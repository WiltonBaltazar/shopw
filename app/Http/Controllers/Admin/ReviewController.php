<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProductReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $reviews = ProductReview::with('product:id,name,slug')
            ->when($request->has('is_approved') && $request->is_approved !== '', function ($q) use ($request) {
                $q->where('is_approved', (bool) $request->is_approved);
            })
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json([
            'data' => $reviews->items(),
            'meta' => [
                'current_page' => $reviews->currentPage(),
                'last_page'    => $reviews->lastPage(),
                'total'        => $reviews->total(),
            ],
        ]);
    }

    public function update(Request $request, ProductReview $review): JsonResponse
    {
        $request->validate(['is_approved' => ['required', 'boolean']]);

        $review->update(['is_approved' => $request->is_approved]);

        return response()->json(['message' => 'Avaliação atualizada.']);
    }
}
