<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TreasuryCashRegisterSession extends Model
{
    /** @use HasFactory<\Database\Factories\TreasuryCashRegisterSessionFactory> */
    use HasFactory, HasUuids;

    public const STATUS_OPEN = 'open';

    public const STATUS_CLOSED = 'closed';

    protected $fillable = [
        'cash_register_id',
        'status',
        'opened_at',
        'closed_at',
        'opened_by',
        'closed_by',
        'opening_float',
        'expected_cash',
        'closing_cash_counted',
        'cash_difference',
        'opening_notes',
        'closing_notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'opened_at' => 'datetime',
            'closed_at' => 'datetime',
            'opening_float' => 'decimal:4',
            'expected_cash' => 'decimal:4',
            'closing_cash_counted' => 'decimal:4',
            'cash_difference' => 'decimal:4',
        ];
    }

    public function isOpen(): bool
    {
        return $this->status === self::STATUS_OPEN;
    }

    public function statusLabel(): string
    {
        return match ($this->status) {
            self::STATUS_CLOSED => 'Cerrada',
            default => 'Abierta',
        };
    }

    /**
     * @return BelongsTo<TreasuryCashRegister, $this>
     */
    public function cashRegister(): BelongsTo
    {
        return $this->belongsTo(TreasuryCashRegister::class, 'cash_register_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function opener(): BelongsTo
    {
        return $this->belongsTo(User::class, 'opened_by');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function closer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    /**
     * @return HasMany<TreasuryPayment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(TreasuryPayment::class, 'cash_register_session_id');
    }
}
