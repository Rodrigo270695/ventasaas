<?php

namespace App\Http\Requests\Admin\Compras;

use App\Models\PurchaseDocument;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexPurchaseDocumentsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('purchases.view') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:120'],
            'payment_status' => [
                'nullable',
                'string',
                Rule::in([
                    PurchaseDocument::PAYMENT_UNPAID,
                    PurchaseDocument::PAYMENT_PARTIAL,
                    PurchaseDocument::PAYMENT_PAID,
                ]),
            ],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ];
    }
}
