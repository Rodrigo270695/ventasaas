import { PurchasePaymentHistory } from '@/components/admin/compras/purchase-payment-history';
import {
    AppModal,
    AppModalBody,
    AppModalFooter,
    AppModalHeader,
} from '@/components/modal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type {
    PayableDocumentRow,
    TreasuryPaymentHistoryItem,
} from '@/types/admin/treasury';

const btnClose =
    'border-violet-200 text-[#5b21b6] hover:bg-violet-50 hover:text-[#5b21b6]';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    document: PayableDocumentRow | null;
    payments?: TreasuryPaymentHistoryItem[];
    canEdit?: boolean;
    onEditPayment?: (payment: TreasuryPaymentHistoryItem) => void;
};

export function PayablePaymentHistoryModal({
    open,
    onOpenChange,
    document,
    payments,
    canEdit = false,
    onEditPayment,
}: Props) {
    if (!document) {
        return null;
    }

    const history = payments ?? document.payment_history ?? [];
    const totalPaid = document.amount_paid_label ?? '0.00';
    const balance = document.balance_due_label ?? document.total_label;

    return (
        <AppModal
            open={open}
            onOpenChange={onOpenChange}
            size="xl"
            className="max-w-[min(100%,calc(100vw-1rem))] sm:max-w-3xl"
        >
            <AppModalHeader
                className="px-4 py-3 sm:px-6 sm:py-4"
                title="Historial de pagos"
            >
                <div className="flex flex-col gap-0.5 break-words text-sm font-normal text-[#7c6f8a]">
                    <span className="font-medium text-[#4c1d95]">
                        {document.display_number}
                    </span>
                    <span>{document.supplier_name}</span>
                </div>
            </AppModalHeader>

            <AppModalBody className="space-y-3 px-4 py-4 sm:space-y-4 sm:px-6 sm:py-5">
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <SummaryCard
                        label="Total factura"
                        value={`${document.currency_code} ${document.total_label}`}
                        tone="neutral"
                    />
                    <SummaryCard
                        label="Pagado"
                        value={`${document.currency_code} ${totalPaid}`}
                        tone="paid"
                    />
                    <SummaryCard
                        label="Saldo pendiente"
                        value={`${document.currency_code} ${balance}`}
                        tone="balance"
                    />
                </div>

                <PurchasePaymentHistory
                    payments={history}
                    currencyCode={document.currency_code}
                    canEdit={canEdit}
                    onEdit={onEditPayment}
                />
            </AppModalBody>

            <AppModalFooter className="px-4 py-3 sm:px-6 sm:py-4">
                <Button
                    type="button"
                    variant="outline"
                    className={cn(
                        'w-full cursor-pointer rounded-xl sm:w-auto',
                        btnClose,
                    )}
                    onClick={() => onOpenChange(false)}
                >
                    Cerrar
                </Button>
            </AppModalFooter>
        </AppModal>
    );
}

function SummaryCard({
    label,
    value,
    tone,
}: {
    label: string;
    value: string;
    tone: 'neutral' | 'paid' | 'balance';
}) {
    return (
        <div
            className={cn(
                'rounded-xl border px-3 py-2',
                tone === 'neutral' &&
                    'border-violet-100 bg-violet-50/50',
                tone === 'paid' &&
                    'border-emerald-100 bg-emerald-50/50',
                tone === 'balance' &&
                    'border-amber-100 bg-amber-50/50',
            )}
        >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9d8fb0]">
                {label}
            </p>
            <p
                className={cn(
                    'text-xs font-bold tabular-nums sm:text-sm',
                    tone === 'neutral' && 'text-[#3b2d4a]',
                    tone === 'paid' && 'text-emerald-800',
                    tone === 'balance' && 'text-amber-800',
                )}
            >
                {value}
            </p>
        </div>
    );
}
