<?php

namespace App\Http\Requests\Admin\Ventas;

use App\Models\DocumentSeries;
use App\Models\Party;
use App\Models\SalesDocument;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class SalesDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if (! $user) {
            return false;
        }

        /** @var SalesDocument|null $comprobante */
        $comprobante = $this->route('comprobante');
        $isInternal = $this->isInternalContext($comprobante);

        if ($this->routeIs('admin.ventas.comprobantes.confirm', 'admin.ventas.tickets-internos.confirm')) {
            $canConfirm = $isInternal
                ? $user->can('sales.internal.confirm')
                : $user->can('sales.confirm');

            if ($this->boolean('record_payment')) {
                return $canConfirm && $user->can('treasury.collections.create');
            }

            return $canConfirm;
        }

        if ($comprobante) {
            return $isInternal
                ? $user->can('sales.internal.update') || $user->can('sales.update')
                : $user->can('sales.update');
        }

        return $isInternal
            ? $user->can('sales.internal.create')
            : $user->can('sales.create');
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $isInternal = $this->isInternalContext($this->route('comprobante'));

        return [
            'document_series_id' => ['required', 'uuid', Rule::exists('document_series', 'id')],
            'customer_party_id' => [
                $isInternal ? 'nullable' : 'required',
                'uuid',
                Rule::exists('parties', 'id')->where(
                    fn ($query) => $query->whereIn('type', [
                        Party::TYPE_CUSTOMER,
                        Party::TYPE_BOTH,
                    ]),
                ),
            ],
            'warehouse_id' => [
                'nullable',
                'uuid',
                Rule::exists('warehouses', 'id')->where(
                    fn ($query) => $query->where('is_active', true),
                ),
            ],
            'issue_date' => ['required', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:issue_date'],
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
            ...$this->paymentRulesOnConfirm(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function paymentRulesOnConfirm(): array
    {
        if (! $this->routeIs('admin.ventas.comprobantes.confirm', 'admin.ventas.tickets-internos.confirm')) {
            return [];
        }

        if (! $this->boolean('record_payment')) {
            return [];
        }

        return [
            'record_payment' => ['required', 'boolean'],
            'payment_method_id' => [
                'required',
                'uuid',
                Rule::exists('treasury_payment_methods', 'id')->where('is_active', true),
            ],
            'payment_date' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'reference' => ['nullable', 'string', 'max:80'],
            'notes' => ['nullable', 'string', 'max:500'],
            'cash_register_session_id' => [
                'nullable',
                'uuid',
                Rule::exists('treasury_cash_register_sessions', 'id')
                    ->where('status', 'open'),
            ],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $series = DocumentSeries::query()->find($this->input('document_series_id'));

            if (! $series) {
                return;
            }

            $expectsInternal = $this->routeIs('admin.ventas.tickets-internos.*');

            if ($series->isInternal() !== $expectsInternal) {
                $validator->errors()->add(
                    'document_series_id',
                    $expectsInternal
                        ? 'Selecciona una serie de ticket interno.'
                        : 'Los comprobantes fiscales no pueden usar series internas.',
                );
            }

            /** @var SalesDocument|null $comprobante */
            $comprobante = $this->route('comprobante');

            if ($comprobante && $comprobante->isInternal() !== $series->isInternal()) {
                $validator->errors()->add(
                    'document_series_id',
                    'No puedes cambiar entre documento fiscal e interno.',
                );
            }

            foreach ((array) $this->input('lines', []) as $index => $line) {
                $variantId = (string) ($line['product_variant_id'] ?? '');
                $description = trim((string) ($line['description'] ?? ''));

                if ($variantId === '' && $description === '') {
                    $validator->errors()->add(
                        "lines.{$index}.description",
                        'Si no seleccionas producto, indica una descripción para el ítem manual.',
                    );
                }
            }
        });
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'document_series_id' => 'serie',
            'customer_party_id' => 'cliente',
            'warehouse_id' => 'almacén',
            'issue_date' => 'fecha de emisión',
            'due_date' => 'fecha de vencimiento',
            'global_discount' => 'descuento global',
            'lines' => 'detalle',
            'lines.*.product_variant_id' => 'producto',
            'lines.*.manual_sku' => 'SKU manual',
            'lines.*.quantity' => 'cantidad',
            'lines.*.unit_price' => 'precio unitario',
            'lines.*.discount' => 'descuento',
        ];
    }

    protected function prepareForValidation(): void
    {
        $lines = $this->input('lines', []);

        if (is_array($lines)) {
            $lines = array_values(array_filter(
                $lines,
                function ($line) {
                    if (! is_array($line)) {
                        return false;
                    }

                    $hasVariant = ! empty($line['product_variant_id']);
                    $hasDescription = trim((string) ($line['description'] ?? '')) !== '';

                    return $hasVariant || $hasDescription;
                },
            ));
        }

        $warehouseId = $this->input('warehouse_id');
        $customerId = $this->input('customer_party_id');

        $this->merge([
            'lines' => $lines,
            'currency_code' => strtoupper((string) $this->input('currency_code', 'PEN')),
            'warehouse_id' => $warehouseId === '' || $warehouseId === null ? null : $warehouseId,
            'customer_party_id' => $customerId === '' || $customerId === null ? null : $customerId,
        ]);
    }

    private function isInternalContext(?SalesDocument $document): bool
    {
        if ($document) {
            return $document->isInternal();
        }

        if ($this->routeIs('admin.ventas.tickets-internos.*')) {
            return true;
        }

        $seriesId = $this->input('document_series_id');

        if (! $seriesId) {
            return false;
        }

        return (bool) DocumentSeries::query()
            ->whereKey($seriesId)
            ->value('is_internal');
    }
}
