<?php

namespace App\Http\Controllers\Admin\Ventas;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Ventas\IndexSalesQuotationsRequest;
use App\Http\Requests\Admin\Ventas\SalesQuotationRequest;
use App\Http\Requests\Admin\Ventas\SendSalesQuotationEmailRequest;
use App\Mail\SalesQuotationMail;
use App\Models\Party;
use App\Models\PriceList;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\SalesQuotation;
use App\Models\DocumentSeries;
use App\Services\Sales\SalesQuotationPdfService;
use App\Services\Sales\SalesQuotationService;
use App\Services\Sales\SalesDocumentService;
use App\Support\Datetime\PeruDateTime;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class SalesQuotationController extends Controller
{
    public function __construct(
        private readonly SalesQuotationService $quotations,
        private readonly SalesDocumentService $salesDocuments,
        private readonly SalesQuotationPdfService $quotationPdf,
    ) {}

    public function index(IndexSalesQuotationsRequest $request): Response
    {
        $status = $request->validated('status');
        $search = trim((string) $request->validated('search', ''));
        $from = $request->validated('from') ?: now()->startOfWeek()->toDateString();
        $to = $request->validated('to') ?: now()->endOfWeek()->toDateString();

        $query = SalesQuotation::query()
            ->with(['customer:id,legal_name,document_type,document_number', 'salesDocument:id,full_number'])
            ->orderByDesc('issue_date')
            ->orderByDesc('created_at')
            ->whereDate('issue_date', '>=', $from)
            ->whereDate('issue_date', '<=', $to);

        if ($status) {
            $query->where('status', $status);
        }

        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder->where('internal_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($customer) use ($search) {
                        $customer->where('legal_name', 'like', "%{$search}%")
                            ->orWhere('document_number', 'like', "%{$search}%");
                    });
            });
        }

        $items = $query->limit(300)->get();

        return Inertia::render('admin/ventas/cotizaciones/index', [
            'quotations' => $items->map(fn (SalesQuotation $quotation) => $this->mapListRow($quotation)),
            'filters' => [
                'status' => $status,
                'search' => $search,
                'from' => $from,
                'to' => $to,
            ],
            'statusOptions' => [
                ['value' => '', 'label' => 'Todos los estados'],
                ['value' => SalesQuotation::STATUS_DRAFT, 'label' => 'Borrador'],
                ['value' => SalesQuotation::STATUS_SENT, 'label' => 'Enviada'],
                ['value' => SalesQuotation::STATUS_ACCEPTED, 'label' => 'Aceptada'],
                ['value' => SalesQuotation::STATUS_REJECTED, 'label' => 'Rechazada'],
                ['value' => SalesQuotation::STATUS_CANCELLED, 'label' => 'Anulada'],
            ],
            'stats' => [
                ['key' => 'total', 'label' => 'Total', 'value' => $items->count(), 'tone' => 'violet'],
                ['key' => 'sent', 'label' => 'Enviadas', 'value' => $items->where('status', SalesQuotation::STATUS_SENT)->count(), 'tone' => 'cyan'],
                ['key' => 'accepted', 'label' => 'Aceptadas', 'value' => $items->where('status', SalesQuotation::STATUS_ACCEPTED)->count(), 'tone' => 'green'],
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        abort_unless($request->user()?->can('sales.quotations.create'), 403);

        return $this->renderForm(null);
    }

    public function store(SalesQuotationRequest $request): RedirectResponse
    {
        try {
            $quotation = $this->quotations->saveDraft(
                $request->validated(),
                null,
                $request->user()?->id,
            );
        } catch (InvalidArgumentException $e) {
            return back()->withErrors(['lines' => $e->getMessage()])->withInput();
        }

        Toast::success('Cotización guardada como borrador.');

        return redirect()->route('admin.ventas.cotizaciones.edit', $quotation);
    }

    public function edit(Request $request, SalesQuotation $cotizacion): Response
    {
        abort_unless($request->user()?->can('sales.quotations.view'), 403);

        return $this->renderForm($cotizacion);
    }

    public function update(SalesQuotationRequest $request, SalesQuotation $cotizacion): RedirectResponse
    {
        if (! $cotizacion->isDraft()) {
            Toast::error('Solo puedes editar cotizaciones en borrador.');

            return back();
        }

        try {
            $this->quotations->saveDraft(
                $request->validated(),
                $cotizacion,
                $request->user()?->id,
            );
        } catch (InvalidArgumentException $e) {
            return back()->withErrors(['lines' => $e->getMessage()])->withInput();
        }

        Toast::success('Cotización actualizada.');

        return redirect()->route('admin.ventas.cotizaciones.edit', $cotizacion);
    }

    public function sendEmail(SendSalesQuotationEmailRequest $request, SalesQuotation $cotizacion): RedirectResponse
    {
        $redirect = back(
            fallback: route('admin.ventas.cotizaciones.edit', $cotizacion),
        );

        if (! $cotizacion->isDraft()) {
            Toast::error('Solo puedes enviar por correo cotizaciones en borrador.');

            return $redirect;
        }

        try {
            $cotizacion->load(['lines.variant.product', 'customer']);
            $updated = $this->quotations->markAsSent(
                $cotizacion,
                $request->validated('to_email'),
                $request->ccEmailList(),
            );

            $mail = Mail::to($updated->customer_email_to);
            $cc = $updated->customer_email_cc ?? [];

            if ($cc !== []) {
                $mail->cc($cc);
            }

            $mail->send(new SalesQuotationMail(
                quotation: $updated,
                companyName: (string) config('company.name', config('app.name')),
            ));
        } catch (InvalidArgumentException $e) {
            Toast::error($e->getMessage());

            return $redirect->withInput();
        } catch (\Throwable $e) {
            report($e);
            Toast::error('No se pudo enviar la cotización por correo.');

            return $redirect->withInput();
        }

        Toast::success('Cotización enviada al cliente.');

        return $redirect;
    }

    public function markAccepted(Request $request, SalesQuotation $cotizacion): RedirectResponse
    {
        abort_unless($request->user()?->can('sales.quotations.update'), 403);

        try {
            $this->quotations->markStatus($cotizacion, SalesQuotation::STATUS_ACCEPTED);
        } catch (InvalidArgumentException $e) {
            Toast::error($e->getMessage());

            return back();
        }
        Toast::success('Cotización marcada como aceptada.');

        return back();
    }

    public function markRejected(Request $request, SalesQuotation $cotizacion): RedirectResponse
    {
        abort_unless($request->user()?->can('sales.quotations.update'), 403);

        try {
            $this->quotations->markStatus($cotizacion, SalesQuotation::STATUS_REJECTED);
        } catch (InvalidArgumentException $e) {
            Toast::error($e->getMessage());

            return back();
        }
        Toast::success('Cotización marcada como rechazada.');

        return back();
    }

    public function cancel(Request $request, SalesQuotation $cotizacion): RedirectResponse
    {
        abort_unless($request->user()?->can('sales.quotations.update'), 403);

        try {
            $this->quotations->markStatus($cotizacion, SalesQuotation::STATUS_CANCELLED);
        } catch (InvalidArgumentException $e) {
            Toast::error($e->getMessage());

            return back();
        }
        Toast::success('Cotización anulada.');

        return back();
    }

    public function duplicate(Request $request, SalesQuotation $cotizacion): RedirectResponse
    {
        abort_unless($request->user()?->can('sales.quotations.create'), 403);

        $copy = $this->quotations->duplicate($cotizacion, $request->user()?->id);
        Toast::success('Cotización duplicada.');

        return redirect()->route('admin.ventas.cotizaciones.edit', $copy);
    }

    public function convertToInvoice(Request $request, SalesQuotation $cotizacion): RedirectResponse
    {
        abort_unless($request->user()?->can('sales.create'), 403);

        $seriesId = (string) DocumentSeries::query()
            ->where('is_active', true)
            ->where('is_internal', false)
            ->whereIn('sunat_document_type_code', [DocumentSeries::DOC_INVOICE, DocumentSeries::DOC_TICKET])
            ->orderBy('sunat_document_type_code')
            ->orderBy('series')
            ->value('id');

        if ($seriesId === '') {
            Toast::error('No hay series fiscales activas para convertir la cotización.');

            return back();
        }

        try {
            $document = $this->quotations->convertToSalesDocumentDraft(
                $cotizacion,
                $this->salesDocuments,
                $seriesId,
                null,
                $request->user()?->id,
            );
        } catch (InvalidArgumentException $e) {
            Toast::error($e->getMessage());

            return back();
        }

        Toast::success('Cotización convertida a comprobante en borrador.');

        return redirect()->route('admin.ventas.comprobantes.edit', $document);
    }

    public function print(Request $request, SalesQuotation $cotizacion): HttpResponse
    {
        abort_unless($request->user()?->can('sales.quotations.view'), 403);

        $pdf = $this->quotationPdf->generate($cotizacion);
        $filename = $this->quotationPdf->filename($cotizacion);

        if ($request->boolean('download')) {
            return $pdf->download($filename);
        }

        return $pdf->stream($filename);
    }

    private function renderForm(?SalesQuotation $quotation): Response
    {
        if ($quotation) {
            $quotation->load(['lines.variant.product', 'customer', 'salesDocument']);
        }

        return Inertia::render('admin/ventas/cotizaciones/form', [
            'quotation' => $quotation ? $this->mapFormQuotation($quotation) : null,
            'customerOptions' => $this->customerOptions(),
            'variantOptions' => $this->variantOptions(),
            'oldForm' => $this->oldFormDefaults(),
        ]);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function customerOptions(): array
    {
        return Party::query()
            ->where('is_active', true)
            ->whereIn('type', [Party::TYPE_CUSTOMER, Party::TYPE_BOTH])
            ->orderBy('legal_name')
            ->get(['id', 'legal_name', 'document_type', 'document_number', 'email'])
            ->map(fn (Party $party) => [
                'value' => $party->id,
                'label' => $party->legal_name,
                'sublabel' => $party->documentLabel().' '.$party->document_number,
                'email' => $party->email,
            ])->values()->all();
    }

    /**
     * @return list<array<string, mixed>>
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
            ->get(['id', 'name'])
            ->flatMap(function (Product $product) use ($defaultListId) {
                return $product->variants->map(function (ProductVariant $variant) use ($product, $defaultListId) {
                    $price = $variant->prices->firstWhere('price_list_id', $defaultListId)
                        ?? $variant->prices->first();

                    return [
                        'value' => $variant->id,
                        'label' => trim($product->name.' · '.($variant->label ?: $variant->sku)),
                        'sublabel' => $variant->sku,
                        'unit_price' => number_format((float) ($price?->amount ?? 0), 2, '.', ''),
                    ];
                });
            })->values()->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function oldFormDefaults(): array
    {
        $lines = old('lines', []);

        return [
            'customer_party_id' => old('customer_party_id', ''),
            'issue_date' => old('issue_date', PeruDateTime::toInputValue(PeruDateTime::now())),
            'valid_until' => old('valid_until', now()->addDays(7)->toDateString()),
            'currency_code' => old('currency_code', 'PEN'),
            'exchange_rate' => old('exchange_rate', '1'),
            'global_discount' => old('global_discount', '0'),
            'notes' => old('notes', ''),
            'lines' => is_array($lines) ? array_values($lines) : [],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function mapListRow(SalesQuotation $quotation): array
    {
        return [
            'id' => $quotation->id,
            'internal_number' => $quotation->internal_number,
            'issue_date' => PeruDateTime::toInputValue($quotation->issue_date),
            'issue_date_label' => PeruDateTime::label($quotation->issue_date),
            'valid_until_label' => $quotation->valid_until
                ? PeruDateTime::parse($quotation->valid_until)->format('d/m/Y')
                : null,
            'customer_name' => $quotation->customer?->legal_name ?? '—',
            'status' => $quotation->status,
            'status_label' => $quotation->statusLabel(),
            'currency_code' => $quotation->currency_code,
            'total_label' => number_format((float) $quotation->total, 2, '.', ','),
            'is_email_sent' => $quotation->customer_email_sent_at !== null,
            'email_sent_label' => PeruDateTime::label($quotation->customer_email_sent_at),
            'sales_document_id' => $quotation->sales_document_id,
            'sales_document_number' => $quotation->salesDocument?->full_number,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function mapFormQuotation(SalesQuotation $quotation): array
    {
        return [
            'id' => $quotation->id,
            'internal_number' => $quotation->internal_number,
            'customer_party_id' => $quotation->customer_party_id,
            'customer_name' => $quotation->customer?->legal_name,
            'customer_email' => $quotation->customer?->email,
            'issue_date' => PeruDateTime::toInputValue($quotation->issue_date),
            'valid_until' => $quotation->valid_until
                ? PeruDateTime::parse($quotation->valid_until)->toDateString()
                : null,
            'currency_code' => $quotation->currency_code,
            'exchange_rate' => number_format((float) $quotation->exchange_rate, 2, '.', ''),
            'global_discount' => number_format((float) $quotation->global_discount, 2, '.', ''),
            'subtotal' => (string) $quotation->subtotal,
            'tax_amount' => (string) $quotation->tax_amount,
            'total' => (string) $quotation->total,
            'status' => $quotation->status,
            'status_label' => $quotation->statusLabel(),
            'notes' => $quotation->notes,
            'customer_email_to' => $quotation->customer_email_to,
            'customer_email_cc' => implode(', ', $quotation->customer_email_cc ?? []),
            'customer_email_sent_label' => PeruDateTime::label($quotation->customer_email_sent_at),
            'can_edit' => $quotation->isDraft(),
            'can_send_email' => $quotation->isDraft(),
            'can_convert' => in_array($quotation->status, [SalesQuotation::STATUS_SENT, SalesQuotation::STATUS_ACCEPTED], true),
            'sales_document_id' => $quotation->sales_document_id,
            'sales_document_number' => $quotation->salesDocument?->full_number,
            'lines' => $quotation->lines->map(fn ($line) => [
                'id' => $line->id,
                'product_variant_id' => $line->product_variant_id,
                'manual_sku' => $line->manual_sku,
                'description' => $line->description,
                'quantity' => number_format((float) $line->quantity, 2, '.', ''),
                'unit_price' => number_format((float) $line->unit_price, 2, '.', ''),
                'discount' => number_format((float) $line->discount, 2, '.', ''),
                'line_total' => (string) $line->line_total,
                'variant_sku' => $line->variant?->sku,
                'product_name' => $line->variant?->product?->name,
            ])->values()->all(),
        ];
    }
}

