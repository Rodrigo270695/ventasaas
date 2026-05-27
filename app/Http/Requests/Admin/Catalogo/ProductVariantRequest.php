<?php

namespace App\Http\Requests\Admin\Catalogo;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProductVariantRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var ProductVariant|null $variante */
        $variante = $this->route('variante');

        if ($variante) {
            return $this->user()?->can('products.update') ?? false;
        }

        return $this->user()?->can('products.create') ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var ProductVariant|null $variante */
        $variante = $this->route('variante');

        return [
            'sku' => [
                'required',
                'string',
                'max:50',
                'regex:/^[A-Z0-9_-]+$/',
                Rule::unique('product_variants', 'sku')->ignore($variante?->id),
            ],
            'label' => ['nullable', 'string', 'max:120'],
            'barcode' => ['nullable', 'string', 'max:50'],
            'minimum_stock' => ['nullable', 'numeric', 'min:0'],
            'is_default' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'sku' => 'SKU',
            'label' => 'presentación',
            'barcode' => 'código de barras',
            'minimum_stock' => 'stock mínimo',
            'is_default' => 'variante predeterminada',
            'is_active' => 'estado',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('sku')) {
            $this->merge([
                'sku' => strtoupper(trim((string) $this->input('sku'))),
            ]);
        }

        if ($this->has('is_default')) {
            $this->merge([
                'is_default' => $this->boolean('is_default'),
            ]);
        }

        if ($this->has('is_active')) {
            $this->merge([
                'is_active' => $this->boolean('is_active'),
            ]);
        }

        if ($this->has('minimum_stock')) {
            $raw = trim((string) $this->input('minimum_stock'));
            $this->merge([
                'minimum_stock' => $raw === '' ? null : str_replace(',', '.', $raw),
            ]);
        }
    }

    protected function failedValidation(Validator $validator): void
    {
        /** @var Product $producto */
        $producto = $this->route('producto');

        throw (new ValidationException($validator))
            ->redirectTo(route('admin.catalogo.productos.show', [
                'producto' => $producto,
                'tab' => 'variantes',
            ]));
    }
}
