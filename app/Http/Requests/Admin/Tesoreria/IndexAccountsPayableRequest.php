<?php

namespace App\Http\Requests\Admin\Tesoreria;

use App\Models\PurchaseDocument;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexAccountsPayableRequest extends FormRequest
{
    public function authorize(): bool
    {
        return \App\Support\Treasury\TreasuryAuthorization::canViewDisbursements($this->user());
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:120'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'aging' => ['nullable', 'string', Rule::in(['overdue', 'current'])],
            'payment_status' => [
                'nullable',
                'string',
                Rule::in([PurchaseDocument::PAYMENT_UNPAID, PurchaseDocument::PAYMENT_PARTIAL]),
            ],
        ];
    }
}
