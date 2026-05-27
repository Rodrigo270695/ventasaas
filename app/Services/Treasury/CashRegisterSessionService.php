<?php

namespace App\Services\Treasury;

use App\Models\TreasuryCashRegister;
use App\Models\TreasuryCashRegisterSession;
use App\Models\TreasuryPayment;
use App\Models\TreasuryPaymentMethod;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class CashRegisterSessionService
{
    /**
     * @param  array{opening_float?: float|string, opening_notes?: string|null}  $data
     */
    public function open(TreasuryCashRegister $register, User $user, array $data): TreasuryCashRegisterSession
    {
        if (! $register->is_active) {
            throw new InvalidArgumentException('La caja no está activa.');
        }

        $hasOpen = TreasuryCashRegisterSession::query()
            ->where('cash_register_id', $register->id)
            ->where('status', TreasuryCashRegisterSession::STATUS_OPEN)
            ->exists();

        if ($hasOpen) {
            throw new InvalidArgumentException('Esta caja ya tiene una sesión abierta.');
        }

        $openingFloat = max(0, round((float) ($data['opening_float'] ?? 0), 4));

        return TreasuryCashRegisterSession::query()->create([
            'cash_register_id' => $register->id,
            'status' => TreasuryCashRegisterSession::STATUS_OPEN,
            'opened_at' => now(),
            'opened_by' => $user->id,
            'opening_float' => $openingFloat,
            'opening_notes' => $data['opening_notes'] ?? null,
        ]);
    }

    /**
     * @param  array{closing_cash_counted: float|string, closing_notes?: string|null}  $data
     */
    public function close(TreasuryCashRegisterSession $session, User $user, array $data): TreasuryCashRegisterSession
    {
        if (! $session->isOpen()) {
            throw new InvalidArgumentException('La sesión ya está cerrada.');
        }

        $counted = round((float) $data['closing_cash_counted'], 4);

        if ($counted < 0) {
            throw new InvalidArgumentException('El efectivo contado no puede ser negativo.');
        }

        $summary = $this->buildSummary($session);
        $expected = $summary['expected_cash'];
        $difference = round($counted - $expected, 4);

        $session->update([
            'status' => TreasuryCashRegisterSession::STATUS_CLOSED,
            'closed_at' => now(),
            'closed_by' => $user->id,
            'expected_cash' => $expected,
            'closing_cash_counted' => $counted,
            'cash_difference' => $difference,
            'closing_notes' => $data['closing_notes'] ?? null,
        ]);

        return $session->fresh(['cashRegister', 'opener', 'closer']);
    }

    /**
     * @return array{
     *     opening_float: float,
     *     cash_collected: float,
     *     non_cash_collected: float,
     *     total_collected: float,
     *     expected_cash: float,
     *     payments_count: int
     * }
     */
    public function buildSummary(TreasuryCashRegisterSession $session): array
    {
        $cashMethodIds = TreasuryPaymentMethod::query()
            ->where('type', TreasuryPaymentMethod::TYPE_CASH)
            ->where('is_active', true)
            ->pluck('id');

        $payments = TreasuryPayment::query()
            ->where('cash_register_session_id', $session->id)
            ->where('direction', TreasuryPayment::DIRECTION_COLLECTION)
            ->get(['amount', 'payment_method_id']);

        $cashCollected = (float) $payments
            ->whereIn('payment_method_id', $cashMethodIds)
            ->sum('amount');

        $totalCollected = (float) $payments->sum('amount');
        $nonCashCollected = round($totalCollected - $cashCollected, 4);
        $openingFloat = (float) $session->opening_float;
        $expectedCash = round($openingFloat + $cashCollected, 4);

        return [
            'opening_float' => $openingFloat,
            'cash_collected' => $cashCollected,
            'non_cash_collected' => $nonCashCollected,
            'total_collected' => $totalCollected,
            'expected_cash' => $expectedCash,
            'payments_count' => $payments->count(),
        ];
    }

    public function resolveSessionForCollection(?string $sessionId, ?int $userId): ?TreasuryCashRegisterSession
    {
        if ($sessionId) {
            $session = TreasuryCashRegisterSession::query()
                ->where('id', $sessionId)
                ->where('status', TreasuryCashRegisterSession::STATUS_OPEN)
                ->first();

            if (! $session) {
                throw new InvalidArgumentException('La sesión de caja no es válida o ya está cerrada.');
            }

            return $session;
        }

        if (! $userId) {
            return null;
        }

        return TreasuryCashRegisterSession::query()
            ->where('status', TreasuryCashRegisterSession::STATUS_OPEN)
            ->where('opened_by', $userId)
            ->orderByDesc('opened_at')
            ->first();
    }

    /**
     * @return array<string, mixed>|null
     */
    public static function openSessionPayloadForUser(?User $user): ?array
    {
        if (! $user) {
            return null;
        }

        $session = TreasuryCashRegisterSession::query()
            ->where('status', TreasuryCashRegisterSession::STATUS_OPEN)
            ->where('opened_by', $user->id)
            ->with('cashRegister:id,name,code')
            ->orderByDesc('opened_at')
            ->first();

        if (! $session) {
            return null;
        }

        return [
            'id' => $session->id,
            'cash_register_id' => $session->cash_register_id,
            'cash_register_name' => $session->cashRegister?->name,
            'cash_register_code' => $session->cashRegister?->code,
            'opened_at_label' => $session->opened_at?->format('d/m/Y H:i'),
            'opening_float' => (string) $session->opening_float,
            'opening_float_label' => number_format((float) $session->opening_float, 2, '.', ','),
        ];
    }
}
