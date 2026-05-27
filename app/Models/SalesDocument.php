<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class SalesDocument extends Model
{
    /** @use HasFactory<\Database\Factories\SalesDocumentFactory> */
    use HasFactory, HasUuids, SoftDeletes;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_CONFIRMED = 'confirmed';

    public const STATUS_VOIDED = 'voided';

    public const PAYMENT_UNPAID = 'unpaid';

    public const PAYMENT_PARTIAL = 'partial';

    public const PAYMENT_PAID = 'paid';

    public const SOURCE_ERP = 'erp';

    protected $fillable = [
        'branch_id',
        'document_series_id',
        'sunat_document_type_code',
        'series',
        'number',
        'full_number',
        'customer_party_id',
        'warehouse_id',
        'issue_date',
        'due_date',
        'currency_code',
        'exchange_rate',
        'subtotal',
        'tax_amount',
        'total',
        'global_discount',
        'status',
        'payment_status',
        'source',
        'is_internal',
        'notes',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'issue_date' => 'date',
            'due_date' => 'date',
            'exchange_rate' => 'decimal:6',
            'subtotal' => 'decimal:4',
            'tax_amount' => 'decimal:4',
            'total' => 'decimal:4',
            'global_discount' => 'decimal:4',
            'number' => 'integer',
            'is_internal' => 'boolean',
        ];
    }

    public function isInternal(): bool
    {
        return (bool) $this->is_internal;
    }

    public function isFiscal(): bool
    {
        return ! $this->isInternal();
    }

    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function isConfirmed(): bool
    {
        return $this->status === self::STATUS_CONFIRMED;
    }

    public function statusLabel(): string
    {
        return match ($this->status) {
            self::STATUS_DRAFT => 'Borrador',
            self::STATUS_CONFIRMED => 'Confirmado',
            self::STATUS_VOIDED => 'Anulado',
            default => $this->status,
        };
    }

    public function documentTypeLabel(): string
    {
        if ($this->is_internal) {
            return 'Ticket interno';
        }

        return match ($this->sunat_document_type_code) {
            DocumentSeries::DOC_INVOICE => 'Factura',
            DocumentSeries::DOC_TICKET => 'Boleta',
            default => $this->sunat_document_type_code,
        };
    }

    /**
     * @return BelongsTo<DocumentSeries, $this>
     */
    public function documentSeries(): BelongsTo
    {
        return $this->belongsTo(DocumentSeries::class);
    }

    /**
     * @return BelongsTo<Party, $this>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Party::class, 'customer_party_id');
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
     * @return HasMany<SalesDocumentLine, $this>
     */
    public function lines(): HasMany
    {
        return $this->hasMany(SalesDocumentLine::class)->orderBy('line_order');
    }

    /**
     * @return HasOne<ElectronicDocument, $this>
     */
    public function electronicDocument(): HasOne
    {
        return $this->hasOne(ElectronicDocument::class);
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
}
