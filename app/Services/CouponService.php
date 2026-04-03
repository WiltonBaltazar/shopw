<?php

namespace App\Services;

use App\Models\Coupon;
use App\Models\Order;

class CouponService
{
    /**
     * Validate a coupon code for a given cart and customer phone.
     *
     * Returns ['valid' => true, 'coupon' => Coupon, 'discount' => float]
     * or      ['valid' => false, 'error' => string]
     *
     * @param  string  $code
     * @param  array   $cartItems  [['product_id' => int, 'price' => float, 'quantity' => int], ...]
     * @param  float   $cartTotal
     * @param  string|null  $customerPhone  Used to check first-buy restriction
     */
    public function validate(string $code, array $cartItems, float $cartTotal, ?string $customerPhone = null): array
    {
        $coupon = Coupon::with('products')->where('code', strtoupper($code))->first();

        if (! $coupon) {
            return ['valid' => false, 'error' => 'Coupon not found.'];
        }

        if (! $coupon->is_active) {
            return ['valid' => false, 'error' => 'This coupon is no longer active.'];
        }

        if ($coupon->expires_at && now()->isAfter($coupon->expires_at)) {
            return ['valid' => false, 'error' => 'This coupon has expired.'];
        }

        if ($coupon->min_order_amount && $cartTotal < $coupon->min_order_amount) {
            return [
                'valid' => false,
                'error' => "Minimum order of {$coupon->min_order_amount} required for this coupon.",
            ];
        }

        if ($customerPhone) {
            $alreadyUsed = Order::where('customer_phone', $customerPhone)
                ->where('coupon_code', $coupon->code)
                ->whereNotIn('status', ['cancelled'])
                ->exists();

            if ($alreadyUsed) {
                return ['valid' => false, 'error' => 'You have already used this coupon.'];
            }
        }

        if ($coupon->is_first_buy) {
            if (! $customerPhone) {
                return ['valid' => false, 'error' => 'This coupon is only valid for first-time customers.'];
            }

            $priorOrders = Order::where('customer_phone', $customerPhone)
                ->whereNotIn('status', ['cancelled'])
                ->count();

            if ($priorOrders > 0) {
                return ['valid' => false, 'error' => 'This coupon is only valid on your first order.'];
            }
        }

        $discount = $this->calculateDiscount($coupon, $cartItems, $cartTotal);

        if ($discount <= 0) {
            return ['valid' => false, 'error' => 'This coupon is not applicable to the items in your cart.'];
        }

        return [
            'valid'    => true,
            'coupon'   => $coupon,
            'discount' => $discount,
        ];
    }

    /**
     * Calculate discount amount.
     *
     * - applies_to_all + fixed:      flat amount off cart total
     * - applies_to_all + percentage: percentage off cart total
     * - !applies_to_all + fixed:     flat amount off eligible product subtotal
     * - !applies_to_all + percentage: percentage off eligible product subtotal
     */
    public function calculateDiscount(Coupon $coupon, array $cartItems, float $cartTotal): float
    {
        if ($coupon->applies_to_all) {
            $base = $cartTotal;
        } else {
            $linkedIds = $coupon->products->pluck('id')->toArray();
            $base = collect($cartItems)
                ->filter(fn ($item) => in_array($item['product_id'], $linkedIds))
                ->sum(fn ($item) => $item['price'] * $item['quantity']);
        }

        if ($base <= 0) {
            return 0;
        }

        $discount = match ($coupon->type) {
            'fixed'      => min((float) $coupon->value, $base),
            'percentage' => $base * ($coupon->value / 100),
            default      => 0,
        };

        // Apply max_discount_amount cap for percentage coupons
        if ($coupon->max_discount_amount && $discount > $coupon->max_discount_amount) {
            $discount = (float) $coupon->max_discount_amount;
        }

        return round($discount, 2);
    }

    /**
     * Auto-apply: find the latest active first-buy coupon for a customer with no orders.
     * Returns the Coupon model or null.
     */
    public function autoApplyFirstBuy(string $customerPhone): ?Coupon
    {
        $priorOrders = Order::where('customer_phone', $customerPhone)
            ->whereNotIn('status', ['cancelled'])
            ->count();

        if ($priorOrders > 0) {
            return null;
        }

        return Coupon::active()
            ->where('is_first_buy', true)
            ->latest()
            ->first();
    }
}
