<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TreasuryPayment extends Model
{
    /** @use HasFactory<\Database\Factories\TreasuryPaymentFactory> */
    use HasFactory, HasUuids;

    public const DIRECTION_COLLECTION = 'collection';

    public const DIRECTION_DISBURSEMENT = 'disbursement';

    protected $fillable = [
        'direction',
        'party_id',
        'payment_method_id',
        'cash_register_session_id',
        'payment_date',
        'currency_code',
        'exchange_rate',
        'amount',
        'reference',
        'notes',
        'proof_file_path',
        'proof_file_name',
        'created_by',
    ];

    public function hasProofFile(): bool
    {
        return filled($this->proof_file_path);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'payment_date' => 'date',
            'exchange_rate' => 'decimal:6',
            'amount' => 'decimal:4',
        ];
    }

    public function isCollection(): bool
    {
        return $this->direction === self::DIRECTION_COLLECTION;
    }

    /**
     * @return BelongsTo<Party, $this>
     */
    public function party(): BelongsTo
    {
        return $this->belongsTo(Party::class);
    }

    /**
     * @return BelongsTo<TreasuryPaymentMethod, $this>
     */
    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(TreasuryPaymentMethod::class, 'payment_method_id');
    }

    /**
     * @return BelongsTo<TreasuryCashRegisterSession, $this>
     */
    public function cashRegisterSession(): BelongsTo
    {
        return $this->belongsTo(TreasuryCashRegisterSession::class, 'cash_register_session_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @return HasMany<TreasuryPaymentAllocation, $this>
     */
    public function allocations(): HasMany
    {
        return $this->hasMany(TreasuryPaymentAllocation::class);
    }
}
