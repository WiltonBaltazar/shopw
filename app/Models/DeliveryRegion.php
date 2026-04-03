<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeliveryRegion extends Model
{
    protected $fillable = ['name', 'price', 'is_active', 'sort_order'];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
