<?php

namespace App\Http\Requests\Admin\Inventario;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StockTransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user?->can('stock_balances.adjust') ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'from_warehouse_id' => ['required', 'uuid', Rule::exists('warehouses', 'id')],
            'to_warehouse_id' => [
                'required',
                'uuid',
                Rule::exists('warehouses', 'id'),
                'different:from_warehouse_id',
            ],
            'product_variant_id' => ['required', 'uuid', Rule::exists('product_variants', 'id')],
            'quantity' => ['required', 'numeric', 'min:0.0001', 'max:999999999.9999'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'from_warehouse_id' => 'almacén origen',
            'to_warehouse_id' => 'almacén destino',
            'product_variant_id' => 'variante',
            'quantity' => 'cantidad',
            'notes' => 'notas',
        ];
    }
}
