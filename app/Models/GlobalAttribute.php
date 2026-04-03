<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GlobalAttribute extends Model
{
    protected $fillable = ['name', 'sort_order'];

    public function values(): HasMany
    {
        return $this->hasMany(GlobalAttributeValue::class)->orderBy('sort_order');
    }
}
