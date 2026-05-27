<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Emisión simulada (desarrollo / tests)
    |--------------------------------------------------------------------------
    |
    | Si es true, el job marca el CPE como "accepted" sin llamar a SUNAT.
    | Solo aplica en entorno local/testing.
    |
    */
    'fake_accept' => env('ELECTRONIC_BILLING_FAKE_ACCEPT', false),

    'ubl_version' => '2.1',

    /*
    | Ruta a openssl.exe (Windows/Laragon). Si está vacío, se intentan rutas comunes.
    */
    'openssl_path' => env('OPENSSL_PATH'),

    'gateways' => [
        'direct_sunat' => \App\Models\ElectronicDocument::GATEWAY_SUNAT_SOAP,
        'apisunat' => \App\Models\ElectronicDocument::GATEWAY_APISUNAT,
        'ose' => \App\Models\ElectronicDocument::GATEWAY_OSE,
        'pse' => \App\Models\ElectronicDocument::GATEWAY_OSE,
    ],

];
