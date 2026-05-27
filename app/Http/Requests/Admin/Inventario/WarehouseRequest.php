<?php

namespace App\Http\Requests\Admin\Inventario;

use App\Models\Warehouse;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class WarehouseRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Warehouse|null $almacen */
        $almacen = $this->route('almacen');

        if ($almacen) {
            return $this->user()?->can('warehouses.update') ?? false;
        }

        return $this->user()?->can('warehouses.create') ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Warehouse|null $almacen */
        $almacen = $this->route('almacen');

        return [
            'code' => [
                'required',
                'string',
                'max:20',
                'regex:/^[A-Z0-9_-]+$/',
                Rule::unique('warehouses', 'code')->ignore($almacen?->id),
            ],
            'name' => ['required', 'string', 'max:100'],
            'is_default' => ['sometimes', 'boolean'],
            'is_saleable' => ['sometimes', 'boolean'],
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
            'is_default' => 'almacén por defecto',
            'is_saleable' => 'disponible para ventas',
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

        foreach (['is_default', 'is_saleable', 'is_active'] as $key) {
            if ($this->has($key)) {
                $this->merge([
                    $key => $this->boolean($key),
                ]);
            }
        }
    }

    protected function failedValidation(Validator $validator): void
    {
        /** @var Warehouse|null $almacen */
        $almacen = $this->route('almacen');

        session()->flash('warehouseModal', $almacen ? 'edit' : 'create');
        if ($almacen) {
            session()->flash('warehouseModalId', $almacen->id);
        }

        throw (new ValidationException($validator))
            ->redirectTo(route('admin.inventario.almacenes.index'));
    }
}
