import type { PayableDocumentRow } from '@/types/admin/treasury';

export function hasPayablePaymentHistory(row: PayableDocumentRow): boolean {
    if ((row.payment_history?.length ?? 0) > 0) {
        return true;
    }

    const paid = parseFloat(row.amount_paid ?? '0');

    return paid > 0.0001 || row.payment_status === 'partial' || row.payment_status === 'paid';
}
