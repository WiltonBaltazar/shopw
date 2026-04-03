<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCouponRequest;
use App\Http\Resources\CouponResource;
use App\Models\Coupon;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class CouponController extends Controller
{
    /** GET /admin/coupons */
    public function index(): JsonResponse
    {
        $coupons = Coupon::with('products')
            ->latest()
            ->paginate(20);

        return response()->json([
            'data' => CouponResource::collection($coupons->items()),
            'meta' => [
                'current_page' => $coupons->currentPage(),
                'last_page'    => $coupons->lastPage(),
                'total'        => $coupons->total(),
            ],
        ]);
    }

    /** POST /admin/coupons */
    public function store(StoreCouponRequest $request): JsonResponse
    {
        $coupon = Coupon::create([
            'code'                => $request->input('code'),
            'description'         => $request->input('description'),
            'type'                => $request->input('type'),
            'value'               => $request->input('value'),
            'min_order_amount'    => $request->input('min_order_amount'),
            'max_discount_amount' => $request->input('max_discount_amount'),
            'applies_to_all'      => $request->boolean('applies_to_all', true),
            'is_first_buy'        => $request->boolean('is_first_buy', false),
            'is_active'           => $request->boolean('is_active', true),
            'expires_at'          => $request->input('expires_at')
                ? Carbon::parse($request->input('expires_at'))->endOfDay()
                : null,
        ]);

        if ($request->filled('product_ids') && ! $request->boolean('applies_to_all')) {
            $coupon->products()->sync($request->input('product_ids'));
        }

        return response()->json(['data' => new CouponResource($coupon->load('products'))], 201);
    }

    /** GET /admin/coupons/{coupon} */
    public function show(Coupon $coupon): JsonResponse
    {
        return response()->json(['data' => new CouponResource($coupon->load('products'))]);
    }

    /** PUT /admin/coupons/{coupon} */
    public function update(StoreCouponRequest $request, Coupon $coupon): JsonResponse
    {
        $coupon->update([
            'code'                => $request->input('code'),
            'description'         => $request->input('description'),
            'type'                => $request->input('type'),
            'value'               => $request->input('value'),
            'min_order_amount'    => $request->input('min_order_amount'),
            'max_discount_amount' => $request->input('max_discount_amount'),
            'applies_to_all'      => $request->boolean('applies_to_all', true),
            'is_first_buy'        => $request->boolean('is_first_buy', false),
            'is_active'           => $request->boolean('is_active'),
            'expires_at'          => $request->input('expires_at')
                ? Carbon::parse($request->input('expires_at'))->endOfDay()
                : null,
        ]);

        if ($request->boolean('applies_to_all')) {
            $coupon->products()->detach();
        } elseif ($request->filled('product_ids')) {
            $coupon->products()->sync($request->input('product_ids'));
        }

        return response()->json(['data' => new CouponResource($coupon->load('products'))]);
    }

    /**
     * PATCH /admin/coupons/{coupon}/toggle
     * Immediately deactivate or re-activate a coupon.
     */
    public function toggle(Coupon $coupon): JsonResponse
    {
        $coupon->update(['is_active' => ! $coupon->is_active]);

        return response()->json([
            'data'    => new CouponResource($coupon),
            'message' => $coupon->is_active ? 'Coupon activated.' : 'Coupon deactivated.',
        ]);
    }

    /** DELETE /admin/coupons/{coupon} */
    public function destroy(Coupon $coupon): JsonResponse
    {
        $coupon->products()->detach();
        $coupon->delete();

        return response()->json(null, 204);
    }
}
