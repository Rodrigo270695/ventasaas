<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SunatTaxAffectation extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $primaryKey = 'code';

    protected $fillable = [
        'code',
        'name',
        'default_igv_rate',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'default_igv_rate' => 'decimal:4',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return HasMany<TaxProfile, $this>
     */
    public function taxProfiles(): HasMany
    {
        return $this->hasMany(TaxProfile::class, 'sunat_affectation_code', 'code');
    }
}
