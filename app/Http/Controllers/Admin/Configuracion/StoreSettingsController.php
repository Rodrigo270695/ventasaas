<?php

namespace App\Http\Controllers\Admin\Configuracion;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Configuracion\StoreSettingsRequest;
use App\Models\CfgStoreSetting;
use App\Support\StoreCertificateStorage;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StoreSettingsController extends Controller
{
    public function __construct(
        private readonly StoreCertificateStorage $certificates,
    ) {}

    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('settings.view'), 403);

        if ($request->boolean('_reset')) {
            $request->session()->forget(['storeSettingsModal', 'errors']);
        }

        $settings = CfgStoreSetting::query()->first();

        $payload = $settings ? $this->formatSettings($settings) : null;

        return Inertia::render('admin/configuracion/tienda/index', [
            'settings' => $payload,
            'stats' => $this->buildStats($settings),
            'storeSettingsModal' => session()->pull('storeSettingsModal', false),
            'oldForm' => $this->oldFormDefaults($settings),
        ]);
    }

    public function store(StoreSettingsRequest $request): RedirectResponse
    {
        if (CfgStoreSetting::query()->exists()) {
            Toast::error('Ya existen datos de la tienda. Edítalos en lugar de crear otro registro.');

            return to_route('admin.configuracion.tienda.index');
        }

        $data = $this->resolvePersistedData($request);

        CfgStoreSetting::create($data);

        Toast::success('Datos de la tienda guardados correctamente.');

        return to_route('admin.configuracion.tienda.index');
    }

    public function update(
        StoreSettingsRequest $request,
        CfgStoreSetting $cfgStoreSetting,
    ): RedirectResponse {
        $data = $this->resolvePersistedData($request, $cfgStoreSetting);

        $cfgStoreSetting->update($data);

        Toast::success('Datos de la tienda actualizados.');

        return to_route('admin.configuracion.tienda.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function resolvePersistedData(
        StoreSettingsRequest $request,
        ?CfgStoreSetting $existing = null,
    ): array {
        $data = $request->safe()->except([
            'certificate',
            'remove_certificate',
        ]);

        if (blank($data['cdt_password_enc'] ?? null)) {
            unset($data['cdt_password_enc']);
        }

        if (blank($data['sol_password_enc'] ?? null)) {
            unset($data['sol_password_enc']);
        }

        if (blank($data['apisunat_token_enc'] ?? null)) {
            unset($data['apisunat_token_enc']);
        }

        if ($request->hasFile('certificate')) {
            $data['cdt_path_enc'] = $this->certificates->store(
                $request->file('certificate'),
                $existing?->cdt_path_enc,
            );
        } elseif ($request->boolean('remove_certificate')) {
            $this->certificates->delete($existing?->cdt_path_enc);
            $data['cdt_path_enc'] = null;
        } elseif ($existing) {
            unset($data['cdt_path_enc']);
        }

        return $data;
    }

    /**
     * @return array<string, mixed>
     */
    private function formatSettings(CfgStoreSetting $settings): array
    {
        return [
            'id' => $settings->id,
            'ruc' => $settings->ruc,
            'razon_social' => $settings->razon_social,
            'ubigeo' => $settings->ubigeo,
            'direccion' => $settings->direccion,
            'whatsapp_number' => $settings->whatsapp_number,
            'tax_regime' => $settings->tax_regime,
            'billing_channel' => $settings->billing_channel,
            'sunat_environment' => $settings->sunat_environment,
            'default_igv_rate' => (float) $settings->default_igv_rate,
            'has_certificate' => $this->certificates->exists($settings->cdt_path_enc),
            'has_certificate_password' => filled($settings->cdt_password_enc),
            'certificate_name' => $this->certificates->displayName($settings->cdt_path_enc),
            'sol_user' => $settings->sol_user,
            'has_sol_password' => filled($settings->sol_password_enc),
            'has_api_token' => filled($settings->apisunat_token_enc),
            'updated_at' => $settings->updated_at?->toIso8601String(),
        ];
    }

    /**
     * @return list<array{key: string, label: string, value: string|int|float, tone: string}>
     */
    private function buildStats(?CfgStoreSetting $settings): array
    {
        if (! $settings) {
            return [
                ['key' => 'configured', 'label' => 'Configuración', 'value' => 'Pendiente', 'tone' => 'amber'],
                ['key' => 'environment', 'label' => 'Ambiente', 'value' => '—', 'tone' => 'slate'],
                ['key' => 'billing', 'label' => 'Facturación', 'value' => '—', 'tone' => 'slate'],
                ['key' => 'igv', 'label' => 'IGV', 'value' => '—', 'tone' => 'slate'],
            ];
        }

        return [
            [
                'key' => 'configured',
                'label' => 'Configuración',
                'value' => 'Completa',
                'tone' => 'green',
            ],
            [
                'key' => 'environment',
                'label' => 'Ambiente',
                'value' => $settings->sunat_environment === 'production' ? 'Producción' : 'Beta',
                'tone' => $settings->sunat_environment === 'production' ? 'violet' : 'cyan',
            ],
            [
                'key' => 'billing',
                'label' => 'Canal',
                'value' => match ($settings->billing_channel) {
                    'pse' => 'PSE',
                    'ose' => 'OSE',
                    default => 'SUNAT directo',
                },
                'tone' => 'pink',
            ],
            [
                'key' => 'igv',
                'label' => 'IGV',
                'value' => number_format((float) $settings->default_igv_rate, 2).'%',
                'tone' => 'amber',
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function oldFormDefaults(?CfgStoreSetting $settings): array
    {
        return [
            'ruc' => old('ruc', $settings?->ruc ?? ''),
            'razon_social' => old('razon_social', $settings?->razon_social ?? ''),
            'ubigeo' => old('ubigeo', $settings?->ubigeo ?? ''),
            'direccion' => old('direccion', $settings?->direccion ?? ''),
            'whatsapp_number' => old('whatsapp_number', $settings?->whatsapp_number ?? ''),
            'tax_regime' => old('tax_regime', $settings?->tax_regime ?? 'mype'),
            'billing_channel' => old('billing_channel', $settings?->billing_channel ?? 'direct_sunat'),
            'sunat_environment' => old('sunat_environment', $settings?->sunat_environment ?? 'production'),
            'default_igv_rate' => old('default_igv_rate', $settings?->default_igv_rate ?? 18),
            'cdt_password_enc' => '',
            'sol_user' => old('sol_user', $settings?->sol_user ?? ''),
            'sol_password_enc' => '',
            'apisunat_token_enc' => '',
        ];
    }
}
