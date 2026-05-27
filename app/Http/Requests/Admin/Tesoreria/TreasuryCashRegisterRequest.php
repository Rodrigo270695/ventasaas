<?php

namespace App\Http\Requests\Admin\Tesoreria;

use App\Models\TreasuryCashRegister;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TreasuryCashRegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var TreasuryCashRegister|null $caja */
        $caja = $this->route('caja');

        if ($caja) {
            return $this->user()?->can('treasury.cash_registers.update') ?? false;
        }

        return $this->user()?->can('treasury.cash_registers.create') ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'warehouse_id' => ['nullable', 'uuid', Rule::exists('warehouses', 'id')],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'name' => 'nombre',
            'warehouse_id' => 'almacén',
            'is_active' => 'activa',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('is_active')) {
            $this->merge([
                'is_active' => $this->boolean('is_active'),
            ]);
        }

        if ($this->input('warehouse_id') === '') {
            $this->merge(['warehouse_id' => null]);
        }
    }

    protected function failedValidation(Validator $validator): void
    {
        /** @var TreasuryCashRegister|null $caja */
        $caja = $this->route('caja');

        session()->flash('cashRegisterModal', $caja ? 'edit' : 'create');
        if ($caja) {
            session()->flash('cashRegisterModalId', $caja->id);
        }

        throw (new ValidationException($validator))
            ->redirectTo(route('admin.tesoreria.cajas.index'));
    }
}
