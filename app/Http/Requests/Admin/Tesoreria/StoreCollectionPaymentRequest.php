<?php

namespace App\Http\Requests\Admin\Tesoreria;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCollectionPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('treasury.collections.create') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'sales_document_id' => [
                'required',
                'uuid',
                Rule::exists('sales_documents', 'id'),
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
            'redirect' => [
                'nullable',
                'string',
                Rule::in([
                    'sales_index',
                    'internal_sales_index',
                    'sales_edit',
                    'receivables_index',
                ]),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'sales_document_id' => 'comprobante',
            'payment_method_id' => 'método de pago',
            'payment_date' => 'fecha de cobro',
            'amount' => 'monto',
            'reference' => 'referencia',
            'notes' => 'notas',
        ];
    }
}
