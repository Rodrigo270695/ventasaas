<?php

namespace App\Http\Requests\Admin\Compras;

use App\Models\Party;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PurchaseOrderRequest extends FormRequest
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
            'supplier_party_id' => [
                'required',
                'uuid',
                Rule::exists('parties', 'id')->where(
                    fn ($query) => $query->whereIn('type', [
                        Party::TYPE_SUPPLIER,
                        Party::TYPE_BOTH,
                    ]),
                ),
            ],
            'order_date' => ['required', 'date'],
            'expected_date' => ['nullable', 'date', 'after_or_equal:order_date'],
            'currency_code' => ['required', 'string', 'size:3'],
            'exchange_rate' => ['required', 'numeric', 'min:0.000001'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'approve' => ['sometimes', 'boolean'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.product_variant_id' => ['required', 'uuid', 'exists:product_variants,id'],
            'lines.*.quantity' => ['required', 'numeric', 'min:0.0001'],
            'lines.*.unit_cost' => ['required', 'numeric', 'min:0'],
            'lines.*.description' => ['nullable', 'string', 'max:500'],
        ];
    }
}
