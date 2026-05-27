<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalesDocumentLine extends Model
{
    /** @use HasFactory<\Database\Factories\SalesDocumentLineFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'sales_document_id',
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
     * @return BelongsTo<SalesDocument, $this>
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(SalesDocument::class, 'sales_document_id');
    }

    /**
     * @return BelongsTo<ProductVariant, $this>
     */
    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }
}
