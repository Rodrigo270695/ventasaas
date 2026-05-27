import { Head, usePage } from '@inertiajs/react';
import { ListFilter } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { UserDeleteModal } from '@/components/admin/sistema/user-delete-modal';
import { UserFormModal } from '@/components/admin/sistema/user-form-modal';
import { UserRolesModal } from '@/components/admin/sistema/user-roles-modal';
import { UsersTable } from '@/components/admin/sistema/users-table';
import {
    PageHeader,
    PageHeaderActions,
    PageHeaderBadges,
    PageHeaderNewButton,
    PageHeaderTitle,
    PageHeaderTop,
    StatBadge,
} from '@/components/page-header';
import { useCan } from '@/hooks/use-can';
import { useUsersModals } from '@/hooks/use-users-modals';
import { USERS_PERMISSIONS } from '@/lib/admin-permissions';
import { sistemaUsersIndex } from '@/lib/admin-breadcrumbs';
import { USER_STAT_ICONS } from '@/lib/user-stat-icons';
import type {
    UserStatItem,
    UsersIndexPageProps,
    UsersPageErrors,
} from '@/types/admin/users';

type PageProps = UsersIndexPageProps & {
    errors?: UsersPageErrors;
};

export default function UsersIndex({
    users,
    stats,
    rolesCatalog,
    userModal = null,
    userModalUserId = null,
    oldForm,
}: UsersIndexPageProps) {
    const { errors = {} } = usePage<PageProps>().props;
    const { can } = useCan();

    const [filteredCount, setFilteredCount] = useState(users.length);

    const modals = useUsersModals(users, {
        userModal,
        userModalUserId,
    });

    const tableAbilities = useMemo(
        () => ({
            canUpdate: can(USERS_PERMISSIONS.UPDATE),
            canDelete: can(USERS_PERMISSIONS.DELETE),
            canAssignRoles: can(USERS_PERMISSIONS.ASSIGN_ROLES),
        }),
        [can],
    );

    const handleFilteredCountChange = useCallback((count: number) => {
        setFilteredCount(count);
    }, []);

    const resolveStatIcon = useCallback((stat: UserStatItem) => {
        return stat.icon ?? USER_STAT_ICONS[stat.key];
    }, []);

    const showFilteredBadge = filteredCount !== users.length;

    return (
        <div className="flex flex-1 flex-col gap-2 p-4 pb-6 md:gap-3 md:p-6 md:pb-6">
            <Head title="Usuarios" />

            <PageHeader className="mb-0 space-y-3 border-b pb-3">
                <PageHeaderTop>
                    <PageHeaderTitle
                        title="Usuarios"
                        description="Cuentas del personal y acceso al sistema."
                    />
                    <PageHeaderActions>
                        {can(USERS_PERMISSIONS.CREATE) && (
                            <PageHeaderNewButton
                                onClick={() => modals.openCreate()}
                                label="Nuevo usuario"
                            />
                        )}
                    </PageHeaderActions>
                </PageHeaderTop>

                <PageHeaderBadges>
                    {stats.map((stat) => (
                        <StatBadge
                            key={stat.key}
                            label={stat.label}
                            value={stat.value}
                            tone={stat.tone}
                            icon={resolveStatIcon(stat)}
                        />
                    ))}
                    {showFilteredBadge && (
                        <StatBadge
                            label="Resultados"
                            value={filteredCount}
                            tone="pink"
                            icon={ListFilter}
                        />
                    )}
                </PageHeaderBadges>
            </PageHeader>

            <UsersTable
                users={users}
                abilities={tableAbilities}
                onEdit={modals.openEdit}
                onDelete={modals.openDelete}
                onAssignRoles={modals.openRoles}
                onFilteredCountChange={handleFilteredCountChange}
            />

            {(can(USERS_PERMISSIONS.CREATE) ||
                can(USERS_PERMISSIONS.UPDATE)) && (
                <UserFormModal
                    open={modals.formOpen}
                    onOpenChange={modals.handleFormOpenChange}
                    mode={modals.formMode}
                    user={modals.editingUser}
                    errors={modals.formOpen ? errors : {}}
                    oldForm={modals.formOpen ? oldForm : undefined}
                />
            )}

            {can(USERS_PERMISSIONS.DELETE) && (
                <UserDeleteModal
                    open={modals.deleteOpen}
                    onOpenChange={modals.handleDeleteOpenChange}
                    user={modals.deletingUser}
                />
            )}

            {can(USERS_PERMISSIONS.ASSIGN_ROLES) && rolesCatalog && (
                <UserRolesModal
                    open={modals.rolesOpen}
                    onOpenChange={modals.handleRolesOpenChange}
                    user={modals.rolesUser}
                    roles={rolesCatalog}
                />
            )}
        </div>
    );
}

UsersIndex.layout = {
    breadcrumbs: sistemaUsersIndex(),
};
