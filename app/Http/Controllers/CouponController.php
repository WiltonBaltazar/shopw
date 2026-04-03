<?php

namespace App\Http\Controllers;

use App\Http\Requests\ApplyCouponRequest;
use App\Http\Resources\CouponResource;
use App\Services\CouponService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    public function __construct(private CouponService $couponService) {}

    /**
     * POST /coupons/apply
     * Validate a coupon code against the current cart and return discount info.
     */
    public function apply(ApplyCouponRequest $request): JsonResponse
    {
        $result = $this->couponService->validate(
            code: $request->input('code'),
            cartItems: $request->input('items'),
            cartTotal: (float) $request->input('cart_total'),
            customerPhone: $request->input('customer_phone'),
        );

        if (! $result['valid']) {
            return response()->json(['message' => $result['error']], 422);
        }

        return response()->json([
            'data' => [
                'coupon'   => new CouponResource($result['coupon']),
                'discount' => $result['discount'],
            ],
        ]);
    }

    /**
     * GET /coupons/auto-apply?phone=XXX
     * If the given phone has no prior orders, return the latest active first-buy coupon.
     * Called on checkout when the customer fills in their phone number.
     */
    public function autoApply(Request $request): JsonResponse
    {
        $request->validate(['phone' => ['required', 'string', 'max:20']]);

        $coupon = $this->couponService->autoApplyFirstBuy($request->input('phone'));

        if (! $coupon) {
            return response()->json(['data' => null]);
        }

        return response()->json(['data' => new CouponResource($coupon)]);
    }
}
