<?php

namespace App\Http\Controllers;

use App\Models\CustomerFavorite;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerFavoriteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'phone' => ['required', 'string', 'min:7', 'max:30'],
        ]);

        $favorites = CustomerFavorite::where('phone', $request->phone)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $favorites]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'phone'              => ['required', 'string', 'min:7', 'max:30'],
            'product_id'         => ['required', 'integer', 'exists:products,id'],
            'product_slug'       => ['required', 'string'],
            'product_name'       => ['required', 'string'],
            'product_image'      => ['nullable', 'string'],
            'variant_id'         => ['required', 'integer', 'exists:product_variants,id'],
            'variant_label'      => ['nullable', 'string'],
            'price'              => ['required', 'numeric', 'min:0'],
            'selected_values'    => ['present', 'array'],
            'flavour_selections' => ['present', 'array'],
            'addon_values'       => ['present', 'array'],
        ]);

        // Idempotent: return existing if same phone + product + variant already saved
        $existing = CustomerFavorite::where('phone', $request->phone)
            ->where('product_id', $request->product_id)
            ->where('variant_id', $request->variant_id)
            ->first();

        if ($existing) {
            return response()->json(['data' => $existing], 200);
        }

        $favorite = CustomerFavorite::create($request->only([
            'phone', 'product_id', 'product_slug', 'product_name', 'product_image',
            'variant_id', 'variant_label', 'price',
            'selected_values', 'flavour_selections', 'addon_values',
        ]));

        return response()->json(['data' => $favorite], 201);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'phone' => ['required', 'string'],
        ]);

        $favorite = CustomerFavorite::findOrFail($id);

        if ($favorite->phone !== $request->phone) {
            return response()->json(['message' => 'Não autorizado.'], 403);
        }

        $favorite->delete();

        return response()->json(['message' => 'Removido.']);
    }
}
