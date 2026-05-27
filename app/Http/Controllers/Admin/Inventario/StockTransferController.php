<?php

namespace App\Http\Controllers\Admin\Inventario;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Inventario\StockTransferRequest;
use App\Models\ProductVariant;
use App\Models\Warehouse;
use App\Services\Inventory\StockMovementService;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use InvalidArgumentException;

class StockTransferController extends Controller
{
    public function __construct(
        private readonly StockMovementService $stockMovementService,
    ) {}

    public function store(StockTransferRequest $request): RedirectResponse
    {
        $data = $request->validated();

        try {
            $from = Warehouse::query()->findOrFail($data['from_warehouse_id']);
            $to = Warehouse::query()->findOrFail($data['to_warehouse_id']);
            $variant = ProductVariant::query()->findOrFail($data['product_variant_id']);

            $this->stockMovementService->transferBetweenWarehouses(
                $from,
                $to,
                $variant,
                (string) $data['quantity'],
                $data['notes'] ?? null,
                $request->user()?->id,
            );
        } catch (InvalidArgumentException $exception) {
            Toast::error($exception->getMessage());

            return back()->withInput();
        }

        Toast::success(
            "Traslado registrado: {$data['quantity']} u. de {$from->code} → {$to->code}.",
        );

        return to_route('admin.inventario.saldos.index', [
            'warehouse_id' => $data['to_warehouse_id'],
        ]);
    }
}
