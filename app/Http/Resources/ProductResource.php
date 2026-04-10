<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $prices = $this->whenLoaded('variants')
            ? collect($this->variants)->pluck('price')
            : collect();

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'product_type' => $this->product_type ?? 'variable',
            'description' => $this->description,
            'seo_title' => $this->seo_title,
            'seo_description' => $this->seo_description,
            'requires_advance_order' => $this->requires_advance_order,
            'delivery_weekday' => $this->delivery_weekday,
            'is_active' => (bool) $this->is_active,
            'is_non_lactose' => (bool) $this->is_non_lactose,
            'is_fitness'     => (bool) $this->is_fitness,
            'is_event'       => (bool) $this->is_event,
            'price_range' => [
                'min' => (float) $prices->min(),
                'max' => (float) $prices->max(),
            ],
            'images' => $this->whenLoaded('images', fn () => $this->images->map(fn ($img) => [
                'id' => $img->id,
                'url' => str_starts_with($img->path, 'http') ? $img->path : asset('storage/' . $img->path),
                'alt' => $img->alt ?? $this->name,
                'is_primary' => $img->is_primary,
            ])),
            'attributes' => $this->whenLoaded('attributes', fn () => $this->attributes->map(fn ($attr) => [
                'id' => $attr->id,
                'name' => $attr->name,
                'sort_order' => $attr->sort_order,
                'values' => $attr->values->map(fn ($val) => [
                    'id' => $val->id,
                    'value' => $val->value,
                    'sort_order' => $val->sort_order,
                ]),
            ])),
            'variants' => ProductVariantResource::collection($this->whenLoaded('variants')),
            'addons' => $this->whenLoaded('addons', fn () => $this->addons->map(fn ($addon) => [
                'id' => $addon->id,
                'name' => $addon->name,
                'price' => (float) $addon->price,
                'type' => $addon->type,
                'placeholder' => $addon->placeholder,
                'options' => $addon->options,
                'is_required' => $addon->is_required,
                'sort_order' => $addon->sort_order,
            ])),
            'option_rules' => $this->whenLoaded('optionRules', fn () => $this->optionRules->map(fn ($rule) => [
                'condition_value_id' => $rule->condition_value_id,
                'target_value_id' => $rule->target_value_id,
                'rule_type' => $rule->rule_type,
            ])),
            'category' => new CategoryResource($this->whenLoaded('category')),
            'reviews_count' => $this->whenLoaded('reviews', fn () => $this->reviews->count()),
            'average_rating' => $this->whenLoaded(
                'reviews',
                fn () => $this->reviews->count() ? round($this->reviews->avg('rating'), 1) : null,
            ),
            'reviews' => $this->whenLoaded('reviews', fn () => $this->reviews->map(fn ($r) => [
                'id'                => $r->id,
                'customer_name'     => $r->customer_name,
                'rating'            => $r->rating,
                'body'              => $r->body,
                'photo_url'         => $r->photo_path ? asset('storage/' . $r->photo_path) : null,
                'verified_purchase' => $r->verified_purchase,
                'created_at'        => $r->created_at,
            ])),
        ];
    }
}
