<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'category_id', 'name', 'slug', 'product_type', 'description', 'seo_title', 'seo_description',
        'requires_advance_order', 'delivery_weekday', 'is_active', 'sort_order',
        'is_non_lactose', 'is_fitness', 'is_event',
    ];

    protected $casts = [
        'requires_advance_order' => 'boolean',
        'delivery_weekday'       => 'integer',
        'is_active'              => 'boolean',
        'is_non_lactose'         => 'boolean',
        'is_fitness'             => 'boolean',
        'is_event'               => 'boolean',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function primaryImage(): HasMany
    {
        return $this->hasMany(ProductImage::class)->where('is_primary', true);
    }

    public function attributes(): HasMany
    {
        return $this->hasMany(ProductAttribute::class)->orderBy('sort_order');
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function addons(): HasMany
    {
        return $this->hasMany(ProductAddon::class)->orderBy('sort_order');
    }

    public function optionRules(): HasMany
    {
        return $this->hasMany(OptionRule::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(ProductReview::class)->where('is_approved', true);
    }

    public function coupons(): BelongsToMany
    {
        return $this->belongsToMany(Coupon::class);
    }

    public function getPriceRangeAttribute(): array
    {
        $prices = $this->variants()->pluck('price');

        return [
            'min' => $prices->min(),
            'max' => $prices->max(),
        ];
    }
}
