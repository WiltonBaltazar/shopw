<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\CustomerFavorite;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerFavoriteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $customer = $request->user();
        if ($customer instanceof Customer) {
            $phone = $customer->phone;
        } else {
            $request->validate([
                'phone' => ['required', 'string', 'min:7', 'max:30'],
            ]);
            $phone = (string) $request->input('phone');
        }

        $favorites = CustomerFavorite::where('phone', $phone)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $favorites]);
    }

    public function store(Request $request): JsonResponse
    {
        $customer = $request->user();

        $rules = [
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
        ];

        if (! $customer instanceof Customer) {
            $rules['phone'] = ['required', 'string', 'min:7', 'max:30'];
        }

        $data = $request->validate($rules);
        $phone = $customer instanceof Customer ? $customer->phone : (string) $data['phone'];

        // Idempotent: return existing if same phone + product + variant already saved
        $existing = CustomerFavorite::where('phone', $phone)
            ->where('product_id', $data['product_id'])
            ->where('variant_id', $data['variant_id'])
            ->first();

        if ($existing) {
            return response()->json(['data' => $existing], 200);
        }

        $favorite = CustomerFavorite::create([
            'phone' => $phone,
            'product_id' => $data['product_id'],
            'product_slug' => $data['product_slug'],
            'product_name' => $data['product_name'],
            'product_image' => $data['product_image'] ?? null,
            'variant_id' => $data['variant_id'],
            'variant_label' => $data['variant_label'] ?? null,
            'price' => $data['price'],
            'selected_values' => $data['selected_values'],
            'flavour_selections' => $data['flavour_selections'],
            'addon_values' => $data['addon_values'],
        ]);

        return response()->json(['data' => $favorite], 201);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $customer = $request->user();
        if ($customer instanceof Customer) {
            $phone = $customer->phone;
        } else {
            $request->validate([
                'phone' => ['required', 'string'],
            ]);
            $phone = (string) $request->input('phone');
        }

        $favorite = CustomerFavorite::findOrFail($id);

        if ($favorite->phone !== $phone) {
            return response()->json(['message' => 'Não autorizado.'], 403);
        }

        $favorite->delete();

        return response()->json(['message' => 'Removido.']);
    }
}
