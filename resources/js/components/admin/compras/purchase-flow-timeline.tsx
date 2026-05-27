import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    Check,
    FileText,
    Mail,
    Package,
    ShoppingCart,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type PurchaseFlowReceiptNode = {
    id: string;
    internal_number: string;
    received_date_label: string;
    invoice: {
        id: string;
        internal_number: string;
        supplier_document_number: string | null;
        edit_url: string;
    } | null;
    create_invoice_url: string | null;
};

export type PurchaseFlowDirectInvoice = {
    id: string;
    internal_number: string;
    supplier_document_number: string | null;
    edit_url: string;
};

export type PurchaseFlowSupplierNode = {
    sent_at_label: string | null;
    sent_to: string | null;
    sent_cc: string[];
    confirmed_at_label: string | null;
};

export type PurchaseFlowData = {
    order: {
        internal_number: string;
        status_label: string;
        order_date_label: string;
    };
    supplier: PurchaseFlowSupplierNode;
    receipts: PurchaseFlowReceiptNode[];
    direct_invoices: PurchaseFlowDirectInvoice[];
};

type Props = {
    flow: PurchaseFlowData;
    canManage?: boolean;
};

function StepConnector({ done }: { done: boolean }) {
    return (
        <div
            className={cn(
                'hidden h-0.5 min-w-6 flex-1 md:block',
                done ? 'bg-emerald-300' : 'bg-violet-200',
            )}
            aria-hidden
        />
    );
}

export function PurchaseFlowTimeline({ flow, canManage = false }: Props) {
    const hasReceipts = flow.receipts.length > 0;
    const orderDone = flow.order.status_label !== 'Borrador';

    return (
        <div className="rounded-xl border border-violet-100 bg-white p-4 shadow-xs ring-1 ring-violet-50">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#6b5b7a]">
                Flujo de compra
            </p>

            <div className="flex flex-col gap-4 md:flex-row md:items-start">
                <div className="flex min-w-0 flex-1 flex-col gap-1 md:max-w-[11rem]">
                    <div className="flex items-center gap-2">
                        <span
                            className={cn(
                                'flex size-8 shrink-0 items-center justify-center rounded-full',
                                orderDone
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-violet-100 text-[#7c3aed]',
                            )}
                        >
                            {orderDone ? (
                                <Check className="size-4" />
                            ) : (
                                <ShoppingCart className="size-4" />
                            )}
                        </span>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#6b5b7a]">
                                Orden
                            </p>
                            <p className="truncate font-mono text-sm font-bold text-[#4c1d95]">
                                {flow.order.internal_number}
                            </p>
                        </div>
                    </div>
                    <p className="pl-10 text-[11px] text-[#6b5b7a]">
                        {flow.order.status_label} · {flow.order.order_date_label}
                    </p>
                </div>

                <StepConnector done={orderDone && Boolean(flow.supplier.sent_at_label)} />

                <div className="min-w-0 flex-1 space-y-2 md:max-w-[12rem]">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-[#6b5b7a]">
                        <Mail className="size-3.5" />
                        Proveedor
                    </p>
                    <div className="rounded-lg border border-violet-100 bg-violet-50/40 px-3 py-2 text-xs">
                        {flow.supplier.confirmed_at_label ? (
                            <p className="font-semibold text-emerald-700">
                                Confirmada ·{' '}
                                {flow.supplier.confirmed_at_label}
                            </p>
                        ) : flow.supplier.sent_at_label ? (
                            <p className="font-semibold text-amber-800">
                                Enviada · {flow.supplier.sent_at_label}
                            </p>
                        ) : (
                            <p className="text-[#6b5b7a]">
                                Sin envío por correo
                            </p>
                        )}
                        {flow.supplier.sent_to ? (
                            <p className="mt-1 truncate text-[#6b5b7a]">
                                {flow.supplier.sent_to}
                            </p>
                        ) : null}
                    </div>
                </div>

                <StepConnector
                    done={
                        Boolean(flow.supplier.confirmed_at_label) &&
                        hasReceipts
                    }
                />

                <div className="min-w-0 flex-[2] space-y-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-[#6b5b7a]">
                        <Package className="size-3.5" />
                        Recepciones
                    </p>
                    {hasReceipts ? (
                        <ul className="space-y-2">
                            {flow.receipts.map((receipt) => (
                                <li
                                    key={receipt.id}
                                    className="rounded-lg border border-violet-100 bg-violet-50/40 px-3 py-2"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <span className="font-mono text-sm font-semibold text-[#7c3aed]">
                                                {receipt.internal_number}
                                            </span>
                                            <span className="ml-2 text-xs text-[#6b5b7a]">
                                                {receipt.received_date_label}
                                            </span>
                                        </div>
                                        {receipt.invoice ? (
                                            <Link
                                                href={receipt.invoice.edit_url}
                                                className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
                                            >
                                                <FileText className="size-3.5" />
                                                {receipt.invoice
                                                    .supplier_document_number ||
                                                    receipt.invoice.internal_number}
                                                <ArrowRight className="size-3" />
                                            </Link>
                                        ) : canManage &&
                                          receipt.create_invoice_url ? (
                                            <Link
                                                href={
                                                    receipt.create_invoice_url
                                                }
                                                className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-linear-to-r from-[#ec4899] to-[#7c3aed] px-2.5 py-1 text-xs font-semibold text-white hover:opacity-95"
                                            >
                                                Registrar factura
                                                <ArrowRight className="size-3" />
                                            </Link>
                                        ) : (
                                            <span className="text-xs text-amber-700">
                                                Sin factura
                                            </span>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-xs text-[#6b5b7a]">
                            Aún no hay recepciones registradas para esta orden.
                        </p>
                    )}
                </div>

                {flow.direct_invoices.length > 0 ? (
                    <>
                        <StepConnector done />
                        <div className="min-w-0 flex-1 space-y-2">
                            <p className="flex items-center gap-1.5 text-xs font-semibold text-[#6b5b7a]">
                                <FileText className="size-3.5" />
                                Facturas directas
                            </p>
                            <ul className="space-y-1">
                                {flow.direct_invoices.map((inv) => (
                                    <li key={inv.id}>
                                        <Link
                                            href={inv.edit_url}
                                            className="cursor-pointer text-sm font-semibold text-[#7c3aed] hover:underline"
                                        >
                                            {inv.supplier_document_number ||
                                                inv.internal_number}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
}
