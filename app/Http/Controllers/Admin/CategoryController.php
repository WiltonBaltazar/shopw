<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::withCount('products')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn ($c) => [
                'id'             => $c->id,
                'name'           => $c->name,
                'slug'           => $c->slug,
                'sort_order'     => $c->sort_order,
                'products_count' => $c->products_count,
            ]);

        return response()->json(['data' => $categories]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate(['name' => ['required', 'string', 'max:255', 'unique:categories,name']]);

        $category = Category::create([
            'name'       => $request->name,
            'slug'       => Str::slug($request->name),
            'sort_order' => Category::max('sort_order') + 1,
        ]);

        return response()->json(['id' => $category->id, 'name' => $category->name, 'slug' => $category->slug], 201);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $request->validate(['name' => ['required', 'string', 'max:255', "unique:categories,name,{$category->id}"]]);

        $category->update([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
        ]);

        return response()->json(['id' => $category->id, 'name' => $category->name, 'slug' => $category->slug]);
    }

    public function destroy(Category $category): JsonResponse
    {
        if ($category->products()->exists()) {
            return response()->json(['message' => 'Não é possível eliminar uma categoria com produtos associados.'], 422);
        }

        $category->delete();

        return response()->json(['message' => 'Categoria eliminada.']);
    }

    public function reorder(Request $request): JsonResponse
    {
        $request->validate([
            'items'            => ['required', 'array'],
            'items.*.id'       => ['required', 'integer', 'exists:categories,id'],
            'items.*.sort_order' => ['required', 'integer'],
        ]);

        DB::transaction(function () use ($request) {
            foreach ($request->items as $item) {
                Category::where('id', $item['id'])->update(['sort_order' => $item['sort_order']]);
            }
        });

        return response()->json(['message' => 'Ordem atualizada.']);
    }
}
