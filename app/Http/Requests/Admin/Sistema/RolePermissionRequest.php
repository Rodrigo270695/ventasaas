<?php

namespace App\Http\Requests\Admin\Sistema;

use App\Support\PermissionCatalog;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RolePermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('roles.assign-permissions') ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'permissions' => ['nullable', 'array'],
            'permissions.*' => [
                'string',
                Rule::in(PermissionCatalog::allNames()),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'permissions' => 'permisos',
            'permissions.*' => 'permiso',
        ];
    }
}
