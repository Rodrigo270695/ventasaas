<?php

namespace App\Http\Requests\Admin\Tesoreria;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDisbursementPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return \App\Support\Treasury\TreasuryAuthorization::canCreateDisbursements($this->user());
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'purchase_document_id' => [
                'required',
                'uuid',
                Rule::exists('purchase_documents', 'id'),
            ],
            'payment_method_id' => [
                'required',
                'uuid',
                Rule::exists('treasury_payment_methods', 'id')->where('is_active', true),
            ],
            'payment_date' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'reference' => ['nullable', 'string', 'max:80'],
            'notes' => ['nullable', 'string', 'max:500'],
            'cash_register_session_id' => [
                'nullable',
                'uuid',
                Rule::exists('treasury_cash_register_sessions', 'id')
                    ->where('status', 'open'),
            ],
            'proof_file' => [
                'nullable',
                'file',
                'mimes:pdf,jpg,jpeg,png,webp',
                'max:10240',
            ],
            'redirect' => [
                'nullable',
                'string',
                Rule::in(['payables_index', 'purchase_edit', 'purchases_index']),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'purchase_document_id' => 'factura de compra',
            'payment_method_id' => 'método de pago',
            'payment_date' => 'fecha de pago',
            'amount' => 'monto',
            'reference' => 'referencia',
            'notes' => 'notas',
        ];
    }
}
