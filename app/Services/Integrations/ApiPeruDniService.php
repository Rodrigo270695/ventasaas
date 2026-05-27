<?php

namespace App\Services\Integrations;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Cliente para consulta de DNI vía {@link https://apiperu.dev apiperu.dev}.
 *
 * POST `{base_url}/dni` — cuerpo `{"dni":"12345678"}` (8 dígitos).
 */
final class ApiPeruDniService
{
    /**
     * @return array{
     *     document_number: string,
     *     legal_name: string,
     * }
     */
    public function consultar(string $dni): array
    {
        $token = trim((string) config('services.apiperu.token', ''));
        $base = rtrim((string) config('services.apiperu.base_url', 'https://apiperu.dev/api'), '/');

        if ($token === '') {
            throw new RuntimeException('Consulta DNI no disponible: configure APIPERU_TOKEN en el servidor.');
        }

        $response = Http::timeout(25)
            ->acceptJson()
            ->withToken($token)
            ->post($base.'/dni', ['dni' => $dni]);

        if (! $response->successful()) {
            throw new RuntimeException('La API de consulta DNI devolvió HTTP '.$response->status().'.');
        }

        $json = $response->json();
        if (! is_array($json) || ! ($json['success'] ?? false)) {
            $msg = is_string($json['message'] ?? null) ? $json['message'] : 'No se encontraron datos para el DNI indicado.';
            throw new RuntimeException($msg);
        }

        $data = $json['data'] ?? null;
        if (! is_array($data)) {
            throw new RuntimeException('Respuesta de API DNI inválida (sin data).');
        }

        $nombre = $this->resolveNombreCompleto($data);
        if ($nombre === '') {
            throw new RuntimeException('La API no devolvió nombre para este DNI.');
        }

        return [
            'document_number' => $dni,
            'legal_name' => mb_substr($nombre, 0, 255),
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function resolveNombreCompleto(array $data): string
    {
        $completo = $data['nombre_completo'] ?? null;
        if (is_string($completo) && trim($completo) !== '') {
            return trim($completo);
        }

        $nombres = trim((string) ($data['nombres'] ?? ''));
        $paterno = trim((string) ($data['apellido_paterno'] ?? ''));
        $materno = trim((string) ($data['apellido_materno'] ?? ''));

        return trim(implode(' ', array_filter([$nombres, $paterno, $materno])));
    }
}
