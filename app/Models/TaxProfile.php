<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class TaxProfile extends Model
{
    /** @use HasFactory<\Database\Factories\TaxProfileFactory> */
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'sunat_affectation_code',
        'igv_rate',
        'isc_rate',
        'is_default',
        'is_active',
        'sort_order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'igv_rate' => 'decimal:4',
            'isc_rate' => 'decimal:4',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<SunatTaxAffectation, $this>
     */
    public function sunatAffectation(): BelongsTo
    {
        return $this->belongsTo(SunatTaxAffectation::class, 'sunat_affectation_code', 'code');
    }

    /**
     * @return HasMany<ProductTaxProfile, $this>
     */
    public function productTaxProfiles(): HasMany
    {
        return $this->hasMany(ProductTaxProfile::class);
    }
}
