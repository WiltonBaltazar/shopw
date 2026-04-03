<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CouponResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'code'                => $this->code,
            'description'         => $this->description,
            'type'                => $this->type,
            'value'               => (float) $this->value,
            'min_order_amount'    => $this->min_order_amount ? (float) $this->min_order_amount : null,
            'max_discount_amount' => $this->max_discount_amount ? (float) $this->max_discount_amount : null,
            'applies_to_all'      => $this->applies_to_all,
            'is_first_buy'        => $this->is_first_buy,
            'is_active'           => $this->is_active,
            'expires_at'          => $this->expires_at?->toISOString(),
            'product_ids'         => $this->whenLoaded('products', fn () => $this->products->pluck('id')),
        ];
    }
}
