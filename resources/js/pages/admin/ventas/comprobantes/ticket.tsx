import { Head, Link } from '@inertiajs/react';
import { Printer, X } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatSalesMoney } from '@/lib/sales-money';
import { salesTicketUrl, type SalesTicketFormat } from '@/lib/sales-ticket-url';
import type { SalesTicketPrintPageProps } from '@/types/admin/sales-ticket';

const FORMAT_CLASS: Record<SalesTicketFormat, string> = {
    '80mm': 'w-[80mm] max-w-[80mm] text-[12px]',
    '58mm': 'w-[58mm] max-w-[58mm] text-[10px]',
    a4: 'w-full max-w-[210mm] text-sm',
};

export default function SalesDocumentTicketPrint({
    document,
    store,
    format,
    autoPrint,
}: SalesTicketPrintPageProps) {
    useEffect(() => {
        if (!autoPrint) {
            return;
        }

        const timer = window.setTimeout(() => window.print(), 350);

        return () => window.clearTimeout(timer);
    }, [autoPrint]);

    const isInternal = Boolean(document.is_internal);
    const editUrl = isInternal
        ? `/admin/ventas/tickets-internos/${document.id}/edit`
        : `/admin/ventas/comprobantes/${document.id}/edit`;

    return (
        <>
            <Head title={`Ticket ${document.full_number}`}>
                <style>{`
                    @media print {
                        @page {
                            margin: 2mm;
                            size: ${format === 'a4' ? 'A4 portrait' : `${format === '58mm' ? '58mm' : '80mm'} auto`};
                        }
                        body { background: white !important; }
                        .no-print { display: none !important; }
                    }
                `}</style>
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
                        {(['80mm', '58mm', 'a4'] as const).map((f) => (
                            <Button
                                key={f}
                                variant={format === f ? 'default' : 'outline'}
                                size="sm"
                                className={cn(
                                    'cursor-pointer text-xs',
                                    format === f &&
                                        'bg-[#6d28d9] hover:bg-[#5b21b6]',
                                )}
                                asChild
                            >
                                <a
                                    href={salesTicketUrl(document.id, {
                                        format: f,
                                        internal: isInternal,
                                    })}
                                >
                                    {f === 'a4' ? 'A4' : f}
                                </a>
                            </Button>
                        ))}
                    </div>
                </div>

                <article
                    className={cn(
                        'ticket-slip mx-auto bg-white px-3 py-4 font-mono text-[#1a1a1a] shadow-md print:shadow-none',
                        FORMAT_CLASS[format],
                    )}
                >
                    <header className="border-b border-dashed border-neutral-400 pb-2 text-center">
                        {store.logo_url ? (
                            <img
                                src={encodeURI(store.logo_url)}
                                alt={store.legal_name ?? 'Logo'}
                                className={cn(
                                    'mx-auto mb-2 block object-contain print:grayscale',
                                    format === '58mm'
                                        ? 'max-h-10 max-w-[48mm]'
                                        : format === 'a4'
                                          ? 'max-h-20 max-w-[120mm]'
                                          : 'max-h-14 max-w-[64mm]',
                                )}
                            />
                        ) : null}
                        {store.legal_name ? (
                            <p className="text-[1.05em] leading-tight font-bold uppercase">
                                {store.legal_name}
                            </p>
                        ) : null}
                        {store.ruc ? (
                            <p className="mt-0.5">RUC {store.ruc}</p>
                        ) : null}
                        {store.address ? (
                            <p className="mt-0.5 leading-snug">{store.address}</p>
                        ) : null}
                    </header>

                    <section className="border-b border-dashed border-neutral-400 py-2 text-center">
                        <p className="font-bold uppercase">
                            {document.document_type_label}
                        </p>
                        <p className="mt-1 text-[1.15em] font-bold">
                            {document.full_number}
                        </p>
                        <p className="mt-0.5">
                            {document.issue_date_label}{' '}
                            {document.issue_time_label}
                        </p>
                    </section>

                    {document.customer_name ? (
                        <section className="border-b border-dashed border-neutral-400 py-2">
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
                                <tr className="border-b border-neutral-300 text-left">
                                    <th className="pb-1 font-bold">Descripción</th>
                                    <th className="w-7 pb-1 text-right font-bold">
                                        Cant
                                    </th>
                                    <th className="w-10 pb-1 text-right font-bold">
                                        P. unit.
                                    </th>
                                    <th className="w-10 pb-1 text-right font-bold">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {document.lines.map((line, index) => (
                                    <tr
                                        key={index}
                                        className="border-b border-neutral-200 align-top"
                                    >
                                        <td className="py-1 pr-1 leading-snug">
                                            {line.description}
                                        </td>
                                        <td className="py-1 text-right tabular-nums">
                                            {line.quantity}
                                        </td>
                                        <td className="py-1 text-right tabular-nums">
                                            {line.unit_price}
                                        </td>
                                        <td className="py-1 text-right tabular-nums">
                                            {line.line_total}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                    <section className="space-y-0.5 border-t border-dashed border-neutral-400 pt-2">
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
                        <div className="flex justify-between border-t border-neutral-400 pt-1 text-[1.1em] font-bold tabular-nums">
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
                        <section className="mt-2 border-t border-dashed border-neutral-400 pt-2 text-[0.9em] leading-snug">
                            <p className="font-bold">Notas</p>
                            <p>{document.notes}</p>
                        </section>
                    ) : null}

                    <footer className="mt-3 border-t border-dashed border-neutral-400 pt-2 text-center text-[0.85em] leading-snug">
                        {isInternal ? (
                            <>
                                <p className="font-bold uppercase tracking-wide">
                                    NO VÁLIDO COMO COMPROBANTE DE PAGO
                                </p>
                                <p className="mt-1 text-neutral-600">
                                    Documento interno de control · sin valor
                                    tributario
                                </p>
                            </>
                        ) : (
                            <>
                                <p>Gracias por su compra</p>
                                <p className="mt-1 text-neutral-500">
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
