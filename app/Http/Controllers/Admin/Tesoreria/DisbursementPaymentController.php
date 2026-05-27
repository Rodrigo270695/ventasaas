<?php

namespace App\Http\Controllers\Admin\Tesoreria;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Tesoreria\IndexDisbursementPaymentsRequest;
use App\Http\Requests\Admin\Tesoreria\StoreDisbursementPaymentRequest;
use App\Http\Requests\Admin\Tesoreria\UpdateDisbursementPaymentRequest;
use App\Support\Treasury\TreasuryAuthorization;
use App\Models\PurchaseDocument;
use App\Models\TreasuryPayment;
use App\Services\Treasury\PaymentDisbursementService;
use App\Support\Toast;
use App\Support\Treasury\PaymentHistoryPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DisbursementPaymentController extends Controller
{
    public function __construct(
        private readonly PaymentDisbursementService $disbursements,
    ) {}

    public function index(IndexDisbursementPaymentsRequest $request): Response
    {
        $search = trim((string) $request->validated('search', ''));
        [$from, $to] = $this->resolveDateFilters($request);

        $query = TreasuryPayment::query()
            ->where('direction', TreasuryPayment::DIRECTION_DISBURSEMENT)
            ->with([
                'party:id,legal_name,document_type,document_number',
                'paymentMethod:id,name,code',
                'allocations.purchaseDocument:id,internal_number,supplier_document_number,currency_code',
                'creator:id,name',
            ])
            ->orderByDesc('payment_date')
            ->orderByDesc('created_at');

        if ($from) {
            $query->whereDate('payment_date', '>=', $from);
        }

        if ($to) {
            $query->whereDate('payment_date', '<=', $to);
        }

        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder->where('reference', 'like', "%{$search}%")
                    ->orWhereHas('party', function ($party) use ($search) {
                        $party->where('legal_name', 'like', "%{$search}%")
                            ->orWhere('document_number', 'like', "%{$search}%");
                    })
                    ->orWhereHas('allocations.purchaseDocument', function ($doc) use ($search) {
                        $doc->where('internal_number', 'like', "%{$search}%")
                            ->orWhere('supplier_document_number', 'like', "%{$search}%");
                    });
            });
        }

        $payments = $query->limit(200)->get();

        return Inertia::render('admin/tesoreria/pagos-proveedor/index', [
            'canUpdatePayment' => TreasuryAuthorization::canUpdateDisbursements($request->user()),
            'payments' => $payments->map(function (TreasuryPayment $payment) {
                $doc = $payment->allocations->first()?->purchaseDocument;

                return PaymentHistoryPresenter::mapPayment(
                    $payment,
                    $doc?->displayNumber(),
                );
            }),
            'filters' => [
                'search' => $search,
                'from' => $from,
                'to' => $to,
            ],
            'stats' => [
                [
                    'key' => 'count',
                    'label' => 'Pagos',
                    'value' => $payments->count(),
                    'tone' => 'violet',
                ],
                [
                    'key' => 'total',
                    'label' => 'Monto pagado',
                    'value' => number_format((float) $payments->sum('amount'), 2, '.', ','),
                    'tone' => 'amber',
                ],
            ],
        ]);
    }

    public function store(StoreDisbursementPaymentRequest $request): RedirectResponse
    {
        abort_unless(TreasuryAuthorization::canCreateDisbursements($request->user()), 403);

        $document = PurchaseDocument::query()->findOrFail($request->validated('purchase_document_id'));

        try {
            $this->disbursements->recordForPurchaseDocument(
                $document,
                [
                    ...$request->validated(),
                    'created_by' => $request->user()?->id,
                ],
                $request->file('proof_file'),
            );
        } catch (InvalidArgumentException $exception) {
            throw ValidationException::withMessages([
                'amount' => $exception->getMessage(),
            ]);
        }

        Toast::success('Pago a proveedor registrado correctamente.');

        $redirect = $request->string('redirect')->toString();

        if ($redirect === 'purchase_edit' && $document->id) {
            return redirect()->route('admin.compras.facturas.edit', $document);
        }

        if ($redirect === 'purchases_index') {
            return redirect()->route('admin.compras.facturas.index');
        }

        return to_route('admin.tesoreria.cuentas-por-pagar.index');
    }

    public function update(
        UpdateDisbursementPaymentRequest $request,
        TreasuryPayment $pago,
    ): RedirectResponse {
        abort_unless($pago->direction === TreasuryPayment::DIRECTION_DISBURSEMENT, 404);

        $this->disbursements->updatePayment(
            $pago,
            $request->safe()->only(['reference', 'notes']),
            $request->file('proof_file'),
        );

        Toast::success('Pago actualizado correctamente.');

        return back();
    }

    public function proof(Request $request, TreasuryPayment $pago): StreamedResponse|\Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        abort_unless(TreasuryAuthorization::canViewDisbursements($request->user()), 403);
        abort_unless($pago->direction === TreasuryPayment::DIRECTION_DISBURSEMENT, 404);
        abort_unless($pago->hasProofFile(), 404);

        $path = Storage::disk('local')->path($pago->proof_file_path);
        $filename = $pago->proof_file_name ?? 'comprobante-pago';

        if ($request->boolean('inline')) {
            $mime = Storage::disk('local')->mimeType($pago->proof_file_path) ?? 'application/octet-stream';

            return response()->file($path, [
                'Content-Type' => $mime,
                'Content-Disposition' => 'inline; filename="'.$filename.'"',
            ]);
        }

        return Storage::disk('local')->download($pago->proof_file_path, $filename);
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function resolveDateFilters(IndexDisbursementPaymentsRequest $request): array
    {
        $from = $request->validated('from');
        $to = $request->validated('to');

        if (! $from && ! $to) {
            $start = now()->startOfMonth();
            $end = now()->endOfMonth();

            return [$start->toDateString(), $end->toDateString()];
        }

        return [
            $from ?? now()->subMonths(3)->toDateString(),
            $to ?? now()->toDateString(),
        ];
    }

    private function redirectAfterPayment(string $redirect, TreasuryPayment $pago): RedirectResponse
    {
        $document = $pago->allocations->first()?->purchaseDocument;

        if ($redirect === 'purchase_edit' && $document) {
            return redirect()->route('admin.compras.facturas.edit', $document);
        }

        if ($redirect === 'purchases_index') {
            return redirect()->route('admin.compras.facturas.index');
        }

        if ($redirect === 'disbursements_index') {
            return redirect()->route('admin.tesoreria.pagos-proveedor.index');
        }

        return to_route('admin.tesoreria.cuentas-por-pagar.index');
    }
}
