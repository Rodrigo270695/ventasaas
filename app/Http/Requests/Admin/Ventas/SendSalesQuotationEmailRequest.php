<?php

namespace App\Http\Requests\Admin\Ventas;

use Illuminate\Foundation\Http\FormRequest;

class SendSalesQuotationEmailRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('sales.quotations.send-email') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'to_email' => ['required', 'email', 'max:255'],
            'cc_emails' => ['nullable', 'string', 'max:1000'],
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

