<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOrderRequest extends FormRequest
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
        $payOnDeliveryRaw = \App\Models\Setting::get('pay_on_delivery_enabled', '0');
        $payOnDeliveryEnabled = in_array(strtolower((string) $payOnDeliveryRaw), ['1', 'true', 'yes', 'on'], true);
        $allowedPaymentMethods = ['mpesa'];
        if ($payOnDeliveryEnabled) {
            $allowedPaymentMethods[] = 'cash_on_delivery';
        }

        return [
            'customer_name'    => ['required', 'string', 'max:255'],
            'customer_phone'   => ['required', 'string', 'max:30'],
            'customer_address' => ['nullable', 'string', 'max:500'],
            'notes'            => ['nullable', 'string', 'max:1000'],
            'delivery_date'    => ['required', 'date', 'after:+23 hours', function (string $attr, mixed $value, \Closure $fail) {
                $deliveryDate = \Carbon\Carbon::parse($value);
                $date = $deliveryDate->toDateString();
                if (\App\Models\BlockedDate::where('date', $date)->exists()) {
                    $fail('Esta data não está disponível para entregas.');
                }
                $raw = \App\Models\Setting::get('blocked_weekdays', '[]');
                $blockedWeekdays = json_decode($raw, true) ?? [];
                if (in_array($deliveryDate->dayOfWeek, $blockedWeekdays, true)) {
                    $fail('Esta data não está disponível para entregas.');
                }
                $startHour = (int) \App\Models\Setting::get('delivery_start_hour', 10);
                $endHour   = (int) \App\Models\Setting::get('delivery_end_hour', 19);
                $hour = (int) $deliveryDate->format('H');
                if ($hour < $startHour || $hour > $endHour) {
                    $fail('O horário escolhido está fora do período de entregas.');
                }

                $productIds = collect($this->input('items', []))
                    ->pluck('product_id')
                    ->filter(fn ($id) => is_numeric($id))
                    ->map(fn ($id) => (int) $id)
                    ->unique()
                    ->values();

                if ($productIds->isEmpty()) {
                    return;
                }

                $restrictedProducts = \App\Models\Product::query()
                    ->whereIn('id', $productIds)
                    ->whereNotNull('delivery_weekday')
                    ->where('delivery_weekday', '!=', $deliveryDate->dayOfWeek)
                    ->get(['name', 'delivery_weekday']);

                if ($restrictedProducts->isNotEmpty()) {
                    $weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
                    $labels = $restrictedProducts->map(function ($product) use ($weekdays) {
                        $requiredDay = $weekdays[$product->delivery_weekday] ?? 'dia específico';
                        return "{$product->name} ({$requiredDay})";
                    })->implode(', ');
                    $fail("Alguns produtos só podem ser entregues em dias específicos: {$labels}.");
                }
            }],
            'delivery_type'    => ['nullable', Rule::in(['delivery', 'pickup'])],
            'delivery_region_id' => ['nullable', 'integer', 'exists:delivery_regions,id'],
            'payment_method'   => ['nullable', 'string', Rule::in($allowedPaymentMethods)],

            'coupon_code'                 => ['nullable', 'string', 'max:64'],

            'items'                       => ['required', 'array', 'min:1'],
            'items.*.product_id'          => ['required', 'integer', 'exists:products,id'],
            'items.*.variant_id'          => ['required', 'integer', 'exists:product_variants,id'],
            'items.*.quantity'            => ['required', 'integer', 'min:1'],
            'items.*.custom_notes'        => ['nullable', 'string', 'max:500'],

            'items.*.addons'              => ['nullable', 'array'],
            'items.*.addons.*.addon_id'   => ['required', 'integer', 'exists:product_addons,id'],
            'items.*.addons.*.value'      => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.required'                  => 'O seu pedido não tem produtos.',
            'items.*.product_id.exists'       => 'Um ou mais produtos do carrinho já não estão disponíveis. Por favor, refresque a página e adicione os produtos novamente.',
            'items.*.variant_id.exists'       => 'Um ou mais produtos do carrinho já não estão disponíveis. Por favor, refresque a página e adicione os produtos novamente.',
            'items.*.addons.*.addon_id.exists' => 'Um ou mais extras do carrinho já não estão disponíveis. Por favor, refresque a página e adicione os produtos novamente.',
            'delivery_region_id.exists'       => 'A região de entrega selecionada já não está disponível. Por favor, escolha outra.',
            'delivery_date.required'          => 'Escolha uma data e horário de entrega.',
            'delivery_date.after'             => 'As encomendas precisam de pelo menos 24 horas de antecedência.',
            'payment_method.in'               => 'Método de pagamento inválido.',
        ];
    }
}
