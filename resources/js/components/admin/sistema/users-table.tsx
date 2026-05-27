import { usePage } from '@inertiajs/react';
import { KeyRound, Pencil, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { DataTable } from '@/components/data-table';
import type { DataTableColumn } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Auth } from '@/types/auth';
import type { UserRow } from '@/types/admin/users';

export type UserTableAbilities = {
    canUpdate: boolean;
    canDelete: boolean;
    canAssignRoles: boolean;
};

type Props = {
    users: UserRow[];
    abilities: UserTableAbilities;
    onEdit: (user: UserRow) => void;
    onDelete: (user: UserRow) => void;
    onAssignRoles: (user: UserRow) => void;
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

export function UsersTable({
    users,
    abilities,
    onEdit,
    onDelete,
    onAssignRoles,
    onFilteredCountChange,
}: Props) {
    const authUserId = usePage<{ auth: Auth }>().props.auth.user?.id;

    const hasActions = useMemo(
        () =>
            abilities.canUpdate ||
            abilities.canDelete ||
            abilities.canAssignRoles,
        [abilities],
    );

    const columns = useMemo<DataTableColumn<UserRow>[]>(
        () => [
            {
                id: 'name',
                header: 'Usuario',
                primary: true,
                sortable: true,
                sortValue: (row) => row.name,
                truncate: true,
                cell: (row) => row.name,
                cellClassName: 'font-semibold text-[#3b2d4a]',
            },
            {
                id: 'email',
                header: 'Correo',
                mobileLabel: 'Correo',
                sortable: true,
                sortValue: (row) => row.email,
                truncate: true,
                cell: (row) => row.email,
                cellClassName: 'text-[#7c6f8a]',
            },
            {
                id: 'roles',
                header: 'Roles',
                mobileLabel: 'Roles',
                sortable: true,
                sortValue: (row) => row.role_names.join(', '),
                truncate: true,
                cell: (row) =>
                    row.role_names.length > 0
                        ? row.role_names.join(', ')
                        : '—',
                cellClassName: 'text-[#7c6f8a]',
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
        (row: UserRow) =>
            `${row.name} ${row.email} ${row.role_names.join(' ')} ${row.is_active ? 'activo' : 'inactivo'}`,
        [],
    );

    const renderActions = useCallback(
        (user: UserRow) => {
            const isSelf = authUserId === user.id;
            const deleteDisabled = isSelf;

            return (
                <>
                    {abilities.canAssignRoles && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 cursor-pointer rounded-lg text-cyan-700 transition-all duration-200 hover:bg-cyan-600 hover:text-white hover:shadow-md hover:shadow-cyan-300/40 active:scale-95"
                            onClick={() => onAssignRoles(user)}
                            aria-label={`Roles de ${user.name}`}
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
                            onClick={() => onEdit(user)}
                            aria-label={`Editar ${user.name}`}
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
                            onClick={() => onDelete(user)}
                            disabled={deleteDisabled}
                            aria-label={
                                deleteDisabled
                                    ? 'No puedes eliminar tu propia cuenta'
                                    : `Eliminar ${user.name}`
                            }
                            title={
                                deleteDisabled
                                    ? 'No puedes eliminar tu propia cuenta'
                                    : undefined
                            }
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    )}
                </>
            );
        },
        [abilities, authUserId, onEdit, onDelete, onAssignRoles],
    );

    return (
        <DataTable
            data={users}
            columns={columns}
            getRowKey={(row) => row.id}
            getSearchText={getSearchText}
            searchPlaceholder="Buscar usuario…"
            emptyMessage="No hay usuarios. Crea el primero con «Nuevo usuario»."
            emptyFilteredMessage="Ningún usuario coincide con tu búsqueda."
            renderActions={hasActions ? renderActions : undefined}
            onFilteredCountChange={onFilteredCountChange}
            className="min-w-0 [&_table]:table-fixed"
        />
    );
}
