import { Head, Link } from '@inertiajs/react';
import { FileText } from 'lucide-react';
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
import { comprasRecepcionesIndex } from '@/lib/admin-breadcrumbs';
import { PURCHASES_PERMISSIONS } from '@/lib/admin-permissions';
import { purchaseTableIconBtnAmber } from '@/lib/purchase-form-styles';

const INDEX_URL = '/admin/compras/recepciones';

type ReceiptRow = {
    id: string;
    internal_number: string;
    received_date_label: string;
    purchase_order_number: string;
    supplier_name: string;
    warehouse_name: string;
    has_invoice: boolean;
    invoice_create_url: string | null;
};

type Props = {
    receipts: ReceiptRow[];
    stats: Array<{ key: string; label: string; value: number; tone: string }>;
};

export default function GoodsReceiptsIndex({ receipts = [], stats = [] }: Props) {
    const { can } = useCan();
    const canManage = can(PURCHASES_PERMISSIONS.MANAGE);

    const columns: DataTableColumn<ReceiptRow>[] = [
        {
            id: 'number',
            header: 'Recepción',
            primary: true,
            cell: (row) => (
                <span className="font-mono font-semibold text-[#7c3aed]">
                    {row.internal_number}
                </span>
            ),
        },
        {
            id: 'oc',
            header: 'Orden',
            cell: (row) => row.purchase_order_number,
        },
        {
            id: 'supplier',
            header: 'Proveedor',
            cell: (row) => row.supplier_name,
        },
        {
            id: 'warehouse',
            header: 'Almacén',
            cell: (row) => row.warehouse_name,
        },
        {
            id: 'date',
            header: 'Fecha',
            cell: (row) => row.received_date_label,
        },
        {
            id: 'invoice',
            header: 'Factura',
            cell: (row) =>
                row.has_invoice ? (
                    <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200/80">
                        Registrada
                    </span>
                ) : (
                    <span className="text-[#9d8fb0]">Pendiente</span>
                ),
        },
    ];

    return (
        <div className="flex flex-1 flex-col gap-3 p-4 md:p-6">
            <Head title="Recepciones de compra" />
            <PageHeader className="mb-0 border-b pb-3">
                <PageHeaderTop>
                    <PageHeaderTitle
                        title="Recepciones"
                        description="Ingreso físico de mercadería al almacén según la orden de compra."
                    />
                    <PageHeaderActions>
                        {can(PURCHASES_PERMISSIONS.MANAGE) ? (
                            <PageHeaderNewButton
                                href={`${INDEX_URL}/nuevo`}
                                label="Nueva recepción"
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
                data={receipts}
                columns={columns}
                getRowKey={(r) => r.id}
                getSearchText={(r) =>
                    `${r.internal_number} ${r.purchase_order_number} ${r.supplier_name}`
                }
                searchPlaceholder="Buscar recepción u orden…"
                emptyMessage="No hay recepciones registradas."
                actionsHeader=""
                renderActions={(row) => (
                    <div className="flex items-center justify-end gap-1">
                        {canManage && row.invoice_create_url ? (
                            <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                className={purchaseTableIconBtnAmber}
                            >
                                <Link
                                    href={row.invoice_create_url}
                                    aria-label={`Registrar factura ${row.internal_number}`}
                                >
                                    <FileText className="size-4" />
                                </Link>
                            </Button>
                        ) : null}
                    </div>
                )}
            />
        </div>
    );
}

GoodsReceiptsIndex.layout = () => ({
    breadcrumbs: comprasRecepcionesIndex(),
});
