<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ElectronicDocumentEvent extends Model
{
    use HasUuids;

    public const UPDATED_AT = null;

    public const EVENT_QUEUED = 'queued';

    public const EVENT_BUILDING = 'building';

    public const EVENT_SENT = 'sent';

    public const EVENT_ACCEPTED = 'accepted';

    public const EVENT_REJECTED = 'rejected';

    public const EVENT_ERROR = 'error';

    protected $fillable = [
        'electronic_document_id',
        'event',
        'payload',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'created_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<ElectronicDocument, $this>
     */
    public function electronicDocument(): BelongsTo
    {
        return $this->belongsTo(ElectronicDocument::class);
    }
}
