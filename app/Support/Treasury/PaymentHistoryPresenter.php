<?php

namespace App\Support\Treasury;

use App\Models\PurchaseDocument;
use App\Models\TreasuryPayment;
use App\Models\TreasuryPaymentAllocation;

class PaymentHistoryPresenter
{
    /**
     * @return list<array<string, mixed>>
     */
    public static function forPurchaseDocument(PurchaseDocument $document): array
    {
        return TreasuryPaymentAllocation::query()
            ->where('purchase_document_id', $document->id)
            ->with([
                'payment.paymentMethod:id,name,code',
                'payment.creator:id,name',
            ])
            ->get()
            ->sortByDesc(fn (TreasuryPaymentAllocation $row) => $row->payment?->payment_date)
            ->map(fn (TreasuryPaymentAllocation $row) => self::mapAllocation($row, $document->currency_code))
            ->filter(fn (array $row) => $row !== [])
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public static function mapPayment(TreasuryPayment $payment, ?string $documentNumber = null): array
    {
        $allocation = $payment->allocations->first();

        return [
            'id' => $payment->id,
            'payment_date' => $payment->payment_date?->format('Y-m-d'),
            'payment_date_label' => $payment->payment_date?->format('d/m/Y'),
            'amount' => (string) $payment->amount,
            'amount_label' => number_format((float) $payment->amount, 2, '.', ','),
            'currency_code' => $payment->currency_code,
            'reference' => $payment->reference,
            'notes' => $payment->notes,
            'payment_method_name' => $payment->paymentMethod?->name,
            'party_name' => $payment->party?->legal_name,
            'created_by_name' => $payment->creator?->name,
            'purchase_document_id' => $allocation?->purchase_document_id,
            'purchase_document_number' => $documentNumber,
            'has_proof' => filled($payment->proof_file_path),
            'proof_file_name' => $payment->proof_file_name,
            'proof_download_url' => self::proofDownloadUrl($payment),
            'proof_view_url' => self::proofViewUrl($payment),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function mapAllocation(
        TreasuryPaymentAllocation $allocation,
        string $currencyCode,
    ): array {
        $payment = $allocation->payment;

        if (! $payment) {
            return [];
        }

        return [
            'id' => $payment->id,
            'payment_date' => $payment->payment_date?->format('Y-m-d'),
            'payment_date_label' => $payment->payment_date?->format('d/m/Y'),
            'amount' => (string) $allocation->amount,
            'amount_label' => number_format((float) $allocation->amount, 2, '.', ','),
            'currency_code' => $currencyCode,
            'reference' => $payment->reference,
            'notes' => $payment->notes,
            'payment_method_name' => $payment->paymentMethod?->name,
            'created_by_name' => $payment->creator?->name,
            'has_proof' => filled($payment->proof_file_path),
            'proof_file_name' => $payment->proof_file_name,
            'proof_download_url' => self::proofDownloadUrl($payment),
            'proof_view_url' => self::proofViewUrl($payment),
        ];
    }

    private static function proofDownloadUrl(TreasuryPayment $payment): ?string
    {
        if (! filled($payment->proof_file_path)) {
            return null;
        }

        return route('admin.tesoreria.pagos-proveedor.proof', $payment);
    }

    private static function proofViewUrl(TreasuryPayment $payment): ?string
    {
        if (! filled($payment->proof_file_path)) {
            return null;
        }

        return route('admin.tesoreria.pagos-proveedor.proof', [
            'pago' => $payment,
            'inline' => 1,
        ]);
    }
}
