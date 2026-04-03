<?php

namespace App\Http\Controllers;

use App\Models\MpesaTransaction;
use App\Models\Order;
use App\Services\MpesaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MpesaController extends Controller
{
    /**
     * Handle async M-Pesa callback (INS-0 = success).
     * M-Pesa sends this to the configured callback URL after the user enters their PIN.
     */
    public function callback(Request $request): JsonResponse
    {
        Log::info('MPesa callback received', $request->all());

        $responseCode = $request->input('output_ResponseCode')
            ?? $request->input('response_code')
            ?? $request->input('status');

        $transactionId = $request->input('output_TransactionID')
            ?? $request->input('transaction_id');

        $reference = $request->input('output_ThirdPartyReference')
            ?? $request->input('input_ThirdPartyReference')
            ?? $request->input('reference');

        if (!$reference) {
            return response()->json(['message' => 'OK']);
        }

        $order = $this->findOrderFromCallbackReference($reference);
        if (!$order) {
            Log::warning('MPesa callback: order not found', ['reference' => $reference]);
            return response()->json(['message' => 'OK']);
        }

        $transaction = MpesaTransaction::where('order_id', $order->id)->first();

        $mpesa = app(MpesaService::class);
        $claimedSuccess = $mpesa->isSuccessfulResponseCode($responseCode) || $responseCode === 'success';

        // Never trust the callback payload alone — verify with M-Pesa query API first.
        // This prevents spoofed callbacks from marking orders as paid.
        $success = false;
        if ($claimedSuccess) {
            $transactionId = $transactionId ?: $transaction?->transaction_id;

            if (!$transactionId) {
                // Cannot verify without a transaction ID — leave pending for the poller.
                Log::warning('MPesa callback: claimed success but no transaction ID.', ['reference' => $reference]);
                return response()->json(['message' => 'OK']);
            }

            $queryResult = $mpesa->queryTransactionStatus($transactionId, $order->reference);
            $success = $queryResult['success'] && $mpesa->isSuccessfulTransactionStatus($queryResult['status'] ?? null);

            if (!$success) {
                Log::warning('MPesa callback: claimed success but query did not confirm.', [
                    'reference'      => $reference,
                    'transaction_id' => $transactionId,
                ]);
                return response()->json(['message' => 'OK']);
            }
        }

        if ($transaction) {
            $transaction->update([
                'transaction_id' => $transactionId ?? $transaction->transaction_id,
                'status'         => $success ? 'success' : 'failed',
                'raw_response'   => $request->all(),
            ]);
        }

        if ($success) {
            $paidAmount = $transaction ? (float) $transaction->amount : (float) $order->total;
            $order->increment('amount_paid', $paidAmount);
            $order->refresh();

            if ($order->amount_paid >= $order->total) {
                $order->update(['payment_status' => 'paid', 'status' => 'confirmed', 'payment_due' => null, 'payment_token' => null]);
            } else {
                // Partial payment — clear token and payment_due so admin generates a new link for the next instalment
                $order->update(['payment_status' => 'unpaid', 'payment_due' => null, 'payment_token' => null]);
            }
        } else {
            $order->update(['payment_status' => 'failed']);
        }

        return response()->json(['message' => 'OK']);
    }

    private function findOrderFromCallbackReference(string $reference): ?Order
    {
        $order = Order::where('reference', $reference)->first();
        if ($order) {
            return $order;
        }

        $normalizedReference = preg_replace('/[^A-Za-z0-9]/', '', strtoupper($reference));
        if (!$normalizedReference) {
            return null;
        }

        return Order::query()
            ->whereRaw("REPLACE(UPPER(reference), '-', '') = ?", [$normalizedReference])
            ->latest('id')
            ->first();
    }

    /**
     * Poll endpoint: verify a pending order's payment by querying M-Pesa directly.
     * The frontend can call this to force a status check.
     */
    public function verify(string $reference): JsonResponse
    {
        $order = Order::where('reference', $reference)
            ->with('mpesaTransaction')
            ->firstOrFail();

        if ($order->payment_status === 'paid') {
            return response()->json(['payment_status' => 'paid']);
        }

        $transaction = $order->mpesaTransaction;
        if (!$transaction || !$transaction->transaction_id) {
            // No transaction ID means M-Pesa never confirmed receipt — nothing to query.
            // Tell the frontend so it can prompt the user to retry payment instead.
            return response()->json([
                'payment_status' => $order->payment_status,
                'no_transaction'  => true,
            ]);
        }

        if ($transaction->status === 'success') {
            // Already processed — don't query M-Pesa again or double-increment amount_paid.
            return response()->json(['payment_status' => $order->payment_status]);
        }

        $mpesa = app(MpesaService::class);
        $result = $mpesa->queryTransactionStatus($transaction->transaction_id, $reference);

        if ($result['success'] && $mpesa->isSuccessfulTransactionStatus($result['status'] ?? null)) {
            $transaction->update(['status' => 'success']);
            $paidAmount = (float) $transaction->amount;
            $order->increment('amount_paid', $paidAmount);
            $order->refresh();
            if ($order->amount_paid >= $order->total) {
                $order->update(['payment_status' => 'paid', 'status' => 'confirmed', 'payment_due' => null, 'payment_token' => null]);
            } else {
                $order->update(['payment_status' => 'unpaid', 'payment_due' => null, 'payment_token' => null]);
            }
            return response()->json(['payment_status' => $order->payment_status]);
        }

        if ($result['success'] && $mpesa->isFailedTransactionStatus($result['status'] ?? null)) {
            $transaction->update(['status' => 'failed']);
            $order->update(['payment_status' => 'failed']);
            return response()->json(['payment_status' => 'failed']);
        }

        return response()->json(['payment_status' => $order->payment_status]);
    }
}
