<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductReview extends Model
{
    protected $fillable = [
        'product_id', 'customer_name', 'customer_email', 'customer_phone',
        'rating', 'body', 'photo_path', 'is_approved', 'verified_purchase',
    ];

    protected $casts = [
        'is_approved'       => 'boolean',
        'verified_purchase' => 'boolean',
        'rating'            => 'integer',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
