<?php

namespace App\Http\Requests\Admin\Socios;

use App\Models\Party;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class PartyRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Party|null $socio */
        $socio = $this->route('socio');

        if ($socio) {
            return $this->user()?->can('parties.update') ?? false;
        }

        return $this->user()?->can('parties.create') ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Party|null $socio */
        $socio = $this->route('socio');

        $documentType = (string) $this->input('document_type');
        $allowedTypes = $this->salesReturnUrl() !== null
            ? [Party::TYPE_CUSTOMER, Party::TYPE_BOTH]
            : [
                Party::TYPE_CUSTOMER,
                Party::TYPE_SUPPLIER,
                Party::TYPE_BOTH,
            ];

        return [
            'type' => [
                'required',
                'string',
                Rule::in($allowedTypes),
            ],
            'return_url' => ['nullable', 'string', 'max:500'],
            'document_type' => [
                'required',
                'string',
                Rule::in([
                    Party::DOC_DNI,
                    Party::DOC_RUC,
                    Party::DOC_CE,
                    Party::DOC_PASSPORT,
                    Party::DOC_OTHER,
                ]),
            ],
            'document_number' => [
                'required',
                'string',
                'max:15',
                Rule::unique('parties', 'document_number')
                    ->where('document_type', $documentType)
                    ->whereNull('deleted_at')
                    ->ignore($socio?->id),
                ...$this->documentNumberRules($documentType),
            ],
            'legal_name' => ['required', 'string', 'max:255'],
            'trade_name' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'sunat_estado' => ['nullable', 'string', 'max:32'],
            'sunat_condicion' => ['nullable', 'string', 'max:32'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'credit_limit' => ['sometimes', 'numeric', 'min:0', 'max:999999999.9999'],
            'payment_term_days' => ['sometimes', 'integer', 'min:0', 'max:3650'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<int, string>
     */
    private function documentNumberRules(string $documentType): array
    {
        return match ($documentType) {
            Party::DOC_DNI => ['regex:/^\d{8}$/'],
            Party::DOC_RUC => ['regex:/^\d{11}$/'],
            default => ['regex:/^[A-Z0-9-]+$/i'],
        };
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'type' => 'tipo',
            'document_type' => 'tipo de documento',
            'document_number' => 'número de documento',
            'legal_name' => 'razón social / nombre',
            'trade_name' => 'nombre comercial',
            'address' => 'dirección',
            'sunat_estado' => 'estado SUNAT',
            'sunat_condicion' => 'condición SUNAT',
            'email' => 'correo',
            'phone' => 'teléfono',
            'credit_limit' => 'línea de crédito',
            'payment_term_days' => 'días de crédito',
            'is_active' => 'estado',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'document_number.unique' => 'Ya existe un socio activo con este número de documento. Busca al socio en el listado o actívalo si estaba desactivado.',
            'document_number.regex' => match ((string) $this->input('document_type')) {
                Party::DOC_DNI => 'El DNI debe tener 8 dígitos.',
                Party::DOC_RUC => 'El RUC debe tener 11 dígitos.',
                default => 'El documento tiene un formato inválido.',
            },
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('document_number')) {
            $this->merge([
                'document_number' => preg_replace(
                    '/\s+/',
                    '',
                    trim((string) $this->input('document_number')),
                ) ?? '',
            ]);
        }

        if ($this->has('legal_name')) {
            $this->merge([
                'legal_name' => trim((string) $this->input('legal_name')),
            ]);
        }

        if ($this->has('trade_name')) {
            $value = trim((string) $this->input('trade_name'));
            $this->merge(['trade_name' => $value !== '' ? $value : null]);
        }

        if ($this->has('email')) {
            $value = trim((string) $this->input('email'));
            $this->merge(['email' => $value !== '' ? $value : null]);
        }

        if ($this->has('phone')) {
            $value = trim((string) $this->input('phone'));
            $this->merge(['phone' => $value !== '' ? $value : null]);
        }

        if ($this->has('address')) {
            $value = trim((string) $this->input('address'));
            $this->merge(['address' => $value !== '' ? $value : null]);
        }

        if ($this->has('sunat_estado')) {
            $value = trim((string) $this->input('sunat_estado'));
            $this->merge(['sunat_estado' => $value !== '' ? $value : null]);
        }

        if ($this->has('sunat_condicion')) {
            $value = trim((string) $this->input('sunat_condicion'));
            $this->merge(['sunat_condicion' => $value !== '' ? $value : null]);
        }

        if ((string) $this->input('document_type') !== Party::DOC_RUC) {
            $this->merge([
                'sunat_estado' => null,
                'sunat_condicion' => null,
            ]);
        }

        if ($this->has('is_active')) {
            $this->merge(['is_active' => $this->boolean('is_active')]);
        }
    }

    protected function failedValidation(Validator $validator): void
    {
        $salesReturnUrl = $this->salesReturnUrl();

        if ($salesReturnUrl !== null) {
            session()->flash('openPartyQuickCreate', true);

            throw (new ValidationException($validator))
                ->redirectTo($salesReturnUrl);
        }

        /** @var Party|null $socio */
        $socio = $this->route('socio');

        session()->flash('partyModal', $socio ? 'edit' : 'create');
        if ($socio) {
            session()->flash('partyModalId', $socio->id);
        }

        throw (new ValidationException($validator))
            ->redirectTo(route('admin.socios.index'));
    }

    private function salesReturnUrl(): ?string
    {
        $url = $this->input('return_url');

        if (! is_string($url) || $url === '') {
            return null;
        }

        if (! str_starts_with($url, '/admin/ventas/')) {
            return null;
        }

        return $url;
    }
}
