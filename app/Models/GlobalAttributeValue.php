<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GlobalAttributeValue extends Model
{
    protected $fillable = ['global_attribute_id', 'value', 'sort_order'];

    public function attribute(): BelongsTo
    {
        return $this->belongsTo(GlobalAttribute::class, 'global_attribute_id');
    }
}
