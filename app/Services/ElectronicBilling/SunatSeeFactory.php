<?php

namespace App\Services\ElectronicBilling;

use App\Models\CfgStoreSetting;
use Greenter\See;
use Greenter\Ws\Services\SunatEndpoints;
use RuntimeException;

class SunatSeeFactory
{
    public function __construct(
        private readonly StoreCertificateReader $certificates,
    ) {}

    public function make(CfgStoreSetting $settings): See
    {
        if (blank($settings->sol_user) || blank($settings->sol_password_enc)) {
            throw new RuntimeException(
                'Falta la Clave SOL (usuario secundario y contraseña) en Configuración → Tienda.',
            );
        }

        $see = new See;
        $see->setCertificate($this->certificates->pemForGreenter($settings));
        $see->setClaveSOL(
            $settings->ruc,
            (string) $settings->sol_user,
            (string) $settings->sol_password_enc,
        );
        $see->setService($this->endpoint($settings));

        return $see;
    }

    private function endpoint(CfgStoreSetting $settings): string
    {
        return $settings->sunat_environment === 'production'
            ? SunatEndpoints::FE_PRODUCCION
            : SunatEndpoints::FE_BETA;
    }
}
