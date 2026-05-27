<?php

namespace App\Console\Commands;

use App\Models\CfgStoreSetting;
use App\Services\ElectronicBilling\SunatSeeFactory;
use Illuminate\Console\Command;
use Throwable;

class VerifySunatSolCommand extends Command
{
    protected $signature = 'billing:verify-sol';

    protected $description = 'Prueba credenciales SOL contra SUNAT (getStatus) y muestra el error SOAP completo';

    public function handle(SunatSeeFactory $seeFactory): int
    {
        $settings = CfgStoreSetting::query()->orderBy('id')->first();

        if (! $settings) {
            $this->error('No hay datos de tienda configurados.');

            return self::FAILURE;
        }

        if (blank($settings->sol_user) || blank($settings->sol_password_enc)) {
            $this->error('Falta usuario/contraseña SOL en Configuración → Tienda.');

            return self::FAILURE;
        }

        $this->info('RUC: '.$settings->ruc);
        $this->info('Usuario SOL: '.$settings->sol_user);
        $this->info('Usuario WS-Security: '.$settings->ruc.$settings->sol_user);
        $this->info('Ambiente: '.$settings->sunat_environment);

        try {
            $see = $seeFactory->make($settings);

            $this->info('Llamando getStatus (ticket de prueba)…');
            $result = $see->getStatus('000000000000000');

            if ($result->isSuccess()) {
                $this->info('OK — SUNAT respondió (autenticación SOAP válida).');

                return self::SUCCESS;
            }

            $error = $result->getError();
            $code = (string) ($error?->getCode() ?? '');
            $message = (string) ($error?->getMessage() ?? '');

            $this->warn('Respuesta SUNAT:');
            $this->line('  Código: '.($code !== '' ? $code : '—'));
            $this->line('  Mensaje: '.($message !== '' ? $message : '—'));

            if (str_contains(strtolower($code), 'http') && str_contains(strtolower($message), 'bad request')) {
                $this->newLine();
                $this->error('Credenciales o encabezado SOAP rechazados (HTTP 400).');
                $this->line('Revisa en Tienda: usuario RODRIG95, contraseña del secundario re-guardada, certificado activo en SUNAT.');

                return self::FAILURE;
            }

            if (preg_match('/\d{3,4}/', $code) || $message !== '') {
                $this->info('La conexión SOAP funciona; el error anterior es normal con un ticket inventado.');

                return self::SUCCESS;
            }

            return self::FAILURE;
        } catch (Throwable $e) {
            if (str_contains($e->getMessage(), 'Invalid getStatus service response')) {
                $this->info('OK — SUNAT respondió al SOAP (credenciales aceptadas; ticket de prueba inválido).');

                return self::SUCCESS;
            }

            $this->error('Falló la conexión SOAP: '.$e->getMessage());

            return self::FAILURE;
        }
    }
}
