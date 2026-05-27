<?php

namespace App\Http\Controllers\Admin\Socios;

use App\Http\Controllers\Controller;
use App\Models\Party;
use App\Services\Integrations\ApiPeruDniService;
use App\Services\Integrations\ApiPeruRucService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;
use Throwable;

class PartyDocumentLookupController extends Controller
{
    public function __invoke(
        Request $request,
        ApiPeruRucService $rucService,
        ApiPeruDniService $dniService,
    ): JsonResponse {
        $user = $request->user();
        abort_unless(
            $user && (
                $user->can('parties.create')
                || $user->can('parties.update')
                || $user->can('settings.manage')
            ),
            403,
        );

        $documentType = (string) $request->query('document_type', '');
        $digits = preg_replace('/\D+/', '', (string) $request->query('document_number', '')) ?? '';
        $request->merge(['document_number' => $digits]);

        $rules = match ($documentType) {
            Party::DOC_RUC => ['document_number' => ['required', 'string', 'regex:/^[0-9]{11}$/']],
            Party::DOC_DNI => ['document_number' => ['required', 'string', 'regex:/^[0-9]{8}$/']],
            default => [],
        };

        if ($rules === []) {
            return response()->json([
                'success' => false,
                'message' => 'Solo se puede consultar RUC o DNI desde SUNAT/RENIEC.',
            ], 422);
        }

        $validated = $request->validate($rules);

        try {
            $data = match ($documentType) {
                Party::DOC_RUC => $rucService->consultar($validated['document_number']),
                Party::DOC_DNI => $dniService->consultar($validated['document_number']),
                default => throw new RuntimeException('Tipo de documento no soportado.'),
            };

            return response()->json(['success' => true, 'data' => $data]);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => 'No se pudo completar la consulta. Intente de nuevo.',
            ], 503);
        }
    }
}
