<?php

namespace App\Http\Requests\Admin\Tesoreria;

use App\Models\SalesDocument;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexAccountsReceivableRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('treasury.collections.view') ?? false;
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
                Rule::in([SalesDocument::PAYMENT_UNPAID, SalesDocument::PAYMENT_PARTIAL]),
            ],
        ];
    }
}
