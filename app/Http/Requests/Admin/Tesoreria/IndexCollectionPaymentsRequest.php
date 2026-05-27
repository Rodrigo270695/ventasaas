<?php

namespace App\Http\Requests\Admin\Tesoreria;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexCollectionPaymentsRequest extends FormRequest
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
            'period' => ['nullable', 'string', Rule::in(['month', 'today'])],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'search' => 'búsqueda',
            'from' => 'fecha desde',
            'to' => 'fecha hasta',
        ];
    }
}
