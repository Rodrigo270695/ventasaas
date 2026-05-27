<?php

namespace App\Http\Requests\Admin\Ventas;

use Illuminate\Foundation\Http\FormRequest;

class IndexSalesQuotationsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('sales.quotations.view') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', 'string', 'max:30'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ];
    }
}

