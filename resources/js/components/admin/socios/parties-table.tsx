import { Pencil, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { formatDecimalDisplay } from '@/lib/format-decimal';
import { PartySunatBadges } from '@/components/admin/socios/party-sunat-badges';
import { partyTypeLabel } from '@/lib/party-type-options';
import { cn } from '@/lib/utils';
import type { PartyRow } from '@/types/admin/parties';

export type PartyTableAbilities = {
    canUpdate: boolean;
    canDelete: boolean;
};

type Props = {
    parties: PartyRow[];
    abilities: PartyTableAbilities;
    onEdit: (party: PartyRow) => void;
    onDelete: (party: PartyRow) => void;
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
            {active ? 'Activo' : 'Inactivo'}
        </span>
    );
}

function TypeBadge({ type }: { type: string }) {
    const tone =
        type === 'customer'
            ? 'bg-cyan-50 text-cyan-800 ring-cyan-200/80'
            : type === 'supplier'
              ? 'bg-amber-50 text-amber-800 ring-amber-200/80'
              : 'bg-violet-50 text-violet-800 ring-violet-200/80';

    return (
        <span
            className={cn(
                'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1',
                tone,
            )}
        >
            {partyTypeLabel(type)}
        </span>
    );
}

export function PartiesTable({
    parties,
    abilities,
    onEdit,
    onDelete,
    onFilteredCountChange,
}: Props) {
    const hasActions = abilities.canUpdate || abilities.canDelete;

    const columns = useMemo<DataTableColumn<PartyRow>[]>(
        () => [
            {
                id: 'legal_name',
                header: 'Socio',
                primary: true,
                sortable: true,
                sortValue: (row) => row.legal_name,
                truncate: true,
                cell: (row) => (
                    <span>
                        {row.legal_name}
                        {row.trade_name ? (
                            <span className="mt-0.5 block text-xs font-normal text-[#6b5b7a]">
                                {row.trade_name}
                            </span>
                        ) : null}
                    </span>
                ),
                cellClassName: 'font-semibold text-[#3b2d4a]',
            },
            {
                id: 'document',
                header: 'Documento',
                mobileLabel: 'Documento',
                sortable: true,
                sortValue: (row) => row.document_number,
                cell: (row) => (
                    <div className="space-y-1.5">
                        <span className="font-mono text-sm text-[#7c6f8a]">
                            {row.document_label}
                        </span>
                        {row.document_type === '6' &&
                        (row.sunat_estado || row.sunat_condicion) ? (
                            <PartySunatBadges
                                sunatEstado={row.sunat_estado}
                                sunatCondicion={row.sunat_condicion}
                            />
                        ) : null}
                    </div>
                ),
            },
            {
                id: 'type',
                header: 'Tipo',
                mobileLabel: 'Tipo',
                sortable: true,
                sortValue: (row) => row.type,
                cell: (row) => <TypeBadge type={row.type} />,
            },
            {
                id: 'contact',
                header: 'Contacto',
                mobileLabel: 'Contacto',
                cell: (row) => (
                    <span className="text-sm text-[#6b5b7a]">
                        {row.email ?? row.phone ?? '—'}
                    </span>
                ),
            },
            {
                id: 'credit',
                header: 'Crédito',
                mobileLabel: 'Crédito',
                sortable: true,
                sortValue: (row) => Number(row.credit_limit),
                cell: (row) => (
                    <span className="text-sm text-[#3b2d4a]">
                        S/ {formatDecimalDisplay(row.credit_limit)}
                        {row.payment_term_days > 0 ? (
                            <span className="block text-[11px] text-[#7c6f8a]">
                                {row.payment_term_days} días
                            </span>
                        ) : null}
                    </span>
                ),
            },
            {
                id: 'status',
                header: 'Estado',
                mobileLabel: 'Estado',
                sortable: true,
                sortValue: (row) => (row.is_active ? 1 : 0),
                cell: (row) => <StatusBadge active={row.is_active} />,
            },
        ],
        [],
    );

    const getSearchText = useCallback(
        (row: PartyRow) =>
            [
                row.legal_name,
                row.trade_name,
                row.document_number,
                row.document_type_label,
                row.email,
                row.phone,
                partyTypeLabel(row.type),
                row.is_active ? 'activo' : 'inactivo',
            ]
                .filter(Boolean)
                .join(' '),
        [],
    );

    const renderActions = useCallback(
        (party: PartyRow) => (
            <>
                {abilities.canUpdate && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 cursor-pointer rounded-lg text-[#7c3aed] transition-all duration-200 hover:bg-[#7c3aed] hover:text-white hover:shadow-md hover:shadow-violet-300/40 active:scale-95"
                        onClick={() => onEdit(party)}
                        aria-label={`Editar ${party.legal_name}`}
                    >
                        <Pencil className="size-4" />
                    </Button>
                )}
                {abilities.canDelete && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="cursor-pointer rounded-lg text-red-600 transition-all duration-200 hover:bg-red-600 hover:text-white hover:shadow-md hover:shadow-red-300/40 active:scale-95"
                        onClick={() => onDelete(party)}
                        aria-label={`Eliminar ${party.legal_name}`}
                    >
                        <Trash2 className="size-4" />
                    </Button>
                )}
            </>
        ),
        [abilities, onEdit, onDelete],
    );

    return (
        <DataTable
            data={parties}
            columns={columns}
            getRowKey={(row) => row.id}
            getSearchText={getSearchText}
            searchPlaceholder="Buscar socio, RUC, DNI…"
            emptyMessage="No hay socios. Registra el primero con «Nuevo socio»."
            emptyFilteredMessage="Ningún socio coincide con tu búsqueda."
            renderActions={hasActions ? renderActions : undefined}
            onFilteredCountChange={onFilteredCountChange}
        />
    );
}
