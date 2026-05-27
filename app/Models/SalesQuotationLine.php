<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalesQuotationLine extends Model
{
    /** @use HasFactory<\Database\Factories\SalesQuotationLineFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'sales_quotation_id',
        'product_variant_id',
        'manual_sku',
        'description',
        'quantity',
        'unit_price',
        'discount',
        'tax_affectation_code',
        'igv_rate',
        'line_subtotal',
        'igv_amount',
        'line_total',
        'line_order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:6',
            'unit_price' => 'decimal:4',
            'discount' => 'decimal:4',
            'igv_rate' => 'decimal:4',
            'line_subtotal' => 'decimal:4',
            'igv_amount' => 'decimal:4',
            'line_total' => 'decimal:4',
            'line_order' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<SalesQuotation, $this>
     */
    public function quotation(): BelongsTo
    {
        return $this->belongsTo(SalesQuotation::class, 'sales_quotation_id');
    }

    /**
     * @return BelongsTo<ProductVariant, $this>
     */
    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }
}

