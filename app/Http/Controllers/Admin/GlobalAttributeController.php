<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GlobalAttribute;
use App\Models\GlobalAttributeValue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GlobalAttributeController extends Controller
{
    public function index(): JsonResponse
    {
        $attrs = GlobalAttribute::with('values')->orderBy('sort_order')->orderBy('name')->get();

        return response()->json(['data' => $attrs->map(fn ($a) => [
            'id'         => $a->id,
            'name'       => $a->name,
            'sort_order' => $a->sort_order,
            'values'     => $a->values->map(fn ($v) => ['id' => $v->id, 'value' => $v->value, 'sort_order' => $v->sort_order]),
        ])]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name'     => ['required', 'string', 'max:100'],
            'values'   => ['nullable', 'array'],
            'values.*' => ['required', 'string', 'max:255'],
        ]);

        $attr = GlobalAttribute::create([
            'name'       => $request->name,
            'sort_order' => GlobalAttribute::max('sort_order') + 1,
        ]);

        foreach ($request->input('values', []) as $i => $val) {
            GlobalAttributeValue::create(['global_attribute_id' => $attr->id, 'value' => $val, 'sort_order' => $i]);
        }

        $attr->load('values');

        return response()->json(['data' => [
            'id'         => $attr->id,
            'name'       => $attr->name,
            'sort_order' => $attr->sort_order,
            'values'     => $attr->values->map(fn ($v) => ['id' => $v->id, 'value' => $v->value, 'sort_order' => $v->sort_order]),
        ]], 201);
    }

    public function update(Request $request, GlobalAttribute $globalAttribute): JsonResponse
    {
        $request->validate(['name' => ['required', 'string', 'max:100']]);
        $globalAttribute->update(['name' => $request->name]);

        return response()->json(['data' => ['id' => $globalAttribute->id, 'name' => $globalAttribute->name]]);
    }

    public function destroy(GlobalAttribute $globalAttribute): JsonResponse
    {
        $globalAttribute->delete(); // cascades to values

        return response()->json(['message' => 'Atributo eliminado.']);
    }

    public function storeValue(Request $request, GlobalAttribute $globalAttribute): JsonResponse
    {
        $request->validate(['value' => ['required', 'string', 'max:255']]);

        $val = GlobalAttributeValue::create([
            'global_attribute_id' => $globalAttribute->id,
            'value'               => $request->value,
            'sort_order'          => $globalAttribute->values()->count(),
        ]);

        return response()->json(['data' => ['id' => $val->id, 'value' => $val->value, 'sort_order' => $val->sort_order]], 201);
    }

    public function destroyValue(GlobalAttribute $globalAttribute, GlobalAttributeValue $value): JsonResponse
    {
        $value->delete();

        return response()->json(['message' => 'Valor eliminado.']);
    }
}
