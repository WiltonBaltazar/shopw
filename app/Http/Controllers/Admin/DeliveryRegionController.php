<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DeliveryRegion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeliveryRegionController extends Controller
{
    public function index(): JsonResponse
    {
        $regions = DeliveryRegion::orderBy('sort_order')->orderBy('id')->get();

        return response()->json(['data' => $regions]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name'       => ['required', 'string', 'max:100'],
            'price'      => ['required', 'integer', 'min:0'],
            'is_active'  => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $region = DeliveryRegion::create([
            'name'       => $request->name,
            'price'      => $request->price,
            'is_active'  => $request->boolean('is_active', true),
            'sort_order' => $request->input('sort_order', 0),
        ]);

        return response()->json(['data' => $region], 201);
    }

    public function update(Request $request, DeliveryRegion $deliveryRegion): JsonResponse
    {
        $request->validate([
            'name'       => ['sometimes', 'string', 'max:100'],
            'price'      => ['sometimes', 'integer', 'min:0'],
            'is_active'  => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $deliveryRegion->update($request->only(['name', 'price', 'is_active', 'sort_order']));

        return response()->json(['data' => $deliveryRegion]);
    }

    public function destroy(DeliveryRegion $deliveryRegion): JsonResponse
    {
        $deliveryRegion->delete();

        return response()->json(['message' => 'Região eliminada.']);
    }
}
