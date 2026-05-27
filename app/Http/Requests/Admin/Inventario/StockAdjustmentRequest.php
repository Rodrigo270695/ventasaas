<?php

namespace App\Http\Requests\Admin\Inventario;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use App\Services\Catalog\ProductPriceFromCostService;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class StockAdjustmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user?->can('stock_balances.adjust')
            || $user?->can('products.update') ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Product|null $producto */
        $producto = $this->route('producto');

        $variantRule = $producto
            ? Rule::exists('product_variants', 'id')->where(
                fn ($query) => $query->where('product_id', $producto->id),
            )
            : Rule::exists('product_variants', 'id');

        return [
            'warehouse_id' => ['required', 'uuid', Rule::exists('warehouses', 'id')],
            'product_variant_id' => ['required', 'uuid', $variantRule],
            'quantity_on_hand' => ['required', 'numeric', 'min:0', 'max:999999999.9999'],
            'unit_cost' => ['nullable', 'numeric', 'min:0', 'max:999999999.999999'],
            'notes' => ['nullable', 'string', 'max:500'],
            'sync_sale_prices' => ['sometimes', 'boolean'],
            'price_list_ids' => ['required_if:sync_sale_prices,1,true', 'array', 'min:1'],
            'price_list_ids.*' => ['uuid', Rule::exists('price_lists', 'id')],
            'markup_type' => [
                'required_if:sync_sale_prices,1,true',
                Rule::in([
                    ProductPriceFromCostService::MARKUP_PERCENT,
                    ProductPriceFromCostService::MARKUP_FIXED,
                ]),
            ],
            'markup_value' => ['required_if:sync_sale_prices,1,true', 'numeric', 'min:0', 'max:999999999.99'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('sync_sale_prices')) {
            $this->merge([
                'sync_sale_prices' => $this->boolean('sync_sale_prices'),
            ]);
        }
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'warehouse_id' => 'almacén',
            'product_variant_id' => 'variante',
            'quantity_on_hand' => 'cantidad en stock',
            'unit_cost' => 'costo unitario',
            'notes' => 'notas',
            'price_list_ids' => 'listas de precios',
            'markup_type' => 'tipo de margen',
            'markup_value' => 'margen',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        /** @var Product|null $producto */
        $producto = $this->route('producto');

        if ($producto) {
            throw (new ValidationException($validator))
                ->redirectTo(route('admin.catalogo.productos.show', [
                    'producto' => $producto,
                    'tab' => 'stock',
                ]));
        }

        session()->flash('stockAdjustModal', 'open');
        session()->flash('stockAdjustVariantId', $this->input('product_variant_id'));
        session()->flash('stockAdjustWarehouseId', $this->input('warehouse_id'));

        throw (new ValidationException($validator))
            ->redirectTo(route('admin.inventario.saldos.index', [
                'warehouse_id' => $this->input('warehouse_id'),
            ]));
    }
}
