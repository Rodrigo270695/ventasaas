<?php

namespace App\Http\Controllers\Admin\Tesoreria;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Tesoreria\IndexAccountsReceivableRequest;
use App\Models\SalesDocument;
use App\Services\Treasury\AccountsReceivableService;
use App\Services\Treasury\PaymentCollectionService;
use Inertia\Inertia;
use Inertia\Response;

class AccountsReceivableController extends Controller
{
    public function __construct(
        private readonly AccountsReceivableService $receivables,
        private readonly PaymentCollectionService $collections,
    ) {}

    public function index(IndexAccountsReceivableRequest $request): Response
    {
        $filters = [
            'search' => trim((string) $request->validated('search', '')),
            'from' => $request->validated('from'),
            'to' => $request->validated('to'),
            'aging' => $request->validated('aging'),
            'payment_status' => $request->validated('payment_status'),
        ];

        $documents = $this->receivables->listOpenDocuments($filters);
        $summary = $this->receivables->summarize($documents);

        $canRecordPayment = $request->user()?->can('treasury.collections.create') ?? false;

        return Inertia::render('admin/tesoreria/cuentas-por-cobrar/index', [
            'documents' => $documents->map(fn (SalesDocument $doc) => $this->mapRow($doc)),
            'filters' => $filters,
            'stats' => [
                [
                    'key' => 'balance',
                    'label' => 'Total por cobrar',
                    'value' => $this->receivables->formatMoney($summary['total_balance']),
                    'tone' => 'violet',
                ],
                [
                    'key' => 'count',
                    'label' => 'Documentos',
                    'value' => $summary['documents_count'],
                    'tone' => 'slate',
                ],
                [
                    'key' => 'overdue',
                    'label' => 'Vencido',
                    'value' => $this->receivables->formatMoney($summary['overdue_balance']),
                    'tone' => 'amber',
                    'filter' => ['aging' => 'overdue'],
                ],
            ],
            'paymentMethods' => $canRecordPayment
                ? CollectionPaymentController::activePaymentMethodsPayload()
                : [],
            'canRecordPayment' => $canRecordPayment,
            'openCashSession' => CashRegisterSessionController::openSessionPayloadForUser($request->user()),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function mapRow(SalesDocument $doc): array
    {
        $total = (float) $doc->total;
        $paid = (float) ($doc->amount_paid ?? 0);
        $balanceDue = $this->collections->balanceDue($doc);
        $isOverdue = $this->receivables->isOverdue($doc);

        $editBase = $doc->isInternal()
            ? '/admin/ventas/tickets-internos'
            : '/admin/ventas/comprobantes';

        return [
            'id' => $doc->id,
            'full_number' => $doc->full_number,
            'document_type_label' => $doc->documentTypeLabel(),
            'is_internal' => $doc->is_internal,
            'issue_date' => $doc->issue_date?->format('Y-m-d'),
            'issue_date_label' => $this->receivables->referenceDateLabel($doc->issue_date),
            'due_date' => $doc->due_date?->format('Y-m-d'),
            'due_date_label' => $this->receivables->referenceDateLabel($doc->due_date),
            'customer_name' => $doc->customer?->legal_name ?? 'Sin cliente',
            'customer_document' => $doc->customer
                ? $doc->customer->documentLabel().' '.$doc->customer->document_number
                : null,
            'payment_status' => $doc->payment_status,
            'payment_status_label' => $doc->paymentStatusLabel(),
            'amount_paid' => (string) $paid,
            'amount_paid_label' => $this->receivables->formatMoney($paid),
            'balance_due' => (string) $balanceDue,
            'balance_due_label' => $this->receivables->formatMoney($balanceDue),
            'total' => (string) $doc->total,
            'total_label' => $this->receivables->formatMoney($total),
            'currency_code' => $doc->currency_code,
            'can_receive_payment' => $doc->isConfirmed() && $balanceDue > 0.0001,
            'is_overdue' => $isOverdue,
            'days_overdue' => $this->receivables->daysOverdue($doc),
            'aging_label' => $this->receivables->agingLabel($doc),
            'document_edit_url' => "{$editBase}/{$doc->id}/edit",
        ];
    }
}
