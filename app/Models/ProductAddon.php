<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductAddon extends Model
{
    protected $fillable = [
        'product_id', 'name', 'price', 'type',
        'placeholder', 'options', 'is_required', 'sort_order',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'options' => 'array',
        'is_required' => 'boolean',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
