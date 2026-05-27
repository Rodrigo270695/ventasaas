<?php

namespace App\Http\Requests\Admin\Sistema;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

class RoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Role|null $role */
        $role = $this->route('role');

        if ($role) {
            return $this->user()?->can('roles.update') ?? false;
        }

        return $this->user()?->can('roles.create') ?? false;
    }

    /**
     * Reglas compartidas para crear y actualizar roles.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Role|null $role */
        $role = $this->route('role');

        return [
            'name' => [
                'required',
                'string',
                'max:50',
                'min:3',
                'alpha_dash:ascii',
                Rule::unique('roles', 'name')
                    ->where('guard_name', 'web')
                    ->ignore($role?->id),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'name' => 'nombre del rol',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        /** @var Role|null $role */
        $role = $this->route('role');

        session()->flash('roleModal', $role ? 'edit' : 'create');
        if ($role) {
            session()->flash('roleModalRoleId', $role->id);
        }

        throw (new ValidationException($validator))
            ->redirectTo(route('admin.sistema.roles.index'));
    }
}
