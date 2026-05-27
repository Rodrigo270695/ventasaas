<?php

namespace App\Services\Treasury;

use App\Models\PurchaseDocument;
use App\Models\TreasuryPayment;
use App\Models\TreasuryPaymentAllocation;
use App\Models\TreasuryPaymentMethod;
use App\Support\Treasury\TreasuryPaymentProofStorage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class PaymentDisbursementService
{
    public function __construct(
        private readonly CashRegisterSessionService $cashSessions,
        private readonly TreasuryPaymentProofStorage $proofStorage,
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
    public function recordForPurchaseDocument(
        PurchaseDocument $document,
        array $data,
        ?UploadedFile $proofFile = null,
    ): TreasuryPayment {
        if (! $document->isConfirmed()) {
            throw new InvalidArgumentException('Solo se pueden pagar facturas confirmadas.');
        }

        if ($document->status === PurchaseDocument::STATUS_VOIDED) {
            throw new InvalidArgumentException('No se puede pagar una factura anulada.');
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
            throw new InvalidArgumentException('El monto del pago debe ser mayor a cero.');
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

        return DB::transaction(function () use ($document, $data, $method, $amount, $session, $proofFile) {
            $payment = TreasuryPayment::query()->create([
                'direction' => TreasuryPayment::DIRECTION_DISBURSEMENT,
                'party_id' => $document->supplier_party_id,
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
                'purchase_document_id' => $document->id,
                'amount' => $amount,
            ]);

            if ($proofFile) {
                $this->proofStorage->store($payment, $proofFile);
            }

            $this->syncPurchaseDocumentPaymentStatus($document->fresh());

            return $payment->load(['paymentMethod', 'allocations.purchaseDocument']);
        });
    }

    public function amountPaid(PurchaseDocument $document): float
    {
        return (float) TreasuryPaymentAllocation::query()
            ->where('purchase_document_id', $document->id)
            ->sum('amount');
    }

    public function balanceDue(PurchaseDocument $document): float
    {
        $paid = $this->amountPaid($document);

        return max(0, round((float) $document->total - $paid, 4));
    }

    /**
     * @param  array{
     *     reference?: string|null,
     *     notes?: string|null,
     * }  $data
     */
    public function updatePayment(
        TreasuryPayment $payment,
        array $data,
        ?UploadedFile $proofFile = null,
    ): TreasuryPayment {
        if ($payment->direction !== TreasuryPayment::DIRECTION_DISBURSEMENT) {
            throw new InvalidArgumentException('Solo se pueden editar pagos a proveedores.');
        }

        return DB::transaction(function () use ($payment, $data, $proofFile) {
            $payment->update([
                'reference' => array_key_exists('reference', $data)
                    ? ($data['reference'] ?: null)
                    : $payment->reference,
                'notes' => array_key_exists('notes', $data)
                    ? ($data['notes'] ?: null)
                    : $payment->notes,
            ]);

            if ($proofFile) {
                $this->proofStorage->store($payment, $proofFile);
            }

            return $payment->fresh(['paymentMethod', 'creator', 'allocations.purchaseDocument']);
        });
    }

    public function syncPurchaseDocumentPaymentStatus(PurchaseDocument $document): void
    {
        $total = round((float) $document->total, 4);
        $paid = $this->amountPaid($document);

        $status = PurchaseDocument::PAYMENT_UNPAID;

        if ($paid <= 0) {
            $status = PurchaseDocument::PAYMENT_UNPAID;
        } elseif ($paid + 0.0001 >= $total) {
            $status = PurchaseDocument::PAYMENT_PAID;
        } else {
            $status = PurchaseDocument::PAYMENT_PARTIAL;
        }

        $document->update(['payment_status' => $status]);
    }
}
