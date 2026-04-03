<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductVariantResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'price' => (float) $this->price,
            'is_available' => $this->is_available,
            'attribute_value_ids' => $this->whenLoaded(
                'attributeValues',
                fn () => $this->attributeValues->pluck('id'),
            ),
        ];
    }
}
