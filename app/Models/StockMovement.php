<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockMovement extends Model
{
    /** @use HasFactory<\Database\Factories\StockMovementFactory> */
    use HasFactory, HasUuids;

    public const TYPE_OPENING = 'opening';

    public const TYPE_ADJUSTMENT = 'adjustment';

    public const TYPE_PURCHASE_IN = 'purchase_in';

    public const TYPE_SALE_OUT = 'sale_out';

    public const TYPE_TRANSFER_OUT = 'transfer_out';

    public const TYPE_TRANSFER_IN = 'transfer_in';

    public const TYPE_BREAKDOWN = 'breakdown';

    public const TYPE_COST_UPDATE = 'cost_update';

    public const STATUS_POSTED = 'posted';

    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'warehouse_id',
        'movement_type',
        'reference_type',
        'reference_id',
        'document_number',
        'movement_date',
        'status',
        'notes',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'movement_date' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Warehouse, $this>
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @return HasMany<StockMovementLine, $this>
     */
    public function lines(): HasMany
    {
        return $this->hasMany(StockMovementLine::class);
    }
}
