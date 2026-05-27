<?php

namespace App\Http\Requests\Admin\Catalogo;

use App\Models\TaxProfile;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TaxProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var TaxProfile|null $perfilTributario */
        $perfilTributario = $this->route('perfiles_tributario');

        if ($perfilTributario) {
            return $this->user()?->can('tax_profiles.update') ?? false;
        }

        return $this->user()?->can('tax_profiles.create') ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var TaxProfile|null $perfilTributario */
        $perfilTributario = $this->route('perfiles_tributario');

        return [
            'code' => [
                'required',
                'string',
                'max:20',
                'regex:/^[A-Z0-9_-]+$/',
                Rule::unique('tax_profiles', 'code')->ignore($perfilTributario?->id),
            ],
            'name' => ['required', 'string', 'max:100'],
            'sunat_affectation_code' => [
                'required',
                'string',
                'size:2',
                Rule::exists('sunat_tax_affectations', 'code'),
            ],
            'igv_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'isc_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'is_default' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:9999'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'code' => 'código',
            'name' => 'nombre',
            'sunat_affectation_code' => 'afectación SUNAT',
            'igv_rate' => 'IGV (%)',
            'isc_rate' => 'ISC (%)',
            'is_default' => 'perfil por defecto',
            'is_active' => 'estado',
            'sort_order' => 'orden',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('code')) {
            $this->merge([
                'code' => strtoupper(trim((string) $this->input('code'))),
            ]);
        }

        foreach (['is_default', 'is_active'] as $key) {
            if ($this->has($key)) {
                $this->merge([
                    $key => $this->boolean($key),
                ]);
            }
        }

        if ($this->has('isc_rate') && $this->input('isc_rate') === '') {
            $this->merge(['isc_rate' => null]);
        }
    }

    protected function failedValidation(Validator $validator): void
    {
        /** @var TaxProfile|null $perfilTributario */
        $perfilTributario = $this->route('perfiles_tributario');

        session()->flash('taxProfileModal', $perfilTributario ? 'edit' : 'create');
        if ($perfilTributario) {
            session()->flash('taxProfileModalId', $perfilTributario->id);
        }

        throw (new ValidationException($validator))
            ->redirectTo(route('admin.catalogo.perfiles-tributarios.index'));
    }
}
