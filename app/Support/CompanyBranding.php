<?php

namespace App\Support;

class CompanyBranding
{
    /**
     * @return array<string, mixed>
     */
    public static function forInertia(): array
    {
        $config = config('company');

        return [
            'name' => $config['name'],
            'legal_name' => $config['legal_name'] ?: null,
            'tagline' => $config['tagline'] ?: null,
            'logo_url' => $config['logo_url'] ?: null,
            'primary_color' => $config['primary_color'],
            'login_background' => $config['login_background'] ?: null,
        ];
    }
}
