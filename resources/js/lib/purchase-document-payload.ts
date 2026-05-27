import { formatPurchaseDecimal } from '@/lib/purchase-decimals';
import { datetimeLocalToServer } from '@/lib/peru-datetime';
import type { PurchaseDocumentFormData } from '@/types/admin/purchase-documents';

export function buildPurchaseDocumentPayload(
    form: PurchaseDocumentFormData & { goods_receipt_id?: string },
) {
    return {
        goods_receipt_id: form.goods_receipt_id || null,
        supplier_party_id: form.supplier_party_id,
        warehouse_id: form.warehouse_id || null,
        supplier_document_number: form.supplier_document_number || null,
        issue_date: datetimeLocalToServer(form.issue_date),
        due_date: form.due_date || null,
        currency_code: form.currency_code ?? 'PEN',
        exchange_rate: form.exchange_rate ?? '1',
        notes: form.notes ?? '',
        lines: (form.lines ?? [])
            .filter((line) => line.product_variant_id)
            .map((line) => ({
                goods_receipt_line_id: line.goods_receipt_line_id ?? null,
                product_variant_id: line.product_variant_id,
                description: line.description ?? '',
                quantity: formatPurchaseDecimal(line.quantity),
                unit_cost: formatPurchaseDecimal(line.unit_cost),
            })),
    };
}
