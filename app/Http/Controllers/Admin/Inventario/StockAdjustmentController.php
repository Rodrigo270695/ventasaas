<?php

namespace App\Http\Controllers\Admin\Inventario;

use App\Http\Controllers\Admin\Catalogo\Concerns\RedirectsToProductCatalog;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Inventario\StockAdjustmentRequest;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Warehouse;
use App\Services\Catalog\ProductPriceFromCostService;
use App\Services\Inventory\StockMovementService;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use InvalidArgumentException;

class StockAdjustmentController extends Controller
{
    use RedirectsToProductCatalog;

    public function __construct(
        private readonly StockMovementService $stockMovementService,
        private readonly ProductPriceFromCostService $productPriceFromCostService,
    ) {}

    public function store(StockAdjustmentRequest $request): RedirectResponse
    {
        $data = $request->validated();

        try {
            $warehouse = Warehouse::query()->findOrFail($data['warehouse_id']);
            $variant = ProductVariant::query()->findOrFail($data['product_variant_id']);

            $this->stockMovementService->setQuantityOnHand(
                $warehouse,
                $variant,
                (string) $data['quantity_on_hand'],
                isset($data['unit_cost']) ? (string) $data['unit_cost'] : null,
                $data['notes'] ?? null,
                $request->user()?->id,
            );
        } catch (InvalidArgumentException $exception) {
            Toast::error($exception->getMessage());

            return back()->withInput();
        }

        $priceListsUpdated = $this->maybeSyncSalePrices($request, $variant);

        if ($priceListsUpdated !== []) {
            Toast::success(
                'Stock actualizado. Precios de venta actualizados: '
                .implode(', ', $priceListsUpdated).'.',
            );
        } else {
            Toast::success('Stock actualizado correctamente.');
        }

        return to_route('admin.inventario.saldos.index', [
            'warehouse_id' => $data['warehouse_id'],
        ]);
    }

    public function storeForProduct(
        StockAdjustmentRequest $request,
        Product $producto,
    ): RedirectResponse {
        abort_unless($producto->exists, 404);

        $data = $request->validated();

        try {
            $warehouse = Warehouse::query()->findOrFail($data['warehouse_id']);
            $variant = ProductVariant::query()
                ->where('product_id', $producto->id)
                ->findOrFail($data['product_variant_id']);

            $this->stockMovementService->setQuantityOnHand(
                $warehouse,
                $variant,
                (string) $data['quantity_on_hand'],
                isset($data['unit_cost']) ? (string) $data['unit_cost'] : null,
                $data['notes'] ?? null,
                $request->user()?->id,
            );
        } catch (InvalidArgumentException $exception) {
            Toast::error($exception->getMessage());

            return $this->redirectToProductShow($producto, 'stock');
        }

        $priceListsUpdated = $this->maybeSyncSalePrices($request, $variant);

        if ($priceListsUpdated !== []) {
            Toast::success(
                'Stock actualizado. Precios de venta actualizados: '
                .implode(', ', $priceListsUpdated).'.',
            );
        } else {
            Toast::success('Stock actualizado.');
        }

        return $this->redirectToProductShow($producto, 'stock');
    }

    /**
     * @return list<string>
     */
    private function maybeSyncSalePrices(
        StockAdjustmentRequest $request,
        ProductVariant $variant,
    ): array {
        if (! $request->boolean('sync_sale_prices')) {
            return [];
        }

        $unitCost = $request->input('unit_cost');

        if ($unitCost === null || $unitCost === '') {
            throw new InvalidArgumentException(
                'Indica el costo unitario para recalcular los precios de venta.',
            );
        }

        $user = $request->user();

        if (! $user?->can('products.update') && ! $user?->can('price_lists.update')) {
            throw new InvalidArgumentException(
                'No tienes permiso para actualizar precios de venta.',
            );
        }

        return $this->productPriceFromCostService->syncFromCost(
            $variant,
            (string) $unitCost,
            $request->input('price_list_ids', []),
            (string) $request->input('markup_type'),
            (string) $request->input('markup_value'),
        );
    }
}
