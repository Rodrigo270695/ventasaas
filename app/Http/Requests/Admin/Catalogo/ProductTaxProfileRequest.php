<?php

namespace App\Http\Requests\Admin\Catalogo;

use App\Models\Product;
use App\Models\ProductTaxProfile;
use App\Models\TaxProfile;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProductTaxProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user?->can('tax_profiles.update')
            || $user?->can('products.update') ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Product $producto */
        $producto = $this->route('producto');

        /** @var ProductTaxProfile|null $perfil */
        $perfil = $this->route('perfil');

        if ($perfil) {
            return [
                'tax_profile_id' => ['nullable', 'uuid', Rule::exists('tax_profiles', 'id')],
                'sunat_affectation_code' => [
                    'required',
                    'string',
                    'size:2',
                    Rule::exists('sunat_tax_affectations', 'code'),
                ],
                'igv_rate' => ['required', 'numeric', 'min:0', 'max:100'],
                'isc_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
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
            'tax_profile_id' => ['nullable', 'uuid', Rule::exists('tax_profiles', 'id')],
            'sunat_affectation_code' => [
                'required',
                'string',
                'size:2',
                Rule::exists('sunat_tax_affectations', 'code'),
            ],
            'igv_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'isc_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'product_variant_id' => 'variante',
            'tax_profile_id' => 'perfil tributario',
            'sunat_affectation_code' => 'afectación SUNAT',
            'igv_rate' => 'IGV (%)',
            'isc_rate' => 'ISC (%)',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('isc_rate') && $this->input('isc_rate') === '') {
            $this->merge(['isc_rate' => null]);
        }

        if ($this->filled('tax_profile_id') && ! $this->filled('sunat_affectation_code')) {
            $template = TaxProfile::query()->find($this->input('tax_profile_id'));

            if ($template) {
                $this->merge([
                    'sunat_affectation_code' => $template->sunat_affectation_code,
                    'igv_rate' => $template->igv_rate,
                    'isc_rate' => $template->isc_rate,
                ]);
            }
        }
    }

    protected function failedValidation(Validator $validator): void
    {
        /** @var Product $producto */
        $producto = $this->route('producto');

        throw (new ValidationException($validator))
            ->redirectTo(route('admin.catalogo.productos.show', [
                'producto' => $producto,
                'tab' => 'impuestos',
            ]));
    }
}
