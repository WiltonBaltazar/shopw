<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class Order extends Model
{
    protected $fillable = [
        'reference', 'order_type', 'customer_name', 'customer_phone', 'customer_address',
        'status', 'payment_status', 'payment_method', 'total', 'amount_paid', 'payment_due', 'payment_token',
        'coupon_code', 'discount_amount',
        'notes', 'admin_notes', 'delivery_date',
        'delivery_type', 'delivery_region_id', 'delivery_fee',
    ];

    protected $casts = [
        'total'           => 'decimal:2',
        'amount_paid'     => 'decimal:2',
        'payment_due'     => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'delivery_date' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (Order $order) {
            if (empty($order->reference)) {
                $order->reference = 'CM-' . strtoupper(Str::random(8));
            }
        });
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function mpesaTransaction(): HasOne
    {
        return $this->hasOne(MpesaTransaction::class);
    }

    public function deliveryRegion(): BelongsTo
    {
        return $this->belongsTo(DeliveryRegion::class);
    }
}
