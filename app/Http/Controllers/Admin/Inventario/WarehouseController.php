<?php

namespace App\Http\Controllers\Admin\Inventario;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Inventario\WarehouseRequest;
use App\Models\StockBalance;
use App\Models\Warehouse;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class WarehouseController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('warehouses.view'), 403);

        if ($request->boolean('_reset')) {
            $request->session()->forget(['warehouseModal', 'warehouseModalId', 'errors']);
        }

        $warehouses = Warehouse::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get([
                'id',
                'code',
                'name',
                'is_default',
                'is_saleable',
                'is_active',
                'sort_order',
            ]);

        $warehousesPayload = $warehouses->map(fn (Warehouse $warehouse) => [
            'id' => $warehouse->id,
            'code' => $warehouse->code,
            'name' => $warehouse->name,
            'is_default' => $warehouse->is_default,
            'is_saleable' => $warehouse->is_saleable,
            'is_active' => $warehouse->is_active,
            'sort_order' => $warehouse->sort_order,
        ]);

        $activeCount = $warehouses->where('is_active', true)->count();

        return Inertia::render('admin/inventario/almacenes/index', [
            'warehouses' => $warehousesPayload,
            'stats' => [
                ['key' => 'total', 'label' => 'Total', 'value' => $warehouses->count(), 'tone' => 'violet'],
                ['key' => 'active', 'label' => 'Activos', 'value' => $activeCount, 'tone' => 'green'],
                ['key' => 'inactive', 'label' => 'Inactivos', 'value' => $warehouses->count() - $activeCount, 'tone' => 'amber'],
                [
                    'key' => 'saleable',
                    'label' => 'Para ventas',
                    'value' => $warehouses->where('is_saleable', true)->count(),
                    'tone' => 'cyan',
                ],
            ],
            'warehouseModal' => session()->pull('warehouseModal'),
            'warehouseModalId' => session()->pull('warehouseModalId'),
            'oldForm' => $this->oldFormDefaults(),
        ]);
    }

    public function store(WarehouseRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data): void {
            $warehouse = Warehouse::create($data);

            if ($warehouse->is_default) {
                $this->clearOtherDefaults($warehouse->id);
            }
        });

        Toast::success('Almacén creado correctamente.');

        return to_route('admin.inventario.almacenes.index');
    }

    public function update(WarehouseRequest $request, Warehouse $almacen): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($almacen, $data): void {
            $almacen->update($data);

            if ($almacen->is_default) {
                $this->clearOtherDefaults($almacen->id);
            }
        });

        Toast::success('Almacén actualizado.');

        return to_route('admin.inventario.almacenes.index');
    }

    public function destroy(Request $request, Warehouse $almacen): RedirectResponse
    {
        abort_unless($request->user()?->can('warehouses.delete'), 403);

        if ($almacen->is_default) {
            Toast::error('No puedes eliminar el almacén por defecto.');

            return to_route('admin.inventario.almacenes.index');
        }

        $hasStock = StockBalance::query()
            ->where('warehouse_id', $almacen->id)
            ->where('quantity_on_hand', '>', 0)
            ->exists();

        if ($hasStock) {
            Toast::error('El almacén tiene stock. Ajusta los saldos antes de eliminarlo.');

            return to_route('admin.inventario.almacenes.index');
        }

        $almacen->delete();

        Toast::success('Almacén eliminado.');

        return to_route('admin.inventario.almacenes.index');
    }

    private function clearOtherDefaults(string $exceptId): void
    {
        Warehouse::query()
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
            'is_default' => filter_var(old('is_default', false), FILTER_VALIDATE_BOOLEAN),
            'is_saleable' => filter_var(old('is_saleable', true), FILTER_VALIDATE_BOOLEAN),
            'is_active' => filter_var(old('is_active', true), FILTER_VALIDATE_BOOLEAN),
            'sort_order' => (int) old('sort_order', 0),
        ];
    }
}
