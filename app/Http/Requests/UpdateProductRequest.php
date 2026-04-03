<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $productId = $this->route('product');

        return [
            'name'                   => ['sometimes', 'string', 'max:255'],
            'slug'                   => ['sometimes', 'string', 'max:255', "unique:products,slug,{$productId}"],
            'category_id'            => ['nullable', 'integer', 'exists:categories,id'],
            'description'            => ['nullable', 'string'],
            'seo_title'              => ['nullable', 'string', 'max:120'],
            'seo_description'        => ['nullable', 'string', 'max:300'],
            'requires_advance_order' => ['boolean'],
            'is_active'              => ['boolean'],
            'is_non_lactose'         => ['boolean'],
            'is_fitness'             => ['boolean'],
            'is_event'               => ['boolean'],
            'sort_order'             => ['integer', 'min:0'],
        ];
    }
}
