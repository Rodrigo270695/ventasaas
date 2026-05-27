<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseOrderLine extends Model
{
    /** @use HasFactory<\Database\Factories\PurchaseOrderLineFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'purchase_order_id',
        'product_variant_id',
        'description',
        'quantity_ordered',
        'quantity_received',
        'unit_cost',
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
            'quantity_ordered' => 'decimal:4',
            'quantity_received' => 'decimal:4',
            'unit_cost' => 'decimal:6',
            'igv_rate' => 'decimal:4',
            'line_subtotal' => 'decimal:4',
            'igv_amount' => 'decimal:4',
            'line_total' => 'decimal:4',
        ];
    }

    public function quantityPending(): string
    {
        $pending = bcsub((string) $this->quantity_ordered, (string) $this->quantity_received, 4);

        return bccomp($pending, '0', 4) === 1 ? $pending : '0';
    }

    /**
     * @return BelongsTo<PurchaseOrder, $this>
     */
    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    /**
     * @return BelongsTo<ProductVariant, $this>
     */
    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    /**
     * @return HasMany<GoodsReceiptLine, $this>
     */
    public function receiptLines(): HasMany
    {
        return $this->hasMany(GoodsReceiptLine::class);
    }
}
