<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SalesQuotation extends Model
{
    /** @use HasFactory<\Database\Factories\SalesQuotationFactory> */
    use HasFactory, HasUuids, SoftDeletes;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_SENT = 'sent';

    public const STATUS_ACCEPTED = 'accepted';

    public const STATUS_REJECTED = 'rejected';

    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'internal_number',
        'customer_party_id',
        'issue_date',
        'valid_until',
        'currency_code',
        'exchange_rate',
        'subtotal',
        'tax_amount',
        'total',
        'global_discount',
        'status',
        'sales_document_id',
        'status_changed_at',
        'notes',
        'customer_email_to',
        'customer_email_cc',
        'customer_email_sent_at',
        'created_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'issue_date' => 'datetime',
            'valid_until' => 'date',
            'exchange_rate' => 'decimal:6',
            'subtotal' => 'decimal:4',
            'tax_amount' => 'decimal:4',
            'total' => 'decimal:4',
            'global_discount' => 'decimal:4',
            'customer_email_cc' => 'array',
            'customer_email_sent_at' => 'datetime',
            'status_changed_at' => 'datetime',
        ];
    }

    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function statusLabel(): string
    {
        return match ($this->status) {
            self::STATUS_DRAFT => 'Borrador',
            self::STATUS_SENT => 'Enviada',
            self::STATUS_ACCEPTED => 'Aceptada',
            self::STATUS_REJECTED => 'Rechazada',
            self::STATUS_CANCELLED => 'Anulada',
            default => $this->status,
        };
    }

    public function canEdit(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function canSendEmail(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    /**
     * @return BelongsTo<Party, $this>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Party::class, 'customer_party_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @return HasMany<SalesQuotationLine, $this>
     */
    public function lines(): HasMany
    {
        return $this->hasMany(SalesQuotationLine::class)->orderBy('line_order');
    }

    /**
     * @return BelongsTo<SalesDocument, $this>
     */
    public function salesDocument(): BelongsTo
    {
        return $this->belongsTo(SalesDocument::class, 'sales_document_id');
    }
}

