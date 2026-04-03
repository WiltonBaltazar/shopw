<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date'   => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        $start = Carbon::parse($request->input('start_date', now()->startOfMonth()))->startOfDay();
        $end   = Carbon::parse($request->input('end_date', now()->endOfMonth()))->endOfDay();

        // ── KPIs for the selected period ─────────────────────────────────────
        $base    = Order::whereBetween('created_at', [$start, $end]);
        $total   = (clone $base)->count();
        $revenue = (float) (clone $base)->where('payment_status', 'paid')->sum('total');
        $avg     = $total > 0 ? round($revenue / $total, 2) : 0;

        $byStatus      = (clone $base)->select('status', DB::raw('count(*) as cnt'))->groupBy('status')->pluck('cnt', 'status');
        $completedPct  = $total > 0 ? round(($byStatus->get('completed', 0) / $total) * 100, 1) : 0;
        $pendingPct    = $total > 0 ? round(($byStatus->get('pending', 0)   / $total) * 100, 1) : 0;

        $byDelivery    = (clone $base)->select('delivery_type', DB::raw('count(*) as cnt'))->groupBy('delivery_type')->pluck('cnt', 'delivery_type');

        // ── Period comparison (previous equivalent window) ────────────────────
        $dayCount  = $start->diffInDays($end) + 1;
        $prevEnd   = (clone $start)->subDay()->endOfDay();
        $prevStart = (clone $prevEnd)->subDays($dayCount - 1)->startOfDay();

        $prevBase    = Order::whereBetween('created_at', [$prevStart, $prevEnd]);
        $prevTotal   = (clone $prevBase)->count();
        $prevRevenue = (float) (clone $prevBase)->where('payment_status', 'paid')->sum('total');
        $prevAvg     = $prevTotal > 0 ? round($prevRevenue / $prevTotal, 2) : 0;

        $pctChange = fn ($curr, $prev) => $prev > 0 ? round((($curr - $prev) / $prev) * 100, 1) : ($curr > 0 ? 100.0 : 0.0);

        // ── Revenue over time ────────────────────────────────────────────────
        $days = collect();
        for ($i = 0; $i < $dayCount; $i++) {
            $days->push((clone $start)->addDays($i)->format('Y-m-d'));
        }

        $revenueRows = Order::where('payment_status', 'paid')
            ->whereBetween('created_at', [$start, $end])
            ->select(DB::raw("date(created_at) as day, sum(total) as revenue, count(*) as orders"))
            ->groupBy('day')
            ->get()
            ->keyBy('day')
            ->map(fn ($r) => ['revenue' => (float) $r->revenue, 'orders' => (int) $r->orders]);

        $revenueOverTime = $days->map(fn ($day) => [
            'day'     => $day,
            'revenue' => $revenueRows->get($day)['revenue'] ?? 0,
            'orders'  => $revenueRows->get($day)['orders']  ?? 0,
        ])->values();

        // ── Orders by status ─────────────────────────────────────────────────
        $ordersByStatus = (clone $base)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->map(fn ($r) => ['status' => $r->status, 'count' => (int) $r->count])
            ->values();

        // ── Top products ─────────────────────────────────────────────────────
        $topProducts = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->whereBetween('orders.created_at', [$start, $end])
            ->select(
                'products.name as product_name',
                DB::raw('sum(order_items.quantity) as quantity'),
                DB::raw('sum(order_items.subtotal) as revenue')
            )
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('quantity')
            ->take(10)
            ->get()
            ->map(fn ($r) => [
                'product_name' => $r->product_name,
                'quantity'     => (int) $r->quantity,
                'revenue'      => (float) $r->revenue,
            ]);

        // ── Delivery split ───────────────────────────────────────────────────
        $deliverySplit = (clone $base)
            ->select('delivery_type', DB::raw('count(*) as count'))
            ->groupBy('delivery_type')
            ->get()
            ->map(fn ($r) => ['type' => $r->delivery_type ?? 'unknown', 'count' => (int) $r->count])
            ->values();

        return response()->json([
            'period'           => ['start' => $start->format('Y-m-d'), 'end' => $end->format('Y-m-d')],
            'kpis'             => [
                'revenue'        => $revenue,
                'orders'         => $total,
                'avg_order_value'=> $avg,
                'completed_pct'  => $completedPct,
                'pending_pct'    => $pendingPct,
                'delivery_count' => (int) $byDelivery->get('delivery', 0),
                'pickup_count'   => (int) $byDelivery->get('pickup', 0),
            ],
            'comparison'       => [
                'revenue_change_pct'   => $pctChange($revenue, $prevRevenue),
                'orders_change_pct'    => $pctChange($total, $prevTotal),
                'avg_order_change_pct' => $pctChange($avg, $prevAvg),
                'prev_revenue'         => $prevRevenue,
                'prev_orders'          => $prevTotal,
            ],
            'revenue_over_time' => $revenueOverTime,
            'orders_by_status'  => $ordersByStatus,
            'top_products'      => $topProducts,
            'delivery_split'    => $deliverySplit,
        ]);
    }

    public function exportXlsx(Request $request): StreamedResponse
    {
        $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date'   => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        $start = Carbon::parse($request->input('start_date', now()->startOfMonth()))->startOfDay();
        $end   = Carbon::parse($request->input('end_date', now()->endOfMonth()))->endOfDay();

        $orders = Order::with('items.product')
            ->whereBetween('created_at', [$start, $end])
            ->orderBy('created_at')
            ->get();

        $filename = "relatorio-{$start->format('Y-m-d')}-{$end->format('Y-m-d')}.xlsx";

        return response()->streamDownload(function () use ($orders) {
            $spreadsheet = new Spreadsheet();

            // ── Sheet 1: Encomendas ──────────────────────────────────────────
            $sheet1 = $spreadsheet->getActiveSheet();
            $sheet1->setTitle('Encomendas');
            $sheet1->fromArray([[
                'Referência', 'Cliente', 'Telefone', 'Endereço',
                'Estado', 'Pagamento', 'Método', 'Total (MZN)',
                'Taxa entrega', 'Tipo entrega', 'Data entrega', 'Criada em',
            ]], null, 'A1');

            $row = 2;
            foreach ($orders as $order) {
                $sheet1->fromArray([[
                    $order->reference,
                    $order->customer_name,
                    $order->customer_phone,
                    $order->customer_address,
                    $order->status,
                    $order->payment_status,
                    $order->payment_method,
                    (float) $order->total,
                    (float) $order->delivery_fee,
                    $order->delivery_type,
                    $order->delivery_date,
                    $order->created_at->format('Y-m-d H:i'),
                ]], null, "A{$row}");
                $row++;
            }

            // ── Sheet 2: Itens ───────────────────────────────────────────────
            $spreadsheet->createSheet();
            $sheet2 = $spreadsheet->getSheet(1);
            $sheet2->setTitle('Itens');
            $sheet2->fromArray([[
                'Referência', 'Produto', 'Quantidade', 'Preço unit. (MZN)', 'Total item (MZN)',
            ]], null, 'A1');

            $row = 2;
            foreach ($orders as $order) {
                foreach ($order->items as $item) {
                    $sheet2->fromArray([[
                        $order->reference,
                        $item->product->name ?? "—",
                        (int) $item->quantity,
                        (float) $item->unit_price,
                        (float) $item->subtotal,
                    ]], null, "A{$row}");
                    $row++;
                }
            }

            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, $filename, [
            'Content-Type'        => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
