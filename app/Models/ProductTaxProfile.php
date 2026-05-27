<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductTaxProfile extends Model
{
    /** @use HasFactory<\Database\Factories\ProductTaxProfileFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'product_variant_id',
        'tax_profile_id',
        'sunat_affectation_code',
        'igv_rate',
        'isc_rate',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'igv_rate' => 'decimal:4',
            'isc_rate' => 'decimal:4',
        ];
    }

    /**
     * @return BelongsTo<ProductVariant, $this>
     */
    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'product_variant_id');
    }

    /**
     * @return BelongsTo<TaxProfile, $this>
     */
    public function taxProfile(): BelongsTo
    {
        return $this->belongsTo(TaxProfile::class);
    }

    /**
     * @return BelongsTo<SunatTaxAffectation, $this>
     */
    public function sunatAffectation(): BelongsTo
    {
        return $this->belongsTo(SunatTaxAffectation::class, 'sunat_affectation_code', 'code');
    }
}
