import { cn } from '@/lib/utils';

export function SalesDocumentPaymentStatusBadge({
    status,
    label,
}: {
    status: string;
    label: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                status === 'paid' &&
                    'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80',
                status === 'partial' &&
                    'bg-sky-50 text-sky-700 ring-1 ring-sky-200/80',
                status === 'unpaid' &&
                    'bg-amber-50 text-amber-800 ring-1 ring-amber-200/80',
            )}
        >
            {label}
        </span>
    );
}

type PaymentSummaryProps = {
    paymentStatus?: string;
    paymentStatusLabel?: string;
    currencyCode: string;
    totalLabel?: string;
    amountPaidLabel?: string;
    balanceDue?: string;
    balanceDueLabel?: string;
};

export function SalesDocumentPaymentSummary({
    paymentStatus,
    paymentStatusLabel,
    currencyCode,
    totalLabel,
    amountPaidLabel,
    balanceDue,
    balanceDueLabel,
}: PaymentSummaryProps) {
    if (!paymentStatusLabel) {
        return null;
    }

    const hasBalance =
        balanceDue != null && parseFloat(balanceDue) > 0.0001;

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200/80 bg-linear-to-r from-emerald-50/90 to-white px-4 py-3 shadow-sm">
            <div className="space-y-1">
                <p className="text-[10px] font-bold tracking-wide text-emerald-800 uppercase">
                    Estado de cobro
                </p>
                <SalesDocumentPaymentStatusBadge
                    status={paymentStatus ?? 'unpaid'}
                    label={paymentStatusLabel}
                />
            </div>
            <dl className="flex flex-wrap gap-x-5 gap-y-1 text-right text-sm">
                {totalLabel ? (
                    <div>
                        <dt className="text-[10px] font-semibold tracking-wide text-[#9d8fb0] uppercase">
                            Total
                        </dt>
                        <dd className="font-mono font-semibold text-[#4c1d95] tabular-nums">
                            {currencyCode} {totalLabel}
                        </dd>
                    </div>
                ) : null}
                {amountPaidLabel ? (
                    <div>
                        <dt className="text-[10px] font-semibold tracking-wide text-[#9d8fb0] uppercase">
                            Cobrado
                        </dt>
                        <dd className="font-mono font-semibold text-emerald-800 tabular-nums">
                            {currencyCode} {amountPaidLabel}
                        </dd>
                    </div>
                ) : null}
                {hasBalance && balanceDueLabel ? (
                    <div>
                        <dt className="text-[10px] font-semibold tracking-wide text-[#9d8fb0] uppercase">
                            Saldo
                        </dt>
                        <dd className="font-mono font-semibold text-amber-900 tabular-nums">
                            {currencyCode} {balanceDueLabel}
                        </dd>
                    </div>
                ) : null}
            </dl>
        </div>
    );
}
