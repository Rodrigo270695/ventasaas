<?php

namespace App\Services\Treasury;

use App\Models\SalesDocument;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class AccountsReceivableService
{
    public function __construct(
        private readonly PaymentCollectionService $collections,
    ) {}

    /**
     * @param  array{
     *     search?: string,
     *     from?: string|null,
     *     to?: string|null,
     *     aging?: string|null,
     *     payment_status?: string|null
     * }  $filters
     * @return Collection<int, SalesDocument>
     */
    public function listOpenDocuments(array $filters = []): Collection
    {
        $query = $this->baseQuery();

        $search = trim((string) ($filters['search'] ?? ''));

        if ($search !== '') {
            $query->where(function (Builder $builder) use ($search) {
                $builder->where('full_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', function (Builder $customer) use ($search) {
                        $customer->where('legal_name', 'like', "%{$search}%")
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

        if (in_array($paymentStatus, [SalesDocument::PAYMENT_UNPAID, SalesDocument::PAYMENT_PARTIAL], true)) {
            $query->where('payment_status', $paymentStatus);
        }

        $documents = $query
            ->orderByDesc('issue_date')
            ->orderByDesc('created_at')
            ->limit(500)
            ->get()
            ->filter(fn (SalesDocument $document) => $this->collections->balanceDue($document) > 0.0001);

        $aging = $filters['aging'] ?? null;

        if ($aging === 'overdue') {
            return $documents->filter(fn (SalesDocument $document) => $this->isOverdue($document))->values();
        }

        if ($aging === 'current') {
            return $documents->filter(fn (SalesDocument $document) => ! $this->isOverdue($document))->values();
        }

        return $documents->values();
    }

    /**
     * @param  Collection<int, SalesDocument>  $documents
     * @return array{total_balance: float, documents_count: int, overdue_count: int, overdue_balance: float}
     */
    public function summarize(Collection $documents): array
    {
        $totalBalance = 0.0;
        $overdueCount = 0;
        $overdueBalance = 0.0;

        foreach ($documents as $document) {
            $balance = $this->collections->balanceDue($document);
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

    public function isOverdue(SalesDocument $document): bool
    {
        if (! $document->due_date) {
            return false;
        }

        if ($this->collections->balanceDue($document) <= 0.0001) {
            return false;
        }

        return $document->due_date->startOfDay()->lt(now()->startOfDay());
    }

    public function daysOverdue(SalesDocument $document): int
    {
        if (! $this->isOverdue($document) || ! $document->due_date) {
            return 0;
        }

        return (int) $document->due_date->startOfDay()->diffInDays(now()->startOfDay());
    }

    public function agingLabel(SalesDocument $document): string
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

    /**
     * @return Builder<SalesDocument>
     */
    private function baseQuery(): Builder
    {
        return SalesDocument::query()
            ->where('status', SalesDocument::STATUS_CONFIRMED)
            ->whereIn('payment_status', [
                SalesDocument::PAYMENT_UNPAID,
                SalesDocument::PAYMENT_PARTIAL,
            ])
            ->with([
                'customer:id,legal_name,document_type,document_number',
            ])
            ->withSum('paymentAllocations as amount_paid', 'amount');
    }

    public function formatMoney(float $amount): string
    {
        return number_format($amount, 2, '.', ',');
    }

    public function referenceDateLabel(?CarbonInterface $date): ?string
    {
        return $date?->format('d/m/Y');
    }
}
