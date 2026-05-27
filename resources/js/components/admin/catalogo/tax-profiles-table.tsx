import { Pencil, Star, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TaxProfileRow } from '@/types/admin/tax-profiles';

export type TaxProfileTableAbilities = {
    canUpdate: boolean;
    canDelete: boolean;
};

type Props = {
    taxProfiles: TaxProfileRow[];
    abilities: TaxProfileTableAbilities;
    onEdit: (taxProfile: TaxProfileRow) => void;
    onDelete: (taxProfile: TaxProfileRow) => void;
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

export function TaxProfilesTable({
    taxProfiles,
    abilities,
    onEdit,
    onDelete,
    onFilteredCountChange,
}: Props) {
    const hasActions = abilities.canUpdate || abilities.canDelete;

    const columns = useMemo<DataTableColumn<TaxProfileRow>[]>(
        () => [
            {
                id: 'name',
                header: 'Perfil',
                primary: true,
                sortable: true,
                sortValue: (row) => row.name,
                truncate: true,
                cell: (row) => (
                    <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-[#3b2d4a]">
                            {row.name}
                        </span>
                        {row.is_default && (
                            <Star className="size-3.5 shrink-0 fill-[#7c3aed] text-[#7c3aed]" />
                        )}
                    </div>
                ),
            },
            {
                id: 'code',
                header: 'Código',
                mobileLabel: 'Código',
                sortable: true,
                sortValue: (row) => row.code,
                cell: (row) => row.code,
                cellClassName: 'font-mono text-sm text-[#7c6f8a]',
            },
            {
                id: 'affectation',
                header: 'Afectación',
                mobileLabel: 'SUNAT',
                sortable: true,
                sortValue: (row) => row.sunat_affectation_code,
                cell: (row) => (
                    <span className="font-mono text-sm">
                        {row.sunat_affectation_code}
                        {row.sunat_affectation_name
                            ? ` · ${row.sunat_affectation_name}`
                            : ''}
                    </span>
                ),
            },
            {
                id: 'igv',
                header: 'IGV %',
                mobileLabel: 'IGV',
                sortable: true,
                sortValue: (row) => Number(row.igv_rate),
                cell: (row) => (
                    <span className="tabular-nums">{row.igv_rate}%</span>
                ),
            },
            {
                id: 'assignments',
                header: 'Asignados',
                mobileLabel: 'Asignados',
                sortable: true,
                sortValue: (row) => row.assignments_count,
                hideOnMobile: true,
                cell: (row) => (
                    <span className="tabular-nums">{row.assignments_count}</span>
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
        (row: TaxProfileRow) =>
            `${row.name} ${row.code} ${row.sunat_affectation_code} ${row.sunat_affectation_name ?? ''} IGV ${row.igv_rate}`,
        [],
    );

    const renderActions = useCallback(
        (taxProfile: TaxProfileRow) => (
            <>
                {abilities.canUpdate && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 cursor-pointer rounded-lg text-[#7c3aed] transition-all duration-200 hover:bg-[#7c3aed] hover:text-white hover:shadow-md hover:shadow-violet-300/40 active:scale-95"
                        onClick={() => onEdit(taxProfile)}
                        aria-label={`Editar ${taxProfile.name}`}
                    >
                        <Pencil className="size-4" />
                    </Button>
                )}
                {abilities.canDelete && !taxProfile.is_default && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 cursor-pointer rounded-lg text-red-600 transition-all duration-200 hover:bg-red-600 hover:text-white hover:shadow-md hover:shadow-red-300/40 active:scale-95"
                        onClick={() => onDelete(taxProfile)}
                        aria-label={`Eliminar ${taxProfile.name}`}
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
            data={taxProfiles}
            columns={columns}
            getRowKey={(row) => row.id}
            getSearchText={getSearchText}
            searchPlaceholder="Buscar perfil…"
            emptyMessage="No hay perfiles. Crea el primero con «Nuevo perfil»."
            emptyFilteredMessage="Ningún perfil coincide con tu búsqueda."
            renderActions={hasActions ? renderActions : undefined}
            onFilteredCountChange={onFilteredCountChange}
            className="min-w-0 [&_table]:table-fixed"
        />
    );
}
