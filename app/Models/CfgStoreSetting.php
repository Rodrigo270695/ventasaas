<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CfgStoreSetting extends Model
{
    /** @use HasFactory<\Database\Factories\CfgStoreSettingFactory> */
    use HasFactory, HasUuids;

    protected $table = 'cfg_store_settings';

    protected $fillable = [
        'branch_id',
        'ruc',
        'razon_social',
        'ubigeo',
        'direccion',
        'whatsapp_number',
        'tax_regime',
        'billing_channel',
        'sunat_environment',
        'cdt_path_enc',
        'cdt_password_enc',
        'sol_user',
        'sol_password_enc',
        'apisunat_token_enc',
        'default_igv_rate',
        'settings',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'default_igv_rate' => 'decimal:4',
            'settings' => 'array',
            'cdt_password_enc' => 'encrypted',
            'sol_password_enc' => 'encrypted',
            'apisunat_token_enc' => 'encrypted',
        ];
    }
}
