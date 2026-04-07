<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FaqController extends Controller
{
    public function index(): JsonResponse
    {
        $faqs = Faq::orderBy('sort_order')->orderBy('id')->get();

        return response()->json(['data' => $faqs]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'question'   => ['required', 'string', 'max:500'],
            'answer'     => ['required', 'string', 'max:2000'],
            'is_active'  => ['boolean'],
            'sort_order' => ['integer'],
        ]);

        $faq = Faq::create($data);

        return response()->json(['data' => $faq], 201);
    }

    public function update(Request $request, Faq $faq): JsonResponse
    {
        $data = $request->validate([
            'question'   => ['sometimes', 'string', 'max:500'],
            'answer'     => ['sometimes', 'string', 'max:2000'],
            'is_active'  => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer'],
        ]);

        $faq->update($data);

        return response()->json(['data' => $faq]);
    }

    public function destroy(Faq $faq): JsonResponse
    {
        $faq->delete();

        return response()->json(['message' => 'FAQ eliminada.']);
    }
}
