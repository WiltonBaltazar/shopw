<?php

namespace App\Console\Commands;

use App\Models\MpesaTransaction;
use App\Models\Order;
use App\Services\MpesaService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class VerifyMpesaPayments extends Command
{
    protected $signature = 'mpesa:verify-payments';
    protected $description = 'Query M-Pesa for pending transactions and update order payment status';

    public function handle(MpesaService $mpesaService): void
    {
        $this->info('Starting M-Pesa payment verification...');

        // Find transactions that are still pending, created within the last 24h but older than 2 min
        $transactions = MpesaTransaction::query()
            ->with('order')
            ->where('status', 'pending')
            ->whereNotNull('transaction_id')
            ->whereBetween('created_at', [
                Carbon::now()->subHours(24),
                Carbon::now()->subMinutes(2),
            ])
            ->get();

        $this->info("Found {$transactions->count()} pending transaction(s).");

        foreach ($transactions as $transaction) {
            $order = $transaction->order;
            if (!$order) continue;

            $result = $mpesaService->queryTransactionStatus(
                $transaction->transaction_id,
                $order->reference,
            );

            if ($result['success'] && $mpesaService->isSuccessfulTransactionStatus($result['status'] ?? null)) {
                $transaction->update(['status' => 'success']);
                $order->update(['payment_status' => 'paid', 'status' => 'confirmed']);
                $this->line("  ✓ Order {$order->reference}: marked as PAID");
            } elseif ($result['success'] && $mpesaService->isFailedTransactionStatus($result['status'] ?? null)) {
                $transaction->update(['status' => 'failed']);
                $order->update(['payment_status' => 'failed']);
                $this->line("  ✗ Order {$order->reference}: marked as FAILED");
            } else {
                $this->line("  ~ Order {$order->reference}: still pending ({$result['status'] ?? 'unknown'})");
            }
        }

        $this->info('Done.');
    }
}
