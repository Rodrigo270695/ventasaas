<?php

namespace App\Http\Requests\Admin\Tesoreria;

use App\Models\TreasuryCashRegisterSession;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\ValidationException;

class CloseCashRegisterSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('treasury.cash_sessions.close') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'closing_cash_counted' => ['required', 'numeric', 'min:0'],
            'closing_notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'closing_cash_counted' => 'efectivo contado',
            'closing_notes' => 'notas de cierre',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        /** @var TreasuryCashRegisterSession|null $sesion */
        $sesion = $this->route('sesion');

        if ($sesion) {
            session()->flash('sessionCloseModalId', $sesion->id);
        }

        throw (new ValidationException($validator))
            ->redirectTo(route('admin.tesoreria.sesiones.index'));
    }
}
