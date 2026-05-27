<?php

namespace App\Http\Requests\Admin\Inventario;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StockBreakdownRequest extends FormRequest
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
            'warehouse_id' => ['required', 'uuid', Rule::exists('warehouses', 'id')],
            'from_variant_id' => ['required', 'uuid', Rule::exists('product_variants', 'id')],
            'to_variant_id' => [
                'required',
                'uuid',
                Rule::exists('product_variants', 'id'),
                'different:from_variant_id',
            ],
            'quantity_from' => ['required', 'numeric', 'min:0.0001', 'max:999999999.9999'],
            'quantity_to' => ['required', 'numeric', 'min:0.0001', 'max:999999999.9999'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'warehouse_id' => 'almacén',
            'from_variant_id' => 'variante origen',
            'to_variant_id' => 'variante destino',
            'quantity_from' => 'cantidad origen',
            'quantity_to' => 'cantidad destino',
            'notes' => 'notas',
        ];
    }
}
