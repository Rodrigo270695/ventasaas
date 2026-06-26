export type SalesTicketFormat = '80mm' | '58mm' | 'a4';

export const SALES_TICKET_FORMAT_STORAGE_KEY = 'ventasaas.sales_ticket_format';

/** Ancho útil en papel de 56 mm (típico en ticketeras portátiles). */
export const THERMAL_NARROW_PAGE_MM = 56;

export const SALES_TICKET_FORMAT_OPTIONS: {
    key: SalesTicketFormat;
    label: string;
    hint: string;
}[] = [
    {
        key: '58mm',
        label: '56 / 58 mm',
        hint: 'Ticketera',
    },
    {
        key: '80mm',
        label: '80 mm',
        hint: 'Mostrador',
    },
    {
        key: 'a4',
        label: 'A4',
        hint: 'Oficina',
    },
];

export function isNarrowThermalFormat(format: SalesTicketFormat): boolean {
    return format === '58mm';
}

export function readPreferredTicketFormat(): SalesTicketFormat {
    if (typeof window === 'undefined') {
        return '58mm';
    }

    const stored = window.localStorage.getItem(SALES_TICKET_FORMAT_STORAGE_KEY);

    if (stored === '80mm' || stored === '58mm' || stored === 'a4') {
        return stored;
    }

    return '58mm';
}

export function persistPreferredTicketFormat(format: SalesTicketFormat): void {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.setItem(SALES_TICKET_FORMAT_STORAGE_KEY, format);
}

export function ticketPrintPageSize(format: SalesTicketFormat): string {
    if (format === 'a4') {
        return 'A4 portrait';
    }

    if (format === '58mm') {
        return `${THERMAL_NARROW_PAGE_MM}mm auto`;
    }

    return '80mm auto';
}

export function ticketPrintCss(format: SalesTicketFormat): string {
    const pageSize = ticketPrintPageSize(format);
    const slipWidth = format === '58mm' ? '52mm' : format === '80mm' ? '72mm' : '100%';
    const fontSize = format === '58mm' ? '9pt' : format === '80mm' ? '10pt' : '11pt';

    return `
        @media print {
            @page {
                margin: 0;
                size: ${pageSize};
            }
            html, body {
                width: ${slipWidth};
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
            }
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .no-print {
                display: none !important;
            }
            .ticket-slip {
                width: ${slipWidth} !important;
                max-width: ${slipWidth} !important;
                margin: 0 !important;
                padding: 1.5mm 2mm !important;
                box-shadow: none !important;
                font-family: 'Courier New', Courier, monospace !important;
                font-size: ${fontSize} !important;
                line-height: 1.3 !important;
                color: #000 !important;
                -webkit-font-smoothing: none !important;
                font-smooth: never !important;
                text-rendering: optimizeSpeed !important;
            }
            .ticket-slip * {
                color: #000 !important;
                border-color: #000 !important;
            }
            .ticket-slip img {
                max-height: 10mm !important;
                max-width: 46mm !important;
                image-rendering: pixelated;
                filter: contrast(1.35) brightness(0.9);
            }
            .ticket-muted {
                color: #000 !important;
                opacity: 0.85;
            }
        }
    `;
}
