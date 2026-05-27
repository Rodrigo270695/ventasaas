export type SalesTicketFormat = '80mm' | '58mm' | 'a4';

export function salesTicketUrl(
    documentId: string,
    options?: {
        format?: SalesTicketFormat;
        auto?: boolean;
        internal?: boolean;
    },
): string {
    const params = new URLSearchParams();
    params.set('format', options?.format ?? '80mm');

    if (options?.auto) {
        params.set('auto', '1');
    }

    const base = options?.internal
        ? `/admin/ventas/tickets-internos/${documentId}/ticket`
        : `/admin/ventas/comprobantes/${documentId}/ticket`;

    return `${base}?${params.toString()}`;
}
