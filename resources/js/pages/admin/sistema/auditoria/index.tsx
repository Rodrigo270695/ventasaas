import { Head } from '@inertiajs/react';
import { History, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';
import {
    PageHeader,
    PageHeaderBadges,
    PageHeaderTitle,
    PageHeaderTop,
    StatBadge,
} from '@/components/page-header';
import { sistemaAuditoriaIndex } from '@/lib/admin-breadcrumbs';

type AuditEvent = {
    module: string;
    entity: string;
    reference: string;
    action: 'created' | 'updated' | 'deleted';
    at: string;
};

type AuditStat = {
    key: string;
    label: string;
    value: number;
    tone: 'violet' | 'green' | 'cyan' | 'amber' | 'pink';
};

type Props = {
    events: AuditEvent[];
    stats: AuditStat[];
};

const ACTION_META = {
    created: {
        label: 'Creado',
        icon: Plus,
        badge: 'bg-emerald-100 text-emerald-700',
    },
    updated: {
        label: 'Actualizado',
        icon: Pencil,
        badge: 'bg-cyan-100 text-cyan-700',
    },
    deleted: {
        label: 'Eliminado',
        icon: Trash2,
        badge: 'bg-amber-100 text-amber-700',
    },
} as const;

export default function AuditoriaIndex({ events, stats }: Props) {
    const columns = useMemo<DataTableColumn<AuditEvent>[]>(
        () => [
            {
                id: 'date',
                header: 'Fecha',
                sortable: true,
                sortValue: (row) => row.at,
                headerClassName: 'w-[11rem] whitespace-nowrap',
                cellClassName: 'whitespace-nowrap text-[#6b5b7a]',
                cell: (row) => new Date(row.at).toLocaleString('es-PE'),
            },
            {
                id: 'module',
                header: 'Módulo',
                primary: true,
                sortable: true,
                sortValue: (row) => row.module,
                headerClassName: 'w-[8rem]',
                cellClassName: 'font-semibold text-[#5b2d82]',
                cell: (row) => row.module,
            },
            {
                id: 'entity',
                header: 'Entidad',
                sortable: true,
                sortValue: (row) => row.entity,
                headerClassName: 'w-[10rem]',
                cellClassName: 'text-[#4b3a60]',
                cell: (row) => row.entity,
            },
            {
                id: 'action',
                header: 'Acción',
                sortable: true,
                sortValue: (row) => row.action,
                headerClassName: 'w-[8.5rem] whitespace-nowrap',
                cellClassName: 'whitespace-nowrap',
                cell: (row) => {
                    const meta = ACTION_META[row.action];
                    const ActionIcon = meta.icon;

                    return (
                        <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${meta.badge}`}
                        >
                            <ActionIcon className="size-3" />
                            {meta.label}
                        </span>
                    );
                },
            },
            {
                id: 'reference',
                header: 'Detalle',
                sortable: true,
                sortValue: (row) => row.reference,
                headerClassName: 'min-w-[14rem]',
                cellClassName: 'min-w-0 text-[#4b3a60]',
                cell: (row) => (
                    <span className="block truncate" title={row.reference}>
                        {row.reference}
                    </span>
                ),
            },
        ],
        [],
    );

    return (
        <div className="flex flex-1 flex-col gap-3 p-4 pb-6 md:p-6">
            <Head title="Auditoría" />

            <PageHeader className="mb-0 space-y-3 border-b pb-3">
                <PageHeaderTop>
                    <PageHeaderTitle
                        title="Auditoría"
                        description="Actividad reciente de módulos clave del sistema."
                    />
                </PageHeaderTop>
                <PageHeaderBadges>
                    {stats.map((stat) => (
                        <StatBadge
                            key={stat.key}
                            label={stat.label}
                            value={stat.value}
                            tone={stat.tone}
                            icon={History}
                        />
                    ))}
                </PageHeaderBadges>
            </PageHeader>

            <DataTable
                data={events}
                columns={columns}
                getRowKey={(row) => `${row.module}-${row.entity}-${row.at}-${row.reference}`}
                getSearchText={(row) =>
                    [row.module, row.entity, row.reference, row.action].join(' ')
                }
                searchPlaceholder="Buscar evento…"
                emptyMessage="Sin eventos recientes."
                emptyFilteredMessage="Ningún evento coincide con tu búsqueda."
                defaultSort={{ columnId: 'date', direction: 'desc' }}
                className="min-w-0 [&_table]:table-fixed"
            />
        </div>
    );
}

AuditoriaIndex.layout = {
    breadcrumbs: sistemaAuditoriaIndex(),
};

