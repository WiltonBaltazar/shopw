<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCouponRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // guard via route middleware
    }

    public function rules(): array
    {
        $couponId = $this->route('coupon')?->id;

        return [
            'code' => [
                'required',
                'string',
                'max:64',
                Rule::unique('coupons', 'code')->ignore($couponId),
            ],
            'description'        => ['nullable', 'string', 'max:255'],
            'type'               => ['required', Rule::in(['fixed', 'percentage'])],
            'value'              => ['required', 'numeric', 'min:0.01'],
            'min_order_amount'   => ['nullable', 'numeric', 'min:0'],
            'max_discount_amount' => ['nullable', 'numeric', 'min:0'],
            'applies_to_all'     => ['boolean'],
            'is_first_buy'       => ['boolean'],
            'is_active'          => ['boolean'],
            'expires_at'         => ['nullable', 'date', 'after:now'],
            'product_ids'        => ['nullable', 'array'],
            'product_ids.*'      => ['integer', 'exists:products,id'],
        ];
    }

    public function prepareForValidation(): void
    {
        $this->merge([
            'code' => strtoupper($this->code ?? ''),
        ]);
    }
}
