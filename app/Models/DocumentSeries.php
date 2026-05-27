<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DocumentSeries extends Model
{
    /** @use HasFactory<\Database\Factories\DocumentSeriesFactory> */
    use HasFactory, HasUuids, SoftDeletes;

    public const DOC_INVOICE = '01';

    public const DOC_TICKET = '03';

    public const DOC_CREDIT_NOTE = '07';

    public const DOC_DEBIT_NOTE = '08';

    public const DOC_DISPATCH_GUIDE = '09';

    /** Documento interno (no SUNAT / sin CPE). */
    public const DOC_INTERNAL = '99';

    protected $fillable = [
        'branch_id',
        'sunat_document_type_code',
        'series',
        'name',
        'is_electronic',
        'is_internal',
        'next_number',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_electronic' => 'boolean',
            'is_internal' => 'boolean',
            'next_number' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function isInternal(): bool
    {
        return (bool) $this->is_internal;
    }

    public function documentTypeLabel(): string
    {
        if ($this->is_internal) {
            return 'Ticket interno';
        }

        return match ($this->sunat_document_type_code) {
            self::DOC_INVOICE => 'Factura',
            self::DOC_TICKET => 'Boleta',
            self::DOC_CREDIT_NOTE => 'Nota de crédito',
            self::DOC_DEBIT_NOTE => 'Nota de débito',
            self::DOC_DISPATCH_GUIDE => 'Guía de remisión',
            default => $this->sunat_document_type_code,
        };
    }

    public function previewNumber(int $padding = 8): string
    {
        return sprintf('%s-%s', $this->series, str_pad((string) $this->next_number, $padding, '0', STR_PAD_LEFT));
    }
}
