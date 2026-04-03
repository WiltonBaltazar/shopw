<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'reference'      => $this->reference,
            'order_type'     => $this->order_type ?? 'standard',
            'customer_name'  => $this->customer_name,
            'customer_phone' => $this->customer_phone,
            'status'         => $this->status,
            'payment_status' => $this->payment_status,
            'total'          => (float) $this->total,
            'amount_paid'    => (float) ($this->amount_paid ?? 0),
            'payment_due'    => $this->payment_due !== null ? (float) $this->payment_due : null,
            'payment_token'  => $this->payment_token,
            'notes'          => $this->notes,
            'delivery_date'  => $this->delivery_date,
            'items_count'    => $this->whenLoaded('items', fn () => $this->items->count()),
            'created_at'     => $this->created_at,
        ];
    }
}
