<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PurchaseDocument extends Model
{
    /** @use HasFactory<\Database\Factories\PurchaseDocumentFactory> */
    use HasFactory, HasUuids, SoftDeletes;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_CONFIRMED = 'confirmed';

    public const STATUS_VOIDED = 'voided';

    public const PAYMENT_UNPAID = 'unpaid';

    public const PAYMENT_PARTIAL = 'partial';

    public const PAYMENT_PAID = 'paid';

    protected $fillable = [
        'supplier_party_id',
        'purchase_order_id',
        'goods_receipt_id',
        'warehouse_id',
        'internal_number',
        'supplier_document_number',
        'issue_date',
        'due_date',
        'currency_code',
        'exchange_rate',
        'subtotal',
        'tax_amount',
        'total',
        'status',
        'payment_status',
        'notes',
        'invoice_file_path',
        'invoice_file_name',
        'stock_movement_id',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'issue_date' => 'datetime',
            'due_date' => 'date',
            'exchange_rate' => 'decimal:6',
            'subtotal' => 'decimal:4',
            'tax_amount' => 'decimal:4',
            'total' => 'decimal:4',
        ];
    }

    public function isConfirmed(): bool
    {
        return $this->status === self::STATUS_CONFIRMED;
    }

    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    /**
     * @return BelongsTo<Party, $this>
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Party::class, 'supplier_party_id');
    }

    /**
     * @return BelongsTo<PurchaseOrder, $this>
     */
    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    /**
     * @return BelongsTo<GoodsReceipt, $this>
     */
    public function goodsReceipt(): BelongsTo
    {
        return $this->belongsTo(GoodsReceipt::class);
    }

    public function stockAlreadyPostedViaReceipt(): bool
    {
        return filled($this->goods_receipt_id);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
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
     * @return HasMany<PurchaseDocumentLine, $this>
     */
    public function lines(): HasMany
    {
        return $this->hasMany(PurchaseDocumentLine::class);
    }

    public function hasInvoiceFile(): bool
    {
        return filled($this->invoice_file_path);
    }

    /**
     * @return HasMany<TreasuryPaymentAllocation, $this>
     */
    public function paymentAllocations(): HasMany
    {
        return $this->hasMany(TreasuryPaymentAllocation::class);
    }

    public function paymentStatusLabel(): string
    {
        return match ($this->payment_status) {
            self::PAYMENT_PAID => 'Pagado',
            self::PAYMENT_PARTIAL => 'Pago parcial',
            default => 'Pendiente',
        };
    }

    public function statusLabel(): string
    {
        return match ($this->status) {
            self::STATUS_CONFIRMED => 'Confirmado',
            self::STATUS_VOIDED => 'Anulado',
            default => 'Borrador',
        };
    }

    public function displayNumber(): string
    {
        return $this->supplier_document_number
            ? $this->supplier_document_number.' ('.$this->internal_number.')'
            : $this->internal_number;
    }
}
