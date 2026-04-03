<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OptionRule extends Model
{
    protected $fillable = [
        'product_id', 'condition_value_id', 'target_value_id', 'rule_type',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function conditionValue(): BelongsTo
    {
        return $this->belongsTo(ProductAttributeValue::class, 'condition_value_id');
    }

    public function targetValue(): BelongsTo
    {
        return $this->belongsTo(ProductAttributeValue::class, 'target_value_id');
    }
}
