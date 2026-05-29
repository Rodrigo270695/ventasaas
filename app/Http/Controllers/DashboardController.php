<?php

namespace App\Http\Controllers;

use App\Models\Party;
use App\Models\Product;
use App\Models\SalesDocument;
use App\Models\SalesDocumentLine;
use App\Models\SalesQuotation;
use App\Models\StockBalance;
use App\Models\TreasuryPayment;
use App\Models\Warehouse;
use App\Support\VariantExpiryStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $today = Carbon::today();
        $period = (int) $request->integer('period', 30);
        if (! in_array($period, [7, 30, 90], true)) {
            $period = 30;
        }

        $warehouseId = $request->string('warehouse_id')->toString();
        $warehouseId = $warehouseId !== '' ? $warehouseId : null;

        $alertFilter = $request->string('alert_filter')->toString() ?: 'all';
        $allowedAlertFilters = ['all', 'low_stock', 'expiring', 'expired'];
        if (! in_array($alertFilter, $allowedAlertFilters, true)) {
            $alertFilter = 'all';
        }

        $startPeriod = $today->copy()->subDays($period - 1);
        $startPrevPeriod = $startPeriod->copy()->subDays($period);
        $endPrevPeriod = $startPeriod->copy()->subDay();
        $start7d = $today->copy()->subDays(6);

        $salesDocsBase = SalesDocument::query()
            ->where('status', SalesDocument::STATUS_CONFIRMED)
            ->when($warehouseId, fn ($query, $value) => $query->where('warehouse_id', $value));

        $collectionsBase = TreasuryPayment::query()
            ->where('direction', TreasuryPayment::DIRECTION_COLLECTION)
            ->when(
                $warehouseId,
                fn ($query, $value) => $query->whereHas(
                    'allocations.salesDocument',
                    fn ($doc) => $doc->where('warehouse_id', $value),
                ),
            );

        $salesToday = (float) (clone $salesDocsBase)
            ->whereDate('issue_date', $today)
            ->sum('total');

        $salesCurrentPeriod = (float) (clone $salesDocsBase)
            ->whereDate('issue_date', '>=', $startPeriod)
            ->whereDate('issue_date', '<=', $today)
            ->sum('total');

        $salesPrevPeriod = (float) (clone $salesDocsBase)
            ->whereDate('issue_date', '>=', $startPrevPeriod)
            ->whereDate('issue_date', '<=', $endPrevPeriod)
            ->sum('total');

        $documentsCurrentPeriod = (int) (clone $salesDocsBase)
            ->whereDate('issue_date', '>=', $startPeriod)
            ->whereDate('issue_date', '<=', $today)
            ->count();

        $avgTicket = $documentsCurrentPeriod > 0 ? round($salesCurrentPeriod / $documentsCurrentPeriod, 2) : 0.0;

        $salesVariation = $salesPrevPeriod > 0
            ? round((($salesCurrentPeriod - $salesPrevPeriod) / $salesPrevPeriod) * 100, 2)
            : ($salesCurrentPeriod > 0 ? 100.0 : 0.0);

        $collectionsToday = (float) (clone $collectionsBase)
            ->whereDate('created_at', $today)
            ->sum('amount');

        $collectionsCurrentPeriod = (float) (clone $collectionsBase)
            ->whereDate('created_at', '>=', $startPeriod)
            ->whereDate('created_at', '<=', $today)
            ->sum('amount');

        $collectionsPrevPeriod = (float) (clone $collectionsBase)
            ->whereDate('created_at', '>=', $startPrevPeriod)
            ->whereDate('created_at', '<=', $endPrevPeriod)
            ->sum('amount');

        $collectionsVariation = $collectionsPrevPeriod > 0
            ? round((($collectionsCurrentPeriod - $collectionsPrevPeriod) / $collectionsPrevPeriod) * 100, 2)
            : ($collectionsCurrentPeriod > 0 ? 100.0 : 0.0);

        $collectionsCountPeriod = (int) (clone $collectionsBase)
            ->whereDate('created_at', '>=', $startPeriod)
            ->whereDate('created_at', '<=', $today)
            ->count();

        $receivableBalance = (float) SalesDocument::query()
            ->where('status', SalesDocument::STATUS_CONFIRMED)
            ->whereIn('payment_status', [
                SalesDocument::PAYMENT_UNPAID,
                SalesDocument::PAYMENT_PARTIAL,
            ])
            ->when($warehouseId, fn ($query, $value) => $query->where('warehouse_id', $value))
            ->withSum('paymentAllocations as amount_paid', 'amount')
            ->get()
            ->sum(
                fn (SalesDocument $document) => max(
                    0,
                    round((float) $document->total - (float) ($document->amount_paid ?? 0), 4),
                ),
            );

        $ordersToday = (int) SalesQuotation::query()
            ->whereDate('issue_date', $today)
            ->count();

        $quotesCurrentPeriod = (int) SalesQuotation::query()
            ->whereDate('issue_date', '>=', $startPeriod)
            ->whereDate('issue_date', '<=', $today)
            ->count();

        $conversionRate = $quotesCurrentPeriod > 0
            ? round(($documentsCurrentPeriod / $quotesCurrentPeriod) * 100, 2)
            : 0.0;

        $activeProducts = (int) Product::query()
            ->where('is_active', true)
            ->count();

        $activeCustomers = (int) Party::query()
            ->where('is_active', true)
            ->whereIn('type', [Party::TYPE_CUSTOMER, Party::TYPE_BOTH])
            ->count();

        $salesTrendRaw = (clone $salesDocsBase)
            ->selectRaw('DATE(issue_date) as day, SUM(total) as amount')
            ->whereDate('issue_date', '>=', $start7d)
            ->whereDate('issue_date', '<=', $today)
            ->groupByRaw('DATE(issue_date)')
            ->pluck('amount', 'day');

        $salesTrend = collect(range(0, 6))->map(function (int $offset) use ($start7d, $salesTrendRaw) {
            $date = $start7d->copy()->addDays($offset);
            $key = $date->toDateString();

            return [
                'date' => $key,
                'label' => $date->translatedFormat('D'),
                'amount' => round((float) ($salesTrendRaw[$key] ?? 0), 2),
            ];
        })->values()->all();

        $collectionsTrendRaw = (clone $collectionsBase)
            ->selectRaw('DATE(created_at) as day, SUM(amount) as amount')
            ->whereDate('created_at', '>=', $start7d)
            ->whereDate('created_at', '<=', $today)
            ->groupByRaw('DATE(created_at)')
            ->pluck('amount', 'day');

        $collectionsTrend = collect(range(0, 6))->map(function (int $offset) use ($start7d, $collectionsTrendRaw) {
            $date = $start7d->copy()->addDays($offset);
            $key = $date->toDateString();

            return [
                'date' => $key,
                'label' => $date->translatedFormat('D'),
                'amount' => round((float) ($collectionsTrendRaw[$key] ?? 0), 2),
            ];
        })->values()->all();

        $categoryShare = SalesDocumentLine::query()
            ->selectRaw("COALESCE(product_categories.name, 'Sin categoría') as category, SUM(sales_document_lines.line_total) as amount")
            ->join('sales_documents', 'sales_documents.id', '=', 'sales_document_lines.sales_document_id')
            ->leftJoin('product_variants', 'product_variants.id', '=', 'sales_document_lines.product_variant_id')
            ->leftJoin('products', 'products.id', '=', 'product_variants.product_id')
            ->leftJoin('product_categories', 'product_categories.id', '=', 'products.category_id')
            ->where('sales_documents.status', SalesDocument::STATUS_CONFIRMED)
            ->whereDate('sales_documents.issue_date', '>=', $startPeriod)
            ->when($warehouseId, fn ($query, $value) => $query->where('sales_documents.warehouse_id', $value))
            ->groupBy('category')
            ->orderByDesc(DB::raw('SUM(sales_document_lines.line_total)'))
            ->limit(6)
            ->get()
            ->map(fn ($row) => [
                'category' => (string) $row->category,
                'amount' => round((float) $row->amount, 2),
            ])
            ->values()
            ->all();

        $topProducts = SalesDocumentLine::query()
            ->selectRaw("COALESCE(products.name, sales_document_lines.description, 'Ítem manual') as product_name, SUM(sales_document_lines.quantity) as qty")
            ->join('sales_documents', 'sales_documents.id', '=', 'sales_document_lines.sales_document_id')
            ->leftJoin('product_variants', 'product_variants.id', '=', 'sales_document_lines.product_variant_id')
            ->leftJoin('products', 'products.id', '=', 'product_variants.product_id')
            ->where('sales_documents.status', SalesDocument::STATUS_CONFIRMED)
            ->whereDate('sales_documents.issue_date', '>=', $startPeriod)
            ->when($warehouseId, fn ($query, $value) => $query->where('sales_documents.warehouse_id', $value))
            ->groupBy('product_name')
            ->orderByDesc(DB::raw('SUM(sales_document_lines.quantity)'))
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'name' => (string) $row->product_name,
                'qty' => round((float) $row->qty, 2),
            ])
            ->values()
            ->all();

        $monthlyPerformanceRaw = (clone $salesDocsBase)
            ->selectRaw("TO_CHAR(issue_date, 'YYYY-MM') as month_key, SUM(total) as amount")
            ->whereDate('issue_date', '>=', $today->copy()->subMonths(5)->startOfMonth())
            ->groupBy('month_key')
            ->orderBy('month_key')
            ->pluck('amount', 'month_key');

        $monthlyPerformance = collect(range(0, 5))->map(function (int $offset) use ($today, $monthlyPerformanceRaw) {
            $monthDate = $today->copy()->subMonths(5 - $offset)->startOfMonth();
            $key = $monthDate->format('Y-m');

            return [
                'month' => $monthDate->translatedFormat('M'),
                'amount' => round((float) ($monthlyPerformanceRaw[$key] ?? 0), 2),
            ];
        })->values()->all();

        $salesByDocumentType = (clone $salesDocsBase)
            ->selectRaw("CASE
                WHEN is_internal = true THEN 'Venta rápida'
                WHEN sunat_document_type_code = '01' THEN 'Factura'
                WHEN sunat_document_type_code = '03' THEN 'Boleta'
                ELSE 'Otro'
            END as doc_type, SUM(total) as amount")
            ->whereDate('issue_date', '>=', $startPeriod)
            ->whereDate('issue_date', '<=', $today)
            ->groupBy('doc_type')
            ->orderByDesc(DB::raw('SUM(total)'))
            ->get()
            ->map(fn ($row) => [
                'type' => (string) $row->doc_type,
                'amount' => round((float) $row->amount, 2),
            ])
            ->values()
            ->all();

        $lowStockAlerts = StockBalance::query()
            ->with(['variant:id,product_id,sku,label,minimum_stock', 'variant.product:id,name'])
            ->whereHas('variant', fn ($q) => $q->where('minimum_stock', '>', 0))
            ->whereRaw('quantity_on_hand <= (SELECT minimum_stock FROM product_variants WHERE product_variants.id = stock_balances.product_variant_id)')
            ->when($warehouseId, fn ($query, $value) => $query->where('warehouse_id', $value))
            ->orderBy('quantity_on_hand')
            ->limit(8)
            ->get()
            ->map(fn (StockBalance $balance) => [
                'variant_id' => $balance->product_variant_id,
                'sku' => $balance->variant?->sku,
                'product' => trim(($balance->variant?->product?->name ?? 'Producto').' '.($balance->variant?->label ? '· '.$balance->variant?->label : '')),
                'stock' => round((float) $balance->quantity_on_hand, 2),
                'minimum' => round((float) ($balance->variant?->minimum_stock ?? 0), 2),
                'level' => (float) $balance->quantity_on_hand <= 0 ? 'critical' : 'warning',
            ])
            ->values()
            ->all();

        $expiryAlertsRaw = StockBalance::query()
            ->with([
                'variant:id,product_id,sku,label,expires_at,expiry_alert_days',
                'variant.product:id,name,track_stock,type',
                'warehouse:id,name',
            ])
            ->where('quantity_on_hand', '>', 0)
            ->whereHas('variant', fn ($query) => $query->whereNotNull('expires_at'))
            ->whereHas('variant.product', fn ($query) => $query
                ->where('track_stock', true)
                ->where('type', Product::TYPE_GOOD))
            ->when($warehouseId, fn ($query, $value) => $query->where('warehouse_id', $value))
            ->get()
            ->filter(function (StockBalance $balance) use ($today) {
                $status = VariantExpiryStatus::evaluate(
                    $balance->variant?->expires_at,
                    $balance->variant?->expiry_alert_days,
                    $today,
                );

                return $status['level'] !== null;
            })
            ->sortBy(fn (StockBalance $balance) => $balance->variant?->expires_at)
            ->values();

        $mapExpiryAlert = function (StockBalance $balance) use ($today) {
            $status = VariantExpiryStatus::evaluate(
                $balance->variant?->expires_at,
                $balance->variant?->expiry_alert_days,
                $today,
            );

            return [
                'variant_id' => $balance->product_variant_id,
                'sku' => $balance->variant?->sku,
                'product' => trim(($balance->variant?->product?->name ?? 'Producto').' '.($balance->variant?->label ? '· '.$balance->variant?->label : '')),
                'warehouse' => $balance->warehouse?->name,
                'stock' => round((float) $balance->quantity_on_hand, 2),
                'expires_at' => VariantExpiryStatus::formatExpiresAt($balance->variant?->expires_at),
                'days_until_expiry' => $status['days_until_expiry'],
                'level' => $status['level'],
            ];
        };

        $expiringAlerts = $expiryAlertsRaw
            ->filter(fn (StockBalance $balance) => VariantExpiryStatus::evaluate(
                $balance->variant?->expires_at,
                $balance->variant?->expiry_alert_days,
                $today,
            )['level'] === 'warning')
            ->take(8)
            ->map($mapExpiryAlert)
            ->values()
            ->all();

        $expiredAlerts = $expiryAlertsRaw
            ->filter(fn (StockBalance $balance) => VariantExpiryStatus::evaluate(
                $balance->variant?->expires_at,
                $balance->variant?->expiry_alert_days,
                $today,
            )['level'] === 'critical')
            ->take(8)
            ->map($mapExpiryAlert)
            ->values()
            ->all();

        $warehouseOptions = Warehouse::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Warehouse $warehouse) => [
                'value' => $warehouse->id,
                'label' => $warehouse->name,
            ])
            ->values()
            ->all();

        return Inertia::render('dashboard', [
            'kpis' => [
                'sales_today' => $salesToday,
                'orders_today' => $ordersToday,
                'active_products' => $activeProducts,
                'active_customers' => $activeCustomers,
                'sales_period' => round($salesCurrentPeriod, 2),
                'sales_prev_period' => round($salesPrevPeriod, 2),
                'sales_variation' => $salesVariation,
                'avg_ticket' => $avgTicket,
                'documents_period' => $documentsCurrentPeriod,
                'quotes_period' => $quotesCurrentPeriod,
                'conversion_rate' => $conversionRate,
                'collections_today' => round($collectionsToday, 2),
                'collections_period' => round($collectionsCurrentPeriod, 2),
                'collections_prev_period' => round($collectionsPrevPeriod, 2),
                'collections_variation' => $collectionsVariation,
                'collections_count_period' => $collectionsCountPeriod,
                'receivable_balance' => round($receivableBalance, 2),
            ],
            'salesTrend' => $salesTrend,
            'collectionsTrend' => $collectionsTrend,
            'categoryShare' => $categoryShare,
            'topProducts' => $topProducts,
            'monthlyPerformance' => $monthlyPerformance,
            'salesByDocumentType' => $salesByDocumentType,
            'lowStockAlerts' => $lowStockAlerts,
            'expiringAlerts' => $expiringAlerts,
            'expiredAlerts' => $expiredAlerts,
            'inventoryAlertCounts' => [
                'low_stock' => count($lowStockAlerts),
                'expiring' => count($expiringAlerts),
                'expired' => count($expiredAlerts),
            ],
            'filters' => [
                'period' => $period,
                'warehouse_id' => $warehouseId,
                'alert_filter' => $alertFilter,
            ],
            'warehouseOptions' => $warehouseOptions,
        ]);
    }
}
