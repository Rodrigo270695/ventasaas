import type { SalesDocumentFormData } from '@/types/admin/sales-documents';

/** Payload para guardar o confirmar un comprobante (desde estado React del formulario). */
export function buildSalesDocumentPayload(form: SalesDocumentFormData) {
    return {
        document_series_id: form.document_series_id,
        customer_party_id: form.customer_party_id || null,
        warehouse_id: form.warehouse_id ?? '',
        issue_date: form.issue_date,
        due_date: form.due_date ?? '',
        currency_code: form.currency_code,
        exchange_rate: form.exchange_rate,
        global_discount: form.global_discount,
        notes: form.notes ?? '',
        lines: form.lines
            .filter((line) => line.product_variant_id)
            .map((line) => ({
                product_variant_id: line.product_variant_id,
                description: line.description ?? '',
                quantity: line.quantity,
                unit_price: line.unit_price,
                discount: line.discount,
            })),
    };
}
