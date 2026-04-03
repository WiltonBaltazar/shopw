<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductListResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $images = $this->whenLoaded('images');
        $primary = $images ? collect($images)->where('is_primary', true)->first() : null;
        $secondary = $images ? collect($images)->where('is_primary', false)->first() : null;
        $prices = $this->whenLoaded('variants')
            ? collect($this->variants)->pluck('price')
            : collect();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'product_type' => $this->product_type ?? 'variable',
            'requires_advance_order' => $this->requires_advance_order,
            'is_non_lactose' => (bool) $this->is_non_lactose,
            'is_fitness'     => (bool) $this->is_fitness,
            'is_event'       => (bool) $this->is_event,
            'price_range' => [
                'min' => (float) $prices->min(),
                'max' => (float) $prices->max(),
            ],
            'primary_image' => $primary ? [
                'url' => str_starts_with($primary->path, 'http') ? $primary->path : asset('storage/' . $primary->path),
                'alt' => $primary->alt ?? $this->name,
            ] : null,
            'secondary_image' => $secondary ? [
                'url' => str_starts_with($secondary->path, 'http') ? $secondary->path : asset('storage/' . $secondary->path),
                'alt' => $secondary->alt ?? $this->name,
            ] : null,
            'default_variant_id' => $this->product_type === 'simple'
                ? (optional(collect($this->whenLoaded('variants'))->first())->id)
                : null,
            'category' => new CategoryResource($this->whenLoaded('category')),
        ];
    }
}
