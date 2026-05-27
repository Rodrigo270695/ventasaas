<?php

namespace App\Http\Requests\Admin\Tesoreria;

use App\Support\Treasury\TreasuryAuthorization;
use Illuminate\Foundation\Http\FormRequest;

class UpdateDisbursementPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return TreasuryAuthorization::canUpdateDisbursements($this->user());
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'reference' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'proof_file' => [
                'nullable',
                'file',
                'mimes:pdf,jpg,jpeg,png,webp',
                'max:10240',
            ],
            'redirect' => ['nullable', 'string', 'in:payables_index,purchases_index,purchase_edit,disbursements_index'],
        ];
    }
}
