<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Unit extends Model
{
    /** @use HasFactory<\Database\Factories\UnitFactory> */
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'sunat_code',
        'symbol',
        'allows_decimals',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'allows_decimals' => 'boolean',
            'is_active' => 'boolean',
        ];
    }
}
