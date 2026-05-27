import { KeyRound, Pencil, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import type { RoleRow } from '@/types/admin/roles';

export type RoleTableAbilities = {
    canUpdate: boolean;
    canDelete: boolean;
    canAssignPermissions: boolean;
};

type Props = {
    roles: RoleRow[];
    abilities: RoleTableAbilities;
    onEdit: (role: RoleRow) => void;
    onDelete: (role: RoleRow) => void;
    onAssignPermissions: (role: RoleRow) => void;
    onFilteredCountChange?: (count: number) => void;
};

function canDeleteRole(role: RoleRow): boolean {
    return role.name !== 'admin' && role.users_count === 0;
}

export function RolesTable({
    roles,
    abilities,
    onEdit,
    onDelete,
    onAssignPermissions,
    onFilteredCountChange,
}: Props) {
    const hasActions = useMemo(
        () =>
            abilities.canUpdate ||
            abilities.canDelete ||
            abilities.canAssignPermissions,
        [abilities],
    );

    const columns = useMemo<DataTableColumn<RoleRow>[]>(
        () => [
            {
                id: 'name',
                header: 'Rol',
                primary: true,
                sortable: true,
                sortValue: (row) => row.name,
                truncate: true,
                cell: (row) => row.name,
                cellClassName: 'font-semibold text-[#3b2d4a]',
            },
            {
                id: 'permissions',
                header: 'Permisos',
                mobileLabel: 'Permisos',
                sortable: true,
                sortValue: (row) => row.permissions_count,
                cell: (row) => row.permissions_count,
                cellClassName: 'tabular-nums text-[#7c6f8a]',
            },
            {
                id: 'users',
                header: 'Usuarios',
                mobileLabel: 'Usuarios',
                sortable: true,
                sortValue: (row) => row.users_count,
                cell: (row) => row.users_count,
                cellClassName: 'tabular-nums text-[#7c6f8a]',
            },
        ],
        [],
    );

    const getSearchText = useCallback(
        (row: RoleRow) =>
            `${row.name} ${row.permissions_count} ${row.users_count}`,
        [],
    );

    const renderActions = useCallback(
        (role: RoleRow) => {
            const deleteDisabled = !canDeleteRole(role);

            return (
                <>
                    {abilities.canAssignPermissions && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 cursor-pointer rounded-lg text-cyan-700 transition-all duration-200 hover:bg-cyan-600 hover:text-white hover:shadow-md hover:shadow-cyan-300/40 active:scale-95"
                            onClick={() => onAssignPermissions(role)}
                            aria-label={`Permisos de ${role.name}`}
                        >
                            <KeyRound className="size-4" />
                        </Button>
                    )}
                    {abilities.canUpdate && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 cursor-pointer rounded-lg text-[#7c3aed] transition-all duration-200 hover:bg-[#7c3aed] hover:text-white hover:shadow-md hover:shadow-violet-300/40 active:scale-95"
                            onClick={() => onEdit(role)}
                            aria-label={`Editar ${role.name}`}
                        >
                            <Pencil className="size-4" />
                        </Button>
                    )}
                    {abilities.canDelete && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 cursor-pointer rounded-lg text-red-600 transition-all duration-200 hover:bg-red-600 hover:text-white hover:shadow-md hover:shadow-red-300/40 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-red-600/50 disabled:hover:shadow-none"
                            onClick={() => onDelete(role)}
                            disabled={deleteDisabled}
                            aria-label={
                                deleteDisabled
                                    ? `No se puede eliminar ${role.name}`
                                    : `Eliminar ${role.name}`
                            }
                            title={
                                role.users_count > 0
                                    ? 'Quita este rol de los usuarios antes de eliminarlo'
                                    : undefined
                            }
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    )}
                </>
            );
        },
        [abilities, onEdit, onDelete, onAssignPermissions],
    );

    return (
        <DataTable
            data={roles}
            columns={columns}
            getRowKey={(row) => row.id}
            getSearchText={getSearchText}
            searchPlaceholder="Buscar rol…"
            emptyMessage="No hay roles. Crea el primero con «Nuevo rol»."
            emptyFilteredMessage="Ningún rol coincide con tu búsqueda."
            renderActions={hasActions ? renderActions : undefined}
            onFilteredCountChange={onFilteredCountChange}
            className="min-w-0 [&_table]:table-fixed"
        />
    );
}
