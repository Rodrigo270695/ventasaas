<?php

namespace App\Services\Treasury;

use App\Models\SalesDocument;
use App\Models\TreasuryPayment;
use App\Models\TreasuryPaymentAllocation;
use App\Models\TreasuryPaymentMethod;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class PaymentCollectionService
{
    public function __construct(
        private readonly CashRegisterSessionService $cashSessions,
    ) {}

    /**
     * @param  array{
     *     payment_method_id: string,
     *     payment_date: string,
     *     amount: float|string,
     *     reference?: string|null,
     *     notes?: string|null,
     *     created_by?: int|null,
     *     cash_register_session_id?: string|null
     * }  $data
     */
    public function recordForSalesDocument(SalesDocument $document, array $data): TreasuryPayment
    {
        if (! $document->isConfirmed()) {
            throw new InvalidArgumentException('Solo se pueden cobrar comprobantes confirmados.');
        }

        if ($document->status === SalesDocument::STATUS_VOIDED) {
            throw new InvalidArgumentException('No se puede cobrar un comprobante anulado.');
        }

        $method = TreasuryPaymentMethod::query()
            ->where('id', $data['payment_method_id'])
            ->where('is_active', true)
            ->first();

        if (! $method) {
            throw new InvalidArgumentException('El método de pago no es válido o está inactivo.');
        }

        $amount = round((float) $data['amount'], 4);

        if ($amount <= 0) {
            throw new InvalidArgumentException('El monto del cobro debe ser mayor a cero.');
        }

        $balanceDue = $this->balanceDue($document);

        if ($amount > $balanceDue + 0.0001) {
            throw new InvalidArgumentException(
                'El monto supera el saldo pendiente ('.number_format($balanceDue, 2, '.', '').').',
            );
        }

        $session = $this->cashSessions->resolveSessionForCollection(
            $data['cash_register_session_id'] ?? null,
            $data['created_by'] ?? null,
        );

        return DB::transaction(function () use ($document, $data, $method, $amount, $session) {
            $payment = TreasuryPayment::query()->create([
                'direction' => TreasuryPayment::DIRECTION_COLLECTION,
                'party_id' => $document->customer_party_id,
                'payment_method_id' => $method->id,
                'cash_register_session_id' => $session?->id,
                'payment_date' => $data['payment_date'],
                'currency_code' => $document->currency_code,
                'exchange_rate' => $document->exchange_rate,
                'amount' => $amount,
                'reference' => $data['reference'] ?? null,
                'notes' => $data['notes'] ?? null,
                'created_by' => $data['created_by'] ?? null,
            ]);

            TreasuryPaymentAllocation::query()->create([
                'treasury_payment_id' => $payment->id,
                'sales_document_id' => $document->id,
                'amount' => $amount,
            ]);

            $this->syncSalesDocumentPaymentStatus($document->fresh());

            return $payment->load(['paymentMethod', 'allocations.salesDocument']);
        });
    }

    public function amountPaid(SalesDocument $document): float
    {
        return (float) TreasuryPaymentAllocation::query()
            ->where('sales_document_id', $document->id)
            ->sum('amount');
    }

    public function balanceDue(SalesDocument $document): float
    {
        $paid = $this->amountPaid($document);

        return max(0, round((float) $document->total - $paid, 4));
    }

    public function syncSalesDocumentPaymentStatus(SalesDocument $document): void
    {
        $total = round((float) $document->total, 4);
        $paid = $this->amountPaid($document);

        $status = SalesDocument::PAYMENT_UNPAID;

        if ($paid <= 0) {
            $status = SalesDocument::PAYMENT_UNPAID;
        } elseif ($paid + 0.0001 >= $total) {
            $status = SalesDocument::PAYMENT_PAID;
        } else {
            $status = SalesDocument::PAYMENT_PARTIAL;
        }

        $document->update(['payment_status' => $status]);
    }

    public function paymentStatusLabel(string $status): string
    {
        return match ($status) {
            SalesDocument::PAYMENT_PAID => 'Pagado',
            SalesDocument::PAYMENT_PARTIAL => 'Pago parcial',
            default => 'Pendiente',
        };
    }
}
