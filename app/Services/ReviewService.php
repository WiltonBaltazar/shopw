<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use App\Models\ProductReview;

class ReviewService
{
    /**
     * Check whether the given phone number has a delivered order containing the product.
     * Used to mark the review as a "verified purchase".
     */
    public function isVerifiedPurchase(string $phone, Product $product): bool
    {
        return Order::where('customer_phone', $phone)
            ->where('status', 'delivered')
            ->whereHas('items', fn ($q) => $q->where('product_id', $product->id))
            ->exists();
    }

    /**
     * Check whether this email has already reviewed the product.
     */
    public function hasAlreadyReviewed(string $email, Product $product): bool
    {
        return ProductReview::where('product_id', $product->id)
            ->where('customer_email', $email)
            ->exists();
    }

    /**
     * Return aggregate stats for a product (all approved reviews).
     *
     * @return array{average: float|null, count: int}
     */
    public function getAggregates(Product $product): array
    {
        $reviews = ProductReview::where('product_id', $product->id)
            ->where('is_approved', true);

        $count = $reviews->count();

        return [
            'average' => $count ? round($reviews->avg('rating'), 1) : null,
            'count'   => $count,
        ];
    }
}
