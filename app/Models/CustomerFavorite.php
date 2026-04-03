<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerFavorite extends Model
{
    protected $fillable = [
        'phone',
        'product_id',
        'product_slug',
        'product_name',
        'product_image',
        'variant_id',
        'variant_label',
        'price',
        'selected_values',
        'flavour_selections',
        'addon_values',
    ];

    protected $casts = [
        'selected_values'   => 'array',
        'flavour_selections' => 'array',
        'addon_values'      => 'array',
        'price'             => 'decimal:2',
    ];
}
