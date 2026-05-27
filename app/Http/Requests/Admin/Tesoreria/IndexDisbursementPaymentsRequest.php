<?php

namespace App\Http\Requests\Admin\Tesoreria;

use Illuminate\Foundation\Http\FormRequest;

class IndexDisbursementPaymentsRequest extends FormRequest
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
        ];
    }
}
