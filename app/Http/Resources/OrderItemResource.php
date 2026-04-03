<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
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
            'product_name' => $this->whenLoaded('product', fn () => $this->product->name),
            'product_slug' => $this->whenLoaded('product', fn () => $this->product->slug),
            'variant_id' => $this->variant_id,
            'variant_label' => $this->whenLoaded('variant', fn () =>
                $this->variant?->attributeValues
                    ->sortBy(fn ($av) => $av->attribute?->sort_order ?? 0)
                    ->map(fn ($av) => trim(($av->attribute?->name ? $av->attribute->name . ': ' : '') . $av->value))
                    ->filter()
                    ->join(', ')
            ),
            'quantity' => $this->quantity,
            'unit_price' => (float) $this->unit_price,
            'subtotal' => (float) $this->subtotal,
            'custom_notes' => $this->custom_notes,
            'addons' => $this->whenLoaded('addons', fn () => $this->addons->map(fn ($a) => [
                'addon_name' => $a->addon_name,
                'value' => $a->value,
                'price' => (float) $a->price,
            ])),
        ];
    }
}
