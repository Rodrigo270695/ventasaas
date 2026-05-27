<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VariantPackagingConversion extends Model
{
    /** @use HasFactory<\Database\Factories\VariantPackagingConversionFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'product_id',
        'from_variant_id',
        'to_variant_id',
        'factor',
        'label',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'factor' => 'decimal:4',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * @return BelongsTo<ProductVariant, $this>
     */
    public function fromVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'from_variant_id');
    }

    /**
     * @return BelongsTo<ProductVariant, $this>
     */
    public function toVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'to_variant_id');
    }
}
