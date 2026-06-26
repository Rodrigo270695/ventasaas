<?php

namespace App\Http\Controllers\Admin\Ventas;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Ventas\IndexSalesDocumentsRequest;
use App\Http\Requests\Admin\Ventas\SalesDocumentRequest;
use App\Models\CfgStoreSetting;
use App\Models\DocumentSeries;
use App\Models\Party;
use App\Models\PriceList;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\SalesDocument;
use App\Models\StockBalance;
use App\Models\Warehouse;
use App\Http\Controllers\Admin\Tesoreria\CashRegisterSessionController;
use App\Http\Controllers\Admin\Tesoreria\CollectionPaymentController;
use App\Services\Sales\SalesDocumentService;
use App\Services\Treasury\PaymentCollectionService;
use App\Support\CompanyBranding;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SalesDocumentController extends Controller
{
    public function __construct(
        private readonly SalesDocumentService $sales,
        private readonly PaymentCollectionService $collections,
    ) {}

    public function index(IndexSalesDocumentsRequest $request): Response
    {
        return $this->renderIndex($request, internal: false);
    }

    public function indexInternal(IndexSalesDocumentsRequest $request): Response
    {
        return $this->renderIndex($request, internal: true);
    }

    private function renderIndex(IndexSalesDocumentsRequest $request, bool $internal): Response
    {
        $status = $request->validated('status');
        $search = trim((string) $request->validated('search', ''));
        [$from, $to] = $this->resolveSalesDateFilters($request);

        $query = SalesDocument::query()
            ->where('is_internal', $internal)
            ->withSum('paymentAllocations as amount_paid', 'amount')
            ->with([
                'customer:id,legal_name,document_type,document_number',
                'documentSeries:id,series,name,is_electronic,is_internal',
                'electronicDocument:id,sales_document_id,status,sunat_description',
            ])
            ->orderByDesc('issue_date')
            ->orderByDesc('created_at');

        if ($status) {
            $query->where('status', $status);
        }

        $query->whereDate('issue_date', '>=', $from);
        $query->whereDate('issue_date', '<=', $to);

        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder->where('full_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($customer) use ($search) {
                        $customer->where('legal_name', 'like', "%{$search}%")
                            ->orWhere('document_number', 'like', "%{$search}%");
                    });
            });
        }

        $documents = $query->get();

        $payload = $documents->map(fn (SalesDocument $doc) => $this->mapListRow($doc));

        $draftCount = $documents->where('status', SalesDocument::STATUS_DRAFT)->count();
        $confirmedCount = $documents->where('status', SalesDocument::STATUS_CONFIRMED)->count();

        $page = $internal
            ? 'admin/ventas/tickets-internos/index'
            : 'admin/ventas/comprobantes/index';

        return Inertia::render($page, [
            'documents' => $payload,
            'saleMode' => $internal ? 'internal' : 'fiscal',
            'paymentMethods' => CollectionPaymentController::activePaymentMethodsPayload(),
            'canRecordPayment' => $request->user()?->can('treasury.collections.create') ?? false,
            'openCashSession' => CashRegisterSessionController::openSessionPayloadForUser($request->user()),
            'filters' => [
                'status' => $status,
                'search' => $search,
                'from' => $from,
                'to' => $to,
            ],
            'stats' => [
                ['key' => 'total', 'label' => 'Total', 'value' => $documents->count(), 'tone' => 'violet'],
                ['key' => 'draft', 'label' => 'Borradores', 'value' => $draftCount, 'tone' => 'amber'],
                ['key' => 'confirmed', 'label' => 'Confirmados', 'value' => $confirmedCount, 'tone' => 'green'],
                [
                    'key' => 'total_amount',
                    'label' => 'Monto confirmado',
                    'value' => number_format(
                        (float) $documents
                            ->where('status', SalesDocument::STATUS_CONFIRMED)
                            ->sum('total'),
                        2,
                        '.',
                        ',',
                    ),
                    'tone' => 'cyan',
                ],
            ],
        ]);
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function resolveSalesDateFilters(IndexSalesDocumentsRequest $request): array
    {
        $from = $request->validated('from');
        $to = $request->validated('to');

        if ($from && $to) {
            return [$from, $to];
        }

        return [
            now()->startOfWeek()->toDateString(),
            now()->endOfWeek()->toDateString(),
        ];
    }

    public function create(Request $request): Response
    {
        abort_unless($request->user()?->can('sales.create'), 403);

        return $this->renderForm($request, null, internal: false);
    }

    public function createInternal(Request $request): Response
    {
        abort_unless($request->user()?->can('sales.internal.create'), 403);

        return $this->renderForm($request, null, internal: true);
    }

    public function store(SalesDocumentRequest $request): RedirectResponse
    {
        try {
            $document = $this->sales->saveDraft(
                $request->validated(),
                null,
                $request->user()?->id,
            );
        } catch (\InvalidArgumentException $e) {
            return back()->withErrors(['lines' => $e->getMessage()])->withInput();
        }

        Toast::success($document->isInternal()
            ? 'Ticket interno guardado como borrador.'
            : 'Comprobante guardado como borrador.');

        return redirect($this->editRoute($document));
    }

    public function edit(Request $request, SalesDocument $comprobante): Response|RedirectResponse
    {
        abort_unless($request->user()?->can('sales.view'), 403);

        if ($comprobante->isInternal()) {
            return $this->editInternal($request, $comprobante);
        }

        return $this->renderForm($request, $comprobante, internal: false);
    }

    public function editInternal(Request $request, SalesDocument $comprobante): Response|RedirectResponse
    {
        abort_unless($request->user()?->can('sales.internal.view'), 403);

        if (! $comprobante->isInternal()) {
            return redirect()->route(
                'admin.ventas.comprobantes.edit',
                array_filter([
                    'comprobante' => $comprobante,
                    'imprimir' => $request->boolean('imprimir') ? 1 : null,
                ]),
            );
        }

        return $this->renderForm($request, $comprobante, internal: true);
    }

    public function update(SalesDocumentRequest $request, SalesDocument $comprobante): RedirectResponse
    {
        if (! $comprobante->isDraft()) {
            Toast::error('Solo puedes editar comprobantes en borrador.');

            return back();
        }

        try {
            $this->sales->saveDraft(
                $request->validated(),
                $comprobante,
                $request->user()?->id,
            );
        } catch (\InvalidArgumentException $e) {
            return back()->withErrors(['lines' => $e->getMessage()])->withInput();
        }

        Toast::success($comprobante->isInternal()
            ? 'Ticket interno actualizado.'
            : 'Comprobante actualizado.');

        return redirect($this->editRoute($comprobante));
    }

    public function destroy(Request $request, SalesDocument $comprobante): RedirectResponse
    {
        $canDelete = $comprobante->isInternal()
            ? $request->user()?->can('sales.internal.delete')
            : $request->user()?->can('sales.delete');

        abort_unless($canDelete, 403);

        if (! $comprobante->isDraft()) {
            Toast::error('Solo puedes eliminar borradores.');

            return back();
        }

        $comprobante->delete();

        Toast::success($comprobante->isInternal()
            ? 'Ticket interno eliminado.'
            : 'Comprobante eliminado.');

        return redirect($this->indexRoute($comprobante->isInternal()));
    }

    public function confirm(SalesDocumentRequest $request, SalesDocument $comprobante): RedirectResponse
    {
        if (! $comprobante->isDraft()) {
            Toast::error('Solo puedes confirmar borradores.');

            return back();
        }

        try {
            $this->sales->saveDraft(
                $request->validated(),
                $comprobante,
                $request->user()?->id,
            );

            $this->sales->confirm(
                $comprobante->fresh(['lines.variant.product', 'documentSeries', 'warehouse']),
                $request->user()?->id,
            );
        } catch (\InvalidArgumentException $e) {
            Toast::error($e->getMessage());

            return back()->withInput();
        }

        $fresh = $comprobante->fresh();

        if ($request->boolean('record_payment')) {
            try {
                $this->collections->recordForSalesDocument($fresh, [
                    'payment_method_id' => $request->validated('payment_method_id'),
                    'payment_date' => $request->validated('payment_date'),
                    'amount' => $request->validated('amount'),
                    'reference' => $request->validated('reference'),
                    'notes' => $request->validated('notes'),
                    'cash_register_session_id' => $request->validated('cash_register_session_id'),
                    'created_by' => $request->user()?->id,
                ]);
            } catch (\InvalidArgumentException $e) {
                Toast::error($e->getMessage());

                return back()->withInput();
            }
        }

        Toast::success($fresh->isInternal()
            ? ($request->boolean('record_payment')
                ? 'Ticket cobrado, numerado y listo para imprimir.'
                : 'Ticket interno confirmado y numerado.')
            : ($request->boolean('record_payment')
                ? 'Comprobante cobrado, numerado y listo para imprimir.'
                : 'Comprobante confirmado y numerado.'));

        return redirect($this->editRoute($fresh, ['imprimir' => 1]));
    }

    public function ticket(Request $request, SalesDocument $comprobante): Response
    {
        abort_unless($request->user()?->can('sales.view'), 403);

        if (! $comprobante->isConfirmed()) {
            abort(404);
        }

        $comprobante->load(['lines.variant.product', 'customer', 'documentSeries']);

        $format = $request->string('format')->toString();
        if (! in_array($format, ['80mm', '58mm', 'a4'], true)) {
            $format = '58mm';
        }

        return Inertia::render('admin/ventas/comprobantes/ticket', [
            'document' => $this->mapTicketDocument($comprobante),
            'store' => $this->mapTicketStore(),
            'format' => $format,
            'autoPrint' => $request->boolean('auto'),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function mapListRow(SalesDocument $doc): array
    {
        $total = (float) $doc->total;

        return [
            'id' => $doc->id,
            'full_number' => $doc->full_number ?? 'Borrador',
            'document_type_label' => $doc->documentTypeLabel(),
            'is_internal' => $doc->is_internal,
            'series' => $doc->series,
            'issue_date' => $doc->issue_date?->format('Y-m-d'),
            'issue_date_label' => $doc->issue_date?->format('d/m/Y'),
            'customer_name' => $doc->customer?->legal_name,
            'customer_document' => $doc->customer
                ? $doc->customer->documentLabel().' '.$doc->customer->document_number
                : null,
            'status' => $doc->status,
            'status_label' => $doc->statusLabel(),
            ...$this->mapPaymentFields($doc, $total),
            'electronic_status' => $doc->electronicDocument?->status,
            'electronic_status_label' => $doc->electronicDocument?->statusLabel(),
            'total' => (string) $doc->total,
            'total_label' => number_format($total, 2, '.', ','),
            'currency_code' => $doc->currency_code,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function mapPaymentFields(SalesDocument $doc, ?float $total = null): array
    {
        $total ??= (float) $doc->total;
        $paid = (float) ($doc->amount_paid ?? 0);
        $balanceDue = max(0, round($total - $paid, 4));

        return [
            'payment_status' => $doc->payment_status,
            'payment_status_label' => $doc->paymentStatusLabel(),
            'amount_paid' => (string) $paid,
            'amount_paid_label' => number_format($paid, 2, '.', ','),
            'balance_due' => (string) $balanceDue,
            'balance_due_label' => number_format($balanceDue, 2, '.', ','),
            'can_receive_payment' => $doc->isConfirmed() && $balanceDue > 0.0001,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function mapFormDocument(SalesDocument $doc): array
    {
        $total = (float) $doc->total;

        return [
            'id' => $doc->id,
            'is_internal' => $doc->is_internal,
            'document_series_id' => $doc->document_series_id,
            'sunat_document_type_code' => $doc->sunat_document_type_code,
            'series' => $doc->series,
            'number' => $doc->number,
            'full_number' => $doc->full_number,
            'customer_party_id' => $doc->customer_party_id ?? '',
            'warehouse_id' => $doc->warehouse_id,
            'issue_date' => $doc->issue_date?->format('Y-m-d'),
            'due_date' => $doc->due_date?->format('Y-m-d'),
            'currency_code' => $doc->currency_code,
            'exchange_rate' => (string) $doc->exchange_rate,
            'global_discount' => $this->formatFormDecimal($doc->global_discount),
            'subtotal' => (string) $doc->subtotal,
            'tax_amount' => (string) $doc->tax_amount,
            'total' => (string) $doc->total,
            'total_label' => number_format($total, 2, '.', ','),
            'status' => $doc->status,
            'status_label' => $doc->statusLabel(),
            ...$this->mapPaymentFields($doc, $total),
            'electronic_document' => $doc->electronicDocument ? [
                'status' => $doc->electronicDocument->status,
                'status_label' => $doc->electronicDocument->statusLabel(),
                'sunat_response_code' => $doc->electronicDocument->sunat_response_code,
                'sunat_description' => $doc->electronicDocument->sunat_description,
                'accepted_at' => $doc->electronicDocument->accepted_at?->toIso8601String(),
            ] : null,
            'notes' => $doc->notes,
            'lines' => $doc->lines->map(fn ($line) => [
                'id' => $line->id,
                'product_variant_id' => $line->product_variant_id,
                'description' => $line->description,
                'quantity' => $this->formatFormDecimal($line->quantity),
                'unit_price' => $this->formatFormDecimal($line->unit_price),
                'discount' => $this->formatFormDecimal($line->discount),
                'tax_affectation_code' => $line->tax_affectation_code,
                'igv_rate' => (string) $line->igv_rate,
                'line_subtotal' => (string) $line->line_subtotal,
                'igv_amount' => (string) $line->igv_amount,
                'line_total' => (string) $line->line_total,
                'variant_sku' => $line->variant?->sku,
                'product_name' => $line->variant?->product?->name,
            ])->values()->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function renderForm(Request $request, ?SalesDocument $document, bool $internal): Response
    {
        if ($document) {
            $document->load(['lines.variant.product', 'customer', 'documentSeries', 'electronicDocument']);
            $document->loadSum('paymentAllocations as amount_paid', 'amount');
        }

        $lookups = $this->formLookups($internal);
        $defaultSeriesId = $internal
            ? ($lookups['seriesOptions'][0]['value'] ?? '')
            : '';

        $page = $internal
            ? 'admin/ventas/tickets-internos/form'
            : 'admin/ventas/comprobantes/form';

        $selectedCustomerId = session()->pull('selected_customer_party_id');

        $canRecordPayment = $request->user()?->can('treasury.collections.create') ?? false;

        return Inertia::render($page, [
            'document' => $document ? $this->mapFormDocument($document) : null,
            'saleMode' => $internal ? 'internal' : 'fiscal',
            'paymentMethods' => $canRecordPayment
                ? CollectionPaymentController::activePaymentMethodsPayload()
                : [],
            'canRecordPayment' => $canRecordPayment,
            'openCashSession' => CashRegisterSessionController::openSessionPayloadForUser($request->user()),
            ...$lookups,
            'oldForm' => array_merge(
                $this->oldFormDefaults(),
                $internal && ! old('document_series_id')
                    ? ['document_series_id' => $defaultSeriesId]
                    : [],
                $selectedCustomerId
                    ? ['customer_party_id' => $selectedCustomerId]
                    : [],
            ),
            'selectedCustomerPartyId' => $selectedCustomerId,
            'openPartyQuickCreate' => (bool) session()->pull('openPartyQuickCreate', false),
            'partyQuickOldForm' => $this->partyQuickOldFormDefaults(),
            'showPrintPrompt' => $request->boolean('imprimir'),
        ]);
    }

    private function formLookups(bool $internalOnly = false): array
    {
        $seriesQuery = DocumentSeries::query()
            ->where('is_active', true);

        if ($internalOnly) {
            $seriesQuery->where('is_internal', true);
        } else {
            $seriesQuery
                ->where('is_internal', false)
                ->whereIn('sunat_document_type_code', [
                    DocumentSeries::DOC_INVOICE,
                    DocumentSeries::DOC_TICKET,
                ]);
        }

        $series = $seriesQuery
            ->orderBy('sunat_document_type_code')
            ->orderBy('series')
            ->get(['id', 'sunat_document_type_code', 'series', 'name', 'next_number', 'is_internal']);

        $customers = Party::query()
            ->where('is_active', true)
            ->whereIn('type', [Party::TYPE_CUSTOMER, Party::TYPE_BOTH])
            ->orderBy('legal_name')
            ->get(['id', 'legal_name', 'document_type', 'document_number']);

        $warehouses = Warehouse::query()
            ->where('is_active', true)
            ->orderByDesc('is_default')
            ->orderByDesc('is_saleable')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'is_default', 'is_saleable']);

        $defaultWarehouseId = $this->resolveDefaultSaleWarehouseId($warehouses);

        return [
            'seriesOptions' => $series->map(fn (DocumentSeries $row) => [
                'value' => $row->id,
                'label' => $row->documentTypeLabel().' '.$row->series.($row->name ? " · {$row->name}" : ''),
                'sublabel' => 'Siguiente: '.$row->previewNumber(),
                'sunat_document_type_code' => $row->sunat_document_type_code,
                'series' => $row->series,
            ])->values()->all(),
            'customerOptions' => $customers->map(fn (Party $party) => [
                'value' => $party->id,
                'label' => $party->legal_name,
                'sublabel' => $party->documentLabel().' '.$party->document_number,
                'searchText' => strtolower($party->legal_name.' '.$party->document_number),
            ])->values()->all(),
            'warehouseOptions' => $warehouses->map(function (Warehouse $w) {
                $suffix = match (true) {
                    $w->is_default && $w->is_saleable => ' · Mostrador',
                    $w->is_saleable => ' · Ventas',
                    default => ' · Bodega',
                };

                return [
                    'value' => $w->id,
                    'label' => "{$w->name} ({$w->code}){$suffix}",
                ];
            })->values()->all(),
            'defaultWarehouseId' => $defaultWarehouseId,
            'variantOptions' => $this->variantOptions(),
            'stockByWarehouse' => $this->stockByWarehouse($warehouses->pluck('id')->all()),
        ];
    }

    /**
     * Saldo por variante en cada almacén activo (para mostrar en el formulario de venta).
     *
     * @param  list<string>  $warehouseIds
     * @return array<string, array<string, string>>
     */
    private function stockByWarehouse(array $warehouseIds): array
    {
        if ($warehouseIds === []) {
            return [];
        }

        $result = [];

        foreach ($warehouseIds as $warehouseId) {
            $result[$warehouseId] = [];
        }

        StockBalance::query()
            ->whereIn('warehouse_id', $warehouseIds)
            ->get(['warehouse_id', 'product_variant_id', 'quantity_on_hand'])
            ->each(function (StockBalance $balance) use (&$result) {
                $result[$balance->warehouse_id][$balance->product_variant_id] = $this->formatFormDecimal(
                    $balance->quantity_on_hand,
                );
            });

        return $result;
    }

    /**
     * @return list<array{value: string, label: string, sublabel?: string, searchText?: string, unit_price?: string, track_stock?: bool}>
     */
    private function variantOptions(): array
    {
        $defaultListId = PriceList::query()->where('is_default', true)->value('id');

        return Product::query()
            ->where('is_active', true)
            ->with([
                'variants' => fn ($query) => $query
                    ->where('is_active', true)
                    ->orderByDesc('is_default')
                    ->orderBy('sku')
                    ->with(['prices', 'taxProfile']),
            ])
            ->orderBy('name')
            ->get(['id', 'name', 'track_stock', 'type'])
            ->flatMap(function (Product $product) use ($defaultListId) {
                return $product->variants->map(function (ProductVariant $variant) use ($product, $defaultListId) {
                    $price = $variant->prices->firstWhere('price_list_id', $defaultListId)
                        ?? $variant->prices->first();

                    return [
                        'value' => $variant->id,
                        'label' => trim($product->name.' · '.($variant->label ?: $variant->sku)),
                        'sublabel' => $variant->sku,
                        'barcode' => $variant->barcode,
                        'searchText' => strtolower(implode(' ', array_filter([
                            $product->name,
                            $variant->sku,
                            $variant->label,
                            $variant->barcode,
                        ]))),
                        'unit_price' => $price
                            ? $this->formatFormDecimal($price->amount)
                            : '0.00',
                        'track_stock' => (bool) $product->track_stock,
                        'tax_affectation_code' => $variant->taxProfile?->sunat_affectation_code ?? '10',
                        'igv_rate' => (string) ($variant->taxProfile?->igv_rate ?? '0.1800'),
                    ];
                });
            })
            ->values()
            ->all();
    }

    private function formatFormDecimal(string|float|null $value): string
    {
        return number_format((float) ($value ?? 0), 2, '.', '');
    }

    private function formatTicketMoney(string|float|null $value): string
    {
        return number_format((float) ($value ?? 0), 2, '.', ',');
    }

    /**
     * @return array<string, mixed>
     */
    private function mapTicketDocument(SalesDocument $doc): array
    {
        $globalDiscount = (float) $doc->global_discount;

        return [
            'id' => $doc->id,
            'full_number' => $doc->full_number ?? '',
            'document_type_label' => $doc->documentTypeLabel(),
            'is_internal' => $doc->is_internal,
            'issue_date_label' => $doc->issue_date?->format('d/m/Y') ?? '',
            'issue_time_label' => $doc->updated_at?->timezone(config('app.timezone'))->format('H:i') ?? '',
            'currency_code' => $doc->currency_code,
            'subtotal' => (string) $doc->subtotal,
            'tax_amount' => (string) $doc->tax_amount,
            'total' => (string) $doc->total,
            'subtotal_label' => $this->formatTicketMoney($doc->subtotal),
            'tax_amount_label' => $this->formatTicketMoney($doc->tax_amount),
            'global_discount' => $globalDiscount > 0
                ? (string) $doc->global_discount
                : null,
            'global_discount_label' => $globalDiscount > 0
                ? $this->formatTicketMoney($doc->global_discount)
                : null,
            'total_label' => $this->formatTicketMoney($doc->total),
            'notes' => $doc->notes,
            'customer_name' => $doc->customer?->legal_name,
            'customer_document' => $doc->customer
                ? $doc->customer->documentLabel().' '.$doc->customer->document_number
                : null,
            'lines' => $doc->lines->map(function ($line) {
                $variant = $line->variant;
                $productName = $variant?->product?->name;
                $label = trim((string) ($line->description ?: $productName ?: 'Ítem'));

                if ($variant?->sku && $productName) {
                    $label = $productName.' · '.$variant->sku;
                }

                return [
                    'description' => $label,
                    'sku' => $variant?->sku,
                    'quantity' => $this->formatFormDecimal($line->quantity),
                    'unit_price' => $this->formatTicketMoney($line->unit_price),
                    'line_total' => $this->formatTicketMoney($line->line_total),
                ];
            })->values()->all(),
        ];
    }

    /**
     * @return array{ruc: string|null, legal_name: string|null, address: string|null, logo_url: string|null}
     */
    private function mapTicketStore(): array
    {
        $settings = CfgStoreSetting::query()->orderBy('id')->first();
        $branding = CompanyBranding::forInertia();

        return [
            'ruc' => $settings?->ruc,
            'legal_name' => $settings?->razon_social,
            'address' => $settings?->direccion,
            'logo_url' => $branding['logo_url'] ?: null,
        ];
    }

    /**
     * Almacén sugerido al crear una venta: primero vendible (mostrador), no bodega.
     */
    private function resolveDefaultSaleWarehouseId(?\Illuminate\Support\Collection $warehouses = null): ?string
    {
        $warehouses ??= Warehouse::query()
            ->where('is_active', true)
            ->orderByDesc('is_saleable')
            ->orderByDesc('is_default')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'is_default', 'is_saleable']);

        $preferred = $warehouses->first(
            fn (Warehouse $w) => $w->is_saleable && $w->is_default,
        )
            ?? $warehouses->firstWhere('is_saleable', true);

        return $preferred?->id ?? $warehouses->first()?->id;
    }

    /**
     * @return array<string, mixed>
     */
    private function editRoute(SalesDocument $document, array $query = []): string
    {
        $name = $document->isInternal()
            ? 'admin.ventas.tickets-internos.edit'
            : 'admin.ventas.comprobantes.edit';

        return route($name, ['comprobante' => $document, ...$query]);
    }

    private function indexRoute(bool $internal): string
    {
        return $internal
            ? route('admin.ventas.tickets-internos.index')
            : route('admin.ventas.comprobantes.index');
    }

    private function oldFormDefaults(): array
    {
        $lines = old('lines', []);

        $defaultWarehouseId = $this->resolveDefaultSaleWarehouseId();

        return [
            'document_series_id' => old('document_series_id', ''),
            'customer_party_id' => old('customer_party_id', ''),
            'warehouse_id' => old('warehouse_id', $defaultWarehouseId ?? ''),
            'issue_date' => old('issue_date', now()->toDateString()),
            'due_date' => old('due_date', ''),
            'currency_code' => old('currency_code', 'PEN'),
            'exchange_rate' => old('exchange_rate', '1'),
            'global_discount' => old('global_discount', '0'),
            'notes' => old('notes', ''),
            'lines' => is_array($lines) ? array_values($lines) : [],
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function partyQuickOldFormDefaults(): ?array
    {
        if (! old('legal_name') && ! old('document_number')) {
            return null;
        }

        return [
            'type' => old('type', Party::TYPE_CUSTOMER),
            'document_type' => old('document_type', Party::DOC_RUC),
            'document_number' => old('document_number', ''),
            'legal_name' => old('legal_name', ''),
            'trade_name' => old('trade_name', ''),
            'address' => old('address', ''),
            'sunat_estado' => old('sunat_estado', ''),
            'sunat_condicion' => old('sunat_condicion', ''),
            'email' => old('email', ''),
            'phone' => old('phone', ''),
            'credit_limit' => old('credit_limit', '0'),
            'payment_term_days' => (int) old('payment_term_days', 0),
            'is_active' => filter_var(old('is_active', true), FILTER_VALIDATE_BOOLEAN),
        ];
    }
}
