<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Testimonial;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TestimonialController extends Controller
{
    public function index(): JsonResponse
    {
        $testimonials = Testimonial::orderBy('sort_order')->orderBy('id')->get();

        return response()->json(['data' => $testimonials]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'author_name'   => ['required', 'string', 'max:100'],
            'author_detail' => ['nullable', 'string', 'max:100'],
            'quote'         => ['required', 'string', 'max:500'],
            'rating'        => ['required', 'integer', 'min:1', 'max:5'],
            'is_active'     => ['boolean'],
            'sort_order'    => ['integer'],
        ]);

        $testimonial = Testimonial::create($data);

        return response()->json(['data' => $testimonial], 201);
    }

    public function update(Request $request, Testimonial $testimonial): JsonResponse
    {
        $data = $request->validate([
            'author_name'   => ['sometimes', 'string', 'max:100'],
            'author_detail' => ['nullable', 'string', 'max:100'],
            'quote'         => ['sometimes', 'string', 'max:500'],
            'rating'        => ['sometimes', 'integer', 'min:1', 'max:5'],
            'is_active'     => ['sometimes', 'boolean'],
            'sort_order'    => ['sometimes', 'integer'],
        ]);

        $testimonial->update($data);

        return response()->json(['data' => $testimonial]);
    }

    public function destroy(Testimonial $testimonial): JsonResponse
    {
        $testimonial->delete();

        return response()->json(['message' => 'Testemunho eliminado.']);
    }
}
