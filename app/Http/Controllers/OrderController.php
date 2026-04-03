<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOrderRequest;
use App\Http\Resources\OrderDetailResource;
use App\Models\DeliveryRegion;
use App\Models\MpesaTransaction;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderItemAddon;
use App\Models\ProductAddon;
use App\Models\ProductVariant;
use App\Services\CouponService;
use App\Services\MpesaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
    public function store(StoreOrderRequest $request): JsonResponse
    {
        $paymentMethod = $request->input('payment_method', 'mpesa');

        // Guard: if this phone already has an unpaid order within 30 minutes,
        // check its M-Pesa transaction state before deciding whether to create a new order.
        if ($paymentMethod === 'mpesa') {
            $existingOrder = Order::where('customer_phone', $request->customer_phone)
                ->where('payment_method', 'mpesa')
                ->whereIn('payment_status', ['unpaid', 'pending'])
                ->where('created_at', '>=', now()->subMinutes(30))
                ->with('mpesaTransaction')
                ->latest()
                ->first();

            if ($existingOrder) {
                $tx = $existingOrder->mpesaTransaction;

                // Transaction is ambiguous (may have already charged) — redirect, don't retry
                if ($tx && $tx->status === 'pending') {
                    Log::info('Duplicate order: pending M-Pesa transaction exists, redirecting.', [
                        'reference' => $existingOrder->reference,
                    ]);
                    return response()->json([
                        'message' => 'Já tem um pagamento em processamento. Confirme o PIN no telemóvel.',
                        'data'    => [
                            'reference'      => $existingOrder->reference,
                            'total'          => (float) $existingOrder->total,
                            'payment_status' => 'pending',
                        ],
                    ], 200);
                }

                // No transaction or previous transaction failed — retry M-Pesa on existing order
                Log::info('Duplicate order: retrying M-Pesa on existing order.', [
                    'reference' => $existingOrder->reference,
                ]);
                return $this->initiatePayment($existingOrder);
            }
        }

        $order = DB::transaction(function () use ($request, $paymentMethod) {
            $itemsTotal = 0;
            $cartItems = [];

            foreach ($request->items as $item) {
                $variant = ProductVariant::findOrFail($item['variant_id']);
                $itemSubtotal = $variant->price * $item['quantity'];

                foreach ($item['addons'] ?? [] as $addonData) {
                    $addon = ProductAddon::findOrFail($addonData['addon_id']);
                    $itemSubtotal += $addon->price * $item['quantity'];
                }

                $itemsTotal += $itemSubtotal;
                $cartItems[] = [
                    'product_id' => $item['product_id'],
                    'price'      => $variant->price,
                    'quantity'   => $item['quantity'],
                ];
            }

            $deliveryType = $request->input('delivery_type', 'delivery');
            $deliveryFee = 0;
            $deliveryRegionId = null;

            if ($deliveryType === 'delivery' && $request->delivery_region_id) {
                $region = DeliveryRegion::find($request->delivery_region_id);
                if ($region && $region->is_active) {
                    $deliveryFee = $region->price;
                    $deliveryRegionId = $region->id;
                }
            }

            $total = $itemsTotal + $deliveryFee;

            // Apply coupon discount
            $discountAmount = 0;
            $couponCode = null;
            if ($request->filled('coupon_code')) {
                $couponService = app(CouponService::class);
                $couponResult = $couponService->validate(
                    $request->coupon_code,
                    $cartItems,
                    $itemsTotal,
                    $request->customer_phone,
                );
                if ($couponResult['valid']) {
                    $discountAmount = $couponResult['discount'];
                    $couponCode = strtoupper($request->coupon_code);
                    $total = max(0, $total - $discountAmount);
                }
            }

            $order = Order::create([
                'customer_name'      => $request->customer_name,
                'customer_phone'     => $request->customer_phone,
                'customer_address'   => $request->customer_address,
                'notes'              => $request->notes,
                'coupon_code'        => $couponCode,
                'discount_amount'    => $discountAmount,
                'delivery_date'      => $request->delivery_date,
                'delivery_type'      => $deliveryType,
                'delivery_region_id' => $deliveryRegionId,
                'delivery_fee'       => $deliveryFee,
                'total'              => $total,
                'status'             => 'pending',
                'payment_status'     => 'unpaid',
                'payment_method'     => $paymentMethod,
            ]);

            foreach ($request->items as $itemData) {
                $variant = ProductVariant::findOrFail($itemData['variant_id']);
                $addonTotal = 0;

                foreach ($itemData['addons'] ?? [] as $addonData) {
                    $addon = ProductAddon::findOrFail($addonData['addon_id']);
                    $addonTotal += $addon->price;
                }

                $orderItem = OrderItem::create([
                    'order_id'     => $order->id,
                    'product_id'   => $itemData['product_id'],
                    'variant_id'   => $itemData['variant_id'],
                    'quantity'     => $itemData['quantity'],
                    'unit_price'   => $variant->price + $addonTotal,
                    'subtotal'     => ($variant->price + $addonTotal) * $itemData['quantity'],
                    'custom_notes' => $itemData['custom_notes'] ?? null,
                ]);

                foreach ($itemData['addons'] ?? [] as $addonData) {
                    $addon = ProductAddon::findOrFail($addonData['addon_id']);
                    OrderItemAddon::create([
                        'order_item_id' => $orderItem->id,
                        'addon_id'      => $addon->id,
                        'addon_name'    => $addon->name,
                        'value'         => $addonData['value'] ?? null,
                        'price'         => $addon->price,
                    ]);
                }
            }

            return $order;
        });

        if ($paymentMethod === 'cash_on_delivery') {
            return response()->json([
                'message' => 'Encomenda criada com sucesso. O pagamento será feito na entrega.',
                'data'    => [
                    'reference'      => $order->reference,
                    'total'          => (float) $order->total,
                    'payment_status' => 'unpaid',
                    'payment_method' => 'cash_on_delivery',
                ],
            ], 201);
        }

        return $this->initiatePayment($order);
    }

    public function storeEvent(Request $request): JsonResponse
    {
        $request->validate([
            'customer_name'             => ['required', 'string', 'max:255'],
            'customer_phone'            => ['required', 'string', 'max:30'],
            'event_date'                => ['required', 'date', 'after:today'],
            'notes'                     => ['nullable', 'string', 'max:2000'],
            'items'                     => ['required', 'array', 'min:1'],
            'items.*.product_id'        => ['required', 'integer', 'exists:products,id'],
            'items.*.variant_id'        => ['required', 'integer', 'exists:product_variants,id'],
            'items.*.quantity'          => ['required', 'integer', 'min:1'],
            'items.*.custom_notes'      => ['nullable', 'string', 'max:500'],
            'items.*.addons'            => ['nullable', 'array'],
            'items.*.addons.*.addon_id' => ['required', 'integer', 'exists:product_addons,id'],
            'items.*.addons.*.value'    => ['nullable', 'string'],
        ]);

        $order = DB::transaction(function () use ($request) {
            $total = 0;

            foreach ($request->items as $item) {
                $variant = ProductVariant::findOrFail($item['variant_id']);
                $itemSubtotal = $variant->price * $item['quantity'];

                foreach ($item['addons'] ?? [] as $addonData) {
                    $addon = ProductAddon::findOrFail($addonData['addon_id']);
                    $itemSubtotal += $addon->price * $item['quantity'];
                }

                $total += $itemSubtotal;
            }

            $order = Order::create([
                'order_type'     => 'event',
                'customer_name'  => $request->customer_name,
                'customer_phone' => $request->customer_phone,
                'notes'          => $request->notes,
                'delivery_date'  => $request->event_date,
                'total'          => $total,
                'status'         => 'pending',
                'payment_status' => 'unpaid',
                'payment_method' => 'mpesa',
            ]);

            foreach ($request->items as $itemData) {
                $variant = ProductVariant::findOrFail($itemData['variant_id']);
                $addonTotal = 0;

                foreach ($itemData['addons'] ?? [] as $addonData) {
                    $addon = ProductAddon::findOrFail($addonData['addon_id']);
                    $addonTotal += $addon->price;
                }

                $orderItem = OrderItem::create([
                    'order_id'     => $order->id,
                    'product_id'   => $itemData['product_id'],
                    'variant_id'   => $itemData['variant_id'],
                    'quantity'     => $itemData['quantity'],
                    'unit_price'   => $variant->price + $addonTotal,
                    'subtotal'     => ($variant->price + $addonTotal) * $itemData['quantity'],
                    'custom_notes' => $itemData['custom_notes'] ?? null,
                ]);

                foreach ($itemData['addons'] ?? [] as $addonData) {
                    $addon = ProductAddon::findOrFail($addonData['addon_id']);
                    OrderItemAddon::create([
                        'order_item_id' => $orderItem->id,
                        'addon_id'      => $addon->id,
                        'addon_name'    => $addon->name,
                        'value'         => $addonData['value'] ?? null,
                        'price'         => $addon->price,
                    ]);
                }
            }

            return $order;
        });

        return response()->json([
            'message' => 'Pedido de evento recebido. Entraremos em contacto com a proposta de valor.',
            'data'    => [
                'reference' => $order->reference,
                'total'     => (float) $order->total,
            ],
        ], 201);
    }

    public function paymentInfo(string $reference): JsonResponse
    {
        $order = Order::where('reference', $reference)->firstOrFail();

        // Event order payment links are token-gated — validate the token from the query string.
        if (($order->order_type ?? 'standard') === 'event' && $order->payment_status !== 'paid') {
            $token = request()->query('token');
            if (!$token || $token !== $order->payment_token) {
                return response()->json(['message' => 'Link de pagamento inválido ou expirado.'], 403);
            }
        }

        return response()->json(['data' => [
            'reference'      => $order->reference,
            'customer_name'  => $order->customer_name,
            'order_type'     => $order->order_type ?? 'standard',
            'total'          => (float) $order->total,
            'amount_paid'    => (float) ($order->amount_paid ?? 0),
            'payment_due'    => $order->payment_due !== null ? (float) $order->payment_due : null,
            'payment_status' => $order->payment_status,
        ]]);
    }

    public function retryPayment(Request $request, string $reference): JsonResponse
    {
        $request->validate([
            'phone'  => ['nullable', 'string', 'max:30'],
            'token'  => ['nullable', 'string', 'max:64'],
        ]);

        $order = Order::where('reference', $reference)
            ->with('mpesaTransaction')
            ->firstOrFail();

        if ($order->payment_status === 'paid') {
            return response()->json(['message' => 'Este pedido já foi pago.'], 422);
        }

        if ($order->payment_method !== 'mpesa') {
            return response()->json(['message' => 'Este pedido está definido para pagamento manual/na entrega.'], 422);
        }

        // For event orders, validate the payment token before allowing payment.
        if (($order->order_type ?? 'standard') === 'event') {
            if (!$request->token || $request->token !== $order->payment_token) {
                return response()->json(['message' => 'Link de pagamento inválido ou expirado.'], 403);
            }
        }

        // For event orders, require payment_due to be set by admin first
        if (($order->order_type ?? 'standard') === 'event' && !$order->payment_due) {
            return response()->json(['message' => 'O valor a pagar ainda não foi definido pelo administrador.'], 422);
        }

        $tx = $order->mpesaTransaction;
        // Only block if there is a pending M-Pesa push that is still plausibly in-flight
        // (updated within the last 3 minutes). Stale pending records from previous failed
        // attempts — e.g. after INS-10 on a second instalment — must not block new retries.
        if ($tx && $tx->status === 'pending' && $tx->transaction_id !== null
            && $tx->updated_at->gt(now()->subMinutes(3))) {
            return response()->json([
                'message' => 'Já existe um pagamento em processamento. Confirme o PIN no telemóvel.',
                'data'    => [
                    'reference'      => $order->reference,
                    'total'          => (float) $order->total,
                    'payment_status' => 'pending',
                ],
            ], 200);
        }

        return $this->initiatePayment($order, $request->input('phone'));
    }

    public function show(string $reference): JsonResponse
    {
        $order = Order::where('reference', $reference)
            ->with(['items.product', 'items.variant.attributeValues.attribute', 'items.addons', 'mpesaTransaction', 'deliveryRegion'])
            ->firstOrFail();

        // Return resource directly so Laravel wraps it in {"data":{...}}
        // response()->json(resource) does NOT wrap — return resource does
        return (new OrderDetailResource($order))->toResponse(request());
    }

    private function initiatePayment(Order $order, ?string $phoneOverride = null): JsonResponse
    {
        $isEvent = ($order->order_type ?? 'standard') === 'event';
        $amount  = $isEvent && $order->payment_due ? (float) $order->payment_due : (float) $order->total;
        $phone   = $phoneOverride ?? $order->customer_phone;

        $mpesa = app(MpesaService::class);
        $mpesaResult = $mpesa->initiatePayment(
            phoneNumber: $phone,
            amount: $amount,
            reference: $order->reference,
        );

        $responseCode       = $mpesaResult['response_code'] ?? null;
        $transactionId      = $mpesaResult['transaction_id'] ?? null;
        $requestSent        = $mpesaResult['request_sent'] ?? null;
        $txStatus           = 'pending';
        $orderPaymentStatus = 'pending';

        if ($mpesaResult['success'] === true) {
            // INS-0: confirmed and charged immediately
            $txStatus = 'success';
            $order->increment('amount_paid', $amount);
            $order->refresh();

            if ($order->amount_paid >= $order->total) {
                $orderPaymentStatus = 'paid';
                $order->update([
                    'payment_status' => 'paid',
                    'status'         => 'confirmed',
                    'payment_due'    => null,
                    'payment_token'  => null, // invalidate link — order fully paid
                ]);
            } else {
                // Partial payment (e.g. first instalment of an event order).
                // Clear the token so this link can't be reused; admin must generate a new one.
                $orderPaymentStatus = 'unpaid';
                $order->update(['payment_status' => 'unpaid', 'payment_due' => null, 'payment_token' => null]);
            }

        } elseif ($responseCode && ($mpesa->isTimeoutResponseCode($responseCode) || $mpesa->isDuplicateResponseCode($responseCode))) {
            // INS-9 or INS-10: M-Pesa may have already charged — leave pending for resolution
            Log::info('Mpesa ambiguous response, leaving order as pending.', [
                'reference'     => $order->reference,
                'response_code' => $responseCode,
            ]);
            $order->update(['payment_status' => 'pending']);

        } elseif ($requestSent === false) {
            // Could not even build/send the request (e.g. token generation/config issue).
            $txStatus = 'failed';
            $orderPaymentStatus = 'failed';
            Log::error('Mpesa request was not sent.', [
                'reference' => $order->reference,
                'error'     => $mpesaResult['technical_message'] ?? $mpesaResult['message'] ?? 'unknown',
            ]);
            $order->update(['payment_status' => 'failed']);

        } elseif (!array_key_exists('response_code', $mpesaResult)) {
            // Connection error — no response from M-Pesa, cannot know if charged
            Log::warning('Mpesa connection error, leaving order as pending.', [
                'reference' => $order->reference,
                'error'     => $mpesaResult['technical_message'] ?? $mpesaResult['message'] ?? 'unknown',
            ]);
            $order->update(['payment_status' => 'pending']);

        } else {
            // Definitive failure (e.g. INS-2006 insufficient balance, INS-2051 invalid number)
            // M-Pesa did NOT debit the customer for these codes
            $txStatus = 'failed';
            $orderPaymentStatus = 'failed';
            $order->update(['payment_status' => 'failed']);
        }

        // Upsert transaction record (for retry cases, update the existing one)
        MpesaTransaction::updateOrCreate(
            ['order_id' => $order->id],
            [
                'transaction_id' => $transactionId,
                'msisdn'         => $phone,
                'amount'         => $amount,
                'status'         => $txStatus,
                'raw_response'   => $mpesaResult['data'] ?? null,
            ]
        );

        $isPartialSuccess = $txStatus === 'success' && $orderPaymentStatus === 'unpaid';

        $message = match (true) {
            $orderPaymentStatus === 'paid'  => 'Encomenda criada e pagamento confirmado.',
            $orderPaymentStatus === 'failed' => $mpesaResult['message'] ?? 'Pagamento falhou. Contacte-nos para assistência.',
            $isPartialSuccess               => 'Prestação confirmada. Entraremos em contacto para o pagamento restante.',
            default                         => 'Encomenda criada. Confirme o pagamento no telemóvel.',
        };

        return response()->json([
            'message' => $message,
            'data'    => [
                'reference'       => $order->reference,
                'total'           => (float) $order->total,
                'amount_paid'     => (float) $order->amount_paid,
                'payment_status'  => $orderPaymentStatus,
                'partial_payment' => $isPartialSuccess,
            ],
        ], 201);
    }
}
