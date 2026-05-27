import { Pencil, Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DocumentSeriesRow } from '@/types/admin/document-series';

export type DocumentSeriesTableAbilities = {
    canUpdate: boolean;
    canDelete: boolean;
};

type Props = {
    rows: DocumentSeriesRow[];
    abilities: DocumentSeriesTableAbilities;
    onEdit: (row: DocumentSeriesRow) => void;
    onDelete: (row: DocumentSeriesRow) => void;
    onFilteredCountChange?: (count: number) => void;
};

function StatusBadge({ active }: { active: boolean }) {
    return (
        <span
            className={cn(
                'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                active
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80'
                    : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80',
            )}
        >
            {active ? 'Activa' : 'Inactiva'}
        </span>
    );
}

export function DocumentSeriesTable({
    rows,
    abilities,
    onEdit,
    onDelete,
    onFilteredCountChange,
}: Props) {
    const hasActions = abilities.canUpdate || abilities.canDelete;

    const columns = useMemo<DataTableColumn<DocumentSeriesRow>[]>(
        () => [
            {
                id: 'type',
                header: 'Comprobante',
                primary: true,
                sortable: true,
                sortValue: (row) => row.document_type_label,
                cell: (row) => (
                    <span>
                        {row.document_type_label}
                        {row.name ? (
                            <span className="mt-0.5 block text-xs font-normal text-[#6b5b7a]">
                                {row.name}
                            </span>
                        ) : null}
                    </span>
                ),
                headerClassName: 'w-[13rem]',
                cellClassName: 'min-w-0 font-semibold text-[#3b2d4a]',
            },
            {
                id: 'series',
                header: 'Serie',
                mobileLabel: 'Serie',
                sortable: true,
                sortValue: (row) => row.series,
                headerClassName: 'w-[7rem] whitespace-nowrap',
                cellClassName: 'whitespace-nowrap font-mono text-sm font-semibold text-[#4c1d95]',
                cell: (row) => row.series,
            },
            {
                id: 'next',
                header: 'Próximo N°',
                mobileLabel: 'Próximo',
                sortable: true,
                sortValue: (row) => row.next_number,
                headerClassName: 'w-[10rem]',
                cellClassName: 'whitespace-nowrap',
                cell: (row) => (
                    <span>
                        <span className="font-semibold tabular-nums text-[#3b2d4a]">
                            {row.next_number}
                        </span>
                        <span className="mt-0.5 block font-mono text-[10px] text-[#7c6f8a]">
                            {row.next_number_preview}
                        </span>
                    </span>
                ),
            },
            {
                id: 'electronic',
                header: 'Electrónico',
                mobileLabel: 'CPE',
                hideOnMobile: true,
                sortable: true,
                sortValue: (row) => (row.is_electronic ? 1 : 0),
                headerClassName: 'w-[7rem] whitespace-nowrap',
                cellClassName: 'whitespace-nowrap text-sm text-[#6b5b7a]',
                cell: (row) => (row.is_electronic ? 'Sí' : 'No'),
            },
            {
                id: 'status',
                header: 'Estado',
                mobileLabel: 'Estado',
                sortable: true,
                sortValue: (row) => (row.is_active ? 1 : 0),
                headerClassName: 'w-[7rem] whitespace-nowrap',
                cellClassName: 'whitespace-nowrap',
                cell: (row) => <StatusBadge active={row.is_active} />,
            },
        ],
        [],
    );

    return (
        <DataTable
            data={rows}
            columns={columns}
            getRowKey={(row) => row.id}
            getSearchText={(row) =>
                `${row.document_type_label} ${row.series} ${row.name ?? ''} ${row.next_number_preview}`
            }
            searchPlaceholder="Buscar serie o tipo…"
            emptyMessage="No hay series registradas."
            emptyFilteredMessage="No se encontraron series."
            defaultSort={{ columnId: 'type', direction: 'asc' }}
            onFilteredCountChange={onFilteredCountChange}
            renderActions={
                hasActions
                    ? (row) => (
                          <div className="flex justify-end gap-1">
                              {abilities.canUpdate && (
                                  <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="size-8 cursor-pointer rounded-lg text-[#7c3aed] transition-all duration-200 hover:bg-[#7c3aed] hover:text-white hover:shadow-md hover:shadow-violet-300/40 active:scale-95"
                                      onClick={() => onEdit(row)}
                                      aria-label="Editar serie"
                                  >
                                      <Pencil className="size-4" />
                                  </Button>
                              )}
                              {abilities.canDelete && (
                                  <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="size-8 cursor-pointer rounded-lg text-red-600 transition-all duration-200 hover:bg-red-600 hover:text-white hover:shadow-md hover:shadow-red-300/40 active:scale-95"
                                      onClick={() => onDelete(row)}
                                      aria-label="Eliminar serie"
                                  >
                                      <Trash2 className="size-4" />
                                  </Button>
                              )}
                          </div>
                      )
                    : undefined
            }
            actionsHeader={hasActions ? 'Acciones' : undefined}
            className="min-w-0 [&_table]:table-fixed"
        />
    );
}
