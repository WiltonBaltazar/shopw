<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerOrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $customer = $request->user();
        if ($customer instanceof Customer) {
            $variants = $this->normalizePhone($customer->phone);
        } else {
            $request->validate([
                'phone' => ['required', 'string', 'min:7', 'max:30'],
            ]);
            $variants = $this->normalizePhone((string) $request->input('phone'));
        }

        $orders = Order::where(function ($q) use ($variants) {
                foreach ($variants as $v) {
                    $q->orWhere('customer_phone', $v)
                      ->orWhere(
                          DB::raw("REPLACE(REPLACE(REPLACE(customer_phone, ' ', ''), '-', ''), '+', '')"),
                          $v
                      );
                }
            })
            ->orderByDesc('created_at')
            ->select([
                'reference', 'customer_name', 'status', 'payment_status',
                'total', 'delivery_date', 'delivery_type', 'created_at',
            ])
            ->get();

        return response()->json(['data' => $orders]);
    }

    private function normalizePhone(string $raw): array
    {
        $digits = preg_replace('/\D/', '', $raw);

        if (strlen($digits) === 12 && str_starts_with($digits, '258')) {
            $nine = substr($digits, 3);
        } elseif (strlen($digits) === 10 && str_starts_with($digits, '0')) {
            $nine = substr($digits, 1);
        } else {
            $nine = $digits;
        }

        $withCountryCode = '258' . $nine;

        return array_unique(array_filter([$raw, $digits, $nine, $withCountryCode]));
    }
}
