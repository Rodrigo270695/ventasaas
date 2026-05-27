<?php

namespace App\Services\ElectronicBilling;

use App\Models\CfgStoreSetting;
use App\Support\StoreCertificateStorage;
use Illuminate\Support\Facades\Process;
use RuntimeException;

class StoreCertificateReader
{
    public function __construct(
        private readonly StoreCertificateStorage $storage,
    ) {}

    public function pemForGreenter(CfgStoreSetting $settings): string
    {
        $path = $settings->cdt_path_enc;
        $password = (string) $settings->cdt_password_enc;

        if (blank($path) || blank($password)) {
            throw new RuntimeException('Certificado digital o su clave no están configurados.');
        }

        $contents = $this->storage->contents($path);

        if ($contents === null) {
            throw new RuntimeException('No se encontró el archivo del certificado digital.');
        }

        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        $absolutePath = $this->storage->absolutePath($path);

        if (in_array($extension, ['p12', 'pfx'], true)) {
            return $this->pkcs12ToPem($contents, $password, $absolutePath);
        }

        return $contents;
    }

    private function pkcs12ToPem(string $pkcs12, string $password, ?string $absolutePath): string
    {
        $certs = [];

        if (openssl_pkcs12_read($pkcs12, $certs, $password)) {
            return $this->bundlePem($certs);
        }

        if ($absolutePath !== null) {
            $pem = $this->pkcs12ToPemWithOpenSslCli($absolutePath, $password);

            if ($pem !== null) {
                return $pem;
            }
        }

        $opensslError = $this->lastOpenSslError();

        throw new RuntimeException(
            'No se pudo leer el certificado .p12. Verifica la clave del certificado (CDT) '
            .'(la que definiste al descargarlo en SUNAT, no es la Clave SOL).'
            .($opensslError !== '' ? " Detalle: {$opensslError}" : ''),
        );
    }

    /**
     * @param  array<string, mixed>  $certs
     */
    private function bundlePem(array $certs): string
    {
        $cert = $certs['cert'] ?? null;
        $key = $certs['pkey'] ?? null;

        if (! is_string($cert) || ! is_string($key)) {
            throw new RuntimeException('El archivo .p12 no contiene certificado o clave privada válidos.');
        }

        return $cert.$key;
    }

    private function pkcs12ToPemWithOpenSslCli(string $absolutePath, string $password): ?string
    {
        $openssl = $this->resolveOpenSslExecutable();

        if ($openssl === null) {
            return null;
        }

        foreach ([true, false] as $useLegacy) {
            $command = [
                $openssl,
                'pkcs12',
                '-in',
                $absolutePath,
                '-nodes',
                '-passin',
                'env:CERT_PASS',
            ];

            if ($useLegacy) {
                $command[] = '-legacy';
            }

            $result = Process::timeout(30)
                ->env(['CERT_PASS' => $password])
                ->run($command);

            if ($result->successful() && trim($result->output()) !== '') {
                return $result->output();
            }
        }

        return null;
    }

    private function resolveOpenSslExecutable(): ?string
    {
        $configured = config('electronic_billing.openssl_path');

        if (is_string($configured) && $configured !== '' && is_file($configured)) {
            return $configured;
        }

        $candidates = [
            'C:\\laragon\\bin\\git\\usr\\bin\\openssl.exe',
            'C:\\laragon\\bin\\apache\\httpd-2.4.54-win64-VS16\\bin\\openssl.exe',
            'openssl',
        ];

        foreach ($candidates as $candidate) {
            if ($candidate === 'openssl') {
                $result = Process::run(['openssl', 'version']);

                if ($result->successful()) {
                    return 'openssl';
                }

                continue;
            }

            if (is_file($candidate)) {
                return $candidate;
            }
        }

        return null;
    }

    private function lastOpenSslError(): string
    {
        $messages = [];

        while ($message = openssl_error_string()) {
            $messages[] = $message;
        }

        return implode(' | ', array_reverse($messages));
    }
}
