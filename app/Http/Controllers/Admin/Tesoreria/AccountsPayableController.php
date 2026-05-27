<?php

namespace App\Http\Controllers\Admin\Tesoreria;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Tesoreria\IndexAccountsPayableRequest;
use App\Models\PurchaseDocument;
use App\Services\Treasury\AccountsPayableService;
use App\Services\Treasury\PaymentDisbursementService;
use App\Support\Datetime\PeruDateTime;
use App\Support\Treasury\PaymentHistoryPresenter;
use App\Support\Treasury\TreasuryAuthorization;
use Inertia\Inertia;
use Inertia\Response;

class AccountsPayableController extends Controller
{
    public function __construct(
        private readonly AccountsPayableService $payables,
        private readonly PaymentDisbursementService $disbursements,
    ) {}

    public function index(IndexAccountsPayableRequest $request): Response
    {
        $filters = [
            'search' => trim((string) $request->validated('search', '')),
            'from' => $request->validated('from'),
            'to' => $request->validated('to'),
            'aging' => $request->validated('aging'),
            'payment_status' => $request->validated('payment_status'),
        ];

        $documents = $this->payables->listOpenDocuments($filters);
        $summary = $this->payables->summarize($documents);

        $canRecordPayment = TreasuryAuthorization::canCreateDisbursements($request->user());
        $canUpdatePayment = TreasuryAuthorization::canUpdateDisbursements($request->user());

        return Inertia::render('admin/tesoreria/cuentas-por-pagar/index', [
            'documents' => $documents->map(fn (PurchaseDocument $doc) => $this->mapRow($doc)),
            'filters' => $filters,
            'stats' => [
                [
                    'key' => 'balance',
                    'label' => 'Total por pagar',
                    'value' => $this->payables->formatMoney($summary['total_balance']),
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
                    'value' => $this->payables->formatMoney($summary['overdue_balance']),
                    'tone' => 'amber',
                    'filter' => ['aging' => 'overdue'],
                ],
            ],
            'paymentMethods' => $canRecordPayment
                ? CollectionPaymentController::activePaymentMethodsPayload()
                : [],
            'canRecordPayment' => $canRecordPayment,
            'canUpdatePayment' => $canUpdatePayment,
            'openCashSession' => CashRegisterSessionController::openSessionPayloadForUser($request->user()),
            'canCreateInvoice' => $request->user()?->can('purchases.manage') ?? false,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function mapRow(PurchaseDocument $doc): array
    {
        $total = (float) $doc->total;
        $paid = (float) ($doc->amount_paid ?? 0);
        $balanceDue = $this->disbursements->balanceDue($doc);

        return [
            'id' => $doc->id,
            'internal_number' => $doc->internal_number,
            'supplier_document_number' => $doc->supplier_document_number,
            'display_number' => $doc->displayNumber(),
            'issue_date' => $doc->issue_date?->format('Y-m-d H:i:s'),
            'issue_date_label' => PeruDateTime::label($doc->issue_date),
            'due_date' => $doc->due_date?->format('Y-m-d'),
            'due_date_label' => $this->payables->referenceDateLabel($doc->due_date),
            'supplier_name' => $doc->supplier?->legal_name ?? '—',
            'supplier_document' => $doc->supplier
                ? $doc->supplier->documentLabel().' '.$doc->supplier->document_number
                : null,
            'payment_status' => $doc->payment_status,
            'payment_status_label' => $doc->paymentStatusLabel(),
            'amount_paid' => (string) $paid,
            'amount_paid_label' => $this->payables->formatMoney($paid),
            'balance_due' => (string) $balanceDue,
            'balance_due_label' => $this->payables->formatMoney($balanceDue),
            'total' => (string) $doc->total,
            'total_label' => $this->payables->formatMoney($total),
            'currency_code' => $doc->currency_code,
            'can_receive_payment' => $doc->isConfirmed() && $balanceDue > 0.0001,
            'is_overdue' => $this->payables->isOverdue($doc),
            'days_overdue' => $this->payables->daysOverdue($doc),
            'aging_label' => $this->payables->agingLabel($doc),
            'document_edit_url' => route('admin.compras.facturas.edit', $doc),
            'payment_history' => PaymentHistoryPresenter::forPurchaseDocument($doc),
        ];
    }
}
