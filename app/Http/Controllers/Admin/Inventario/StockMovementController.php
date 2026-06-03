<?php

namespace App\Http\Controllers\Admin\Inventario;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\StockMovementLine;
use App\Models\Warehouse;
use App\Services\Inventory\StockKardexService;
use App\Support\Datetime\PeruDateTime;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StockMovementController extends Controller
{
    public function __construct(
        private readonly StockKardexService $kardex,
    ) {}

    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('stock_movements.view'), 403);

        $warehouses = Warehouse::query()
            ->where('is_active', true)
            ->orderByDesc('is_default')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'is_default']);

        $warehouseId = $request->string('warehouse_id')->toString() ?: null;

        if (! $warehouseId && $warehouses->isNotEmpty()) {
            $warehouseId = $warehouses->firstWhere('is_default', true)?->id
                ?? $warehouses->first()->id;
        }

        $variantId = $request->string('product_variant_id')->toString() ?: null;
        $movementType = $request->string('movement_type')->toString() ?: null;
        $dateFrom = $this->kardex->parseDateFilter($request->string('date_from')->toString() ?: null);
        $dateTo = $this->kardex->parseDateFilter($request->string('date_to')->toString() ?: null);

        $filters = [
            'warehouse_id' => $warehouseId,
            'product_variant_id' => $variantId,
            'movement_type' => $movementType ?: null,
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
        ];

        $lines = $this->kardex->linesQuery($filters);
        $summary = $this->kardex->summarize($lines);

        $balanceMap = ($warehouseId && $variantId)
            ? $this->kardex->balancesAfter($warehouseId, $variantId)
            : [];

        $rows = $lines->map(fn (StockMovementLine $line) => $this->mapLine(
            $line,
            $balanceMap[$line->id] ?? null,
        ));

        $variantOptions = $this->variantOptions();

        return Inertia::render('admin/inventario/movimientos/index', [
            'movements' => $rows,
            'filters' => [
                'warehouse_id' => $warehouseId,
                'product_variant_id' => $variantId,
                'movement_type' => $movementType ?: null,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'warehouseOptions' => $warehouses->map(fn (Warehouse $w) => [
                'value' => $w->id,
                'label' => $w->is_default
                    ? "{$w->name} ({$w->code}) · Principal"
                    : "{$w->name} ({$w->code})",
            ])->values()->all(),
            'variantOptions' => $variantOptions,
            'movementTypeOptions' => $this->movementTypeOptions(),
            'showBalanceColumn' => $warehouseId !== null && $variantId !== null,
            'stats' => [
                ['key' => 'total', 'label' => 'Movimientos', 'value' => $summary['total_lines'], 'tone' => 'violet'],
                ['key' => 'entries', 'label' => 'Ingresos', 'value' => $summary['entries'], 'tone' => 'green'],
                ['key' => 'exits', 'label' => 'Salidas', 'value' => $summary['exits'], 'tone' => 'amber'],
                [
                    'key' => 'inbound',
                    'label' => 'Cant. ingresada',
                    'value' => $this->formatQtyDisplay($summary['inbound_qty']),
                    'tone' => 'cyan',
                ],
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function mapLine(StockMovementLine $line, ?string $balanceAfter): array
    {
        $movement = $line->movement;
        $qty = (string) $line->quantity;

        return [
            'id' => $line->id,
            'movement_id' => $line->stock_movement_id,
            'movement_date' => $movement?->movement_date
                ? PeruDateTime::parse($movement->movement_date)->toIso8601String()
                : null,
            'movement_date_sort' => $movement?->movement_date?->timestamp ?? 0,
            'movement_date_label' => PeruDateTime::label($movement?->movement_date),
            'document_number' => $movement?->document_number,
            'movement_type' => $movement?->movement_type,
            'movement_type_label' => $this->movementTypeLabel($movement?->movement_type),
            'warehouse_code' => $movement?->warehouse?->code,
            'warehouse_name' => $movement?->warehouse?->name,
            'product_name' => $line->variant?->product?->name,
            'variant_sku' => $line->variant?->sku,
            'variant_label' => $line->variant?->label,
            'quantity' => $this->formatQtyStorage($qty),
            'quantity_label' => $this->formatSignedQty($qty),
            'is_inbound' => bccomp($qty, '0', 4) === 1,
            'unit_cost' => (string) $line->unit_cost,
            'total_cost' => (string) $line->total_cost,
            'balance_after' => $balanceAfter !== null
                ? $this->formatQtyStorage($balanceAfter)
                : null,
            'created_by_name' => $movement?->creator?->name,
            'notes' => $movement?->notes,
        ];
    }

    /**
     * @return list<array{value: string, label: string, searchText?: string, sublabel?: string}>
     */
    private function variantOptions(): array
    {
        return Product::query()
            ->where('track_stock', true)
            ->where('type', Product::TYPE_GOOD)
            ->with(['variants' => fn ($query) => $query
                ->where('is_active', true)
                ->orderByDesc('is_default')
                ->orderBy('sku')
                ->select(['id', 'product_id', 'sku', 'label', 'is_default']),
            ])
            ->orderBy('name')
            ->get(['id', 'name'])
            ->flatMap(function (Product $product) {
                return $product->variants->map(function ($variant) use ($product) {
                    return [
                        'value' => $variant->id,
                        'label' => trim($product->name.' · '.($variant->label ?: $variant->sku)),
                        'sublabel' => $variant->sku,
                        'searchText' => strtolower(implode(' ', array_filter([
                            $product->name,
                            $variant->sku,
                            $variant->label,
                        ]))),
                    ];
                });
            })
            ->values()
            ->all();
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    private function movementTypeOptions(): array
    {
        return [
            ['value' => '', 'label' => 'Todos los tipos'],
            ['value' => StockMovement::TYPE_OPENING, 'label' => 'Inventario inicial'],
            ['value' => StockMovement::TYPE_ADJUSTMENT, 'label' => 'Ajuste de stock'],
            ['value' => StockMovement::TYPE_PURCHASE_IN, 'label' => 'Ingreso por compra'],
            ['value' => StockMovement::TYPE_SALE_OUT, 'label' => 'Salida por venta'],
            ['value' => StockMovement::TYPE_TRANSFER_OUT, 'label' => 'Traslado (salida)'],
            ['value' => StockMovement::TYPE_TRANSFER_IN, 'label' => 'Traslado (ingreso)'],
            ['value' => StockMovement::TYPE_BREAKDOWN, 'label' => 'Desglose de empaque'],
        ];
    }

    private function movementTypeLabel(?string $type): string
    {
        return match ($type) {
            StockMovement::TYPE_OPENING => 'Inventario inicial',
            StockMovement::TYPE_ADJUSTMENT => 'Ajuste',
            StockMovement::TYPE_PURCHASE_IN => 'Compra',
            StockMovement::TYPE_SALE_OUT => 'Venta',
            StockMovement::TYPE_TRANSFER_OUT => 'Traslado salida',
            StockMovement::TYPE_TRANSFER_IN => 'Traslado ingreso',
            StockMovement::TYPE_BREAKDOWN => 'Desglose',
            StockMovement::TYPE_COST_UPDATE => 'Registro de costo',
            default => $type ?? '—',
        };
    }

    private function formatSignedQty(string $qty): string
    {
        if (bccomp($qty, '0', 4) === 1) {
            return '+'.rtrim(rtrim($qty, '0'), '.');
        }

        if (bccomp($qty, '0', 4) === -1) {
            return rtrim(rtrim($qty, '0'), '.');
        }

        return '0';
    }

    private function formatQtyDisplay(string $qty): string
    {
        return rtrim(rtrim($qty, '0'), '.') ?: '0';
    }

    private function formatQtyStorage(string $qty): string
    {
        return number_format((float) $qty, 4, '.', '');
    }
}
