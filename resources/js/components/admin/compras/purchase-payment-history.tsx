import { ExternalLink, FileDown, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TreasuryPaymentHistoryItem } from '@/types/admin/treasury';

type Props = {
    payments: TreasuryPaymentHistoryItem[];
    currencyCode?: string;
    canEdit?: boolean;
    onEdit?: (payment: TreasuryPaymentHistoryItem) => void;
};

export function PurchasePaymentHistory({
    payments,
    currencyCode = 'PEN',
    canEdit = false,
    onEdit,
}: Props) {
    if (payments.length === 0) {
        return (
            <p className="rounded-xl border border-dashed border-violet-200 bg-violet-50/30 px-4 py-6 text-center text-sm text-[#6b5b7a]">
                Aún no hay pagos registrados para esta factura.
            </p>
        );
    }

    return (
        <>
            <ul className="space-y-3 md:hidden">
                {payments.map((payment) => (
                    <li key={`payment-mobile-${payment.id}`}>
                        <PaymentHistoryCard
                            payment={payment}
                            currencyCode={currencyCode}
                            canEdit={canEdit}
                            onEdit={onEdit}
                        />
                    </li>
                ))}
            </ul>

            <div className="hidden overflow-x-auto rounded-xl border border-violet-100 md:block">
                <table className="w-full text-left text-sm">
                    <thead className="bg-violet-50/80 text-[10px] font-semibold uppercase tracking-wide text-[#6b5b7a]">
                        <tr>
                            <th className="px-4 py-2.5">Fecha</th>
                            <th className="px-4 py-2.5">Método</th>
                            <th className="px-4 py-2.5 text-right">Monto</th>
                            <th className="px-4 py-2.5">Referencia</th>
                            <th className="px-4 py-2.5">Registró</th>
                            <th className="px-4 py-2.5 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.map((payment) => (
                            <tr
                                key={`payment-desktop-${payment.id}`}
                                className="border-t border-violet-50 text-[#3b2d4a]"
                            >
                                <td className="px-4 py-2.5 whitespace-nowrap">
                                    {payment.payment_date_label}
                                </td>
                                <td className="px-4 py-2.5">
                                    {payment.payment_method_name ?? '—'}
                                </td>
                                <td className="px-4 py-2.5 text-right font-semibold tabular-nums whitespace-nowrap">
                                    {payment.currency_code ?? currencyCode}{' '}
                                    {payment.amount_label}
                                </td>
                                <td className="max-w-[10rem] truncate px-4 py-2.5 text-[#6b5b7a]">
                                    {payment.reference || '—'}
                                </td>
                                <td className="px-4 py-2.5 text-[#6b5b7a]">
                                    {payment.created_by_name ?? '—'}
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                    <PaymentRowActions
                                        payment={payment}
                                        canEdit={canEdit}
                                        onEdit={onEdit}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}

function PaymentHistoryCard({
    payment,
    currencyCode,
    canEdit,
    onEdit,
}: {
    payment: TreasuryPaymentHistoryItem;
    currencyCode: string;
    canEdit?: boolean;
    onEdit?: (payment: TreasuryPaymentHistoryItem) => void;
}) {
    const code = payment.currency_code ?? currencyCode;

    return (
        <article className="rounded-xl border border-violet-100 bg-white p-3 shadow-sm shadow-violet-100/40">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9d8fb0]">
                        Fecha
                    </p>
                    <p className="text-sm font-semibold text-[#3b2d4a]">
                        {payment.payment_date_label}
                    </p>
                </div>
                <div className="shrink-0 text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9d8fb0]">
                        Monto
                    </p>
                    <p className="text-sm font-bold tabular-nums text-[#4c1d95]">
                        {code} {payment.amount_label}
                    </p>
                </div>
            </div>

            <dl className="mt-3 space-y-2 text-sm">
                <div className="flex gap-2">
                    <dt className="shrink-0 text-[#9d8fb0]">Método</dt>
                    <dd className="min-w-0 font-medium text-[#3b2d4a]">
                        {payment.payment_method_name ?? '—'}
                    </dd>
                </div>
                {payment.reference ? (
                    <div className="flex gap-2">
                        <dt className="shrink-0 text-[#9d8fb0]">Ref.</dt>
                        <dd className="min-w-0 break-all text-[#3b2d4a]">
                            {payment.reference}
                        </dd>
                    </div>
                ) : null}
                {payment.created_by_name ? (
                    <div className="flex gap-2">
                        <dt className="shrink-0 text-[#9d8fb0]">Registró</dt>
                        <dd className="min-w-0 truncate text-[#6b5b7a]">
                            {payment.created_by_name}
                        </dd>
                    </div>
                ) : null}
            </dl>

            <div className="mt-3 border-t border-violet-50 pt-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#9d8fb0]">
                    Acciones
                </p>
                <PaymentRowActions
                    payment={payment}
                    canEdit={canEdit}
                    onEdit={onEdit}
                    layout="stacked"
                />
            </div>
        </article>
    );
}

function PaymentRowActions({
    payment,
    canEdit = false,
    onEdit,
    layout = 'inline',
}: {
    payment: TreasuryPaymentHistoryItem;
    canEdit?: boolean;
    onEdit?: (payment: TreasuryPaymentHistoryItem) => void;
    layout?: 'inline' | 'stacked';
}) {
    const viewUrl =
        payment.proof_view_url ??
        (payment.proof_download_url
            ? `${payment.proof_download_url}${payment.proof_download_url.includes('?') ? '&' : '?'}inline=1`
            : null);

    const fileLabel = payment.proof_file_name ?? 'comprobante';
    const stacked = layout === 'stacked';
    const hasProof =
        payment.has_proof && Boolean(payment.proof_download_url);

    return (
        <div
            className={cn(
                'gap-2',
                stacked
                    ? 'grid grid-cols-2'
                    : 'flex flex-wrap items-center justify-end',
            )}
        >
            {canEdit && onEdit ? (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                        'h-8 cursor-pointer gap-1.5 rounded-lg border-violet-200 text-xs font-semibold text-[#5b21b6] hover:bg-violet-50',
                        stacked && 'col-span-2 w-full',
                    )}
                    onClick={() => onEdit(payment)}
                >
                    <Pencil className="size-3.5" />
                    Editar
                </Button>
            ) : null}
            {hasProof && viewUrl ? (
                <a
                    href={viewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                        'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-[#7c3aed] ring-1 ring-violet-200 hover:bg-violet-50',
                        stacked && 'w-full',
                    )}
                    title={fileLabel}
                >
                    <ExternalLink className="size-3.5 shrink-0" />
                    Ver
                </a>
            ) : null}
            {hasProof ? (
                <a
                    href={payment.proof_download_url!}
                    className={cn(
                        'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-[#5b21b6] ring-1 ring-violet-200 hover:bg-violet-50',
                        stacked && 'w-full',
                    )}
                    title={fileLabel}
                    download
                >
                    <FileDown className="size-3.5 shrink-0" />
                    Descargar
                </a>
            ) : !canEdit ? (
                <span className="text-xs text-[#9d8fb0]">Sin adjunto</span>
            ) : null}
        </div>
    );
}
