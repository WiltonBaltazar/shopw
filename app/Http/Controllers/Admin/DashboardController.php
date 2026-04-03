<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function revenueChart(): JsonResponse
    {
        $days = collect();
        for ($i = 29; $i >= 0; $i--) {
            $days->push(now()->subDays($i)->format('Y-m-d'));
        }

        $rows = Order::where('payment_status', 'paid')
            ->where('created_at', '>=', now()->subDays(29)->startOfDay())
            ->select(DB::raw("date(created_at) as day, sum(total) as revenue, count(*) as orders"))
            ->groupBy('day')
            ->get()
            ->keyBy('day')
            ->map(fn ($r) => ['revenue' => (float) $r->revenue, 'orders' => (int) $r->orders]);

        $data = $days->map(fn ($day) => [
            'day'     => $day,
            'revenue' => $rows->get($day)['revenue'] ?? 0,
            'orders'  => $rows->get($day)['orders'] ?? 0,
        ])->values();

        return response()->json(['data' => $data]);
    }

    public function index(): JsonResponse
    {
        $today = now()->startOfDay();

        return response()->json([
            'orders_today'    => Order::where('created_at', '>=', $today)->count(),
            'revenue_today'   => (float) Order::where('created_at', '>=', $today)
                ->where('payment_status', 'paid')
                ->sum('total'),
            'orders_pending'  => Order::where('status', 'pending')->count(),
            'orders_total'    => Order::count(),
            'revenue_total'   => (float) Order::where('payment_status', 'paid')->sum('total'),
            'products_active' => Product::where('is_active', true)->count(),
            'recent_orders'   => Order::with('items.product')
                ->latest()
                ->take(10)
                ->get()
                ->map(fn ($o) => [
                    'reference'      => $o->reference,
                    'customer_name'  => $o->customer_name,
                    'total'          => (float) $o->total,
                    'status'         => $o->status,
                    'payment_status' => $o->payment_status,
                    'created_at'     => $o->created_at,
                ]),
        ]);
    }
}
