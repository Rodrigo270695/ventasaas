<?php

namespace App\Services\Integrations;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Cliente para consulta de RUC vía {@link https://apiperu.dev apiperu.dev}.
 *
 * POST `{base_url}/ruc` — cuerpo `{"ruc":"20100070970"}` (11 dígitos).
 */
final class ApiPeruRucService
{
    /**
     * @return array{
     *     document_number: string,
     *     legal_name: string,
     *     trade_name: string|null,
     *     address: string|null,
     *     ubigeo: string|null,
     *     sunat_estado: string|null,
     *     sunat_condicion: string|null,
     * }
     */
    public function consultar(string $ruc): array
    {
        $token = trim((string) config('services.apiperu.token', ''));
        $base = rtrim((string) config('services.apiperu.base_url', 'https://apiperu.dev/api'), '/');

        if ($token === '') {
            throw new RuntimeException('Consulta RUC no disponible: configure APIPERU_TOKEN en el servidor.');
        }

        $response = Http::timeout(25)
            ->acceptJson()
            ->withToken($token)
            ->post($base.'/ruc', ['ruc' => $ruc]);

        if (! $response->successful()) {
            throw new RuntimeException('La API de consulta RUC devolvió HTTP '.$response->status().'.');
        }

        $json = $response->json();
        if (! is_array($json) || ! ($json['success'] ?? false)) {
            $msg = is_string($json['message'] ?? null) ? $json['message'] : 'No se encontraron datos para el RUC indicado.';
            throw new RuntimeException($msg);
        }

        $data = $json['data'] ?? null;
        if (! is_array($data)) {
            throw new RuntimeException('Respuesta de API RUC inválida (sin data).');
        }

        $razon = (string) ($data['nombre_o_razon_social'] ?? '');
        if ($razon === '') {
            throw new RuntimeException('La API no devolvió razón social para este RUC.');
        }

        $comercial = $data['nombre_comercial'] ?? null;
        $comercial = is_string($comercial) && $comercial !== '' ? mb_substr($comercial, 0, 255) : null;

        $direccion = $data['direccion_completa'] ?? $data['direccion'] ?? null;
        $direccion = is_string($direccion) && trim($direccion) !== '' ? trim($direccion) : null;

        $estado = $data['estado'] ?? null;
        $estado = is_string($estado) && $estado !== '' ? mb_substr(trim($estado), 0, 32) : null;

        $condicion = $data['condicion'] ?? null;
        $condicion = is_string($condicion) && $condicion !== '' ? mb_substr(trim($condicion), 0, 32) : null;

        $ubigeo = $data['ubigeo_sunat'] ?? null;
        if (! is_string($ubigeo) || ! preg_match('/^\d{6}$/', $ubigeo)) {
            $ubigeoParts = $data['ubigeo'] ?? null;
            if (is_array($ubigeoParts)) {
                $district = $ubigeoParts[2] ?? null;
                $ubigeo = is_string($district) && preg_match('/^\d{6}$/', $district) ? $district : null;
            } else {
                $ubigeo = null;
            }
        }

        return [
            'document_number' => $ruc,
            'legal_name' => mb_substr($razon, 0, 255),
            'trade_name' => $comercial,
            'address' => $direccion,
            'ubigeo' => $ubigeo,
            'sunat_estado' => $estado,
            'sunat_condicion' => $condicion,
        ];
    }
}
