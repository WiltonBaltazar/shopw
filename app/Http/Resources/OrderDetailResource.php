<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderDetailResource extends JsonResource
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
            'reference' => $this->reference,
            'order_type' => $this->order_type ?? 'standard',
            'customer_name' => $this->customer_name,
            'customer_phone' => $this->customer_phone,
            'customer_address' => $this->customer_address,
            'status' => $this->status,
            'payment_status' => $this->payment_status,
            'payment_method' => $this->payment_method,
            'coupon_code' => $this->coupon_code,
            'discount_amount' => (float) ($this->discount_amount ?? 0),
            'total' => (float) $this->total,
            'amount_paid' => (float) ($this->amount_paid ?? 0),
            'payment_due' => $this->payment_due !== null ? (float) $this->payment_due : null,
            'payment_token' => $this->payment_token,
            'notes' => $this->notes,
            'admin_notes' => $this->admin_notes,
            'delivery_date' => $this->delivery_date,
            'delivery_type' => $this->delivery_type ?? 'delivery',
            'delivery_region_id' => $this->delivery_region_id,
            'delivery_region' => $this->deliveryRegion ? ['id' => $this->deliveryRegion->id, 'name' => $this->deliveryRegion->name] : null,
            'delivery_fee' => (int) ($this->delivery_fee ?? 0),
            'mpesa_status' => $this->mpesaTransaction?->status ?? null,
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
