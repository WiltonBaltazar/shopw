<?php

namespace App\Http\Controllers;

use App\Models\BlogPost;
use Illuminate\Http\JsonResponse;

class BlogPostController extends Controller
{
    public function index(): JsonResponse
    {
        $posts = BlogPost::published()
            ->get(['id', 'title', 'slug', 'excerpt', 'cover_image_url', 'published_at']);

        return response()->json(['data' => $posts]);
    }

    public function show(string $slug): JsonResponse
    {
        $post = BlogPost::published()->where('slug', $slug)->firstOrFail();

        return response()->json(['data' => $post]);
    }
}
