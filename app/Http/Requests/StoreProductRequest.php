<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
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
        $isSimple = $this->input('product_type') === 'simple';

        return [
            'name'                    => ['required', 'string', 'max:255'],
            'slug'                    => ['nullable', 'string', 'max:255', 'unique:products,slug'],
            'category_id'             => ['nullable', 'integer', 'exists:categories,id'],
            'product_type'            => ['in:simple,variable'],
            'description'             => ['nullable', 'string'],
            'requires_advance_order'  => ['boolean'],
            'is_active'               => ['boolean'],
            'is_non_lactose'          => ['boolean'],
            'is_fitness'              => ['boolean'],
            'sort_order'              => ['integer', 'min:0'],

            'base_price'              => $isSimple ? ['required', 'numeric', 'min:0'] : ['nullable', 'numeric', 'min:0'],

            'attributes'              => $isSimple ? ['nullable', 'array'] : ['required', 'array', 'min:1'],
            'attributes.*.name'       => ['required', 'string'],
            'attributes.*.values'     => ['required', 'array', 'min:1'],
            'attributes.*.values.*'   => ['required', 'string'],

            'variants'                          => $isSimple ? ['nullable', 'array'] : ['required', 'array', 'min:1'],
            'variants.*.price'                  => ['required', 'numeric', 'min:0'],
            'variants.*.is_available'           => ['boolean'],
            'variants.*.attribute_value_keys'   => ['required', 'array'],

            'addons'                  => ['nullable', 'array'],
            'addons.*.name'           => ['required', 'string'],
            'addons.*.price'          => ['numeric', 'min:0'],
            'addons.*.type'           => ['required', 'in:checkbox,text,select'],
            'addons.*.placeholder'    => ['nullable', 'string'],
            'addons.*.is_required'    => ['boolean'],
        ];
    }
}
