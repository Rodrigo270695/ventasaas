import { Head, Link } from '@inertiajs/react';
import { Printer, X } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    isNarrowThermalFormat,
    SALES_TICKET_FORMAT_OPTIONS,
    ticketPrintCss,
    type SalesTicketFormat,
} from '@/lib/sales-ticket-format';
import { salesTicketUrl } from '@/lib/sales-ticket-url';
import { formatSalesMoney } from '@/lib/sales-money';
import { cn } from '@/lib/utils';
import type { SalesTicketPrintPageProps } from '@/types/admin/sales-ticket';

const FORMAT_CLASS: Record<SalesTicketFormat, string> = {
    '80mm': 'w-[72mm] max-w-[72mm] text-[12px]',
    '58mm': 'w-[52mm] max-w-[52mm] text-[11px]',
    a4: 'w-full max-w-[210mm] text-sm',
};

function formatTicketQty(value: string): string {
    const num = parseFloat(value);

    if (Number.isNaN(num)) {
        return value;
    }

    if (Number.isInteger(num)) {
        return String(num);
    }

    return num.toFixed(2).replace(/\.?0+$/, '');
}

export default function SalesDocumentTicketPrint({
    document,
    store,
    format,
    autoPrint,
}: SalesTicketPrintPageProps) {
    const narrow = isNarrowThermalFormat(format);

    useEffect(() => {
        if (!autoPrint) {
            return;
        }

        const timer = window.setTimeout(() => window.print(), 400);

        return () => window.clearTimeout(timer);
    }, [autoPrint]);

    const isInternal = Boolean(document.is_internal);
    const editUrl = isInternal
        ? `/admin/ventas/tickets-internos/${document.id}/edit`
        : `/admin/ventas/comprobantes/${document.id}/edit`;

    return (
        <>
            <Head title={`Ticket ${document.full_number}`}>
                <style>{ticketPrintCss(format)}</style>
            </Head>

            <div className="min-h-screen bg-slate-100 py-4 print:bg-white print:py-0">
                <div className="no-print mx-auto mb-4 flex max-w-lg flex-wrap items-center justify-center gap-2 px-4">
                    <Button
                        type="button"
                        className="cursor-pointer gap-2 bg-[#6d28d9] hover:bg-[#5b21b6]"
                        onClick={() => window.print()}
                    >
                        <Printer className="size-4" />
                        Imprimir
                    </Button>
                    <Button variant="outline" className="cursor-pointer" asChild>
                        <Link href={editUrl}>Volver al comprobante</Link>
                    </Button>
                    <div className="flex gap-1">
                        {SALES_TICKET_FORMAT_OPTIONS.map((item) => (
                            <Button
                                key={item.key}
                                variant={format === item.key ? 'default' : 'outline'}
                                size="sm"
                                className={cn(
                                    'cursor-pointer text-xs',
                                    format === item.key &&
                                        'bg-[#6d28d9] hover:bg-[#5b21b6]',
                                )}
                                asChild
                            >
                                <a
                                    href={salesTicketUrl(document.id, {
                                        format: item.key,
                                        internal: isInternal,
                                    })}
                                >
                                    {item.label}
                                </a>
                            </Button>
                        ))}
                    </div>
                </div>

                <article
                    className={cn(
                        'ticket-slip mx-auto bg-white px-2 py-3 font-mono text-black shadow-md print:shadow-none',
                        FORMAT_CLASS[format],
                    )}
                >
                    <header className="border-b border-dashed border-black pb-2 text-center">
                        {store.logo_url && !narrow ? (
                            <img
                                src={encodeURI(store.logo_url)}
                                alt={store.legal_name ?? 'Logo'}
                                className="mx-auto mb-2 block max-h-12 max-w-[64mm] object-contain"
                            />
                        ) : null}
                        {store.legal_name ? (
                            <p className="text-[1.05em] leading-tight font-bold uppercase">
                                {store.legal_name}
                            </p>
                        ) : null}
                        {store.ruc ? <p className="mt-0.5">RUC {store.ruc}</p> : null}
                        {store.address ? (
                            <p className="mt-0.5 leading-snug">{store.address}</p>
                        ) : null}
                    </header>

                    <section className="border-b border-dashed border-black py-2 text-center">
                        <p className="font-bold uppercase">
                            {document.document_type_label}
                        </p>
                        <p className="mt-1 text-[1.1em] font-bold">
                            {document.full_number}
                        </p>
                        <p className="mt-0.5">
                            {document.issue_date_label}{' '}
                            {document.issue_time_label}
                        </p>
                    </section>

                    {document.customer_name ? (
                        <section className="border-b border-dashed border-black py-2">
                            <p className="font-bold">Cliente</p>
                            <p className="mt-0.5 leading-snug">
                                {document.customer_name}
                            </p>
                            {document.customer_document ? (
                                <p>{document.customer_document}</p>
                            ) : null}
                        </section>
                    ) : null}

                    <section className="py-2">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-black text-left">
                                    <th className="pb-1 font-bold">
                                        {narrow ? 'Producto' : 'Descripción'}
                                    </th>
                                    <th className="w-7 pb-1 text-right font-bold">
                                        Cant
                                    </th>
                                    {!narrow ? (
                                        <th className="w-10 pb-1 text-right font-bold">
                                            P.unit
                                        </th>
                                    ) : null}
                                    <th className="w-11 pb-1 text-right font-bold">
                                        Importe
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {document.lines.map((line, index) => (
                                    <tr
                                        key={index}
                                        className="border-b border-black/30 align-top"
                                    >
                                        <td className="py-1 pr-1 leading-snug break-words">
                                            {line.description}
                                        </td>
                                        <td className="py-1 text-right tabular-nums">
                                            {formatTicketQty(line.quantity)}
                                        </td>
                                        {!narrow ? (
                                            <td className="py-1 text-right tabular-nums">
                                                {line.unit_price}
                                            </td>
                                        ) : null}
                                        <td className="py-1 text-right tabular-nums">
                                            {line.line_total}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                    <section className="space-y-0.5 border-t border-dashed border-black pt-2">
                        <div className="flex justify-between tabular-nums">
                            <span>Subtotal</span>
                            <span>
                                {formatSalesMoney(
                                    document.subtotal,
                                    document.currency_code,
                                )}
                            </span>
                        </div>
                        <div className="flex justify-between tabular-nums">
                            <span>IGV</span>
                            <span>
                                {formatSalesMoney(
                                    document.tax_amount,
                                    document.currency_code,
                                )}
                            </span>
                        </div>
                        {document.global_discount ? (
                            <div className="flex justify-between tabular-nums">
                                <span>Desc. global</span>
                                <span>
                                    −{' '}
                                    {formatSalesMoney(
                                        document.global_discount,
                                        document.currency_code,
                                    )}
                                </span>
                            </div>
                        ) : null}
                        <div className="flex justify-between border-t border-black pt-1 text-[1.1em] font-bold tabular-nums">
                            <span>TOTAL</span>
                            <span>
                                {formatSalesMoney(
                                    document.total,
                                    document.currency_code,
                                )}
                            </span>
                        </div>
                    </section>

                    {document.notes ? (
                        <section className="mt-2 border-t border-dashed border-black pt-2 text-[0.9em] leading-snug">
                            <p className="font-bold">Notas</p>
                            <p>{document.notes}</p>
                        </section>
                    ) : null}

                    <footer className="mt-3 border-t border-dashed border-black pt-2 text-center text-[0.85em] leading-snug">
                        {isInternal ? (
                            <>
                                <p className="font-bold uppercase tracking-wide">
                                    NO VÁLIDO COMO COMPROBANTE DE PAGO
                                </p>
                                <p className="ticket-muted mt-1">
                                    Documento interno de control
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="font-bold">Gracias por su compra</p>
                                <p className="ticket-muted mt-1">
                                    Representación impresa del comprobante
                                </p>
                            </>
                        )}
                    </footer>
                </article>

                <button
                    type="button"
                    className="no-print fixed top-3 right-3 flex size-9 cursor-pointer items-center justify-center rounded-full bg-white shadow-md ring-1 ring-neutral-200"
                    onClick={() => window.close()}
                    aria-label="Cerrar"
                >
                    <X className="size-4" />
                </button>
            </div>
        </>
    );
}

SalesDocumentTicketPrint.layout = null;
