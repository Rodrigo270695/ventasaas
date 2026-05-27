<?php

namespace App\Http\Requests\Admin\Catalogo;

use App\Models\Product;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Product|null $producto */
        $producto = $this->route('producto');

        if ($producto) {
            return $this->user()?->can('products.update') ?? false;
        }

        return $this->user()?->can('products.create') ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Product|null $producto */
        $producto = $this->route('producto');

        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'type' => ['required', 'string', Rule::in([Product::TYPE_GOOD, Product::TYPE_SERVICE])],
            'category_id' => ['nullable', 'uuid', Rule::exists('product_categories', 'id')],
            'brand_id' => ['nullable', 'uuid', Rule::exists('brands', 'id')],
            'base_unit_id' => ['required', 'uuid', Rule::exists('units', 'id')],
            'track_stock' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ];

        if (! $producto) {
            $rules['initial_variant.sku'] = [
                'required',
                'string',
                'max:50',
                'regex:/^[A-Z0-9_-]+$/',
                Rule::unique('product_variants', 'sku'),
            ];
            $rules['initial_variant.label'] = ['nullable', 'string', 'max:120'];
            $rules['initial_variant.barcode'] = ['nullable', 'string', 'max:50'];
        }

        return $rules;
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'name' => 'nombre',
            'description' => 'descripción',
            'type' => 'tipo',
            'category_id' => 'categoría',
            'brand_id' => 'marca',
            'base_unit_id' => 'unidad de medida',
            'track_stock' => 'control de stock',
            'is_active' => 'estado',
            'initial_variant.sku' => 'SKU',
            'initial_variant.label' => 'presentación',
            'initial_variant.barcode' => 'código de barras',
        ];
    }

    protected function prepareForValidation(): void
    {
        $initial = $this->input('initial_variant');
        if (is_array($initial) && isset($initial['sku'])) {
            $initial['sku'] = strtoupper(trim((string) $initial['sku']));
            $this->merge(['initial_variant' => $initial]);
        }

        foreach (['category_id', 'brand_id'] as $key) {
            if ($this->has($key) && $this->input($key) === '') {
                $this->merge([$key => null]);
            }
        }

        if ($this->has('track_stock')) {
            $this->merge([
                'track_stock' => $this->boolean('track_stock'),
            ]);
        }

        if ($this->has('is_active')) {
            $this->merge([
                'is_active' => $this->boolean('is_active'),
            ]);
        }
    }

    protected function failedValidation(Validator $validator): void
    {
        /** @var Product|null $producto */
        $producto = $this->route('producto');

        if ($producto) {
            throw (new ValidationException($validator))
                ->redirectTo(route('admin.catalogo.productos.show', [
                    'producto' => $producto,
                    'tab' => 'general',
                ]));
        }

        session()->flash('productModal', 'create');

        throw (new ValidationException($validator))
            ->redirectTo(route('admin.catalogo.productos.index'));
    }
}
