<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItemAddon extends Model
{
    protected $fillable = ['order_item_id', 'addon_id', 'addon_name', 'value', 'price'];

    protected $casts = [
        'price' => 'decimal:2',
    ];

    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function addon(): BelongsTo
    {
        return $this->belongsTo(ProductAddon::class, 'addon_id');
    }
}
