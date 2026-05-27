<?php

namespace App\Http\Controllers\Admin\Catalogo;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Catalogo\TaxProfileRequest;
use App\Models\SunatTaxAffectation;
use App\Models\TaxProfile;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TaxProfileController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('tax_profiles.view'), 403);

        if ($request->boolean('_reset')) {
            $request->session()->forget(['taxProfileModal', 'taxProfileModalId', 'errors']);
        }

        $profiles = TaxProfile::query()
            ->with('sunatAffectation:code,name')
            ->withCount('productTaxProfiles')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $payload = $profiles->map(fn (TaxProfile $profile) => [
            'id' => $profile->id,
            'code' => $profile->code,
            'name' => $profile->name,
            'sunat_affectation_code' => $profile->sunat_affectation_code,
            'sunat_affectation_name' => $profile->sunatAffectation?->name,
            'igv_rate' => (string) $profile->igv_rate,
            'isc_rate' => $profile->isc_rate !== null ? (string) $profile->isc_rate : null,
            'is_default' => $profile->is_default,
            'is_active' => $profile->is_active,
            'sort_order' => $profile->sort_order,
            'assignments_count' => $profile->product_tax_profiles_count,
        ]);

        $activeCount = $profiles->where('is_active', true)->count();

        return Inertia::render('admin/catalogo/perfiles-tributarios/index', [
            'taxProfiles' => $payload,
            'affectationOptions' => SunatTaxAffectation::query()
                ->where('is_active', true)
                ->orderBy('code')
                ->get(['code', 'name', 'default_igv_rate'])
                ->map(fn (SunatTaxAffectation $row) => [
                    'value' => $row->code,
                    'label' => trim($row->code.' — '.$row->name),
                    'default_igv_rate' => (string) $row->default_igv_rate,
                ])
                ->values()
                ->all(),
            'stats' => [
                ['key' => 'total', 'label' => 'Total', 'value' => $profiles->count(), 'tone' => 'violet'],
                ['key' => 'active', 'label' => 'Activos', 'value' => $activeCount, 'tone' => 'green'],
                ['key' => 'assignments', 'label' => 'Asignados', 'value' => $profiles->sum('product_tax_profiles_count'), 'tone' => 'cyan'],
            ],
            'taxProfileModal' => session()->pull('taxProfileModal'),
            'taxProfileModalId' => session()->pull('taxProfileModalId'),
            'oldForm' => $this->oldFormDefaults(),
        ]);
    }

    public function store(TaxProfileRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data): void {
            $profile = TaxProfile::create($data);

            if ($profile->is_default) {
                $this->clearOtherDefaults($profile->id);
            }
        });

        Toast::success('Perfil tributario creado correctamente.');

        return to_route('admin.catalogo.perfiles-tributarios.index');
    }

    public function update(TaxProfileRequest $request, TaxProfile $perfilesTributario): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($perfilesTributario, $data): void {
            $perfilesTributario->update($data);

            if ($perfilesTributario->is_default) {
                $this->clearOtherDefaults($perfilesTributario->id);
            }
        });

        Toast::success('Perfil tributario actualizado.');

        return to_route('admin.catalogo.perfiles-tributarios.index');
    }

    public function destroy(Request $request, TaxProfile $perfilesTributario): RedirectResponse
    {
        abort_unless($request->user()?->can('tax_profiles.delete'), 403);

        if ($perfilesTributario->is_default) {
            Toast::error('No puedes eliminar el perfil por defecto.');

            return to_route('admin.catalogo.perfiles-tributarios.index');
        }

        if ($perfilesTributario->productTaxProfiles()->exists()) {
            Toast::error('El perfil está asignado a variantes. Desactívalo o reasigna antes.');

            return to_route('admin.catalogo.perfiles-tributarios.index');
        }

        $perfilesTributario->delete();

        Toast::success('Perfil tributario eliminado.');

        return to_route('admin.catalogo.perfiles-tributarios.index');
    }

    private function clearOtherDefaults(string $exceptId): void
    {
        TaxProfile::query()
            ->where('id', '!=', $exceptId)
            ->update(['is_default' => false]);
    }

    /**
     * @return array<string, mixed>
     */
    private function oldFormDefaults(): array
    {
        return [
            'code' => old('code', ''),
            'name' => old('name', ''),
            'sunat_affectation_code' => old('sunat_affectation_code', '10'),
            'igv_rate' => old('igv_rate', '18'),
            'isc_rate' => old('isc_rate', ''),
            'is_default' => filter_var(old('is_default', false), FILTER_VALIDATE_BOOLEAN),
            'is_active' => filter_var(old('is_active', true), FILTER_VALIDATE_BOOLEAN),
            'sort_order' => (int) old('sort_order', 0),
        ];
    }
}
