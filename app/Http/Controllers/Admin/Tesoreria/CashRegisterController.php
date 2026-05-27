<?php

namespace App\Http\Controllers\Admin\Tesoreria;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Tesoreria\TreasuryCashRegisterRequest;
use App\Models\TreasuryCashRegister;
use App\Models\TreasuryCashRegisterSession;
use App\Models\Warehouse;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CashRegisterController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('treasury.cash_registers.view'), 403);

        if ($request->boolean('_reset')) {
            $request->session()->forget(['cashRegisterModal', 'cashRegisterModalId', 'errors']);
        }

        $registers = TreasuryCashRegister::query()
            ->with(['warehouse:id,name,code', 'openSession:id,cash_register_id,opened_at,opened_by'])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $warehouseOptions = Warehouse::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code'])
            ->map(fn (Warehouse $warehouse) => [
                'value' => $warehouse->id,
                'label' => $warehouse->name,
                'sublabel' => $warehouse->code,
            ])
            ->all();

        return Inertia::render('admin/tesoreria/cajas/index', [
            'registers' => $registers->map(fn (TreasuryCashRegister $register) => $this->mapRow($register)),
            'warehouseOptions' => $warehouseOptions,
            'stats' => [
                ['key' => 'total', 'label' => 'Total', 'value' => $registers->count(), 'tone' => 'violet'],
                ['key' => 'active', 'label' => 'Activas', 'value' => $registers->where('is_active', true)->count(), 'tone' => 'green'],
                [
                    'key' => 'open',
                    'label' => 'Con sesión abierta',
                    'value' => $registers->filter(fn ($r) => $r->openSession !== null)->count(),
                    'tone' => 'cyan',
                ],
            ],
            'cashRegisterModal' => session()->pull('cashRegisterModal'),
            'cashRegisterModalId' => session()->pull('cashRegisterModalId'),
            'oldForm' => $this->oldFormDefaults(),
        ]);
    }

    public function store(TreasuryCashRegisterRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        TreasuryCashRegister::query()->create([
            'name' => $validated['name'],
            'warehouse_id' => $validated['warehouse_id'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
            'code' => TreasuryCashRegister::generateUniqueCodeFromName($validated['name']),
            'sort_order' => TreasuryCashRegister::nextSortOrder(),
        ]);

        Toast::success('Caja registrada.');

        return to_route('admin.tesoreria.cajas.index');
    }

    public function update(TreasuryCashRegisterRequest $request, TreasuryCashRegister $caja): RedirectResponse
    {
        $validated = $request->validated();

        $caja->update([
            'name' => $validated['name'],
            'warehouse_id' => $validated['warehouse_id'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        Toast::success('Caja actualizada.');

        return to_route('admin.tesoreria.cajas.index');
    }

    public function destroy(Request $request, TreasuryCashRegister $caja): RedirectResponse
    {
        abort_unless($request->user()?->can('treasury.cash_registers.delete'), 403);

        $hasOpenSession = TreasuryCashRegisterSession::query()
            ->where('cash_register_id', $caja->id)
            ->where('status', TreasuryCashRegisterSession::STATUS_OPEN)
            ->exists();

        if ($hasOpenSession) {
            Toast::error('Cierra la sesión abierta antes de eliminar la caja.');

            return to_route('admin.tesoreria.cajas.index');
        }

        $hasSessions = TreasuryCashRegisterSession::query()
            ->where('cash_register_id', $caja->id)
            ->exists();

        if ($hasSessions) {
            Toast::error('No se puede eliminar: la caja tiene historial de sesiones.');

            return to_route('admin.tesoreria.cajas.index');
        }

        $caja->delete();

        Toast::success('Caja eliminada.');

        return to_route('admin.tesoreria.cajas.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function mapRow(TreasuryCashRegister $register): array
    {
        $open = $register->openSession;

        return [
            'id' => $register->id,
            'code' => $register->code,
            'name' => $register->name,
            'warehouse_id' => $register->warehouse_id,
            'warehouse_name' => $register->warehouse?->name,
            'is_active' => $register->is_active,
            'sort_order' => $register->sort_order,
            'has_open_session' => $open !== null,
            'open_session_id' => $open?->id,
            'open_session_opened_at_label' => $open?->opened_at?->format('d/m/Y H:i'),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function oldFormDefaults(): array
    {
        return [
            'name' => old('name', ''),
            'warehouse_id' => old('warehouse_id', ''),
            'is_active' => filter_var(old('is_active', true), FILTER_VALIDATE_BOOLEAN),
        ];
    }
}
