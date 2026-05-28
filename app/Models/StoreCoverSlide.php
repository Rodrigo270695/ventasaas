<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StoreCoverSlide extends Model
{
    /** @use HasFactory<\Database\Factories\StoreCoverSlideFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'title',
        'subtitle',
        'image_path',
        'sort_order',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }
}
