<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class TreasuryCashRegister extends Model
{
    /** @use HasFactory<\Database\Factories\TreasuryCashRegisterFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'code',
        'name',
        'warehouse_id',
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

    /**
     * @return BelongsTo<Warehouse, $this>
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * @return HasMany<TreasuryCashRegisterSession, $this>
     */
    public function sessions(): HasMany
    {
        return $this->hasMany(TreasuryCashRegisterSession::class, 'cash_register_id');
    }

    /**
     * @return HasOne<TreasuryCashRegisterSession, $this>
     */
    public function openSession(): HasOne
    {
        return $this->hasOne(TreasuryCashRegisterSession::class, 'cash_register_id')
            ->where('status', TreasuryCashRegisterSession::STATUS_OPEN);
    }

    public static function nextSortOrder(): int
    {
        return ((int) static::query()->max('sort_order')) + 10;
    }

    public static function generateUniqueCodeFromName(string $name): string
    {
        $normalized = strtoupper(
            preg_replace('/[^A-Z0-9]/', '', Str::ascii($name)),
        );

        if ($normalized === '') {
            $normalized = 'CAJA';
        }

        $base = substr($normalized, 0, 6);
        $code = $base;
        $suffix = 1;

        while (static::query()->where('code', $code)->exists()) {
            $code = substr($base, 0, 4).str_pad((string) $suffix, 2, '0', STR_PAD_LEFT);
            $suffix++;
        }

        return $code;
    }
}
