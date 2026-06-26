import {
    readPreferredTicketFormat,
    type SalesTicketFormat,
} from '@/lib/sales-ticket-format';

export type { SalesTicketFormat };

export function salesTicketUrl(
    documentId: string,
    options?: {
        format?: SalesTicketFormat;
        auto?: boolean;
        internal?: boolean;
    },
): string {
    const params = new URLSearchParams();
    const format = options?.format ?? readPreferredTicketFormat();
    params.set('format', format);

    if (options?.auto) {
        params.set('auto', '1');
    }

    const base = options?.internal
        ? `/admin/ventas/tickets-internos/${documentId}/ticket`
        : `/admin/ventas/comprobantes/${documentId}/ticket`;

    return `${base}?${params.toString()}`;
}
