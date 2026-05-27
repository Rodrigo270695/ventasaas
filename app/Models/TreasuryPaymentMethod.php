<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class TreasuryPaymentMethod extends Model
{
    /** @use HasFactory<\Database\Factories\TreasuryPaymentMethodFactory> */
    use HasFactory, HasUuids;

    public const TYPE_CASH = 'cash';

    public const TYPE_BANK_TRANSFER = 'bank_transfer';

    public const TYPE_DIGITAL_WALLET = 'digital_wallet';

    public const TYPE_CARD = 'card';

    public const TYPE_OTHER = 'other';

    protected $fillable = [
        'code',
        'name',
        'type',
        'is_active',
        'sort_order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function typeLabel(): string
    {
        return match ($this->type) {
            self::TYPE_CASH => 'Efectivo',
            self::TYPE_BANK_TRANSFER => 'Transferencia',
            self::TYPE_DIGITAL_WALLET => 'Billetera digital',
            self::TYPE_CARD => 'Tarjeta',
            default => 'Otro',
        };
    }

    /**
     * @return HasMany<TreasuryPayment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(TreasuryPayment::class, 'payment_method_id');
    }

    public static function nextSortOrder(): int
    {
        $max = (int) static::query()->max('sort_order');

        return $max + 10;
    }

    public static function generateUniqueCodeFromName(string $name): string
    {
        $base = Str::slug($name, '_');

        if ($base === '') {
            $base = 'metodo';
        }

        $base = substr($base, 0, 25);
        $code = $base;
        $suffix = 1;

        while (static::query()->where('code', $code)->exists()) {
            $code = substr($base, 0, 22).'_'.str_pad((string) $suffix, 2, '0', STR_PAD_LEFT);
            $suffix++;
        }

        return $code;
    }
}
