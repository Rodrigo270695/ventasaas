<?php

namespace App\Http\Requests\Admin\Compras;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class QuickPurchaseVariantRequest extends FormRequest
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
            'product_id' => ['nullable', 'uuid', Rule::exists('products', 'id')],
            'product_name' => ['required_without:product_id', 'string', 'max:255'],
            'sku' => [
                'required',
                'string',
                'max:50',
                'regex:/^[A-Z0-9_-]+$/',
                Rule::unique('product_variants', 'sku'),
            ],
            'label' => ['nullable', 'string', 'max:120'],
            'barcode' => ['nullable', 'string', 'max:50'],
            'track_stock' => ['sometimes', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('sku')) {
            $this->merge([
                'sku' => strtoupper(trim((string) $this->input('sku'))),
            ]);
        }
    }
}
