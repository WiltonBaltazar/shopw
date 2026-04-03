<?php

namespace App\Http\Controllers;

use App\Models\Page;
use Illuminate\Http\JsonResponse;

class PageController extends Controller
{
    public function show(string $slug): JsonResponse
    {
        $page = Page::published()
            ->where('slug', $slug)
            ->firstOrFail(['id', 'title', 'slug', 'content', 'updated_at']);

        return response()->json(['data' => $page]);
    }
}
