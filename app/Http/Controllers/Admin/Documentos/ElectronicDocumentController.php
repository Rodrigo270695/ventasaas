<?php

namespace App\Http\Controllers\Admin\Documentos;

use App\Http\Controllers\Controller;
use App\Models\ElectronicDocument;
use App\Services\ElectronicBilling\ElectronicDocumentService;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class ElectronicDocumentController extends Controller
{
    public function __construct(
        private readonly ElectronicDocumentService $electronicDocuments,
    ) {}

    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('electronic_documents.view'), 403);

        $status = $request->string('status')->toString() ?: null;
        $search = trim($request->string('search')->toString());

        $query = ElectronicDocument::query()
            ->with([
                'salesDocument.customer:id,legal_name,document_type,document_number',
                'salesDocument:id,full_number,series,sunat_document_type_code,issue_date,total,currency_code,status',
            ])
            ->orderByDesc('created_at');

        if ($status) {
            $query->where('status', $status);
        }

        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder->where('sunat_description', 'like', "%{$search}%")
                    ->orWhere('sunat_response_code', 'like', "%{$search}%")
                    ->orWhereHas('salesDocument', function ($sales) use ($search) {
                        $sales->where('full_number', 'like', "%{$search}%")
                            ->orWhereHas('customer', function ($customer) use ($search) {
                                $customer->where('legal_name', 'like', "%{$search}%")
                                    ->orWhere('document_number', 'like', "%{$search}%");
                            });
                    });
            });
        }

        $documents = $query->get();

        $statusCounts = ElectronicDocument::query()
            ->selectRaw('status, count(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        return Inertia::render('admin/documentos/comprobantes-electronicos/index', [
            'documents' => $documents->map(fn (ElectronicDocument $row) => $this->mapListRow($row)),
            'filters' => [
                'status' => $status,
                'search' => $search,
            ],
            'statusOptions' => $this->statusOptions(),
            'stats' => [
                ['key' => 'total', 'label' => 'Total CPE', 'value' => $statusCounts->sum(), 'tone' => 'violet'],
                ['key' => 'pending', 'label' => 'Pendientes', 'value' => (int) ($statusCounts[ElectronicDocument::STATUS_PENDING] ?? 0), 'tone' => 'amber'],
                ['key' => 'accepted', 'label' => 'Aceptados', 'value' => (int) ($statusCounts[ElectronicDocument::STATUS_ACCEPTED] ?? 0), 'tone' => 'green'],
                ['key' => 'rejected', 'label' => 'Rechazados', 'value' => (int) ($statusCounts[ElectronicDocument::STATUS_REJECTED] ?? 0), 'tone' => 'pink'],
            ],
        ]);
    }

    public function show(Request $request, ElectronicDocument $comprobanteElectronico): Response
    {
        abort_unless($request->user()?->can('electronic_documents.view'), 403);

        $comprobanteElectronico->load([
            'salesDocument.customer',
            'salesDocument.lines',
            'events' => fn ($query) => $query->orderBy('created_at'),
        ]);

        return Inertia::render('admin/documentos/comprobantes-electronicos/show', [
            'document' => $this->mapDetail($comprobanteElectronico),
        ]);
    }

    public function reemit(Request $request, ElectronicDocument $comprobanteElectronico): RedirectResponse
    {
        abort_unless($request->user()?->can('electronic_documents.manage'), 403);

        try {
            $this->electronicDocuments->retryEmission($comprobanteElectronico);
        } catch (InvalidArgumentException $exception) {
            Toast::error($exception->getMessage());

            return back();
        }

        Toast::success('Comprobante electrónico encolado para emisión.');

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function mapListRow(ElectronicDocument $row): array
    {
        $sale = $row->salesDocument;

        return [
            'id' => $row->id,
            'sales_document_id' => $row->sales_document_id,
            'full_number' => $sale?->full_number ?? '—',
            'document_type_label' => $sale?->documentTypeLabel() ?? '—',
            'series' => $sale?->series,
            'issue_date' => $sale?->issue_date?->format('Y-m-d'),
            'issue_date_label' => $sale?->issue_date?->format('d/m/Y'),
            'customer_name' => $sale?->customer?->legal_name,
            'customer_document' => $sale?->customer
                ? $sale->customer->documentLabel().' '.$sale->customer->document_number
                : null,
            'total' => $sale ? (string) $sale->total : '0',
            'total_label' => $sale
                ? number_format((float) $sale->total, 2, '.', ',')
                : '0.00',
            'currency_code' => $sale?->currency_code ?? 'PEN',
            'gateway' => $row->gateway,
            'status' => $row->status,
            'status_label' => $row->statusLabel(),
            'sunat_response_code' => $row->sunat_response_code,
            'sunat_description' => $row->sunat_description,
            'retry_count' => $row->retry_count,
            'sent_at' => $row->sent_at?->toIso8601String(),
            'sent_at_label' => $this->formatDateTimeLabel($row->sent_at),
            'accepted_at' => $row->accepted_at?->toIso8601String(),
            'accepted_at_label' => $this->formatDateTimeLabel($row->accepted_at),
            'updated_at' => $row->updated_at?->toIso8601String(),
            'can_reemit' => $this->canReemit($row),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function mapDetail(ElectronicDocument $row): array
    {
        $sale = $row->salesDocument;

        return [
            ...$this->mapListRow($row),
            'ubl_version' => $row->ubl_version,
            'xml_hash' => $row->xml_hash,
            'xml_path' => $row->xml_path,
            'cdr_path' => $row->cdr_path,
            'sunat_ticket' => $row->sunat_ticket,
            'created_at' => $row->created_at?->toIso8601String(),
            'sale_status' => $sale?->status,
            'sale_status_label' => $sale?->statusLabel(),
            'lines_count' => $sale?->lines->count() ?? 0,
            'events' => $row->events->map(fn ($event) => [
                'id' => $event->id,
                'event' => $event->event,
                'event_label' => $this->eventLabel($event->event),
                'payload' => $event->payload,
                'created_at' => $event->created_at?->toIso8601String(),
                'created_at_label' => $this->formatDateTimeLabel($event->created_at),
            ])->values()->all(),
        ];
    }

    private function canReemit(ElectronicDocument $row): bool
    {
        return ! in_array($row->status, [
            ElectronicDocument::STATUS_ACCEPTED,
            ElectronicDocument::STATUS_BUILDING,
        ], true);
    }

    private function formatDateTimeLabel(?\DateTimeInterface $value): ?string
    {
        if ($value === null) {
            return null;
        }

        return $value
            ->timezone(config('app.timezone'))
            ->format('d/m/Y H:i:s');
    }

    private function eventLabel(string $event): string
    {
        return match ($event) {
            'queued' => 'En cola',
            'building' => 'Generando',
            'sent' => 'Enviado',
            'accepted' => 'Aceptado',
            'rejected' => 'Rechazado',
            'error' => 'Error',
            default => $event,
        };
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    private function statusOptions(): array
    {
        return [
            ['value' => '', 'label' => 'Todos los estados'],
            ['value' => ElectronicDocument::STATUS_PENDING, 'label' => 'Pendiente'],
            ['value' => ElectronicDocument::STATUS_BUILDING, 'label' => 'Generando'],
            ['value' => ElectronicDocument::STATUS_SENT, 'label' => 'Enviado'],
            ['value' => ElectronicDocument::STATUS_ACCEPTED, 'label' => 'Aceptado'],
            ['value' => ElectronicDocument::STATUS_REJECTED, 'label' => 'Rechazado'],
            ['value' => ElectronicDocument::STATUS_OBSERVED, 'label' => 'Observado'],
            ['value' => ElectronicDocument::STATUS_CANCELLED, 'label' => 'Anulado'],
        ];
    }
}
