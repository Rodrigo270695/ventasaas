import { Head, Link } from '@inertiajs/react';
import { Mail, PackageCheck, Pencil } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    PurchaseOrderSendEmailModal,
    type PurchaseOrderSupplierEmailMeta,
} from '@/components/admin/compras/purchase-order-send-email-modal';
import {
    PageHeader,
    PageHeaderActions,
    PageHeaderBadges,
    PageHeaderNewButton,
    PageHeaderTitle,
    PageHeaderTop,
    StatBadge,
} from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { useCan } from '@/hooks/use-can';
import { comprasOrdenesIndex } from '@/lib/admin-breadcrumbs';
import { PURCHASES_PERMISSIONS } from '@/lib/admin-permissions';
import {
    purchaseTableIconBtnAmber,
    purchaseTableIconBtnEmerald,
    purchaseTableIconBtnViolet,
} from '@/lib/purchase-form-styles';

const INDEX_URL = '/admin/compras/ordenes';

type OrderRow = {
    id: string;
    internal_number: string;
    order_date_label: string;
    supplier_name: string;
    status: string;
    status_label: string;
    total_label: string;
    currency_code: string;
    can_receive: boolean;
    can_send_email: boolean;
    supplier_default_email: string;
    supplier_email_to: string | null;
    supplier_email_cc: string;
    supplier_email_sent_label: string | null;
    supplier_confirmed_label: string | null;
    is_supplier_confirmed: boolean;
    is_supplier_email_sent: boolean;
};

type Props = {
    orders: OrderRow[];
    filters: { search: string; status: string; from: string | null; to: string | null };
    stats: Array<{ key: string; label: string; value: number; tone: string }>;
    statusOptions: Array<{ value: string; label: string }>;
};

function emailMetaFromRow(row: OrderRow): PurchaseOrderSupplierEmailMeta {
    return {
        default_email: row.supplier_default_email,
        last_sent_to: row.supplier_email_to,
        last_sent_cc: row.supplier_email_cc,
        sent_at_label: row.supplier_email_sent_label,
        confirmed_at_label: row.supplier_confirmed_label,
        can_send: row.can_send_email,
        is_confirmed: row.is_supplier_confirmed,
    };
}

function SupplierEmailBadge({ row }: { row: OrderRow }) {
    if (row.is_supplier_confirmed) {
        return (
            <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 ring-1 ring-emerald-200">
                Confirmada por proveedor
            </span>
        );
    }

    if (row.is_supplier_email_sent) {
        return (
            <span className="mt-1 inline-flex rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-800 ring-1 ring-sky-200">
                Correo enviado
            </span>
        );
    }

    return null;
}

export default function PurchaseOrdersIndex({
    orders = [],
    stats = [],
}: Props) {
    const { can } = useCan();
    const canManage = can(PURCHASES_PERMISSIONS.MANAGE);
    const canView = can(PURCHASES_PERMISSIONS.VIEW);

    const [emailTarget, setEmailTarget] = useState<OrderRow | null>(null);

    const columns = useMemo<DataTableColumn<OrderRow>[]>(
        () => [
            {
                id: 'number',
                header: 'Orden',
                primary: true,
                sortable: true,
                sortValue: (row) => row.internal_number,
                cell: (row) => (
                    <div>
                        <span className="font-mono font-semibold text-[#7c3aed]">
                            {row.internal_number}
                        </span>
                        <SupplierEmailBadge row={row} />
                    </div>
                ),
            },
            {
                id: 'supplier',
                header: 'Proveedor',
                sortable: true,
                sortValue: (row) => row.supplier_name,
                cell: (row) => row.supplier_name,
            },
            {
                id: 'date',
                header: 'Fecha',
                sortable: true,
                sortValue: (row) => row.order_date_label,
                cell: (row) => row.order_date_label,
            },
            {
                id: 'status',
                header: 'Estado',
                sortable: true,
                sortValue: (row) => row.status_label,
                cell: (row) => (
                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-semibold text-[#5b21b6]">
                        {row.status_label}
                    </span>
                ),
            },
            {
                id: 'total',
                header: 'Total',
                sortable: true,
                sortValue: (row) => row.total_label,
                cell: (row) => (
                    <span className="font-semibold tabular-nums">
                        {row.currency_code} {row.total_label}
                    </span>
                ),
            },
        ],
        [],
    );

    return (
        <div className="flex flex-1 flex-col gap-3 p-4 md:p-6">
            <Head title="Órdenes de compra" />

            <PageHeader className="mb-0 border-b pb-3">
                <PageHeaderTop>
                    <PageHeaderTitle
                        title="Órdenes de compra"
                        description="Solicitud formal al proveedor. Después registras la recepción y la factura."
                    />
                    <PageHeaderActions>
                        {canManage ? (
                            <PageHeaderNewButton
                                href={`${INDEX_URL}/nuevo`}
                                label="Nueva orden"
                            />
                        ) : null}
                    </PageHeaderActions>
                </PageHeaderTop>
                <PageHeaderBadges>
                    {stats.map((s) => (
                        <StatBadge
                            key={s.key}
                            label={s.label}
                            value={String(s.value)}
                            tone={s.tone as 'violet'}
                        />
                    ))}
                </PageHeaderBadges>
            </PageHeader>

            <DataTable
                data={orders}
                columns={columns}
                getRowKey={(r) => r.id}
                getSearchText={(r) =>
                    `${r.internal_number} ${r.supplier_name} ${r.status_label}`
                }
                searchPlaceholder="Buscar orden o proveedor…"
                emptyMessage="No hay órdenes de compra."
                defaultSort={{ columnId: 'date', direction: 'desc' }}
                actionsHeader=""
                renderActions={(row) => (
                    <div className="flex items-center justify-end gap-1">
                        {canView ? (
                            <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                className={purchaseTableIconBtnViolet}
                            >
                                <Link
                                    href={`${INDEX_URL}/${row.id}/edit`}
                                    aria-label={`Ver orden ${row.internal_number}`}
                                >
                                    <Pencil className="size-4" />
                                </Link>
                            </Button>
                        ) : null}
                        {canManage && row.can_send_email ? (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className={
                                    row.is_supplier_confirmed
                                        ? purchaseTableIconBtnEmerald
                                        : purchaseTableIconBtnViolet
                                }
                                onClick={() => setEmailTarget(row)}
                                aria-label={`Enviar correo ${row.internal_number}`}
                            >
                                <Mail className="size-4" />
                            </Button>
                        ) : null}
                        {row.can_receive ? (
                            <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                className={purchaseTableIconBtnAmber}
                            >
                                <Link
                                    href={`/admin/compras/recepciones/nuevo?orden=${row.id}`}
                                    aria-label={`Registrar recepción ${row.internal_number}`}
                                >
                                    <PackageCheck className="size-4" />
                                </Link>
                            </Button>
                        ) : null}
                    </div>
                )}
            />

            {emailTarget && canManage ? (
                <PurchaseOrderSendEmailModal
                    open={Boolean(emailTarget)}
                    onOpenChange={(open) => {
                        if (!open) {
                            setEmailTarget(null);
                        }
                    }}
                    orderId={emailTarget.id}
                    orderNumber={emailTarget.internal_number}
                    sendUrl={`${INDEX_URL}/${emailTarget.id}/enviar-correo`}
                    meta={emailMetaFromRow(emailTarget)}
                />
            ) : null}
        </div>
    );
}

PurchaseOrdersIndex.layout = () => ({
    breadcrumbs: comprasOrdenesIndex(),
});
