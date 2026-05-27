<?php

namespace App\Http\Requests\Admin\Sistema;

use App\Support\PermissionCatalog;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class UserRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('users.assign-roles') ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'roles' => ['nullable', 'array'],
            'roles.*' => [
                'integer',
                Rule::exists('roles', 'id')->where('guard_name', PermissionCatalog::guard()),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'roles' => 'roles',
            'roles.*' => 'rol',
        ];
    }
}
