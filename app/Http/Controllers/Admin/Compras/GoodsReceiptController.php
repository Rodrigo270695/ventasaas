<?php

namespace App\Http\Controllers\Admin\Compras;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Compras\IndexPurchaseOrdersRequest;
use App\Http\Requests\Admin\Compras\StoreGoodsReceiptRequest;
use App\Models\GoodsReceipt;
use App\Models\PurchaseOrder;
use App\Services\Compras\GoodsReceiptService;
use App\Support\Catalog\VariantCatalogOptions;
use App\Support\Compras\PurchaseDisplayFormat;
use App\Support\Datetime\PeruDateTime;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class GoodsReceiptController extends Controller
{
    public function __construct(
        private readonly GoodsReceiptService $receipts,
    ) {}

    public function index(IndexPurchaseOrdersRequest $request): Response
    {
        $search = trim((string) $request->validated('search', ''));
        $from = $request->validated('from');
        $to = $request->validated('to');

        $query = GoodsReceipt::query()
            ->with([
                'purchaseOrder:id,internal_number,supplier_party_id',
                'purchaseOrder.supplier:id,legal_name',
                'warehouse:id,name',
                'purchaseDocument:id,goods_receipt_id',
            ])
            ->orderByDesc('received_date')
            ->orderByDesc('created_at');

        if ($from) {
            $query->whereDate('received_date', '>=', $from);
        }

        if ($to) {
            $query->whereDate('received_date', '<=', $to);
        }

        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder->where('internal_number', 'like', "%{$search}%")
                    ->orWhereHas('purchaseOrder', function ($order) use ($search) {
                        $order->where('internal_number', 'like', "%{$search}%");
                    });
            });
        }

        $receipts = $query->limit(200)->get();

        return Inertia::render('admin/compras/recepciones/index', [
            'receipts' => $receipts->map(fn (GoodsReceipt $receipt) => [
                'id' => $receipt->id,
                'internal_number' => $receipt->internal_number,
                'received_date' => PeruDateTime::toInputValue($receipt->received_date),
                'received_date_label' => PeruDateTime::label($receipt->received_date),
                'purchase_order_id' => $receipt->purchase_order_id,
                'purchase_order_number' => $receipt->purchaseOrder?->internal_number,
                'supplier_name' => $receipt->purchaseOrder?->supplier?->legal_name ?? '—',
                'warehouse_name' => $receipt->warehouse?->name ?? '—',
                'has_invoice' => (bool) $receipt->purchaseDocument,
                'invoice_create_url' => $receipt->purchaseDocument
                    ? null
                    : route('admin.compras.facturas.create', ['recepcion' => $receipt->id]),
            ]),
            'filters' => [
                'search' => $search,
                'from' => $from,
                'to' => $to,
            ],
            'stats' => [
                ['key' => 'count', 'label' => 'Recepciones', 'value' => $receipts->count(), 'tone' => 'violet'],
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        abort_unless($request->user()?->can('purchases.manage'), 403);

        $orderId = $request->query('orden');
        $order = null;
        $openLines = [];

        if ($orderId) {
            $order = PurchaseOrder::query()
                ->with(['lines.variant.product', 'supplier'])
                ->find($orderId);

            if ($order && $order->canReceive()) {
                $openLines = $order->lines
                    ->filter(fn ($line) => bccomp($line->quantityPending(), '0', 4) === 1)
                    ->values()
                    ->map(fn ($line) => [
                        'purchase_order_line_id' => $line->id,
                        'product_variant_id' => $line->product_variant_id,
                        'description' => $line->description,
                        'variant_sku' => $line->variant?->sku,
                        'product_name' => $line->variant?->product?->name,
                        'quantity_ordered' => PurchaseDisplayFormat::decimal($line->quantity_ordered),
                        'quantity_received' => PurchaseDisplayFormat::decimal($line->quantity_received),
                        'quantity_pending' => PurchaseDisplayFormat::decimal($line->quantityPending()),
                        'unit_cost' => PurchaseDisplayFormat::decimal($line->unit_cost),
                        'quantity' => PurchaseDisplayFormat::decimal($line->quantityPending()),
                    ])
                    ->all();
            }
        }

        $openOrders = PurchaseOrder::query()
            ->with('supplier:id,legal_name')
            ->whereIn('status', [
                PurchaseOrder::STATUS_APPROVED,
                PurchaseOrder::STATUS_PARTIALLY_RECEIVED,
            ])
            ->orderByDesc('order_date')
            ->limit(100)
            ->get()
            ->map(fn (PurchaseOrder $o) => [
                'value' => $o->id,
                'label' => $o->internal_number.' · '.$o->supplier?->legal_name,
            ])
            ->all();

        return Inertia::render('admin/compras/recepciones/form', [
            'purchaseOrderId' => $order?->id ?? '',
            'purchaseOrderNumber' => $order?->internal_number,
            'supplierName' => $order?->supplier?->legal_name,
            'openOrders' => $openOrders,
            'openLines' => $openLines,
            'warehouseOptions' => VariantCatalogOptions::warehouseOptions(),
            'defaultWarehouseId' => VariantCatalogOptions::defaultWarehouseId(),
            'receivedDate' => PeruDateTime::toInputValue(PeruDateTime::now()),
        ]);
    }

    public function store(StoreGoodsReceiptRequest $request): RedirectResponse
    {
        try {
            $receipt = $this->receipts->create([
                ...$request->validated(),
                'created_by' => $request->user()?->id,
            ]);
        } catch (InvalidArgumentException $exception) {
            Toast::error($exception->getMessage());

            return back()->withInput();
        }

        Toast::success('Recepción registrada. Completa la factura del proveedor cuando la tengas.');

        return redirect()->route('admin.compras.facturas.create', [
            'recepcion' => $receipt->id,
        ]);
    }
}
