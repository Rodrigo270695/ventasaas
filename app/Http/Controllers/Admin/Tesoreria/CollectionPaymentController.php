<?php

namespace App\Http\Controllers\Admin\Tesoreria;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Tesoreria\IndexCollectionPaymentsRequest;
use App\Http\Requests\Admin\Tesoreria\StoreCollectionPaymentRequest;
use App\Models\SalesDocument;
use App\Models\TreasuryPayment;
use App\Models\TreasuryPaymentMethod;
use App\Services\Treasury\PaymentCollectionService;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class CollectionPaymentController extends Controller
{
    public function __construct(
        private readonly PaymentCollectionService $collections,
    ) {}

    public function index(IndexCollectionPaymentsRequest $request): Response
    {
        $search = trim((string) $request->validated('search', ''));
        [$from, $to, $period] = $this->resolveCollectionDateFilters($request);

        $query = TreasuryPayment::query()
            ->where('direction', TreasuryPayment::DIRECTION_COLLECTION)
            ->with([
                'party:id,legal_name,document_type,document_number',
                'paymentMethod:id,name,code',
                'allocations.salesDocument:id,full_number,series,number,total,currency_code',
                'creator:id,name',
            ])
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
                    ->orWhereHas('allocations.salesDocument', function ($doc) use ($search) {
                        $doc->where('full_number', 'like', "%{$search}%");
                    });
            });
        }

        $payments = $query->limit(200)->get();

        $totalAmount = (float) $payments->sum('amount');

        return Inertia::render('admin/tesoreria/cobros/index', [
            'payments' => $payments->map(fn (TreasuryPayment $payment) => $this->mapPaymentRow($payment)),
            'filters' => [
                'search' => $search,
                'from' => $from,
                'to' => $to,
                'period' => $period,
            ],
            'stats' => [
                [
                    'key' => 'count',
                    'label' => 'Cobros',
                    'value' => $payments->count(),
                    'tone' => 'violet',
                    'filter' => ['period' => 'month'],
                ],
                [
                    'key' => 'total',
                    'label' => 'Monto cobrado',
                    'value' => number_format($totalAmount, 2, '.', ','),
                    'tone' => 'green',
                    'filter' => ['period' => 'today'],
                ],
            ],
        ]);
    }

    /**
     * @return array{0: string, 1: string, 2: string|null}
     */
    private function resolveCollectionDateFilters(IndexCollectionPaymentsRequest $request): array
    {
        $period = $request->validated('period');

        if ($period === 'today') {
            $today = now()->toDateString();

            return [$today, $today, 'today'];
        }

        if ($period === 'month') {
            return [
                now()->startOfMonth()->toDateString(),
                now()->endOfMonth()->toDateString(),
                'month',
            ];
        }

        $from = $request->validated('from');
        $to = $request->validated('to');

        if ($from && $to) {
            return [$from, $to, null];
        }

        return [
            now()->startOfMonth()->toDateString(),
            now()->endOfMonth()->toDateString(),
            'month',
        ];
    }

    public function store(StoreCollectionPaymentRequest $request): RedirectResponse
    {
        abort_unless($request->user()?->can('treasury.collections.create'), 403);

        $document = SalesDocument::query()->findOrFail($request->validated('sales_document_id'));

        try {
            $this->collections->recordForSalesDocument($document, [
                ...$request->validated(),
                'created_by' => $request->user()?->id,
            ]);
        } catch (InvalidArgumentException $exception) {
            throw ValidationException::withMessages([
                'amount' => $exception->getMessage(),
            ]);
        }

        Toast::success('Cobro registrado correctamente.');

        $redirect = $request->string('redirect')->toString();

        if ($redirect === 'sales_index') {
            return to_route('admin.ventas.comprobantes.index');
        }

        if ($redirect === 'internal_sales_index') {
            return to_route('admin.ventas.tickets-internos.index');
        }

        if ($redirect === 'sales_edit' && $document->id) {
            $editRoute = $document->is_internal
                ? 'admin.ventas.tickets-internos.edit'
                : 'admin.ventas.comprobantes.edit';

            return redirect()->route($editRoute, $document);
        }

        if ($redirect === 'receivables_index') {
            return to_route('admin.tesoreria.cuentas-por-cobrar.index');
        }

        return to_route('admin.tesoreria.cobros.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function mapPaymentRow(TreasuryPayment $payment): array
    {
        $allocation = $payment->allocations->first();
        $document = $allocation?->salesDocument;
        $recordedAt = $payment->created_at?->timezone(config('app.timezone'));

        return [
            'id' => $payment->id,
            'payment_date' => $payment->payment_date?->format('Y-m-d'),
            'payment_date_label' => $payment->payment_date?->format('d/m/Y'),
            'recorded_at' => $recordedAt?->toIso8601String(),
            'recorded_at_label' => $recordedAt?->format('d/m/Y H:i'),
            'amount' => (string) $payment->amount,
            'amount_label' => number_format((float) $payment->amount, 2, '.', ','),
            'currency_code' => $payment->currency_code,
            'reference' => $payment->reference,
            'notes' => $payment->notes,
            'payment_method_name' => $payment->paymentMethod?->name,
            'party_name' => $payment->party?->legal_name,
            'party_document' => $payment->party
                ? $payment->party->documentLabel().' '.$payment->party->document_number
                : null,
            'sales_document_id' => $document?->id,
            'sales_document_number' => $document?->full_number,
            'created_by_name' => $payment->creator?->name,
        ];
    }

    /**
     * @return list<array{id: string, name: string, code: string}>
     */
    public static function activePaymentMethodsPayload(): array
    {
        return TreasuryPaymentMethod::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'code'])
            ->map(fn (TreasuryPaymentMethod $method) => [
                'id' => $method->id,
                'name' => $method->name,
                'code' => $method->code,
            ])
            ->all();
    }
}
