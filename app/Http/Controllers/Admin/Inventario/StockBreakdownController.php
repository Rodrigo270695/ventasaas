<?php

namespace App\Http\Controllers\Admin\Inventario;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Inventario\StockBreakdownRequest;
use App\Models\ProductVariant;
use App\Models\Warehouse;
use App\Services\Inventory\StockMovementService;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use InvalidArgumentException;

class StockBreakdownController extends Controller
{
    public function __construct(
        private readonly StockMovementService $stockMovementService,
    ) {}

    public function store(StockBreakdownRequest $request): RedirectResponse
    {
        $data = $request->validated();

        try {
            $warehouse = Warehouse::query()->findOrFail($data['warehouse_id']);
            $fromVariant = ProductVariant::query()->findOrFail($data['from_variant_id']);
            $toVariant = ProductVariant::query()->findOrFail($data['to_variant_id']);

            $this->stockMovementService->breakdownPackaging(
                $warehouse,
                $fromVariant,
                $toVariant,
                (string) $data['quantity_from'],
                (string) $data['quantity_to'],
                $data['notes'] ?? null,
                $request->user()?->id,
            );
        } catch (InvalidArgumentException $exception) {
            Toast::error($exception->getMessage());

            return back()->withInput();
        }

        Toast::success('Desglose de empaque registrado correctamente.');

        return to_route('admin.inventario.saldos.index', [
            'warehouse_id' => $data['warehouse_id'],
        ]);
    }
}
