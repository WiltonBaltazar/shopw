<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BlogPost extends Model
{
    protected $fillable = [
        'title',
        'slug',
        'excerpt',
        'content',
        'cover_image_url',
        'is_published',
        'is_sticky',
        'published_at',
        'sort_order',
    ];

    protected $casts = [
        'is_published'  => 'boolean',
        'is_sticky'     => 'boolean',
        'published_at'  => 'datetime',
        'sort_order'    => 'integer',
    ];

    public function scopePublished($query)
    {
        return $query
            ->where('is_published', true)
            ->orderByDesc('is_sticky')
            ->orderBy('sort_order')
            ->orderByDesc('published_at');
    }
}
