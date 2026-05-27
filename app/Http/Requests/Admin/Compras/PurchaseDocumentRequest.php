<?php

namespace App\Http\Requests\Admin\Compras;

use App\Models\Party;
use App\Models\PurchaseDocument;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PurchaseDocumentRequest extends FormRequest
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
        /** @var PurchaseDocument|null $factura */
        $factura = $this->route('factura');

        if ($factura?->stock_movement_id) {
            return [
                'notes' => ['nullable', 'string', 'max:2000'],
                'invoice_file' => [
                    'nullable',
                    'file',
                    'mimes:pdf,jpg,jpeg,png,webp',
                    'max:10240',
                ],
            ];
        }

        return [
            'goods_receipt_id' => [
                'nullable',
                'uuid',
                Rule::exists('goods_receipts', 'id'),
            ],
            'supplier_party_id' => [
                'required',
                'uuid',
                Rule::exists('parties', 'id')->where(
                    fn ($query) => $query->whereIn('type', [
                        Party::TYPE_SUPPLIER,
                        Party::TYPE_BOTH,
                    ]),
                ),
            ],
            'warehouse_id' => [
                'nullable',
                'uuid',
                Rule::exists('warehouses', 'id')->where('is_active', true),
            ],
            'supplier_document_number' => ['nullable', 'string', 'max:40'],
            'issue_date' => ['required', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:issue_date'],
            'currency_code' => ['required', 'string', 'size:3'],
            'exchange_rate' => ['required', 'numeric', 'min:0.000001'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'invoice_file' => [
                'nullable',
                'file',
                'mimes:pdf,jpg,jpeg,png,webp',
                'max:10240',
            ],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.goods_receipt_line_id' => [
                'nullable',
                'uuid',
                Rule::exists('goods_receipt_lines', 'id'),
            ],
            'lines.*.product_variant_id' => [
                'required',
                'uuid',
                Rule::exists('product_variants', 'id'),
            ],
            'lines.*.description' => ['nullable', 'string', 'max:500'],
            'lines.*.quantity' => ['required', 'numeric', 'gt:0'],
            'lines.*.unit_cost' => ['required', 'numeric', 'min:0'],
        ];
    }
}
