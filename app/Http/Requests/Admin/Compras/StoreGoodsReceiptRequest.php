<?php

namespace App\Http\Requests\Admin\Compras;

use App\Models\PurchaseOrder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreGoodsReceiptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('purchases.manage') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'purchase_order_id' => [
                'required',
                'uuid',
                Rule::exists('purchase_orders', 'id')->whereIn('status', [
                    PurchaseOrder::STATUS_APPROVED,
                    PurchaseOrder::STATUS_PARTIALLY_RECEIVED,
                ]),
            ],
            'warehouse_id' => [
                'required',
                'uuid',
                Rule::exists('warehouses', 'id')->where('is_active', true),
            ],
            'received_date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.purchase_order_line_id' => [
                'required',
                'uuid',
                'exists:purchase_order_lines,id',
            ],
            'lines.*.quantity' => ['required', 'numeric', 'min:0.0001'],
        ];
    }
}
