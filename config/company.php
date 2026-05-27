<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Identidad de la empresa (Fase 1 — software a medida)
    |--------------------------------------------------------------------------
    |
    | Personaliza login y cabeceras. En Fase 2 (SaaS) estos valores vendrán
    | del tenant activo; por ahora se leen de .env.
    |
    */

    'name' => env('COMPANY_NAME', env('APP_NAME', 'Choko House')),

    'legal_name' => env('COMPANY_LEGAL_NAME'),

    'tagline' => env('COMPANY_TAGLINE', 'Gestión de ventas, compras e inventario'),

    'logo_url' => env('COMPANY_LOGO_URL', '/LOGO CHOKO HOUSE.png'),

    'ruc' => env('COMPANY_RUC'),

    'address' => env('COMPANY_ADDRESS'),

    'phone' => env('COMPANY_PHONE'),

    'email' => env('COMPANY_EMAIL'),

    'website' => env('COMPANY_WEBSITE'),

    'manager_name' => env('COMPANY_MANAGER_NAME'),

    'manager_title' => env('COMPANY_MANAGER_TITLE', 'Gerente General'),

    'quotation_validity' => env('COMPANY_QUOTATION_VALIDITY', '30 días'),

    'quotation_payment_terms' => env('COMPANY_QUOTATION_PAYMENT_TERMS', 'Transferencia, Yape o PLIN'),

    'primary_color' => env('COMPANY_PRIMARY_COLOR', '#5b21b6'),

    'login_background' => env('COMPANY_LOGIN_BACKGROUND'),

];
