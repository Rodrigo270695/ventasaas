<?php

namespace App\Http\Controllers\Admin\Compras;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Compras\IndexPurchaseOrdersRequest;
use App\Http\Requests\Admin\Compras\PurchaseOrderRequest;
use App\Http\Requests\Admin\Compras\SendPurchaseOrderEmailRequest;
use App\Models\Party;
use App\Models\PurchaseOrder;
use App\Services\Compras\PurchaseOrderService;
use App\Services\Compras\PurchaseOrderSupplierMailService;
use App\Support\Catalog\VariantCatalogOptions;
use App\Support\Compras\PurchaseDisplayFormat;
use App\Support\Datetime\PeruDateTime;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class PurchaseOrderController extends Controller
{
    public function __construct(
        private readonly PurchaseOrderService $orders,
        private readonly PurchaseOrderSupplierMailService $supplierMail,
    ) {}

    public function index(IndexPurchaseOrdersRequest $request): Response
    {
        $search = trim((string) $request->validated('search', ''));
        $status = $request->validated('status');
        $from = $request->validated('from');
        $to = $request->validated('to');

        $query = PurchaseOrder::query()
            ->with(['supplier:id,legal_name,document_type,document_number,email'])
            ->withCount('lines')
            ->orderByDesc('order_date')
            ->orderByDesc('created_at');

        if ($status) {
            $query->where('status', $status);
        }

        if ($from) {
            $query->whereDate('order_date', '>=', $from);
        }

        if ($to) {
            $query->whereDate('order_date', '<=', $to);
        }

        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder->where('internal_number', 'like', "%{$search}%")
                    ->orWhereHas('supplier', function ($supplier) use ($search) {
                        $supplier->where('legal_name', 'like', "%{$search}%")
                            ->orWhere('document_number', 'like', "%{$search}%");
                    });
            });
        }

        $orders = $query->limit(200)->get();

        return Inertia::render('admin/compras/ordenes/index', [
            'orders' => $orders->map(fn (PurchaseOrder $order) => $this->mapListRow($order)),
            'filters' => [
                'search' => $search,
                'status' => $status,
                'from' => $from,
                'to' => $to,
            ],
            'stats' => [
                ['key' => 'total', 'label' => 'Órdenes', 'value' => $orders->count(), 'tone' => 'violet'],
                [
                    'key' => 'pending',
                    'label' => 'Por recibir',
                    'value' => $orders->whereIn('status', [
                        PurchaseOrder::STATUS_APPROVED,
                        PurchaseOrder::STATUS_PARTIALLY_RECEIVED,
                    ])->count(),
                    'tone' => 'amber',
                ],
            ],
            'statusOptions' => $this->statusFilterOptions(),
        ]);
    }

    public function create(Request $request): Response
    {
        abort_unless($request->user()?->can('purchases.manage'), 403);

        return Inertia::render('admin/compras/ordenes/form', $this->formPayload(null));
    }

    public function store(PurchaseOrderRequest $request): RedirectResponse
    {
        try {
            $order = $this->orders->create(
                [...$request->validated(), 'created_by' => $request->user()?->id],
                (bool) $request->boolean('approve'),
            );
        } catch (InvalidArgumentException $exception) {
            Toast::error($exception->getMessage());

            return back()->withInput();
        }

        Toast::success(
            $order->isDraft()
                ? 'Orden de compra guardada en borrador.'
                : 'Orden de compra aprobada. Ya puedes registrar recepciones.',
        );

        return redirect()->route('admin.compras.ordenes.edit', $order);
    }

    public function edit(Request $request, PurchaseOrder $orden): Response
    {
        abort_unless($request->user()?->can('purchases.view'), 403);

        $orden->load([
            'lines.variant.product',
            'supplier',
            'goodsReceipts.purchaseDocument',
            'purchaseDocuments' => fn ($query) => $query->whereNull('goods_receipt_id'),
        ]);

        return Inertia::render('admin/compras/ordenes/form', [
            ...$this->formPayload($orden),
            'order' => $this->mapFormOrder($orden),
            'purchaseFlow' => $this->mapPurchaseFlow($orden),
            'supplierEmail' => $this->mapSupplierEmailMeta($orden),
            'canManage' => $request->user()?->can('purchases.manage') ?? false,
            'canReceive' => $orden->canReceive(),
            'receiveUrl' => $orden->canReceive()
                ? route('admin.compras.recepciones.create', ['orden' => $orden->id])
                : null,
        ]);
    }

    public function update(PurchaseOrderRequest $request, PurchaseOrder $orden): RedirectResponse
    {
        try {
            $this->orders->update(
                $orden,
                $request->validated(),
                $request->boolean('approve') ? true : null,
            );
        } catch (InvalidArgumentException $exception) {
            Toast::error($exception->getMessage());

            return back()->withInput();
        }

        Toast::success('Orden de compra actualizada.');

        return redirect()->route('admin.compras.ordenes.edit', $orden);
    }

    public function approve(Request $request, PurchaseOrder $orden): RedirectResponse
    {
        abort_unless($request->user()?->can('purchases.manage'), 403);

        try {
            $this->orders->approve($orden);
        } catch (InvalidArgumentException $exception) {
            Toast::error($exception->getMessage());

            return back();
        }

        Toast::success('Orden aprobada. Registra la recepción cuando llegue la mercadería.');

        return redirect()->route('admin.compras.ordenes.edit', $orden);
    }

    public function cancel(Request $request, PurchaseOrder $orden): RedirectResponse
    {
        abort_unless($request->user()?->can('purchases.manage'), 403);

        try {
            $this->orders->cancel($orden);
        } catch (InvalidArgumentException $exception) {
            Toast::error($exception->getMessage());

            return back();
        }

        Toast::success('Orden de compra anulada.');

        return redirect()->route('admin.compras.ordenes.index');
    }

    public function sendSupplierEmail(
        SendPurchaseOrderEmailRequest $request,
        PurchaseOrder $orden,
    ): RedirectResponse {
        $redirect = back(
            fallback: route('admin.compras.ordenes.edit', $orden),
        );

        try {
            $this->supplierMail->send(
                $orden,
                $request->validated('to_email'),
                $request->ccEmailList(),
                $request->boolean('save_supplier_email'),
            );
        } catch (InvalidArgumentException $exception) {
            Toast::error($exception->getMessage());

            return $redirect->withInput();
        } catch (\Throwable $exception) {
            report($exception);

            Toast::error(
                'No se pudo enviar el correo. Revisa la configuración MAIL en .env o el log de Laravel.',
            );

            return $redirect->withInput();
        }

        Toast::success('Orden enviada al proveedor. Podrá confirmarla desde el correo.');

        return $redirect;
    }

    /**
     * @return array<string, mixed>
     */
    private function formPayload(?PurchaseOrder $order): array
    {
        return [
            'supplierOptions' => $this->supplierOptions(),
            'variantOptions' => VariantCatalogOptions::variantOptions(),
            'productOptions' => $this->productOptions(),
            'oldForm' => [
                'supplier_party_id' => '',
                'order_date' => PeruDateTime::toInputValue(PeruDateTime::now()),
                'expected_date' => '',
                'currency_code' => 'PEN',
                'exchange_rate' => '1',
                'notes' => '',
                'lines' => [],
            ],
        ];
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    private function statusFilterOptions(): array
    {
        return [
            ['value' => '', 'label' => 'Todos los estados'],
            ['value' => PurchaseOrder::STATUS_DRAFT, 'label' => 'Borrador'],
            ['value' => PurchaseOrder::STATUS_APPROVED, 'label' => 'Aprobada'],
            ['value' => PurchaseOrder::STATUS_PARTIALLY_RECEIVED, 'label' => 'Recepción parcial'],
            ['value' => PurchaseOrder::STATUS_RECEIVED, 'label' => 'Recibida'],
            ['value' => PurchaseOrder::STATUS_CANCELLED, 'label' => 'Anulada'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function mapListRow(PurchaseOrder $order): array
    {
        return [
            'id' => $order->id,
            'internal_number' => $order->internal_number,
            'order_date' => PeruDateTime::toInputValue($order->order_date),
            'order_date_label' => PeruDateTime::label($order->order_date),
            'expected_date_label' => $order->expected_date?->format('d/m/Y'),
            'supplier_name' => $order->supplier?->legal_name ?? '—',
            'status' => $order->status,
            'status_label' => $order->statusLabel(),
            'total' => (string) $order->total,
            'total_label' => number_format((float) $order->total, 2, '.', ','),
            'currency_code' => $order->currency_code,
            'lines_count' => $order->lines_count ?? 0,
            'can_receive' => $order->canReceive(),
            'can_send_email' => $order->canSendSupplierEmail(),
            'supplier_default_email' => $order->supplier?->email ?? '',
            'supplier_email_to' => $order->supplier_email_to,
            'supplier_email_cc' => implode(', ', $order->supplier_email_cc ?? []),
            'supplier_email_sent_label' => PeruDateTime::label($order->supplier_email_sent_at),
            'supplier_confirmed_label' => PeruDateTime::label($order->supplier_confirmed_at),
            'is_supplier_confirmed' => $order->hasSupplierConfirmed(),
            'is_supplier_email_sent' => $order->supplier_email_sent_at !== null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function mapFormOrder(PurchaseOrder $order): array
    {
        return [
            'id' => $order->id,
            'internal_number' => $order->internal_number,
            'supplier_party_id' => $order->supplier_party_id,
            'order_date' => PeruDateTime::toInputValue($order->order_date),
            'expected_date' => $order->expected_date?->format('Y-m-d') ?? '',
            'currency_code' => $order->currency_code,
            'exchange_rate' => (string) $order->exchange_rate,
            'notes' => $order->notes ?? '',
            'status' => $order->status,
            'status_label' => $order->statusLabel(),
            'total_label' => number_format((float) $order->total, 2, '.', ','),
            'lines' => $order->lines->map(fn ($line) => [
                'id' => $line->id,
                'product_variant_id' => $line->product_variant_id,
                'description' => $line->description ?? '',
                'quantity' => PurchaseDisplayFormat::decimal($line->quantity_ordered),
                'quantity_ordered' => PurchaseDisplayFormat::decimal($line->quantity_ordered),
                'quantity_received' => PurchaseDisplayFormat::decimal($line->quantity_received),
                'quantity_pending' => PurchaseDisplayFormat::decimal($line->quantityPending()),
                'unit_cost' => PurchaseDisplayFormat::decimal($line->unit_cost),
                'variant_sku' => $line->variant?->sku,
                'product_name' => $line->variant?->product?->name,
            ])->values()->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function mapPurchaseFlow(PurchaseOrder $order): array
    {
        $receipts = $order->goodsReceipts
            ->sortBy('received_date')
            ->values()
            ->map(function ($receipt) {
                $invoice = $receipt->purchaseDocument;

                return [
                    'id' => $receipt->id,
                    'internal_number' => $receipt->internal_number,
                    'received_date_label' => PeruDateTime::label($receipt->received_date) ?? '—',
                    'invoice' => $invoice ? [
                        'id' => $invoice->id,
                        'internal_number' => $invoice->internal_number,
                        'supplier_document_number' => $invoice->supplier_document_number,
                        'edit_url' => route('admin.compras.facturas.edit', $invoice),
                    ] : null,
                    'create_invoice_url' => $invoice
                        ? null
                        : route('admin.compras.facturas.create', ['recepcion' => $receipt->id]),
                ];
            })
            ->all();

        $invoiceIdsOnReceipts = collect($receipts)
            ->pluck('invoice.id')
            ->filter()
            ->all();

        $directInvoices = $order->purchaseDocuments
            ->reject(fn ($doc) => in_array($doc->id, $invoiceIdsOnReceipts, true))
            ->map(fn ($doc) => [
                'id' => $doc->id,
                'internal_number' => $doc->internal_number,
                'supplier_document_number' => $doc->supplier_document_number,
                'edit_url' => route('admin.compras.facturas.edit', $doc),
            ])
            ->values()
            ->all();

        return [
            'order' => [
                'internal_number' => $order->internal_number,
                'status_label' => $order->statusLabel(),
                'order_date_label' => PeruDateTime::label($order->order_date) ?? '—',
            ],
            'supplier' => [
                'sent_at_label' => PeruDateTime::label($order->supplier_email_sent_at),
                'sent_to' => $order->supplier_email_to,
                'sent_cc' => $order->supplier_email_cc ?? [],
                'confirmed_at_label' => PeruDateTime::label($order->supplier_confirmed_at),
            ],
            'receipts' => $receipts,
            'direct_invoices' => $directInvoices,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function mapSupplierEmailMeta(PurchaseOrder $order): array
    {
        $order->loadMissing('supplier');

        return [
            'default_email' => $order->supplier?->email ?? '',
            'last_sent_to' => $order->supplier_email_to,
            'last_sent_cc' => implode(', ', $order->supplier_email_cc ?? []),
            'sent_at_label' => PeruDateTime::label($order->supplier_email_sent_at),
            'confirmed_at_label' => PeruDateTime::label($order->supplier_confirmed_at),
            'can_send' => $order->canSendSupplierEmail(),
            'is_confirmed' => $order->hasSupplierConfirmed(),
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
    private function productOptions(): array
    {
        return \App\Models\Product::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn ($p) => ['value' => $p->id, 'label' => $p->name])
            ->all();
    }
}
