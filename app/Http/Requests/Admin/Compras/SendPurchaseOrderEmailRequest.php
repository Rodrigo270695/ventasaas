<?php

namespace App\Http\Requests\Admin\Compras;

use Illuminate\Foundation\Http\FormRequest;

class SendPurchaseOrderEmailRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('purchases.manage') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'to_email' => ['required', 'email', 'max:255'],
            'cc_emails' => ['nullable', 'string', 'max:1000'],
            'save_supplier_email' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return list<string>
     */
    public function ccEmailList(): array
    {
        $raw = (string) $this->validated('cc_emails', '');

        if (trim($raw) === '') {
            return [];
        }

        return preg_split('/[\s,;]+/', $raw, -1, PREG_SPLIT_NO_EMPTY) ?: [];
    }
}
