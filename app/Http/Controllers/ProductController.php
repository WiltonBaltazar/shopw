<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProductListResource;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $products = Product::query()
            ->where('is_active', true)
            ->with(['images', 'variants', 'category'])
            ->when($request->category, fn ($q, $slug) => $q->whereHas('category', fn ($q) => $q->where('slug', $slug)))
            ->orderBy('sort_order')
            ->get();

        return ProductListResource::collection($products);
    }

    public function eventIndex(): AnonymousResourceCollection
    {
        $products = Product::query()
            ->where('is_event', true)
            ->with(['images', 'variants.attributeValues', 'attributes.values', 'addons', 'optionRules'])
            ->orderBy('sort_order')
            ->get();

        return ProductResource::collection($products);
    }

    public function show(string $slug): ProductResource
    {
        $product = Product::where('slug', $slug)
            ->where('is_active', true)
            ->with([
                'images',
                'category',
                'attributes.values',
                'variants.attributeValues',
                'addons',
                'optionRules',
                'reviews',
            ])
            ->firstOrFail();

        return new ProductResource($product);
    }
}
