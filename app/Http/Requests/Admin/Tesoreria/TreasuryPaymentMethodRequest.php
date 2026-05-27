<?php

namespace App\Http\Requests\Admin\Tesoreria;

use App\Models\TreasuryPaymentMethod;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TreasuryPaymentMethodRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var TreasuryPaymentMethod|null $metodoPago */
        $metodoPago = $this->route('metodos_pago');

        if ($metodoPago) {
            return $this->user()?->can('treasury.payment_methods.update') ?? false;
        }

        return $this->user()?->can('treasury.payment_methods.create') ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:80'],
            'type' => [
                'required',
                'string',
                Rule::in([
                    TreasuryPaymentMethod::TYPE_CASH,
                    TreasuryPaymentMethod::TYPE_BANK_TRANSFER,
                    TreasuryPaymentMethod::TYPE_DIGITAL_WALLET,
                    TreasuryPaymentMethod::TYPE_CARD,
                    TreasuryPaymentMethod::TYPE_OTHER,
                ]),
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
            'type' => 'tipo',
            'is_active' => 'activo',
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
        /** @var TreasuryPaymentMethod|null $metodoPago */
        $metodoPago = $this->route('metodos_pago');

        session()->flash('paymentMethodModal', $metodoPago ? 'edit' : 'create');
        if ($metodoPago) {
            session()->flash('paymentMethodModalId', $metodoPago->id);
        }

        throw (new ValidationException($validator))
            ->redirectTo(route('admin.tesoreria.metodos-pago.index'));
    }
}
