<?php

namespace App\Http\Controllers\Admin\Catalogo;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Catalogo\UnitRequest;
use App\Models\Unit;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UnitController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('units.view'), 403);

        if ($request->boolean('_reset')) {
            $request->session()->forget(['unitModal', 'unitModalUnitId', 'errors']);
        }

        $units = Unit::query()
            ->orderBy('name')
            ->get([
                'id',
                'code',
                'name',
                'sunat_code',
                'symbol',
                'allows_decimals',
                'is_active',
            ]);

        $unitsPayload = $units->map(fn (Unit $unit) => [
            'id' => $unit->id,
            'code' => $unit->code,
            'name' => $unit->name,
            'sunat_code' => $unit->sunat_code,
            'symbol' => $unit->symbol,
            'allows_decimals' => $unit->allows_decimals,
            'is_active' => $unit->is_active,
        ]);

        $activeCount = $units->where('is_active', true)->count();

        return Inertia::render('admin/catalogo/unidades/index', [
            'units' => $unitsPayload,
            'stats' => [
                ['key' => 'total', 'label' => 'Total', 'value' => $units->count(), 'tone' => 'violet'],
                ['key' => 'active', 'label' => 'Activas', 'value' => $activeCount, 'tone' => 'green'],
                ['key' => 'inactive', 'label' => 'Inactivas', 'value' => $units->count() - $activeCount, 'tone' => 'amber'],
                [
                    'key' => 'decimals',
                    'label' => 'Con decimales',
                    'value' => $units->where('allows_decimals', true)->count(),
                    'tone' => 'cyan',
                ],
            ],
            'unitModal' => session()->pull('unitModal'),
            'unitModalUnitId' => session()->pull('unitModalUnitId'),
            'oldForm' => $this->oldFormDefaults(),
        ]);
    }

    public function store(UnitRequest $request): RedirectResponse
    {
        Unit::create($request->validated());

        Toast::success('Unidad de medida creada correctamente.');

        return to_route('admin.catalogo.unidades.index');
    }

    public function update(UnitRequest $request, Unit $unidade): RedirectResponse
    {
        $unidade->update($request->validated());

        Toast::success('Unidad de medida actualizada.');

        return to_route('admin.catalogo.unidades.index');
    }

    public function destroy(Request $request, Unit $unidade): RedirectResponse
    {
        abort_unless($request->user()?->can('units.delete'), 403);

        $unidade->delete();

        Toast::success('Unidad de medida eliminada.');

        return to_route('admin.catalogo.unidades.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function oldFormDefaults(): array
    {
        return [
            'code' => old('code', ''),
            'name' => old('name', ''),
            'sunat_code' => old('sunat_code', ''),
            'symbol' => old('symbol', ''),
            'allows_decimals' => filter_var(old('allows_decimals', false), FILTER_VALIDATE_BOOLEAN),
            'is_active' => filter_var(old('is_active', true), FILTER_VALIDATE_BOOLEAN),
        ];
    }
}
