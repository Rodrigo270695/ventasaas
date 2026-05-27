<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PurchaseOrder extends Model
{
    /** @use HasFactory<\Database\Factories\PurchaseOrderFactory> */
    use HasFactory, HasUuids, SoftDeletes;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_PARTIALLY_RECEIVED = 'partially_received';

    public const STATUS_RECEIVED = 'received';

    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'supplier_party_id',
        'internal_number',
        'order_date',
        'expected_date',
        'currency_code',
        'exchange_rate',
        'subtotal',
        'tax_amount',
        'total',
        'status',
        'notes',
        'approved_at',
        'supplier_email_sent_at',
        'supplier_email_to',
        'supplier_email_cc',
        'supplier_confirmation_token',
        'supplier_confirmation_expires_at',
        'supplier_confirmed_at',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'order_date' => 'datetime',
            'expected_date' => 'date',
            'exchange_rate' => 'decimal:6',
            'subtotal' => 'decimal:4',
            'tax_amount' => 'decimal:4',
            'total' => 'decimal:4',
            'approved_at' => 'datetime',
            'supplier_email_sent_at' => 'datetime',
            'supplier_email_cc' => 'array',
            'supplier_confirmation_expires_at' => 'datetime',
            'supplier_confirmed_at' => 'datetime',
        ];
    }

    public function hasSupplierConfirmed(): bool
    {
        return $this->supplier_confirmed_at !== null;
    }

    public function canSendSupplierEmail(): bool
    {
        return $this->isApproved()
            && $this->status !== self::STATUS_CANCELLED;
    }

    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function isApproved(): bool
    {
        return in_array($this->status, [
            self::STATUS_APPROVED,
            self::STATUS_PARTIALLY_RECEIVED,
            self::STATUS_RECEIVED,
        ], true);
    }

    public function canReceive(): bool
    {
        return in_array($this->status, [
            self::STATUS_APPROVED,
            self::STATUS_PARTIALLY_RECEIVED,
        ], true);
    }

    /**
     * @return BelongsTo<Party, $this>
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Party::class, 'supplier_party_id');
    }

    /**
     * @return HasMany<PurchaseOrderLine, $this>
     */
    public function lines(): HasMany
    {
        return $this->hasMany(PurchaseOrderLine::class)->orderBy('line_order');
    }

    /**
     * @return HasMany<GoodsReceipt, $this>
     */
    public function goodsReceipts(): HasMany
    {
        return $this->hasMany(GoodsReceipt::class);
    }

    /**
     * @return HasMany<PurchaseDocument, $this>
     */
    public function purchaseDocuments(): HasMany
    {
        return $this->hasMany(PurchaseDocument::class);
    }

    public function statusLabel(): string
    {
        return match ($this->status) {
            self::STATUS_DRAFT => 'Borrador',
            self::STATUS_APPROVED => 'Aprobada',
            self::STATUS_PARTIALLY_RECEIVED => 'Recepción parcial',
            self::STATUS_RECEIVED => 'Recibida',
            self::STATUS_CANCELLED => 'Anulada',
            default => $this->status,
        };
    }
}
