<?php

namespace App\Http\Requests\Admin\Catalogo;

use App\Models\Unit;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class UnitRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Unit|null $unidade */
        $unidade = $this->route('unidade');

        if ($unidade) {
            return $this->user()?->can('units.update') ?? false;
        }

        return $this->user()?->can('units.create') ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Unit|null $unidade */
        $unidade = $this->route('unidade');

        return [
            'code' => [
                'required',
                'string',
                'max:20',
                'regex:/^[A-Z0-9_-]+$/',
                Rule::unique('units', 'code')->ignore($unidade?->id),
            ],
            'name' => ['required', 'string', 'max:100'],
            'sunat_code' => ['nullable', 'string', 'max:3', 'regex:/^[A-Z0-9]+$/'],
            'symbol' => ['nullable', 'string', 'max:10'],
            'allows_decimals' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
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
            'sunat_code' => 'código SUNAT',
            'symbol' => 'símbolo',
            'allows_decimals' => 'permite decimales',
            'is_active' => 'estado',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('code')) {
            $this->merge([
                'code' => strtoupper(trim((string) $this->input('code'))),
            ]);
        }

        if ($this->has('sunat_code') && filled($this->input('sunat_code'))) {
            $this->merge([
                'sunat_code' => strtoupper(trim((string) $this->input('sunat_code'))),
            ]);
        }

        if ($this->has('allows_decimals')) {
            $this->merge([
                'allows_decimals' => $this->boolean('allows_decimals'),
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
        /** @var Unit|null $unidade */
        $unidade = $this->route('unidade');

        session()->flash('unitModal', $unidade ? 'edit' : 'create');
        if ($unidade) {
            session()->flash('unitModalUnitId', $unidade->id);
        }

        throw (new ValidationException($validator))
            ->redirectTo(route('admin.catalogo.unidades.index'));
    }
}
