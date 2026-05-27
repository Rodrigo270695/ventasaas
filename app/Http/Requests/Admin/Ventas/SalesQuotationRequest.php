<?php

namespace App\Http\Requests\Admin\Ventas;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SalesQuotationRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if (! $user) {
            return false;
        }

        return $this->route('cotizacion')
            ? $user->can('sales.quotations.update')
            : $user->can('sales.quotations.create');
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'customer_party_id' => [
                'required',
                'uuid',
                Rule::exists('parties', 'id')->where(
                    fn ($q) => $q->whereIn('type', ['customer', 'both']),
                ),
            ],
            'issue_date' => ['required', 'date'],
            'valid_until' => ['nullable', 'date', 'after_or_equal:issue_date'],
            'currency_code' => ['required', 'string', 'size:3'],
            'exchange_rate' => ['required', 'numeric', 'min:0.000001'],
            'global_discount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.product_variant_id' => ['nullable', 'uuid', Rule::exists('product_variants', 'id')],
            'lines.*.manual_sku' => ['nullable', 'string', 'max:120'],
            'lines.*.description' => ['nullable', 'string', 'max:500'],
            'lines.*.quantity' => ['required', 'numeric', 'gt:0'],
            'lines.*.unit_price' => ['required', 'numeric', 'min:0'],
            'lines.*.discount' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $lines = $this->input('lines', []);

        if (is_array($lines)) {
            $lines = array_values(array_filter($lines, fn ($line) => is_array($line)));
        }

        $this->merge([
            'lines' => $lines,
            'currency_code' => strtoupper((string) $this->input('currency_code', 'PEN')),
        ]);
    }
}

