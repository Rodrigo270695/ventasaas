<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ElectronicDocument extends Model
{
    /** @use HasFactory<\Database\Factories\ElectronicDocumentFactory> */
    use HasFactory, HasUuids;

    public const GATEWAY_SUNAT_SOAP = 'sunat_soap';

    public const GATEWAY_APISUNAT = 'apisunat';

    public const GATEWAY_OSE = 'ose';

    public const STATUS_PENDING = 'pending';

    public const STATUS_BUILDING = 'building';

    public const STATUS_SENT = 'sent';

    public const STATUS_ACCEPTED = 'accepted';

    public const STATUS_REJECTED = 'rejected';

    public const STATUS_OBSERVED = 'observed';

    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'sales_document_id',
        'gateway',
        'ubl_version',
        'xml_hash',
        'xml_path',
        'cdr_path',
        'sunat_ticket',
        'sunat_response_code',
        'sunat_description',
        'status',
        'sent_at',
        'accepted_at',
        'retry_count',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sent_at' => 'datetime',
            'accepted_at' => 'datetime',
            'retry_count' => 'integer',
        ];
    }

    public function isTerminal(): bool
    {
        return in_array($this->status, [
            self::STATUS_ACCEPTED,
            self::STATUS_REJECTED,
            self::STATUS_CANCELLED,
        ], true);
    }

    public function statusLabel(): string
    {
        return match ($this->status) {
            self::STATUS_PENDING => 'Pendiente de emisión',
            self::STATUS_BUILDING => 'Generando XML',
            self::STATUS_SENT => 'Enviado a SUNAT',
            self::STATUS_ACCEPTED => 'Aceptado',
            self::STATUS_REJECTED => 'Rechazado',
            self::STATUS_OBSERVED => 'Observado',
            self::STATUS_CANCELLED => 'Anulado',
            default => $this->status,
        };
    }

    /**
     * @return BelongsTo<SalesDocument, $this>
     */
    public function salesDocument(): BelongsTo
    {
        return $this->belongsTo(SalesDocument::class);
    }

    /**
     * @return HasMany<ElectronicDocumentEvent, $this>
     */
    public function events(): HasMany
    {
        return $this->hasMany(ElectronicDocumentEvent::class)->orderBy('created_at');
    }
}
