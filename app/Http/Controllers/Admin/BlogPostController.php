<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BlogPostController extends Controller
{
    public function index(): JsonResponse
    {
        $posts = BlogPost::orderBy('sort_order')->orderByDesc('id')->get();

        return response()->json(['data' => $posts]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'        => 'required|string|max:255',
            'slug'         => 'nullable|string|max:255|unique:blog_posts,slug',
            'excerpt'      => 'required|string',
            'content'      => 'required|string',
            'cover_image'  => 'nullable|image|max:5120',
            'is_published' => 'boolean',
            'sort_order'   => 'integer',
        ]);

        $data['slug'] = $data['slug'] ?? Str::slug($data['title']);

        if (!empty($data['is_published'])) {
            $data['published_at'] = now();
        }

        if ($request->hasFile('cover_image')) {
            $path = $request->file('cover_image')->store('blog', 'public');
            $data['cover_image_url'] = asset('storage/' . $path);
        }

        unset($data['cover_image']);

        $post = BlogPost::create($data);

        return response()->json(['data' => $post], 201);
    }

    public function update(Request $request, BlogPost $blogPost): JsonResponse
    {
        $data = $request->validate([
            'title'              => 'sometimes|string|max:255',
            'slug'               => 'sometimes|string|max:255|unique:blog_posts,slug,' . $blogPost->id,
            'excerpt'            => 'sometimes|string',
            'content'            => 'sometimes|string',
            'cover_image'        => 'nullable|image|max:5120',
            'remove_cover_image' => 'boolean',
            'is_published'       => 'boolean',
            'sort_order'         => 'integer',
        ]);

        // Set published_at when first publishing
        if (!empty($data['is_published']) && !$blogPost->is_published && !$blogPost->published_at) {
            $data['published_at'] = now();
        }

        if ($request->hasFile('cover_image')) {
            $this->deleteCoverImage($blogPost);
            $path = $request->file('cover_image')->store('blog', 'public');
            $data['cover_image_url'] = asset('storage/' . $path);
        } elseif (!empty($data['remove_cover_image'])) {
            $this->deleteCoverImage($blogPost);
            $data['cover_image_url'] = null;
        }

        unset($data['cover_image'], $data['remove_cover_image']);

        $blogPost->update($data);

        return response()->json(['data' => $blogPost->fresh()]);
    }

    public function destroy(BlogPost $blogPost): JsonResponse
    {
        $this->deleteCoverImage($blogPost);
        $blogPost->delete();

        return response()->json(null, 204);
    }

    private function deleteCoverImage(BlogPost $blogPost): void
    {
        if (!$blogPost->cover_image_url) return;

        $parsed   = parse_url($blogPost->cover_image_url, PHP_URL_PATH);
        $relative = ltrim(str_replace('/storage/', '', $parsed ?? ''), '/');

        if (str_starts_with($relative, 'blog/')) {
            Storage::disk('public')->delete($relative);
        }
    }
}
