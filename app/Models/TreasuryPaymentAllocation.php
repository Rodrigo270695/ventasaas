<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TreasuryPaymentAllocation extends Model
{
    /** @use HasFactory<\Database\Factories\TreasuryPaymentAllocationFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'treasury_payment_id',
        'sales_document_id',
        'purchase_document_id',
        'amount',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:4',
        ];
    }

    /**
     * @return BelongsTo<TreasuryPayment, $this>
     */
    public function payment(): BelongsTo
    {
        return $this->belongsTo(TreasuryPayment::class, 'treasury_payment_id');
    }

    /**
     * @return BelongsTo<TreasuryPayment, $this>
     */
    public function treasuryPayment(): BelongsTo
    {
        return $this->payment();
    }

    /**
     * @return BelongsTo<SalesDocument, $this>
     */
    public function salesDocument(): BelongsTo
    {
        return $this->belongsTo(SalesDocument::class);
    }

    /**
     * @return BelongsTo<PurchaseDocument, $this>
     */
    public function purchaseDocument(): BelongsTo
    {
        return $this->belongsTo(PurchaseDocument::class);
    }
}
