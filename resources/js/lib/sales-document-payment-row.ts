import type {
    SalesDocumentFormData,
    SalesDocumentListRow,
} from '@/types/admin/sales-documents';

function formatMoneyLabel(value: string): string {
    const amount = parseFloat(value);

    if (Number.isNaN(amount)) {
        return value;
    }

    return amount.toLocaleString('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

/** Convierte el documento del formulario a fila para el modal de cobro (ya confirmado). */
export function toPaymentListRow(
    document: SalesDocumentFormData,
): SalesDocumentListRow | null {
    if (!document.id || !document.can_receive_payment) {
        return null;
    }

    return {
        id: document.id,
        full_number: document.full_number ?? 'Borrador',
        document_type_label: document.sunat_document_type_code ?? 'Ticket',
        series: document.series ?? '',
        issue_date: document.issue_date,
        issue_date_label: document.issue_date,
        customer_name: null,
        customer_document: null,
        status: document.status ?? 'confirmed',
        status_label: document.status_label ?? 'Confirmado',
        payment_status: document.payment_status,
        payment_status_label: document.payment_status_label,
        amount_paid: document.amount_paid,
        amount_paid_label: document.amount_paid_label,
        balance_due: document.balance_due,
        balance_due_label: document.balance_due_label,
        can_receive_payment: document.can_receive_payment,
        total: document.total ?? '0',
        total_label: document.total_label ?? document.total ?? '0',
        currency_code: document.currency_code,
        is_internal: document.is_internal,
    };
}

/** Vista previa de cobro para un borrador antes de confirmar y numerar. */
export function toPaymentPreviewFromForm(
    documentId: string,
    form: SalesDocumentFormData,
    total: string,
): SalesDocumentListRow {
    const totalLabel = formatMoneyLabel(total);

    return {
        id: documentId,
        full_number: 'Borrador',
        document_type_label: 'Pendiente',
        series: '',
        issue_date: form.issue_date,
        issue_date_label: form.issue_date,
        customer_name: null,
        customer_document: null,
        status: 'draft',
        status_label: 'Borrador',
        total,
        total_label: totalLabel,
        balance_due: total,
        balance_due_label: totalLabel,
        currency_code: form.currency_code,
        is_internal: form.is_internal,
    };
}
