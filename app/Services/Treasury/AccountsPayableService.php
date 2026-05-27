<?php

namespace App\Services\Treasury;

use App\Models\PurchaseDocument;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class AccountsPayableService
{
    public function __construct(
        private readonly PaymentDisbursementService $disbursements,
    ) {}

    /**
     * @param  array{
     *     search?: string,
     *     from?: string|null,
     *     to?: string|null,
     *     aging?: string|null,
     *     payment_status?: string|null
     * }  $filters
     * @return Collection<int, PurchaseDocument>
     */
    public function listOpenDocuments(array $filters = []): Collection
    {
        $query = $this->baseQuery();

        $search = trim((string) ($filters['search'] ?? ''));

        if ($search !== '') {
            $query->where(function (Builder $builder) use ($search) {
                $builder->where('internal_number', 'like', "%{$search}%")
                    ->orWhere('supplier_document_number', 'like', "%{$search}%")
                    ->orWhereHas('supplier', function (Builder $supplier) use ($search) {
                        $supplier->where('legal_name', 'like', "%{$search}%")
                            ->orWhere('document_number', 'like', "%{$search}%");
                    });
            });
        }

        if (! empty($filters['from'])) {
            $query->whereDate('issue_date', '>=', $filters['from']);
        }

        if (! empty($filters['to'])) {
            $query->whereDate('issue_date', '<=', $filters['to']);
        }

        $paymentStatus = $filters['payment_status'] ?? null;

        if (in_array($paymentStatus, [PurchaseDocument::PAYMENT_UNPAID, PurchaseDocument::PAYMENT_PARTIAL], true)) {
            $query->where('payment_status', $paymentStatus);
        }

        $documents = $query
            ->orderByDesc('issue_date')
            ->orderByDesc('created_at')
            ->limit(500)
            ->get()
            ->filter(fn (PurchaseDocument $document) => $this->disbursements->balanceDue($document) > 0.0001);

        $aging = $filters['aging'] ?? null;

        if ($aging === 'overdue') {
            return $documents->filter(fn (PurchaseDocument $document) => $this->isOverdue($document))->values();
        }

        if ($aging === 'current') {
            return $documents->filter(fn (PurchaseDocument $document) => ! $this->isOverdue($document))->values();
        }

        return $documents->values();
    }

    /**
     * @param  Collection<int, PurchaseDocument>  $documents
     * @return array{total_balance: float, documents_count: int, overdue_count: int, overdue_balance: float}
     */
    public function summarize(Collection $documents): array
    {
        $totalBalance = 0.0;
        $overdueCount = 0;
        $overdueBalance = 0.0;

        foreach ($documents as $document) {
            $balance = $this->disbursements->balanceDue($document);
            $totalBalance += $balance;

            if ($this->isOverdue($document)) {
                $overdueCount++;
                $overdueBalance += $balance;
            }
        }

        return [
            'total_balance' => round($totalBalance, 4),
            'documents_count' => $documents->count(),
            'overdue_count' => $overdueCount,
            'overdue_balance' => round($overdueBalance, 4),
        ];
    }

    public function isOverdue(PurchaseDocument $document): bool
    {
        if (! $document->due_date) {
            return false;
        }

        if ($this->disbursements->balanceDue($document) <= 0.0001) {
            return false;
        }

        return $document->due_date->startOfDay()->lt(now()->startOfDay());
    }

    public function daysOverdue(PurchaseDocument $document): int
    {
        if (! $this->isOverdue($document) || ! $document->due_date) {
            return 0;
        }

        return (int) $document->due_date->startOfDay()->diffInDays(now()->startOfDay());
    }

    public function agingLabel(PurchaseDocument $document): string
    {
        if ($this->isOverdue($document)) {
            $days = $this->daysOverdue($document);

            return $days === 1 ? '1 día vencido' : "{$days} días vencido";
        }

        if ($document->due_date) {
            $daysUntil = (int) now()->startOfDay()->diffInDays($document->due_date->startOfDay(), false);

            if ($daysUntil > 0) {
                return $daysUntil === 1 ? 'Vence en 1 día' : "Vence en {$daysUntil} días";
            }
        }

        return 'Al día';
    }

    public function formatMoney(float $amount): string
    {
        return number_format($amount, 2, '.', ',');
    }

    public function referenceDateLabel(?CarbonInterface $date): ?string
    {
        return $date?->format('d/m/Y');
    }

    /**
     * @return Builder<PurchaseDocument>
     */
    private function baseQuery(): Builder
    {
        return PurchaseDocument::query()
            ->where('status', PurchaseDocument::STATUS_CONFIRMED)
            ->whereIn('payment_status', [
                PurchaseDocument::PAYMENT_UNPAID,
                PurchaseDocument::PAYMENT_PARTIAL,
            ])
            ->with([
                'supplier:id,legal_name,document_type,document_number',
            ])
            ->withSum('paymentAllocations as amount_paid', 'amount');
    }
}
