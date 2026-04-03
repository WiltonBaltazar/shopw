<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductReview;
use App\Services\ReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ReviewController extends Controller
{
    public function __construct(private ReviewService $service) {}

    /**
     * List approved reviews for a product.
     */
    public function index(string $slug): JsonResponse
    {
        $product = Product::where('slug', $slug)->where('is_active', true)->firstOrFail();

        $reviews = ProductReview::where('product_id', $product->id)
            ->where('is_approved', true)
            ->latest()
            ->get(['id', 'customer_name', 'rating', 'body', 'photo_path', 'verified_purchase', 'created_at']);

        return response()->json(['data' => $reviews]);
    }

    /**
     * Check if this email/phone is eligible (no existing review, optionally verified).
     */
    public function checkEligibility(Request $request, string $slug): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'phone' => ['nullable', 'string'],
        ]);

        $product = Product::where('slug', $slug)->where('is_active', true)->firstOrFail();

        $alreadyReviewed = $this->service->hasAlreadyReviewed($request->email, $product);
        $verified = $request->phone
            ? $this->service->isVerifiedPurchase($request->phone, $product)
            : false;

        return response()->json([
            'can_review'         => ! $alreadyReviewed,
            'already_reviewed'   => $alreadyReviewed,
            'verified_purchase'  => $verified,
        ]);
    }

    /**
     * Store a new review for a product.
     */
    public function store(Request $request, string $slug): JsonResponse
    {
        $product = Product::where('slug', $slug)->where('is_active', true)->firstOrFail();

        $data = $request->validate([
            'customer_name'  => ['required', 'string', 'max:100'],
            'customer_email' => ['required', 'email', 'max:150'],
            'customer_phone' => ['nullable', 'string', 'max:30'],
            'rating'         => ['required', 'integer', 'min:1', 'max:5'],
            'body'           => ['nullable', 'string', 'max:1500'],
            'photo'          => ['nullable', 'image', 'max:3072'], // 3 MB
        ]);

        if ($this->service->hasAlreadyReviewed($data['customer_email'], $product)) {
            return response()->json(['message' => 'Já deixou uma avaliação para este produto.'], 422);
        }

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('reviews', 'public');
        }

        $verified = isset($data['customer_phone']) && $data['customer_phone']
            ? $this->service->isVerifiedPurchase($data['customer_phone'], $product)
            : false;

        ProductReview::create([
            'product_id'        => $product->id,
            'customer_name'     => $data['customer_name'],
            'customer_email'    => $data['customer_email'],
            'customer_phone'    => $data['customer_phone'] ?? null,
            'rating'            => $data['rating'],
            'body'              => $data['body'] ?? null,
            'photo_path'        => $photoPath,
            'is_approved'       => false,
            'verified_purchase' => $verified,
        ]);

        return response()->json(['message' => 'Avaliação enviada. Será publicada após revisão.'], 201);
    }
}
