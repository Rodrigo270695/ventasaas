<?php

namespace App\Http\Requests\Admin\Sistema;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class UserRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var User|null $usuario */
        $usuario = $this->route('usuario');

        if ($usuario) {
            return $this->user()?->can('users.update') ?? false;
        }

        return $this->user()?->can('users.create') ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var User|null $usuario */
        $usuario = $this->route('usuario');

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($usuario?->id),
            ],
            'password' => [
                $usuario ? 'nullable' : 'required',
                'string',
                'confirmed',
                Password::defaults(),
            ],
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
            'email' => 'correo',
            'password' => 'contraseña',
            'is_active' => 'estado',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('is_active')) {
            $this->merge([
                'is_active' => $this->boolean('is_active'),
            ]);
        }
    }

    protected function failedValidation(Validator $validator): void
    {
        /** @var User|null $usuario */
        $usuario = $this->route('usuario');

        session()->flash('userModal', $usuario ? 'edit' : 'create');
        if ($usuario) {
            session()->flash('userModalUserId', $usuario->id);
        }

        throw (new ValidationException($validator))
            ->redirectTo(route('admin.sistema.usuarios.index'));
    }
}
