<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderDetailResource;
use App\Http\Resources\OrderResource;
use App\Models\MpesaTransaction;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderItemAddon;
use App\Models\ProductAddon;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orders = Order::with('items')
            ->when($request->status, fn ($q, $v) => $q->where('status', $v))
            ->when($request->payment_status, fn ($q, $v) => $q->where('payment_status', $v))
            ->when($request->search, fn ($q, $v) => $q->where(function ($q) use ($v) {
                $q->where('reference', 'like', "%{$v}%")
                    ->orWhere('customer_name', 'like', "%{$v}%")
                    ->orWhere('customer_phone', 'like', "%{$v}%");
            }))
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json([
            'data' => OrderResource::collection($orders->items()),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page'    => $orders->lastPage(),
                'total'        => $orders->total(),
            ],
        ]);
    }

    public function calendar(Request $request): JsonResponse
    {
        $year  = $request->integer('year', now()->year);
        $month = $request->integer('month', now()->month);

        $start = \Carbon\Carbon::create($year, $month, 1)->startOfMonth();
        $end   = $start->copy()->endOfMonth();

        $orders = Order::where(function ($q) use ($start, $end) {
                $q->whereBetween('delivery_date', [$start, $end])
                  ->orWhere(function ($q2) use ($start, $end) {
                      $q2->whereNull('delivery_date')
                         ->whereBetween('created_at', [$start, $end]);
                  });
            })
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'data' => $orders->map(fn ($o) => [
                'id'             => $o->id,
                'reference'      => $o->reference,
                'customer_name'  => $o->customer_name,
                'customer_phone' => $o->customer_phone,
                'status'         => $o->status,
                'payment_status' => $o->payment_status,
                'total'          => (float) $o->total,
                'delivery_date'  => $o->delivery_date,
                'created_at'     => (string) $o->created_at,
                'date'           => $o->delivery_date
                    ? \Carbon\Carbon::parse($o->delivery_date)->format('Y-m-d')
                    : $o->created_at->format('Y-m-d'),
            ]),
        ]);
    }

    public function show(string $order): JsonResponse
    {
        $order = Order::with(['items.product', 'items.addons', 'mpesaTransaction', 'deliveryRegion'])
            ->findOrFail($order);

        return response()->json(new OrderDetailResource($order));
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'customer_name'    => ['required', 'string', 'max:255'],
            'customer_phone'   => ['required', 'string', 'max:30'],
            'customer_address' => ['nullable', 'string', 'max:500'],
            'notes'            => ['nullable', 'string', 'max:1000'],
            'delivery_date'    => ['nullable', 'date'],
            'payment_status'   => ['nullable', Rule::in(['paid', 'unpaid'])],
            'items'            => ['required', 'array', 'min:1'],
            'items.*.variant_id'    => ['required', 'integer', 'exists:product_variants,id'],
            'items.*.product_id'    => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity'      => ['required', 'integer', 'min:1'],
            'items.*.custom_notes'  => ['nullable', 'string'],
            'items.*.addons'        => ['nullable', 'array'],
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
                'customer_name'    => $request->customer_name,
                'customer_phone'   => $request->customer_phone,
                'customer_address' => $request->customer_address,
                'notes'            => $request->notes,
                'delivery_date'    => $request->delivery_date,
                'total'            => $total,
                'status'           => 'confirmed',
                'payment_status'   => $request->input('payment_status', 'paid'),
                'payment_method'   => 'manual',
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

        $order->load(['items.product', 'items.addons']);

        return response()->json(new OrderDetailResource($order), 201);
    }

    public function latestOrderId(): JsonResponse
    {
        return response()->json(['id' => Order::max('id') ?? 0]);
    }

    public function bulkUpdateStatus(Request $request): JsonResponse
    {
        $request->validate([
            'ids'   => ['required', 'array'],
            'ids.*' => ['integer'],
            'status' => ['required', Rule::in(['pending', 'confirmed', 'processing', 'ready', 'delivered', 'cancelled'])],
        ]);

        Order::whereIn('id', $request->ids)->update(['status' => $request->status]);

        return response()->json(['message' => 'Estados atualizados.']);
    }

    public function export(Request $request): StreamedResponse
    {
        $request->validate([
            'from' => ['required', 'date'],
            'to'   => ['required', 'date', 'after_or_equal:from'],
        ]);

        $from = \Carbon\Carbon::parse($request->from)->startOfDay();
        $to   = \Carbon\Carbon::parse($request->to)->endOfDay();
        $filename = "encomendas-{$request->from}-{$request->to}.csv";

        $orders = Order::with('items')
            ->whereBetween('created_at', [$from, $to])
            ->orderBy('created_at')
            ->get();

        return response()->streamDownload(function () use ($orders) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Referência', 'Cliente', 'Telefone', 'Estado', 'Pagamento', 'Total (MZN)', 'Data entrega', 'Itens', 'Criada em']);
            foreach ($orders as $order) {
                $items = $order->items->map(fn ($i) => "{$i->product_name} x{$i->quantity}")->implode('; ');
                fputcsv($handle, [
                    $order->reference,
                    $order->customer_name,
                    $order->customer_phone,
                    $order->status,
                    $order->payment_status,
                    $order->total,
                    $order->delivery_date ? $order->delivery_date->format('Y-m-d') : '',
                    $items,
                    $order->created_at->format('Y-m-d H:i'),
                ]);
            }
            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    public function updateNotes(Request $request, string $order): JsonResponse
    {
        $request->validate(['admin_notes' => ['nullable', 'string', 'max:2000']]);

        $order = Order::findOrFail($order);
        $order->update(['admin_notes' => $request->admin_notes]);

        return response()->json(['message' => 'Notas guardadas.']);
    }

    public function setPaymentDue(Request $request, Order $order): JsonResponse
    {
        $request->validate([
            'payment_due' => ['required', 'numeric', 'min:1'],
        ]);

        // Generate a fresh token each time so every instalment gets a unique, one-time link.
        $order->update([
            'payment_due'   => $request->payment_due,
            'payment_token' => \Illuminate\Support\Str::random(32),
        ]);

        return response()->json(['data' => new OrderResource($order), 'message' => 'Valor definido.']);
    }

    public function resetPayment(Order $order): JsonResponse
    {
        if ($order->payment_status === 'paid') {
            return response()->json(['message' => 'Este pedido já foi pago.'], 422);
        }

        $order->update(['payment_status' => 'unpaid']);

        if ($order->mpesaTransaction) {
            $order->mpesaTransaction->update(['status' => 'failed']);
        }

        return response()->json(['message' => 'Pagamento resetado. O cliente pode tentar novamente.']);
    }

    public function updateStatus(Request $request, string $order): JsonResponse
    {
        $request->validate([
            'status' => ['required', Rule::in(['pending', 'confirmed', 'processing', 'ready', 'delivered', 'cancelled'])],
        ]);

        $order = Order::findOrFail($order);
        $order->update(['status' => $request->status]);

        return response()->json([
            'message' => 'Estado atualizado.',
            'status'  => $order->status,
        ]);
    }
}
