<?php

namespace App\Http\Controllers\Admin\Compras;

use App\Http\Controllers\Admin\Tesoreria\CashRegisterSessionController;
use App\Http\Controllers\Admin\Tesoreria\CollectionPaymentController;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Compras\IndexPurchaseDocumentsRequest;
use App\Http\Requests\Admin\Compras\PurchaseDocumentRequest;
use App\Models\Party;
use App\Models\GoodsReceipt;
use App\Models\PurchaseDocument;
use App\Services\Compras\PurchaseDocumentService;
use App\Services\Treasury\PaymentDisbursementService;
use App\Support\Catalog\VariantCatalogOptions;
use App\Support\Compras\PurchaseDisplayFormat;
use App\Support\Datetime\PeruDateTime;
use App\Support\Toast;
use App\Support\Treasury\PaymentHistoryPresenter;
use App\Support\Treasury\TreasuryAuthorization;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PurchaseDocumentController extends Controller
{
    public function __construct(
        private readonly PurchaseDocumentService $purchases,
        private readonly PaymentDisbursementService $disbursements,
    ) {}

    public function index(IndexPurchaseDocumentsRequest $request): Response
    {
        $paymentStatus = $request->validated('payment_status');
        $search = trim((string) $request->validated('search', ''));
        [$from, $to] = $this->resolveDateFilters($request);

        $query = PurchaseDocument::query()
            ->withSum('paymentAllocations as amount_paid', 'amount')
            ->with(['supplier:id,legal_name,document_type,document_number'])
            ->withCount('lines')
            ->orderByDesc('issue_date')
            ->orderByDesc('created_at');

        if ($paymentStatus) {
            $query->where('payment_status', $paymentStatus);
        }

        $query->whereDate('issue_date', '>=', $from);
        $query->whereDate('issue_date', '<=', $to);

        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder->where('internal_number', 'like', "%{$search}%")
                    ->orWhere('supplier_document_number', 'like', "%{$search}%")
                    ->orWhereHas('supplier', function ($supplier) use ($search) {
                        $supplier->where('legal_name', 'like', "%{$search}%")
                            ->orWhere('document_number', 'like', "%{$search}%");
                    });
            });
        }

        $documents = $query->get();
        $payload = $documents->map(fn (PurchaseDocument $doc) => $this->mapListRow($doc));
        $canRecordPayment = TreasuryAuthorization::canCreateDisbursements($request->user());

        $pendingReceipts = GoodsReceipt::query()
            ->with([
                'purchaseOrder:id,internal_number,supplier_party_id',
                'purchaseOrder.supplier:id,legal_name',
            ])
            ->withCount('lines')
            ->whereDoesntHave('purchaseDocument')
            ->orderByDesc('received_date')
            ->limit(15)
            ->get()
            ->map(fn (GoodsReceipt $receipt) => [
                'id' => $receipt->id,
                'internal_number' => $receipt->internal_number,
                'received_date_label' => PeruDateTime::label($receipt->received_date),
                'purchase_order_number' => $receipt->purchaseOrder?->internal_number,
                'supplier_name' => $receipt->purchaseOrder?->supplier?->legal_name ?? '—',
                'lines_count' => $receipt->lines_count ?? 0,
                'create_invoice_url' => route('admin.compras.facturas.create', [
                    'recepcion' => $receipt->id,
                ]),
            ]);

        return Inertia::render('admin/compras/facturas/index', [
            'documents' => $payload,
            'pendingReceipts' => $pendingReceipts,
            'paymentMethods' => $canRecordPayment
                ? CollectionPaymentController::activePaymentMethodsPayload()
                : [],
            'canRecordPayment' => $canRecordPayment,
            'canUpdatePayment' => TreasuryAuthorization::canUpdateDisbursements($request->user()),
            'openCashSession' => CashRegisterSessionController::openSessionPayloadForUser($request->user()),
            'filters' => [
                'payment_status' => $paymentStatus,
                'search' => $search,
                'from' => $from,
                'to' => $to,
            ],
            'stats' => [
                ['key' => 'total', 'label' => 'Total', 'value' => $documents->count(), 'tone' => 'violet'],
                [
                    'key' => 'unpaid',
                    'label' => 'Pendientes de pago',
                    'value' => $documents->where('payment_status', PurchaseDocument::PAYMENT_UNPAID)->count(),
                    'tone' => 'amber',
                ],
                [
                    'key' => 'total_amount',
                    'label' => 'Monto registrado',
                    'value' => number_format((float) $documents->sum('total'), 2, '.', ','),
                    'tone' => 'cyan',
                ],
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        abort_unless($request->user()?->can('purchases.manage'), 403);

        $receiptId = $request->query('recepcion');
        $prefill = null;

        if ($receiptId) {
            $receipt = GoodsReceipt::query()
                ->with(['lines.variant.product', 'purchaseOrder.supplier', 'warehouse', 'purchaseDocument'])
                ->find($receiptId);

            if ($receipt && ! $receipt->purchaseDocument) {
                $order = $receipt->purchaseOrder;
                $prefill = [
                    'goods_receipt_id' => $receipt->id,
                    'purchase_order_id' => $order?->id,
                    'supplier_party_id' => $order?->supplier_party_id,
                    'warehouse_id' => $receipt->warehouse_id,
                    'issue_date' => PeruDateTime::toInputValue(PeruDateTime::now()),
                    'currency_code' => $order?->currency_code ?? 'PEN',
                    'exchange_rate' => (string) ($order?->exchange_rate ?? 1),
                    'notes' => "Factura por recepción {$receipt->internal_number}",
                    'lines' => $receipt->lines->map(fn ($line) => [
                        'goods_receipt_line_id' => $line->id,
                        'product_variant_id' => $line->product_variant_id,
                        'quantity' => PurchaseDisplayFormat::decimal($line->quantity),
                        'unit_cost' => PurchaseDisplayFormat::decimal($line->unit_cost),
                        'description' => $line->description ?? $line->variant?->product?->name,
                        'variant_sku' => $line->variant?->sku,
                        'product_name' => $line->variant?->product?->name,
                    ])->values()->all(),
                    'receipt_number' => $receipt->internal_number,
                    'order_number' => $order?->internal_number,
                    'stock_from_receipt' => true,
                ];
            }
        }

        return Inertia::render('admin/compras/facturas/form', [
            ...$this->formPayload(null),
            'prefillFromReceipt' => $prefill,
        ]);
    }

    public function store(PurchaseDocumentRequest $request): RedirectResponse
    {
        try {
            $this->purchases->createConfirmed([
                ...$request->validated(),
                'created_by' => $request->user()?->id,
            ], $request->file('invoice_file'));
        } catch (\InvalidArgumentException $exception) {
            Toast::error($exception->getMessage());

            return back()->withInput();
        }

        $message = $request->filled('goods_receipt_id')
            ? 'Factura registrada. El stock ya ingresó con la recepción; saldo en cuentas por pagar.'
            : 'Compra registrada: productos en inventario y saldo en cuentas por pagar.';

        Toast::success($message);

        if ($request->filled('goods_receipt_id')) {
            return redirect()->route('admin.tesoreria.cuentas-por-pagar.index');
        }

        return redirect()->route('admin.compras.facturas.index');
    }

    public function edit(Request $request, PurchaseDocument $factura): Response
    {
        abort_unless($request->user()?->can('purchases.view'), 403);

        $factura->load(['supplier', 'lines.variant.product', 'warehouse']);
        $factura->loadSum('paymentAllocations as amount_paid', 'amount');

        $paid = (float) ($factura->amount_paid ?? 0);
        $balance = $this->disbursements->balanceDue($factura);
        $canRecordPayment = TreasuryAuthorization::canCreateDisbursements($request->user());

        return Inertia::render('admin/compras/facturas/form', [
            ...$this->formPayload($factura),
            'document' => [
                'id' => $factura->id,
                'internal_number' => $factura->internal_number,
                'supplier_party_id' => $factura->supplier_party_id,
                'warehouse_id' => $factura->warehouse_id ?? '',
                'supplier_document_number' => $factura->supplier_document_number ?? '',
                'issue_date' => PeruDateTime::toInputValue($factura->issue_date),
                'due_date' => $factura->due_date?->format('Y-m-d') ?? '',
                'currency_code' => $factura->currency_code,
                'exchange_rate' => (string) $factura->exchange_rate,
                'subtotal' => (string) $factura->subtotal,
                'tax_amount' => (string) $factura->tax_amount,
                'total' => (string) $factura->total,
                'notes' => $factura->notes ?? '',
                'lines' => $factura->lines->map(fn ($line) => [
                    'id' => $line->id,
                    'product_variant_id' => $line->product_variant_id,
                    'description' => $line->description ?? '',
                    'quantity' => PurchaseDisplayFormat::decimal($line->quantity),
                    'unit_cost' => PurchaseDisplayFormat::decimal($line->unit_cost),
                    'line_total' => PurchaseDisplayFormat::decimal($line->line_total),
                    'variant_sku' => $line->variant?->sku,
                    'product_name' => $line->variant?->product?->name,
                ])->values()->all(),
                'payment_status' => $factura->payment_status,
                'payment_status_label' => $factura->paymentStatusLabel(),
                'amount_paid_label' => number_format($paid, 2, '.', ','),
                'balance_due_label' => number_format($balance, 2, '.', ','),
                'can_receive_payment' => $factura->isConfirmed() && $balance > 0.0001,
                'has_invoice_file' => $factura->hasInvoiceFile(),
                'invoice_file_name' => $factura->invoice_file_name,
                'invoice_download_url' => $factura->hasInvoiceFile()
                    ? route('admin.compras.facturas.invoice', $factura)
                    : null,
                'stock_posted' => (bool) $factura->stock_movement_id,
            ],
            'paymentMethods' => $canRecordPayment
                ? CollectionPaymentController::activePaymentMethodsPayload()
                : [],
            'canRecordPayment' => $canRecordPayment,
            'canUpdatePayment' => TreasuryAuthorization::canUpdateDisbursements($request->user()),
            'canUpdate' => $request->user()?->can('purchases.manage') ?? false,
            'openCashSession' => CashRegisterSessionController::openSessionPayloadForUser($request->user()),
            'paymentHistory' => PaymentHistoryPresenter::forPurchaseDocument($factura),
        ]);
    }

    public function update(PurchaseDocumentRequest $request, PurchaseDocument $factura): RedirectResponse
    {
        try {
            $this->purchases->update($factura, [
                ...$request->validated(),
                'updated_by' => $request->user()?->id,
            ], $request->file('invoice_file'));
        } catch (\InvalidArgumentException $exception) {
            Toast::error($exception->getMessage());

            return back()->withInput();
        }

        Toast::success('Factura de compra actualizada.');

        return redirect()->route('admin.compras.facturas.edit', $factura);
    }

    public function invoice(Request $request, PurchaseDocument $factura): StreamedResponse
    {
        abort_unless($request->user()?->can('purchases.view'), 403);
        abort_unless($factura->hasInvoiceFile(), 404);

        return Storage::disk('local')->download(
            $factura->invoice_file_path,
            $factura->invoice_file_name ?? 'factura-proveedor',
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function formPayload(?PurchaseDocument $document): array
    {
        $warehouseOptions = VariantCatalogOptions::warehouseOptions();
        $warehouseIds = array_column($warehouseOptions, 'value');

        return [
            'document' => $document,
            'supplierOptions' => $this->supplierOptions(),
            'warehouseOptions' => $warehouseOptions,
            'defaultWarehouseId' => VariantCatalogOptions::defaultWarehouseId(),
            'variantOptions' => VariantCatalogOptions::variantOptions(),
            'stockByWarehouse' => VariantCatalogOptions::stockByWarehouse($warehouseIds),
            'productOptions' => $this->productOptionsForQuickCreate(),
            'oldForm' => $this->oldFormDefaults(),
        ];
    }

    /**
     * @return list<array{value: string, label: string, sublabel?: string}>
     */
    private function supplierOptions(): array
    {
        return Party::query()
            ->whereIn('type', [Party::TYPE_SUPPLIER, Party::TYPE_BOTH])
            ->orderBy('legal_name')
            ->get(['id', 'legal_name', 'document_type', 'document_number'])
            ->map(fn (Party $party) => [
                'value' => $party->id,
                'label' => $party->legal_name,
                'sublabel' => $party->documentLabel().' '.$party->document_number,
            ])
            ->all();
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    private function productOptionsForQuickCreate(): array
    {
        return \App\Models\Product::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn ($p) => ['value' => $p->id, 'label' => $p->name])
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function oldFormDefaults(): array
    {
        return [
            'supplier_party_id' => '',
            'warehouse_id' => VariantCatalogOptions::defaultWarehouseId() ?? '',
            'supplier_document_number' => '',
            'issue_date' => now()->toDateString(),
            'due_date' => '',
            'currency_code' => 'PEN',
            'exchange_rate' => '1',
            'notes' => '',
            'lines' => [],
        ];
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function resolveDateFilters(IndexPurchaseDocumentsRequest $request): array
    {
        $from = $request->validated('from');
        $to = $request->validated('to');

        if (! $from && ! $to) {
            $start = now()->startOfWeek();
            $end = now()->endOfWeek();

            return [$start->toDateString(), $end->toDateString()];
        }

        return [
            $from ?? now()->subMonths(3)->toDateString(),
            $to ?? now()->toDateString(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function mapListRow(PurchaseDocument $doc): array
    {
        $total = (float) $doc->total;
        $paid = (float) ($doc->amount_paid ?? 0);
        $balanceDue = $this->disbursements->balanceDue($doc);

        return [
            'id' => $doc->id,
            'internal_number' => $doc->internal_number,
            'supplier_document_number' => $doc->supplier_document_number,
            'display_number' => $doc->displayNumber(),
            'issue_date' => PeruDateTime::toInputValue($doc->issue_date),
            'issue_date_label' => PeruDateTime::label($doc->issue_date),
            'due_date' => $doc->due_date?->format('Y-m-d'),
            'due_date_label' => $doc->due_date?->format('d/m/Y'),
            'supplier_name' => $doc->supplier?->legal_name ?? '—',
            'supplier_document' => $doc->supplier
                ? $doc->supplier->documentLabel().' '.$doc->supplier->document_number
                : null,
            'status' => $doc->status,
            'status_label' => $doc->statusLabel(),
            'payment_status' => $doc->payment_status,
            'payment_status_label' => $doc->paymentStatusLabel(),
            'amount_paid' => (string) $paid,
            'amount_paid_label' => number_format($paid, 2, '.', ','),
            'balance_due' => (string) $balanceDue,
            'balance_due_label' => number_format($balanceDue, 2, '.', ','),
            'can_receive_payment' => $doc->isConfirmed() && $balanceDue > 0.0001,
            'total' => (string) $doc->total,
            'total_label' => number_format($total, 2, '.', ','),
            'currency_code' => $doc->currency_code,
            'lines_count' => $doc->lines_count ?? $doc->lines()->count(),
            'has_invoice_file' => $doc->hasInvoiceFile(),
            'payment_history' => PaymentHistoryPresenter::forPurchaseDocument($doc),
        ];
    }
}
