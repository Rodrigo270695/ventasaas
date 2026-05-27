<?php

namespace App\Http\Requests\Admin\Documentos;

use App\Models\DocumentSeries;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class DocumentSeriesRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var DocumentSeries|null $serie */
        $serie = $this->route('serie');

        if ($serie) {
            return $this->user()?->can('document_series.update') ?? false;
        }

        return $this->user()?->can('document_series.create') ?? false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var DocumentSeries|null $serie */
        $serie = $this->route('serie');

        return [
            'sunat_document_type_code' => [
                'required',
                'string',
                'size:2',
                Rule::in([
                    DocumentSeries::DOC_INVOICE,
                    DocumentSeries::DOC_TICKET,
                    DocumentSeries::DOC_CREDIT_NOTE,
                    DocumentSeries::DOC_DEBIT_NOTE,
                    DocumentSeries::DOC_DISPATCH_GUIDE,
                ]),
            ],
            'series' => [
                'required',
                'string',
                'size:4',
                'regex:/^[A-Z0-9]{4}$/',
                Rule::unique('document_series', 'series')
                    ->where('sunat_document_type_code', (string) $this->input('sunat_document_type_code'))
                    ->ignore($serie?->id),
            ],
            'name' => ['nullable', 'string', 'max:120'],
            'is_electronic' => ['sometimes', 'boolean'],
            'next_number' => ['required', 'integer', 'min:1', 'max:99999999'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'sunat_document_type_code' => 'tipo de comprobante',
            'series' => 'serie',
            'name' => 'descripción',
            'is_electronic' => 'electrónico',
            'next_number' => 'próximo número',
            'is_active' => 'estado',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('series')) {
            $this->merge([
                'series' => strtoupper(trim((string) $this->input('series'))),
            ]);
        }

        foreach (['is_electronic', 'is_active'] as $key) {
            if ($this->has($key)) {
                $this->merge([$key => $this->boolean($key)]);
            }
        }
    }

    protected function failedValidation(Validator $validator): void
    {
        /** @var DocumentSeries|null $serie */
        $serie = $this->route('serie');

        session()->flash('documentSeriesModal', $serie ? 'edit' : 'create');
        if ($serie) {
            session()->flash('documentSeriesModalId', $serie->id);
        }

        throw (new ValidationException($validator))
            ->redirectTo(route('admin.documentos.series.index'));
    }
}
