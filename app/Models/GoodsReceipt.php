<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class GoodsReceipt extends Model
{
    /** @use HasFactory<\Database\Factories\GoodsReceiptFactory> */
    use HasFactory, HasUuids;

    public const STATUS_CONFIRMED = 'confirmed';

    protected $fillable = [
        'purchase_order_id',
        'warehouse_id',
        'internal_number',
        'received_date',
        'status',
        'notes',
        'stock_movement_id',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'received_date' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<PurchaseOrder, $this>
     */
    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    /**
     * @return BelongsTo<Warehouse, $this>
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * @return BelongsTo<StockMovement, $this>
     */
    public function stockMovement(): BelongsTo
    {
        return $this->belongsTo(StockMovement::class);
    }

    /**
     * @return HasMany<GoodsReceiptLine, $this>
     */
    public function lines(): HasMany
    {
        return $this->hasMany(GoodsReceiptLine::class)->orderBy('line_order');
    }

    /**
     * @return HasOne<PurchaseDocument, $this>
     */
    public function purchaseDocument(): HasOne
    {
        return $this->hasOne(PurchaseDocument::class);
    }
}
