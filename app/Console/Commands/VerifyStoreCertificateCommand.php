<?php

namespace App\Console\Commands;

use App\Models\CfgStoreSetting;
use App\Services\ElectronicBilling\StoreCertificateReader;
use Illuminate\Console\Command;
use Throwable;

class VerifyStoreCertificateCommand extends Command
{
    protected $signature = 'billing:verify-certificate';

    protected $description = 'Verifica que el certificado .p12 de la tienda se pueda leer con la clave CDT guardada';

    public function handle(StoreCertificateReader $reader): int
    {
        $settings = CfgStoreSetting::query()->orderBy('id')->first();

        if (! $settings) {
            $this->error('No hay datos de tienda configurados.');

            return self::FAILURE;
        }

        if (blank($settings->cdt_path_enc)) {
            $this->error('No hay certificado digital cargado.');

            return self::FAILURE;
        }

        if (blank($settings->cdt_password_enc)) {
            $this->error('No hay clave del certificado (CDT) guardada. Configúrala en Tienda.');

            return self::FAILURE;
        }

        $this->info('Certificado: '.$settings->cdt_path_enc);
        $this->info('Ambiente SUNAT: '.$settings->sunat_environment);

        try {
            $pem = $reader->pemForGreenter($settings);
            $this->info('OK — certificado leído correctamente ('.strlen($pem).' bytes PEM).');

            return self::SUCCESS;
        } catch (Throwable $e) {
            $this->error('Falló: '.$e->getMessage());

            return self::FAILURE;
        }
    }
}
