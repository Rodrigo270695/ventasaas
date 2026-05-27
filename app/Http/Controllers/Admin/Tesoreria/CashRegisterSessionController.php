<?php

namespace App\Http\Controllers\Admin\Tesoreria;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Tesoreria\CloseCashRegisterSessionRequest;
use App\Http\Requests\Admin\Tesoreria\OpenCashRegisterSessionRequest;
use App\Models\TreasuryCashRegister;
use App\Models\TreasuryCashRegisterSession;
use App\Services\Treasury\CashRegisterSessionService;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

class CashRegisterSessionController extends Controller
{
    public function __construct(
        private readonly CashRegisterSessionService $sessions,
    ) {}

    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('treasury.cash_sessions.view'), 403);

        if ($request->boolean('_reset')) {
            $request->session()->forget([
                'openSessionModal',
                'sessionCloseModalId',
                'errors',
            ]);
        }

        $status = $request->string('status')->toString() ?: null;

        $query = TreasuryCashRegisterSession::query()
            ->with([
                'cashRegister:id,code,name',
                'opener:id,name',
                'closer:id,name',
            ])
            ->orderByDesc('opened_at');

        if ($status === TreasuryCashRegisterSession::STATUS_OPEN) {
            $query->where('status', TreasuryCashRegisterSession::STATUS_OPEN);
        } elseif ($status === TreasuryCashRegisterSession::STATUS_CLOSED) {
            $query->where('status', TreasuryCashRegisterSession::STATUS_CLOSED);
        }

        $sessions = $query->limit(100)->get();

        $openCount = TreasuryCashRegisterSession::query()
            ->where('status', TreasuryCashRegisterSession::STATUS_OPEN)
            ->count();

        $closedCount = TreasuryCashRegisterSession::query()
            ->where('status', TreasuryCashRegisterSession::STATUS_CLOSED)
            ->count();

        $openRegisters = TreasuryCashRegister::query()
            ->where('is_active', true)
            ->whereDoesntHave('openSession')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'code', 'name'])
            ->map(fn (TreasuryCashRegister $register) => [
                'value' => $register->id,
                'label' => $register->name,
                'sublabel' => $register->code,
            ])
            ->all();

        $userOpenSession = CashRegisterSessionService::openSessionPayloadForUser($request->user());

        return Inertia::render('admin/tesoreria/sesiones/index', [
            'sessions' => $sessions->map(fn (TreasuryCashRegisterSession $session) => $this->mapRow($session)),
            'cashRegisterOptions' => $openRegisters,
            'userOpenSession' => $userOpenSession,
            'filters' => [
                'status' => $status,
            ],
            'stats' => [
                [
                    'key' => 'open',
                    'label' => 'Abiertas',
                    'value' => $openCount,
                    'tone' => 'green',
                ],
                [
                    'key' => 'closed',
                    'label' => 'Cerradas',
                    'value' => $closedCount,
                    'tone' => 'violet',
                ],
            ],
            'openSessionModal' => session()->pull('openSessionModal'),
            'sessionCloseModalId' => session()->pull('sessionCloseModalId'),
            'oldForm' => $this->oldFormDefaults(),
        ]);
    }

    public function store(OpenCashRegisterSessionRequest $request): RedirectResponse
    {
        $register = TreasuryCashRegister::query()->findOrFail($request->validated('cash_register_id'));

        try {
            $this->sessions->open($register, $request->user(), $request->validated());
        } catch (InvalidArgumentException $exception) {
            session()->flash('openSessionModal', true);

            throw ValidationException::withMessages([
                'cash_register_id' => $exception->getMessage(),
            ]);
        }

        Toast::success('Sesión de caja abierta.');

        return to_route('admin.tesoreria.sesiones.index', ['status' => TreasuryCashRegisterSession::STATUS_OPEN]);
    }

    public function close(
        CloseCashRegisterSessionRequest $request,
        TreasuryCashRegisterSession $sesion,
    ): RedirectResponse {
        try {
            $this->sessions->close($sesion, $request->user(), $request->validated());
        } catch (InvalidArgumentException $exception) {
            session()->flash('sessionCloseModalId', $sesion->id);

            throw ValidationException::withMessages([
                'closing_cash_counted' => $exception->getMessage(),
            ]);
        }

        Toast::success('Sesión de caja cerrada.');

        return to_route('admin.tesoreria.sesiones.index');
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function openSessionPayloadForUser(?\App\Models\User $user): ?array
    {
        return CashRegisterSessionService::openSessionPayloadForUser($user);
    }

    /**
     * @return array<string, mixed>
     */
    private function mapRow(TreasuryCashRegisterSession $session): array
    {
        $summary = $session->isOpen()
            ? $this->sessions->buildSummary($session)
            : null;

        return [
            'id' => $session->id,
            'status' => $session->status,
            'status_label' => $session->statusLabel(),
            'cash_register_id' => $session->cash_register_id,
            'cash_register_name' => $session->cashRegister?->name,
            'cash_register_code' => $session->cashRegister?->code,
            'opened_at' => $session->opened_at?->toIso8601String(),
            'opened_at_label' => $session->opened_at?->format('d/m/Y H:i'),
            'closed_at_label' => $session->closed_at?->format('d/m/Y H:i'),
            'opened_by_name' => $session->opener?->name,
            'closed_by_name' => $session->closer?->name,
            'opening_float' => (string) $session->opening_float,
            'opening_float_label' => number_format((float) $session->opening_float, 2, '.', ','),
            'expected_cash' => $session->expected_cash !== null ? (string) $session->expected_cash : null,
            'expected_cash_label' => $session->expected_cash !== null
                ? number_format((float) $session->expected_cash, 2, '.', ',')
                : ($summary ? number_format($summary['expected_cash'], 2, '.', ',') : null),
            'closing_cash_counted_label' => $session->closing_cash_counted !== null
                ? number_format((float) $session->closing_cash_counted, 2, '.', ',')
                : null,
            'cash_difference_label' => $session->cash_difference !== null
                ? number_format((float) $session->cash_difference, 2, '.', ',')
                : null,
            'summary' => $summary ? [
                'cash_collected_label' => number_format($summary['cash_collected'], 2, '.', ','),
                'non_cash_collected_label' => number_format($summary['non_cash_collected'], 2, '.', ','),
                'total_collected_label' => number_format($summary['total_collected'], 2, '.', ','),
                'payments_count' => $summary['payments_count'],
            ] : null,
            'can_close' => $session->isOpen()
                && (request()->user()?->can('treasury.cash_sessions.close') ?? false),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function oldFormDefaults(): array
    {
        return [
            'cash_register_id' => old('cash_register_id', ''),
            'opening_float' => old('opening_float', '0'),
            'opening_notes' => old('opening_notes', ''),
        ];
    }
}
