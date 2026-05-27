<?php

namespace App\Http\Requests\Admin\Ventas;

use App\Models\SalesDocument;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexSalesDocumentsRequest extends FormRequest
{
    public function authorize(): bool
    {
        if ($this->routeIs('admin.ventas.tickets-internos.index')) {
            return $this->user()?->can('sales.internal.view') ?? false;
        }

        return $this->user()?->can('sales.view') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:120'],
            'status' => [
                'nullable',
                'string',
                Rule::in([
                    SalesDocument::STATUS_DRAFT,
                    SalesDocument::STATUS_CONFIRMED,
                    SalesDocument::STATUS_VOIDED,
                ]),
            ],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'search' => 'búsqueda',
            'status' => 'estado',
            'from' => 'fecha desde',
            'to' => 'fecha hasta',
        ];
    }
}
