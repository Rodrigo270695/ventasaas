import {
    cacheCollectionSnapshot,
    countPendingActions,
    enqueuePendingAction,
    generateOfflineId,
    getCollectionSnapshot,
    isOfflineEntityId,
    listPendingActions,
    removePendingActionsByLocalEntity,
    updatePendingCreatePayload,
} from '@/lib/offline-store';
import type { SalesQuotationFormData, SalesQuotationListRow } from '@/types/admin/sales-quotations';

export const QUOTATIONS_CACHE_KEY = 'ventas.cotizaciones.index';
export const QUOTATIONS_FORM_CACHE_KEY = 'ventas.cotizaciones.form';
export const QUOTATIONS_DRAFTS_CACHE_KEY = 'ventas.cotizaciones.drafts';
export const QUOTATIONS_RESOURCE = 'sales.quotations';
export const QUOTATIONS_BASE_PATH = '/admin/ventas/cotizaciones';

export type QuotationFormSnapshot = {
    customerOptions: SalesQuotationFormPageLookups['customerOptions'];
    variantOptions: SalesQuotationFormPageLookups['variantOptions'];
    oldForm: SalesQuotationFormData;
};

export type SalesQuotationFormPageLookups = {
    customerOptions: Array<{
        value: string;
        label: string;
        sublabel?: string;
        email?: string | null;
    }>;
    variantOptions: Array<{
        value: string;
        label: string;
        sublabel?: string;
        unit_price?: string;
    }>;
};

function calcTotals(form: SalesQuotationFormData) {
    let subtotal = 0;
    let tax = 0;
    let total = 0;

    form.lines.forEach((line) => {
        const qty = Number(line.quantity || 0);
        const price = Number(line.unit_price || 0);
        const discount = Number(line.discount || 0);
        const lineTotal = Math.max(0, qty * price - discount);
        const lineSubtotal = lineTotal / 1.18;
        const lineTax = lineTotal - lineSubtotal;

        subtotal += lineSubtotal;
        tax += lineTax;
        total += lineTotal;
    });

    const globalDiscount = Number(form.global_discount || 0);
    total = Math.max(0, total - globalDiscount);

    return {
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
    };
}

function buildPayload(form: SalesQuotationFormData) {
    return {
        customer_party_id: form.customer_party_id,
        issue_date: form.issue_date,
        valid_until: form.valid_until,
        currency_code: form.currency_code,
        exchange_rate: form.exchange_rate,
        global_discount: form.global_discount,
        notes: form.notes ?? '',
        lines: form.lines
            .filter(
                (line) =>
                    line.product_variant_id ||
                    line.manual_sku ||
                    line.description,
            )
            .map((line) => ({
                product_variant_id: line.product_variant_id || null,
                manual_sku: line.manual_sku || null,
                description: line.description || null,
                quantity: line.quantity,
                unit_price: line.unit_price,
                discount: line.discount,
            })),
    };
}

function resolveCustomerName(
    customerId: string,
    options: QuotationFormSnapshot['customerOptions'],
): string {
    return (
        options.find((option) => option.value === customerId)?.label ??
        'Cliente'
    );
}

function buildListRowFromForm(
    form: SalesQuotationFormData,
    localId: string,
    customerOptions: QuotationFormSnapshot['customerOptions'],
): SalesQuotationListRow {
    const totals = calcTotals(form);

    return {
        id: localId,
        internal_number: 'Borrador offline',
        issue_date: form.issue_date,
        issue_date_label: form.issue_date?.slice(0, 10) ?? null,
        valid_until_label: form.valid_until || null,
        customer_name: resolveCustomerName(form.customer_party_id, customerOptions),
        status: 'draft',
        status_label: 'Borrador (offline)',
        currency_code: form.currency_code,
        total_label: totals.total,
        is_email_sent: false,
        email_sent_label: null,
    };
}

export function persistQuotationsIndexSnapshot(
    quotations: SalesQuotationListRow[],
): void {
    cacheCollectionSnapshot(QUOTATIONS_CACHE_KEY, quotations, {});
}

export function loadQuotationsIndexSnapshot(): SalesQuotationListRow[] | null {
    const snapshot = getCollectionSnapshot<SalesQuotationListRow>(
        QUOTATIONS_CACHE_KEY,
    );

    return snapshot?.items ?? null;
}

export function persistQuotationFormSnapshot(snapshot: QuotationFormSnapshot): void {
    cacheCollectionSnapshot(QUOTATIONS_FORM_CACHE_KEY, [], {
        formProps: snapshot as unknown as Record<string, unknown>,
    });
}

export function loadQuotationFormSnapshot(): QuotationFormSnapshot | null {
    const snapshot = getCollectionSnapshot(QUOTATIONS_FORM_CACHE_KEY);

    if (!snapshot?.meta?.formProps) {
        return null;
    }

    return snapshot.meta.formProps as unknown as QuotationFormSnapshot;
}

export function saveQuotationOffline(
    form: SalesQuotationFormData,
    urls: { storeUrl: string; updateUrl?: string },
    customerOptions: QuotationFormSnapshot['customerOptions'],
): {
    quotation: SalesQuotationFormData;
    listRow: SalesQuotationListRow;
} {
    const payload = buildPayload(form);
    const quotationId = form.id;

    if (quotationId && !isOfflineEntityId(quotationId)) {
        enqueuePendingAction({
            resource: QUOTATIONS_RESOURCE,
            method: 'PUT',
            endpoint: urls.updateUrl ?? `${QUOTATIONS_BASE_PATH}/${quotationId}`,
            payload,
        });

        const totals = calcTotals(form);
        const listRow: SalesQuotationListRow = {
            id: quotationId,
            internal_number: form.internal_number ?? '—',
            issue_date: form.issue_date,
            issue_date_label: form.issue_date?.slice(0, 10) ?? null,
            valid_until_label: form.valid_until || null,
            customer_name:
                form.customer_name ??
                resolveCustomerName(form.customer_party_id, customerOptions),
            status: form.status ?? 'draft',
            status_label: form.status_label ?? 'Borrador',
            currency_code: form.currency_code,
            total_label: totals.total,
            is_email_sent: false,
            email_sent_label: null,
        };

        return {
            quotation: {
                ...form,
                subtotal: totals.subtotal,
                tax_amount: totals.tax,
                total: totals.total,
            },
            listRow,
        };
    }

    const localId =
        quotationId && isOfflineEntityId(quotationId)
            ? quotationId
            : generateOfflineId();

    const existingSave = listPendingActions(QUOTATIONS_RESOURCE).find(
        (action) =>
            action.localEntityId === localId && action.method === 'POST',
    );

    if (existingSave) {
        updatePendingCreatePayload(localId, payload);
    } else {
        removePendingActionsByLocalEntity(localId);
        enqueuePendingAction({
            resource: QUOTATIONS_RESOURCE,
            method: 'POST',
            endpoint: urls.storeUrl,
            localEntityId: localId,
            payload,
        });
    }

    const totals = calcTotals(form);
    const quotation: SalesQuotationFormData = {
        ...form,
        id: localId,
        internal_number: 'Borrador offline',
        status: 'draft',
        status_label: 'Borrador (offline)',
        subtotal: totals.subtotal,
        tax_amount: totals.tax,
        total: totals.total,
        can_edit: true,
        can_send_email: false,
        can_convert: false,
    };
    const listRow = buildListRowFromForm(form, localId, customerOptions);

    mergeQuotationIntoIndexCache(listRow);
    persistOfflineQuotationDraft(quotation);

    return { quotation, listRow };
}

export function persistOfflineQuotationDraft(
    quotation: SalesQuotationFormData,
): void {
    if (!quotation.id) {
        return;
    }

    const snapshot =
        getCollectionSnapshot<SalesQuotationFormData>(
            QUOTATIONS_DRAFTS_CACHE_KEY,
        ) ?? null;
    const items = snapshot?.items ?? [];
    const next = [
        ...items.filter((item) => item.id !== quotation.id),
        quotation,
    ];

    cacheCollectionSnapshot(QUOTATIONS_DRAFTS_CACHE_KEY, next, {});
}

export function loadOfflineQuotationDraft(
    quotationId: string,
): SalesQuotationFormData | null {
    const snapshot = getCollectionSnapshot<SalesQuotationFormData>(
        QUOTATIONS_DRAFTS_CACHE_KEY,
    );

    return snapshot?.items.find((item) => item.id === quotationId) ?? null;
}

function mergeQuotationIntoIndexCache(listRow: SalesQuotationListRow): void {
    const current = loadQuotationsIndexSnapshot() ?? [];
    const next = [
        listRow,
        ...current.filter((row) => row.id !== listRow.id),
    ];

    persistQuotationsIndexSnapshot(next);
}

export function countQuotationsPendingActions(): number {
    return countPendingActions(QUOTATIONS_RESOURCE);
}

export function buildQuotationsStats(quotations: SalesQuotationListRow[]) {
    const draftCount = quotations.filter((row) => row.status === 'draft').length;
    const sentCount = quotations.filter((row) => row.status === 'sent').length;

    return [
        {
            key: 'total',
            label: 'Total',
            value: quotations.length,
            tone: 'violet',
        },
        {
            key: 'draft',
            label: 'Borradores',
            value: draftCount,
            tone: 'amber',
        },
        {
            key: 'sent',
            label: 'Enviadas',
            value: sentCount,
            tone: 'cyan',
        },
    ];
}
