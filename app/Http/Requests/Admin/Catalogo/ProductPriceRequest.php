<?php

namespace App\Http\Requests\Admin\Catalogo;

use App\Models\Product;
use App\Models\ProductPrice;
use App\Models\ProductVariant;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProductPriceRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user?->can('price_lists.update')
            || $user?->can('products.update') ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Product $producto */
        $producto = $this->route('producto');

        /** @var ProductPrice|null $precio */
        $precio = $this->route('precio');

        if ($precio) {
            return [
                'amount' => ['required', 'numeric', 'min:0', 'max:999999999.9999'],
            ];
        }

        return [
            'product_variant_id' => [
                'required',
                'uuid',
                Rule::exists('product_variants', 'id')->where(
                    fn ($query) => $query->where('product_id', $producto->id),
                ),
            ],
            'price_list_id' => [
                'required',
                'uuid',
                Rule::exists('price_lists', 'id'),
            ],
            'amount' => ['required', 'numeric', 'min:0', 'max:999999999.9999'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'product_variant_id' => 'variante',
            'price_list_id' => 'lista de precios',
            'amount' => 'precio',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        /** @var Product $producto */
        $producto = $this->route('producto');

        throw (new ValidationException($validator))
            ->redirectTo(route('admin.catalogo.productos.show', [
                'producto' => $producto,
                'tab' => 'precios',
            ]));
    }
}
