<?php

namespace App\Http\Requests\Admin\Configuracion;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class StoreSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('settings.manage') ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'ruc' => ['required', 'string', 'digits:11'],
            'razon_social' => ['required', 'string', 'max:255'],
            'ubigeo' => ['required', 'string', 'digits:6'],
            'direccion' => ['nullable', 'string', 'max:500'],
            'whatsapp_number' => ['nullable', 'string', 'max:20', 'regex:/^[0-9+\s()-]+$/'],
            'tax_regime' => ['required', 'string', Rule::in(['mype', 'general', 'special', 'nrus'])],
            'billing_channel' => [
                'required',
                'string',
                Rule::in(['direct_sunat', 'pse', 'ose']),
            ],
            'sunat_environment' => [
                'required',
                'string',
                Rule::in(['beta', 'production']),
            ],
            'default_igv_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'certificate' => [
                'nullable',
                'file',
                'extensions:pem,crt,key,p12,pfx',
                'max:512',
            ],
            'remove_certificate' => ['sometimes', 'boolean'],
            'cdt_password_enc' => ['nullable', 'string', 'max:255'],
            'sol_user' => ['nullable', 'string', 'max:20'],
            'sol_password_enc' => ['nullable', 'string', 'max:255'],
            'apisunat_token_enc' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'ruc' => 'RUC',
            'razon_social' => 'razón social',
            'ubigeo' => 'ubigeo',
            'direccion' => 'dirección',
            'whatsapp_number' => 'WhatsApp de pedidos',
            'tax_regime' => 'régimen tributario',
            'billing_channel' => 'canal de facturación',
            'sunat_environment' => 'ambiente SUNAT',
            'default_igv_rate' => 'IGV por defecto',
            'certificate' => 'certificado digital',
            'cdt_password_enc' => 'clave del certificado',
            'sol_user' => 'usuario Clave SOL',
            'sol_password_enc' => 'contraseña Clave SOL',
            'apisunat_token_enc' => 'token API SUNAT',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('remove_certificate')) {
            $this->merge([
                'remove_certificate' => $this->boolean('remove_certificate'),
            ]);
        }

        if ($this->has('whatsapp_number')) {
            $digits = preg_replace('/\D+/', '', (string) $this->input('whatsapp_number')) ?? '';

            $this->merge([
                'whatsapp_number' => $digits !== '' ? $digits : null,
            ]);
        }
    }

    protected function failedValidation(Validator $validator): void
    {
        session()->flash('storeSettingsModal', true);

        throw (new ValidationException($validator))
            ->redirectTo(route('admin.configuracion.tienda.index'));
    }
}
