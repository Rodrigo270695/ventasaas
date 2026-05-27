<?php

namespace App\Http\Controllers;

use App\Models\Party;
use App\Models\Product;
use App\Models\SalesDocument;
use App\Models\SalesDocumentLine;
use App\Models\SalesQuotation;
use App\Models\StockBalance;
use App\Models\Warehouse;
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

        $startPeriod = $today->copy()->subDays($period - 1);
        $startPrevPeriod = $startPeriod->copy()->subDays($period);
        $endPrevPeriod = $startPeriod->copy()->subDay();
        $start7d = $today->copy()->subDays(6);

        $salesDocsBase = SalesDocument::query()
            ->where('status', SalesDocument::STATUS_CONFIRMED)
            ->where('is_internal', false)
            ->when($warehouseId, fn ($query, $value) => $query->where('warehouse_id', $value));

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

        $categoryShare = SalesDocumentLine::query()
            ->selectRaw("COALESCE(product_categories.name, 'Sin categoría') as category, SUM(sales_document_lines.line_total) as amount")
            ->join('sales_documents', 'sales_documents.id', '=', 'sales_document_lines.sales_document_id')
            ->leftJoin('product_variants', 'product_variants.id', '=', 'sales_document_lines.product_variant_id')
            ->leftJoin('products', 'products.id', '=', 'product_variants.product_id')
            ->leftJoin('product_categories', 'product_categories.id', '=', 'products.category_id')
            ->where('sales_documents.status', SalesDocument::STATUS_CONFIRMED)
            ->where('sales_documents.is_internal', false)
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
            ->where('sales_documents.is_internal', false)
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
            ],
            'salesTrend' => $salesTrend,
            'categoryShare' => $categoryShare,
            'topProducts' => $topProducts,
            'monthlyPerformance' => $monthlyPerformance,
            'salesByDocumentType' => $salesByDocumentType,
            'lowStockAlerts' => $lowStockAlerts,
            'filters' => [
                'period' => $period,
                'warehouse_id' => $warehouseId,
            ],
            'warehouseOptions' => $warehouseOptions,
        ]);
    }
}

