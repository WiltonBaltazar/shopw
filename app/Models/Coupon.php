<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Coupon extends Model
{
    protected $fillable = [
        'code',
        'description',
        'type',
        'value',
        'min_order_amount',
        'max_discount_amount',
        'applies_to_all',
        'is_first_buy',
        'is_active',
        'expires_at',
    ];

    protected $casts = [
        'value'             => 'decimal:2',
        'min_order_amount'  => 'decimal:2',
        'max_discount_amount' => 'decimal:2',
        'applies_to_all'    => 'boolean',
        'is_first_buy'      => 'boolean',
        'is_active'         => 'boolean',
        'expires_at'        => 'datetime',
    ];

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class);
    }

    /** Whether the coupon is currently usable (active + not expired). */
    public function isValid(): bool
    {
        if (! $this->is_active) {
            return false;
        }

        if ($this->expires_at && now()->isAfter($this->expires_at)) {
            return false;
        }

        return true;
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()));
    }
}
