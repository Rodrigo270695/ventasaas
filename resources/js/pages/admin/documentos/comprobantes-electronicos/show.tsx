import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import {
    PageHeader,
    PageHeaderActions,
    PageHeaderTitle,
    PageHeaderTop,
} from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { useCan } from '@/hooks/use-can';
import { documentosComprobantesElectronicosIndex } from '@/lib/admin-breadcrumbs';
import { ELECTRONIC_DOCUMENTS_PERMISSIONS } from '@/lib/admin-permissions';
import { cn } from '@/lib/utils';
import {
    index as cpeIndex,
    reemit as cpeReemit,
} from '@/routes/admin/documentos/comprobantes-electronicos';
import type { ElectronicDocumentsShowPageProps } from '@/types/admin/electronic-documents';

function DetailRow({
    label,
    value,
    mono,
}: {
    label: string;
    value: React.ReactNode;
    mono?: boolean;
}) {
    return (
        <div className="grid gap-0.5 sm:grid-cols-[140px_1fr]">
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#7c6f8a]">
                {label}
            </dt>
            <dd
                className={cn(
                    'text-sm text-[#3b2d4a]',
                    mono && 'font-mono text-xs break-all',
                )}
            >
                {value}
            </dd>
        </div>
    );
}

function CpeStatusPill({ status, label }: { status: string; label: string }) {
    return (
        <span
            className={cn(
                'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                status === 'accepted' && 'bg-emerald-100 text-emerald-800',
                (status === 'pending' || status === 'building') &&
                    'bg-amber-100 text-amber-900',
                status === 'sent' && 'bg-sky-100 text-sky-900',
                status === 'rejected' && 'bg-rose-100 text-rose-800',
                status === 'observed' && 'bg-orange-100 text-orange-900',
                status === 'cancelled' && 'bg-slate-200 text-slate-700',
            )}
        >
            {label}
        </span>
    );
}

export default function ElectronicDocumentsShow({
    document: cpe,
}: ElectronicDocumentsShowPageProps) {
    const { can } = useCan();
    const canReemit = can(ELECTRONIC_DOCUMENTS_PERMISSIONS.MANAGE) && cpe.can_reemit;

    const handleReemit = () => {
        if (
            !confirm(
                '¿Reencolar la emisión de este comprobante electrónico a SUNAT?',
            )
        ) {
            return;
        }

        router.post(cpeReemit.url(cpe.id));
    };

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pb-6 md:gap-5 md:p-6 md:pb-6">
            <Head title={`CPE ${cpe.full_number}`} />

            <PageHeader className="mb-0 space-y-3 border-b pb-3">
                <PageHeaderTop>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-fit cursor-pointer gap-1 px-2 text-[#7c6f8a] hover:text-[#5b4d6e]"
                            asChild
                        >
                            <Link href={cpeIndex.url()}>
                                <ArrowLeft className="h-4 w-4" />
                                Volver al listado
                            </Link>
                        </Button>
                        <PageHeaderTitle
                            title={cpe.full_number}
                            description={`${cpe.document_type_label} · ${cpe.customer_name ?? 'Sin cliente'}`}
                        />
                    </div>
                    <PageHeaderActions>
                        {canReemit ? (
                            <Button
                                type="button"
                                className="cursor-pointer gap-2 bg-[#6d28d9] hover:bg-[#5b21b6]"
                                onClick={handleReemit}
                            >
                                <RefreshCw className="h-4 w-4" />
                                Reemitir
                            </Button>
                        ) : null}
                        <Button variant="outline" className="cursor-pointer" asChild>
                            <Link
                                href={`/admin/ventas/comprobantes/${cpe.sales_document_id}/edit`}
                            >
                                Ver comprobante de venta
                            </Link>
                        </Button>
                    </PageHeaderActions>
                </PageHeaderTop>
            </PageHeader>

            <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-xl border border-violet-100/80 bg-white p-4 shadow-sm">
                    <h2 className="mb-3 text-sm font-bold text-[#4c1d95]">
                        Estado SUNAT
                    </h2>
                    <div className="mb-4">
                        <CpeStatusPill
                            status={cpe.status}
                            label={cpe.status_label}
                        />
                    </div>
                    <dl className="flex flex-col gap-3">
                        <DetailRow
                            label="Código respuesta"
                            value={cpe.sunat_response_code ?? '—'}
                            mono
                        />
                        <DetailRow
                            label="Descripción"
                            value={cpe.sunat_description ?? '—'}
                        />
                        <DetailRow label="Pasarela" value={cpe.gateway} />
                        <DetailRow
                            label="Reintentos"
                            value={String(cpe.retry_count)}
                        />
                        <DetailRow
                            label="Enviado"
                            value={cpe.sent_at_label ?? '—'}
                        />
                        <DetailRow
                            label="Aceptado"
                            value={cpe.accepted_at_label ?? '—'}
                        />
                    </dl>
                </section>

                <section className="rounded-xl border border-violet-100/80 bg-white p-4 shadow-sm">
                    <h2 className="mb-3 text-sm font-bold text-[#4c1d95]">
                        Comprobante de venta
                    </h2>
                    <dl className="flex flex-col gap-3">
                        <DetailRow label="Número" value={cpe.full_number} mono />
                        <DetailRow
                            label="Fecha emisión"
                            value={cpe.issue_date_label ?? '—'}
                        />
                        <DetailRow
                            label="Total"
                            value={`${cpe.currency_code} ${cpe.total_label}`}
                        />
                        <DetailRow
                            label="Estado venta"
                            value={cpe.sale_status_label ?? '—'}
                        />
                        <DetailRow
                            label="Líneas"
                            value={String(cpe.lines_count)}
                        />
                    </dl>
                </section>
            </div>

            <section className="rounded-xl border border-violet-100/80 bg-white p-4 shadow-sm">
                <h2 className="mb-4 text-sm font-bold text-[#4c1d95]">
                    Historial de eventos
                </h2>
                {cpe.events.length === 0 ? (
                    <p className="text-sm text-[#6b5b7a]">
                        Sin eventos registrados aún.
                    </p>
                ) : (
                    <ol className="relative border-s border-violet-200 ps-6">
                        {cpe.events.map((event) => (
                            <li key={event.id} className="mb-6 last:mb-0">
                                <span className="absolute -start-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-[#8b5cf6] ring-2 ring-violet-100" />
                                <p className="text-sm font-semibold text-[#3b2d4a]">
                                    {event.event_label}
                                </p>
                                <p className="text-xs text-[#6b5b7a]">
                                    {event.created_at_label}
                                </p>
                                {event.payload &&
                                Object.keys(event.payload).length > 0 ? (
                                    <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-slate-50 p-2 text-[11px] text-slate-700">
                                        {JSON.stringify(event.payload, null, 2)}
                                    </pre>
                                ) : null}
                            </li>
                        ))}
                    </ol>
                )}
            </section>
        </div>
    );
}

ElectronicDocumentsShow.layout = {
    breadcrumbs: documentosComprobantesElectronicosIndex(),
};
