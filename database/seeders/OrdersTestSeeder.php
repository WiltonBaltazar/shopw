<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class OrdersTestSeeder extends Seeder
{
    public function run(): void
    {
        // Load all available variants once
        $variants = ProductVariant::with('product')->where('is_available', true)->get();

        if ($variants->isEmpty()) {
            $this->command->warn('No product variants found — run CheesemaniaSeeder first.');
            return;
        }

        $customers = [
            ['name' => 'Ana Martins',       'phone' => '258841000001'],
            ['name' => 'Bruno Costa',        'phone' => '258841000002'],
            ['name' => 'Carla Nhantumbo',   'phone' => '258841000003'],
            ['name' => 'David Chissano',     'phone' => '258841000004'],
            ['name' => 'Elena Sitoe',        'phone' => '258841000005'],
            ['name' => 'Fátima Machava',     'phone' => '258841000006'],
            ['name' => 'Gilberto Mondlane',  'phone' => '258841000007'],
            ['name' => 'Hélia Cumbe',        'phone' => '258841000008'],
            ['name' => 'Ivo Matsinhe',       'phone' => '258841000009'],
            ['name' => 'Joana Bila',         'phone' => '258841000010'],
            ['name' => 'Kátia Tembe',        'phone' => '258841000011'],
            ['name' => 'Luís Guambe',        'phone' => '258841000012'],
            ['name' => 'Maria Cossa',        'phone' => '258841000013'],
            ['name' => 'Nuno Chaúque',       'phone' => '258841000014'],
            ['name' => 'Olga Duvane',        'phone' => '258841000015'],
        ];

        $addresses = [
            'Av. Julius Nyerere, 1245, Maputo',
            'Rua da Resistência, 34, Maputo',
            'Av. Vladimir Lenine, 678, Maputo',
            'Rua dos Desportistas, 99, Maputo',
            'Av. 24 de Julho, 502, Maputo',
            'Bairro da Sommerschield, Maputo',
            'Av. Marginal, 15, Matola',
            'Rua Consiglieri Pedroso, 88, Maputo',
            'Matola Rio, Matola',
        ];

        $deliveryTypes   = ['delivery', 'delivery', 'delivery', 'pickup'];  // 75% delivery
        $paymentMethods  = ['mpesa', 'mpesa', 'mpesa', 'cash'];
        $deliveryFees    = [150, 200, 250, 0]; // last one = pickup

        $orders = [];

        // ── February 2026 ──────────────────────────────────────────────────────
        // ~60 orders with moderate volume

        // Valid statuses: pending, confirmed, processing, ready, delivered, cancelled
        // Valid payment_status: unpaid, paid, failed, refunded
        $febOrders = [
            // Week 1
            ['date' => '2026-02-02', 'count' => 3, 'status_pool' => ['delivered', 'delivered', 'delivered']],
            ['date' => '2026-02-04', 'count' => 2, 'status_pool' => ['delivered', 'delivered']],
            ['date' => '2026-02-05', 'count' => 4, 'status_pool' => ['delivered', 'delivered', 'delivered', 'cancelled']],
            ['date' => '2026-02-06', 'count' => 2, 'status_pool' => ['delivered', 'delivered']],
            ['date' => '2026-02-07', 'count' => 3, 'status_pool' => ['delivered', 'delivered', 'delivered']],
            // Week 2
            ['date' => '2026-02-09', 'count' => 2, 'status_pool' => ['delivered', 'delivered']],
            ['date' => '2026-02-11', 'count' => 3, 'status_pool' => ['delivered', 'delivered', 'delivered']],
            ['date' => '2026-02-12', 'count' => 5, 'status_pool' => ['delivered', 'delivered', 'delivered', 'delivered', 'cancelled']],
            ['date' => '2026-02-13', 'count' => 2, 'status_pool' => ['delivered', 'delivered']],
            ['date' => '2026-02-14', 'count' => 6, 'status_pool' => ['delivered', 'delivered', 'delivered', 'delivered', 'delivered', 'delivered']], // Valentine's
            // Week 3
            ['date' => '2026-02-16', 'count' => 3, 'status_pool' => ['delivered', 'delivered', 'delivered']],
            ['date' => '2026-02-18', 'count' => 2, 'status_pool' => ['delivered', 'delivered']],
            ['date' => '2026-02-19', 'count' => 4, 'status_pool' => ['delivered', 'delivered', 'delivered', 'delivered']],
            ['date' => '2026-02-21', 'count' => 2, 'status_pool' => ['delivered', 'cancelled']],
            // Week 4
            ['date' => '2026-02-23', 'count' => 3, 'status_pool' => ['delivered', 'delivered', 'delivered']],
            ['date' => '2026-02-24', 'count' => 2, 'status_pool' => ['delivered', 'delivered']],
            ['date' => '2026-02-25', 'count' => 4, 'status_pool' => ['delivered', 'delivered', 'delivered', 'delivered']],
            ['date' => '2026-02-26', 'count' => 3, 'status_pool' => ['delivered', 'delivered', 'delivered']],
            ['date' => '2026-02-27', 'count' => 2, 'status_pool' => ['delivered', 'delivered']],
            ['date' => '2026-02-28', 'count' => 4, 'status_pool' => ['delivered', 'delivered', 'delivered', 'delivered']],
        ];

        // ── March 2026 ─────────────────────────────────────────────────────────
        // ~80 orders, slightly higher volume (growth)

        $marOrders = [
            ['date' => '2026-03-02', 'count' => 3, 'status_pool' => ['delivered', 'delivered', 'delivered']],
            ['date' => '2026-03-03', 'count' => 2, 'status_pool' => ['delivered', 'delivered']],
            ['date' => '2026-03-04', 'count' => 4, 'status_pool' => ['delivered', 'delivered', 'delivered', 'delivered']],
            ['date' => '2026-03-05', 'count' => 3, 'status_pool' => ['delivered', 'delivered', 'cancelled']],
            ['date' => '2026-03-06', 'count' => 2, 'status_pool' => ['delivered', 'delivered']],
            ['date' => '2026-03-07', 'count' => 4, 'status_pool' => ['delivered', 'delivered', 'delivered', 'delivered']],
            ['date' => '2026-03-08', 'count' => 5, 'status_pool' => ['delivered', 'delivered', 'delivered', 'delivered', 'delivered']], // Women's Day
            ['date' => '2026-03-09', 'count' => 3, 'status_pool' => ['delivered', 'delivered', 'delivered']],
            ['date' => '2026-03-10', 'count' => 4, 'status_pool' => ['delivered', 'delivered', 'delivered', 'delivered']],
            ['date' => '2026-03-11', 'count' => 3, 'status_pool' => ['delivered', 'delivered', 'delivered']],
            ['date' => '2026-03-12', 'count' => 2, 'status_pool' => ['delivered', 'delivered']],
            ['date' => '2026-03-13', 'count' => 3, 'status_pool' => ['delivered', 'delivered', 'delivered']],
            ['date' => '2026-03-14', 'count' => 4, 'status_pool' => ['delivered', 'delivered', 'delivered', 'delivered']],
            ['date' => '2026-03-16', 'count' => 3, 'status_pool' => ['delivered', 'delivered', 'delivered']],
            ['date' => '2026-03-17', 'count' => 2, 'status_pool' => ['delivered', 'delivered']],
            ['date' => '2026-03-18', 'count' => 4, 'status_pool' => ['delivered', 'delivered', 'delivered', 'cancelled']],
            ['date' => '2026-03-19', 'count' => 3, 'status_pool' => ['delivered', 'delivered', 'delivered']],
            ['date' => '2026-03-20', 'count' => 2, 'status_pool' => ['delivered', 'delivered']],
            ['date' => '2026-03-21', 'count' => 4, 'status_pool' => ['delivered', 'delivered', 'delivered', 'delivered']],
            ['date' => '2026-03-23', 'count' => 3, 'status_pool' => ['delivered', 'delivered', 'delivered']],
            ['date' => '2026-03-24', 'count' => 2, 'status_pool' => ['delivered', 'delivered']],
            ['date' => '2026-03-25', 'count' => 5, 'status_pool' => ['delivered', 'delivered', 'delivered', 'delivered', 'delivered']],
            ['date' => '2026-03-26', 'count' => 3, 'status_pool' => ['delivered', 'delivered', 'delivered']],
            ['date' => '2026-03-27', 'count' => 2, 'status_pool' => ['delivered', 'delivered']],
            ['date' => '2026-03-28', 'count' => 4, 'status_pool' => ['delivered', 'delivered', 'delivered', 'delivered']],
            ['date' => '2026-03-30', 'count' => 3, 'status_pool' => ['delivered', 'delivered', 'delivered']],
            ['date' => '2026-03-31', 'count' => 4, 'status_pool' => ['delivered', 'delivered', 'delivered', 'pending']],
        ];

        $allDays = array_merge($febOrders, $marOrders);
        $orderIdx = 0;

        foreach ($allDays as $day) {
            $statusPool = $day['status_pool'];

            for ($i = 0; $i < $day['count']; $i++) {
                $customer  = $customers[array_rand($customers)];
                $status    = $statusPool[$i % count($statusPool)];
                $isPaid    = $status === 'delivered';
                $delType   = $deliveryTypes[array_rand($deliveryTypes)];
                $payMethod = $paymentMethods[array_rand($paymentMethods)];
                $delFee    = $delType === 'pickup' ? 0 : $deliveryFees[array_rand([0, 1, 2])];

                // Pick 1-3 random variants
                $pickedVariants = $variants->random(rand(1, min(3, $variants->count())));
                $subtotal = 0;
                $itemRows = [];

                foreach ($pickedVariants as $variant) {
                    $qty       = rand(1, 2);
                    $unitPrice = $variant->price;
                    $lineTotal = $unitPrice * $qty;
                    $subtotal += $lineTotal;

                    $itemRows[] = [
                        'product_id' => $variant->product_id,
                        'variant_id' => $variant->id,
                        'quantity'   => $qty,
                        'unit_price' => $unitPrice,
                        'subtotal'   => $lineTotal,
                    ];
                }

                $total  = $subtotal + $delFee;
                $hour   = rand(8, 20);
                $minute = rand(0, 59);
                $createdAt = "{$day['date']} {$hour}:{$minute}:00";

                // Delivery date is 2-5 days after order
                $deliveryDate = date('Y-m-d', strtotime($day['date'] . ' +' . rand(2, 5) . ' days'));

                $order = Order::create([
                    'reference'      => 'TEST-' . strtoupper(Str::random(8)),
                    'customer_name'  => $customer['name'],
                    'customer_phone' => $customer['phone'],
                    'customer_address' => $delType === 'delivery' ? $addresses[array_rand($addresses)] : null,
                    'status'         => $status,
                    'payment_status' => $isPaid ? 'paid' : 'unpaid',
                    'payment_method' => $payMethod,
                    'total'          => $total,
                    'amount_paid'    => $isPaid ? $total : 0,
                    'delivery_fee'   => $delFee,
                    'delivery_type'  => $delType,
                    'delivery_date'  => $deliveryDate,
                    'order_type'     => 'standard',
                    'created_at'     => $createdAt,
                    'updated_at'     => $createdAt,
                ]);

                foreach ($itemRows as $item) {
                    OrderItem::create(array_merge($item, ['order_id' => $order->id]));
                }

                $orderIdx++;
            }
        }

        $this->command->info("Seeded {$orderIdx} test orders for February and March 2026.");
    }
}
