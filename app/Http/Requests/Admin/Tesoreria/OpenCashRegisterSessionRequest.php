<?php

namespace App\Http\Requests\Admin\Tesoreria;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class OpenCashRegisterSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('treasury.cash_sessions.open') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'cash_register_id' => [
                'required',
                'uuid',
                Rule::exists('treasury_cash_registers', 'id')->where('is_active', true),
            ],
            'opening_float' => ['nullable', 'numeric', 'min:0'],
            'opening_notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'cash_register_id' => 'caja',
            'opening_float' => 'fondo inicial',
            'opening_notes' => 'notas de apertura',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        session()->flash('openSessionModal', true);

        throw (new ValidationException($validator))
            ->redirectTo(route('admin.tesoreria.sesiones.index'));
    }
}
