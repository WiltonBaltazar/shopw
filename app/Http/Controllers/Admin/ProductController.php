<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Models\ProductAddon;
use App\Models\ProductAttribute;
use App\Models\ProductAttributeValue;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(): JsonResponse
    {
        $products = Product::with(['images', 'variants', 'category'])
            ->orderBy('sort_order')
            ->get();

        return response()->json(ProductResource::collection($products));
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = DB::transaction(function () use ($request) {
            $isSimple = $request->input('product_type', 'variable') === 'simple';

            $product = Product::create([
                'name'                   => $request->name,
                'slug'                   => $request->slug ?? Str::slug($request->name),
                'category_id'            => $request->category_id,
                'product_type'           => $isSimple ? 'simple' : 'variable',
                'description'            => $request->description,
                'requires_advance_order' => $request->boolean('requires_advance_order', true),
                'is_active'              => $request->boolean('is_active', true),
                'is_non_lactose'         => $request->boolean('is_non_lactose', false),
                'is_fitness'             => $request->boolean('is_fitness', false),
                'sort_order'             => $request->integer('sort_order', 0),
            ]);

            if ($isSimple) {
                // Simple product: one variant with no attribute values
                ProductVariant::create([
                    'product_id'   => $product->id,
                    'price'        => $request->base_price,
                    'is_available' => true,
                ]);
            } else {
                // Create attributes + values, track value map for variant linking
                $valueKeyMap = []; // "attr_index.value_index" => ProductAttributeValue id

                foreach ($request->attributes as $attrIndex => $attrData) {
                    $attribute = ProductAttribute::create([
                        'product_id'  => $product->id,
                        'name'        => $attrData['name'],
                        'sort_order'  => $attrIndex,
                    ]);

                    foreach ($attrData['values'] as $valIndex => $value) {
                        $attrValue = ProductAttributeValue::create([
                            'attribute_id' => $attribute->id,
                            'value'        => $value,
                            'sort_order'   => $valIndex,
                        ]);
                        $valueKeyMap["{$attrIndex}.{$valIndex}"] = $attrValue->id;
                    }
                }

                // Create variants + attach attribute values via pivot
                foreach ($request->variants as $variantData) {
                    $variant = ProductVariant::create([
                        'product_id'   => $product->id,
                        'price'        => $variantData['price'],
                        'is_available' => $variantData['is_available'] ?? true,
                    ]);

                    $valueIds = collect($variantData['attribute_value_keys'])
                        ->map(fn ($key) => $valueKeyMap[$key] ?? null)
                        ->filter()
                        ->values();

                    $variant->attributeValues()->attach($valueIds);
                }
            }

            // Create addons
            foreach ($request->addons ?? [] as $idx => $addonData) {
                $product->addons()->create([
                    'name'        => $addonData['name'],
                    'price'       => $addonData['price'] ?? 0,
                    'type'        => $addonData['type'],
                    'placeholder' => $addonData['placeholder'] ?? null,
                    'is_required' => $addonData['is_required'] ?? false,
                    'sort_order'  => $idx,
                ]);
            }

            return $product;
        });

        $product->load(['images', 'attributes.values', 'variants.attributeValues', 'addons', 'category']);

        return response()->json(new ProductResource($product), 201);
    }

    public function show(string $id): JsonResponse
    {
        $product = Product::with([
            'images', 'category', 'attributes.values',
            'variants.attributeValues', 'addons', 'optionRules',
        ])->findOrFail($id);

        return response()->json(new ProductResource($product));
    }

    public function update(UpdateProductRequest $request, string $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $product->update($request->validated());

        $product->load(['images', 'attributes.values', 'variants.attributeValues', 'addons', 'category']);

        return response()->json(new ProductResource($product));
    }

    public function bulkUpdateVariants(Request $request, string $product): JsonResponse
    {
        $request->validate([
            'variants'               => ['required', 'array', 'min:1'],
            'variants.*.id'          => ['required', 'integer'],
            'variants.*.price'       => ['sometimes', 'numeric', 'min:0'],
            'variants.*.is_available' => ['sometimes', 'boolean'],
        ]);

        $updated = 0;
        foreach ($request->variants as $data) {
            $v = ProductVariant::where('product_id', $product)->find($data['id']);
            if (!$v) continue;
            $v->update(collect($data)->only(['price', 'is_available'])->toArray());
            $updated++;
        }

        return response()->json(['message' => "{$updated} variantes atualizadas.", 'updated' => $updated]);
    }

    public function updateVariant(Request $request, string $product, string $variant): JsonResponse
    {
        $request->validate([
            'price'        => ['sometimes', 'numeric', 'min:0'],
            'is_available' => ['sometimes', 'boolean'],
        ]);

        $v = ProductVariant::where('product_id', $product)->findOrFail($variant);
        $v->update($request->only(['price', 'is_available']));

        return response()->json(['id' => $v->id, 'price' => (float) $v->price, 'is_available' => $v->is_available]);
    }

    public function storeVariant(Request $request, string $product): JsonResponse
    {
        $request->validate([
            'price'                => ['required', 'numeric', 'min:0'],
            'is_available'         => ['boolean'],
            'attribute_value_ids'  => ['required', 'array', 'min:1'],
            'attribute_value_ids.*' => ['integer', 'exists:product_attribute_values,id'],
        ]);

        $v = ProductVariant::create([
            'product_id'   => $product,
            'price'        => $request->price,
            'is_available' => $request->boolean('is_available', true),
        ]);
        $v->attributeValues()->attach($request->attribute_value_ids);
        $v->load('attributeValues');

        return response()->json([
            'id'                  => $v->id,
            'price'               => (float) $v->price,
            'is_available'        => $v->is_available,
            'attribute_value_ids' => $v->attributeValues->pluck('id'),
        ], 201);
    }

    public function destroyVariant(string $product, string $variant): JsonResponse
    {
        $v = ProductVariant::where('product_id', $product)->findOrFail($variant);
        $v->attributeValues()->detach();
        $v->delete();

        return response()->json(['message' => 'Variante removida.']);
    }

    public function generateVariants(Request $request, string $product): JsonResponse
    {
        $p = Product::findOrFail($product);

        $request->validate([
            'default_price' => ['sometimes', 'numeric', 'min:0'],
        ]);

        $defaultPrice = $request->input('default_price', 0);
        $attributes = $p->attributes()->with('values')->orderBy('sort_order')->get();

        if ($attributes->isEmpty()) {
            return response()->json(['message' => 'Nenhum atributo definido.'], 422);
        }

        // Build cartesian product of all attribute value IDs
        $pools = $attributes->map(fn ($a) => $a->values->pluck('id')->toArray())->filter(fn ($v) => count($v) > 0)->values()->toArray();

        if (empty($pools)) {
            return response()->json(['message' => 'Atributos sem valores.'], 422);
        }

        $combos = [[]];
        foreach ($pools as $pool) {
            $newCombos = [];
            foreach ($combos as $combo) {
                foreach ($pool as $valueId) {
                    $newCombos[] = array_merge($combo, [$valueId]);
                }
            }
            $combos = $newCombos;
        }

        // Get existing combos to avoid duplicates
        $existing = $p->variants()->with('attributeValues')->get()->map(fn ($v) => $v->attributeValues->pluck('id')->sort()->values()->toArray());

        $created = 0;
        foreach ($combos as $valueIds) {
            $sorted = collect($valueIds)->sort()->values()->toArray();
            if ($existing->contains(fn ($e) => $e === $sorted)) continue;

            $variant = ProductVariant::create([
                'product_id'   => $p->id,
                'price'        => $defaultPrice,
                'is_available' => true,
            ]);
            $variant->attributeValues()->attach($valueIds);
            $created++;
        }

        return response()->json(['message' => "Geradas {$created} variantes.", 'created' => $created], 201);
    }

    public function storeAttribute(Request $request, string $product): JsonResponse
    {
        $p = Product::findOrFail($product);
        $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'values'   => ['required', 'array', 'min:1'],
            'values.*' => ['required', 'string'],
        ]);

        $attr = ProductAttribute::create([
            'product_id' => $p->id,
            'name'       => $request->name,
            'sort_order' => $p->attributes()->count(),
        ]);

        $values = collect($request->values)->map(fn ($val, $i) =>
            ProductAttributeValue::create(['attribute_id' => $attr->id, 'value' => $val, 'sort_order' => $i])
        );

        return response()->json([
            'id'         => $attr->id,
            'name'       => $attr->name,
            'sort_order' => $attr->sort_order,
            'values'     => $values->map(fn ($v) => ['id' => $v->id, 'value' => $v->value, 'sort_order' => $v->sort_order]),
        ], 201);
    }

    public function storeAttributeValue(Request $request, string $product, string $attribute): JsonResponse
    {
        $attr = ProductAttribute::where('product_id', $product)->findOrFail($attribute);
        $request->validate(['value' => ['required', 'string', 'max:255']]);

        $v = ProductAttributeValue::create([
            'attribute_id' => $attr->id,
            'value'        => $request->value,
            'sort_order'   => $attr->values()->count(),
        ]);

        return response()->json(['id' => $v->id, 'value' => $v->value, 'sort_order' => $v->sort_order], 201);
    }

    public function destroyAttributeValue(string $product, string $attribute, string $value): JsonResponse
    {
        $attr = ProductAttribute::where('product_id', $product)->findOrFail($attribute);
        $val  = ProductAttributeValue::where('attribute_id', $attr->id)->findOrFail($value);

        // Delete all variants that include this value
        foreach ($val->variants as $variant) {
            $variant->attributeValues()->detach();
            $variant->delete();
        }

        $val->delete();

        return response()->json(['message' => 'Valor e variantes associadas removidos.']);
    }

    // ── Addons ──

    public function storeAddon(Request $request, string $product): JsonResponse
    {
        $p = Product::findOrFail($product);

        $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'price'       => ['required', 'numeric', 'min:0'],
            'type'        => ['sometimes', 'in:checkbox,text,select'],
            'placeholder' => ['nullable', 'string', 'max:255'],
            'options'     => ['nullable', 'array'],
            'is_required' => ['sometimes', 'boolean'],
        ]);

        $addon = $p->addons()->create([
            'name'        => $request->name,
            'price'       => $request->price,
            'type'        => $request->input('type', 'checkbox'),
            'placeholder' => $request->placeholder,
            'options'     => $request->options,
            'is_required' => $request->boolean('is_required', false),
            'sort_order'  => $p->addons()->count(),
        ]);

        return response()->json($addon, 201);
    }

    public function updateAddon(Request $request, string $product, string $addon): JsonResponse
    {
        $a = ProductAddon::where('product_id', $product)->findOrFail($addon);

        $request->validate([
            'name'        => ['sometimes', 'string', 'max:255'],
            'price'       => ['sometimes', 'numeric', 'min:0'],
            'type'        => ['sometimes', 'in:checkbox,text,select'],
            'placeholder' => ['nullable', 'string', 'max:255'],
            'options'     => ['nullable', 'array'],
            'is_required' => ['sometimes', 'boolean'],
        ]);

        $a->update($request->only(['name', 'price', 'type', 'placeholder', 'options', 'is_required']));

        return response()->json($a);
    }

    public function destroyAddon(string $product, string $addon): JsonResponse
    {
        $a = ProductAddon::where('product_id', $product)->findOrFail($addon);
        $a->delete();

        return response()->json(['message' => 'Extra removido.']);
    }

    public function convertType(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'product_type' => ['required', 'in:simple,variable'],
            'base_price'   => ['required_if:product_type,simple', 'numeric', 'min:0'],
        ]);

        $product = Product::with(['variants.attributeValues', 'attributes.values'])->findOrFail($id);
        $newType = $request->product_type;

        if ($product->product_type === $newType) {
            return response()->json(['message' => 'O produto já é deste tipo.'], 422);
        }

        DB::transaction(function () use ($product, $request, $newType) {
            // Always remove existing variants (detach pivot first)
            foreach ($product->variants as $variant) {
                $variant->attributeValues()->detach();
                $variant->delete();
            }

            if ($newType === 'simple') {
                // Also remove all attributes and their values
                foreach ($product->attributes as $attr) {
                    $attr->values()->delete();
                    $attr->delete();
                }
                // Create the single fixed-price variant
                ProductVariant::create([
                    'product_id'   => $product->id,
                    'price'        => $request->base_price,
                    'is_available' => true,
                ]);
            }
            // If converting to variable: variants/attributes deleted above; admin adds them fresh

            $product->update(['product_type' => $newType]);
        });

        $product->load(['images', 'attributes.values', 'variants.attributeValues', 'addons', 'category']);

        return response()->json(new ProductResource($product));
    }

    public function destroy(string $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        try {
            $product->delete();
            return response()->json(['message' => 'Produto removido.']);
        } catch (QueryException $e) {
            // Keep historical order integrity when product is referenced by past orders.
            if ($e->getCode() === '23000') {
                $product->update(['is_active' => false]);

                return response()->json([
                    'message' => 'Produto com histórico de encomendas não pode ser eliminado. Foi desativado.',
                    'archived' => true,
                ]);
            }

            throw $e;
        }
    }

    public function uploadImages(Request $request, string $product): JsonResponse
    {
        $request->validate([
            'images'          => ['required', 'array', 'min:1'],
            'images.*'        => ['required', 'image', 'mimes:jpeg,jpg,png,gif,webp', 'max:5120'],
            'primary_index'   => ['nullable', 'integer'],
        ]);

        $productModel = Product::findOrFail($product);
        $primaryIndex = $request->integer('primary_index', 0);
        $uploaded = [];

        foreach ($request->file('images') as $index => $file) {
            $path = $file->store("products/{$productModel->id}", 'public');
            $image = $productModel->images()->create([
                'path'       => $path,
                'alt'        => $productModel->name,
                'is_primary' => $index === $primaryIndex,
                'sort_order' => $productModel->images()->count() + $index,
            ]);
            $uploaded[] = [
                'id'  => $image->id,
                'url' => asset('storage/' . $path),
            ];
        }

        return response()->json(['images' => $uploaded], 201);
    }

    public function deleteImage(Request $request, string $product, string $image): JsonResponse
    {
        $productModel = Product::findOrFail($product);
        $imageModel = $productModel->images()->findOrFail($image);

        Storage::disk('public')->delete($imageModel->path);
        $imageModel->delete();

        // If we deleted the primary, promote the first remaining image
        if ($imageModel->is_primary) {
            $first = $productModel->images()->orderBy('sort_order')->first();
            if ($first) $first->update(['is_primary' => true]);
        }

        // Renumber sort_order sequentially
        $productModel->images()->orderBy('sort_order')->get()
            ->each(fn($img, $i) => $img->update(['sort_order' => $i]));

        return response()->json(null, 204);
    }

    public function reorderImages(Request $request, string $product): JsonResponse
    {
        $request->validate([
            'order' => ['required', 'array'],
            'order.*' => ['integer'],
        ]);

        $productModel = Product::findOrFail($product);
        $ids = $request->input('order');

        foreach ($ids as $index => $imageId) {
            $productModel->images()->where('id', $imageId)->update([
                'sort_order' => $index,
                'is_primary' => $index === 0,
            ]);
        }

        return response()->json(null, 204);
    }
}
