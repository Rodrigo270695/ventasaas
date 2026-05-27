<?php

namespace App\Http\Requests\Admin\Catalogo;

use App\Models\Product;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class VariantPackagingConversionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user?->can('products.update') ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Product $producto */
        $producto = $this->route('producto');

        return [
            'from_variant_id' => [
                'required',
                'uuid',
                Rule::exists('product_variants', 'id')->where(
                    fn ($query) => $query->where('product_id', $producto->id),
                ),
            ],
            'to_variant_id' => [
                'required',
                'uuid',
                'different:from_variant_id',
                Rule::exists('product_variants', 'id')->where(
                    fn ($query) => $query->where('product_id', $producto->id),
                ),
            ],
            'factor' => ['required', 'numeric', 'min:0.0001', 'max:999999999.9999'],
            'label' => ['nullable', 'string', 'max:120'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'from_variant_id' => 'variante origen',
            'to_variant_id' => 'variante destino',
            'factor' => 'factor de conversión',
            'label' => 'descripción',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        /** @var Product $producto */
        $producto = $this->route('producto');

        throw (new ValidationException($validator))
            ->redirectTo(route('admin.catalogo.productos.show', [
                'producto' => $producto,
                'tab' => 'empaque',
            ]));
    }
}
