<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Party extends Model
{
    /** @use HasFactory<\Database\Factories\PartyFactory> */
    use HasFactory, HasUuids, SoftDeletes;

    public const TYPE_CUSTOMER = 'customer';

    public const TYPE_SUPPLIER = 'supplier';

    public const TYPE_BOTH = 'both';

    public const DOC_DNI = '1';

    public const DOC_RUC = '6';

    public const DOC_CE = '4';

    public const DOC_PASSPORT = '7';

    public const DOC_OTHER = '0';

    protected $fillable = [
        'type',
        'document_type',
        'document_number',
        'legal_name',
        'trade_name',
        'address',
        'sunat_estado',
        'sunat_condicion',
        'email',
        'phone',
        'credit_limit',
        'payment_term_days',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'credit_limit' => 'decimal:4',
            'payment_term_days' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function documentLabel(): string
    {
        return match ($this->document_type) {
            self::DOC_DNI => 'DNI',
            self::DOC_RUC => 'RUC',
            self::DOC_CE => 'CE',
            self::DOC_PASSPORT => 'Pasaporte',
            default => 'Doc.',
        };
    }
}
