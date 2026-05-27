<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PriceList extends Model
{
    /** @use HasFactory<\Database\Factories\PriceListFactory> */
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'currency_code',
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
            'is_default' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * @return HasMany<ProductPrice, $this>
     */
    public function productPrices(): HasMany
    {
        return $this->hasMany(ProductPrice::class);
    }
}
