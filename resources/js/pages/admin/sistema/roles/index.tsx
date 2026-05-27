import { Head, usePage } from '@inertiajs/react';
import { ListFilter } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { RoleDeleteModal } from '@/components/admin/sistema/role-delete-modal';
import { RoleFormModal } from '@/components/admin/sistema/role-form-modal';
import { RolePermissionsModal } from '@/components/admin/sistema/role-permissions-modal';
import { RolesTable } from '@/components/admin/sistema/roles-table';
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
import { useRolesModals } from '@/hooks/use-roles-modals';
import { sistemaRolesIndex } from '@/lib/admin-breadcrumbs';
import { ROLES_PERMISSIONS } from '@/lib/admin-permissions';
import { ROLE_STAT_ICONS } from '@/lib/role-stat-icons';
import type {
    RoleStatItem,
    RolesIndexPageProps,
    RolesPageErrors,
} from '@/types/admin/roles';

type PageProps = RolesIndexPageProps & {
    errors?: RolesPageErrors;
};

export default function RolesIndex({
    roles,
    stats,
    permissionCatalog,
    roleModal = null,
    roleModalRoleId = null,
    oldName = '',
}: RolesIndexPageProps) {
    const { errors = {} } = usePage<PageProps>().props;
    const { can } = useCan();

    const [filteredCount, setFilteredCount] = useState(roles.length);

    const modals = useRolesModals(roles, {
        roleModal,
        roleModalRoleId,
        oldName,
    });

    const tableAbilities = useMemo(
        () => ({
            canUpdate: can(ROLES_PERMISSIONS.UPDATE),
            canDelete: can(ROLES_PERMISSIONS.DELETE),
            canAssignPermissions: can(ROLES_PERMISSIONS.ASSIGN_PERMISSIONS),
        }),
        [can],
    );

    const handleFilteredCountChange = useCallback((count: number) => {
        setFilteredCount(count);
    }, []);

    const resolveStatIcon = useCallback((stat: RoleStatItem) => {
        return stat.icon ?? ROLE_STAT_ICONS[stat.key];
    }, []);

    const showFilteredBadge = filteredCount !== roles.length;

    return (
        <div className="flex flex-1 flex-col gap-2 p-4 pb-6 md:gap-3 md:p-6 md:pb-6">
            <Head title="Roles" />

            <PageHeader className="mb-0 space-y-3 border-b pb-3">
                <PageHeaderTop>
                    <PageHeaderTitle
                        title="Roles"
                        description="Permisos y accesos del personal en el sistema."
                    />
                    <PageHeaderActions>
                        {can(ROLES_PERMISSIONS.CREATE) && (
                            <PageHeaderNewButton
                                onClick={() => modals.openCreate()}
                                label="Nuevo rol"
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

            <RolesTable
                roles={roles}
                abilities={tableAbilities}
                onEdit={modals.openEdit}
                onDelete={modals.openDelete}
                onAssignPermissions={modals.openPermissions}
                onFilteredCountChange={handleFilteredCountChange}
            />

            {(can(ROLES_PERMISSIONS.CREATE) ||
                can(ROLES_PERMISSIONS.UPDATE)) && (
                <RoleFormModal
                    open={modals.formOpen}
                    onOpenChange={modals.handleFormOpenChange}
                    mode={modals.formMode}
                    role={modals.editingRole}
                    errors={modals.formOpen ? errors : {}}
                    defaultName={modals.formOpen ? oldName : ''}
                />
            )}

            {can(ROLES_PERMISSIONS.DELETE) && (
                <RoleDeleteModal
                    open={modals.deleteOpen}
                    onOpenChange={modals.handleDeleteOpenChange}
                    role={modals.deletingRole}
                />
            )}

            {can(ROLES_PERMISSIONS.ASSIGN_PERMISSIONS) &&
                permissionCatalog && (
                    <RolePermissionsModal
                        open={modals.permissionsOpen}
                        onOpenChange={modals.handlePermissionsOpenChange}
                        role={modals.permissionsRole}
                        catalog={permissionCatalog}
                    />
                )}
        </div>
    );
}

RolesIndex.layout = {
    breadcrumbs: sistemaRolesIndex(),
};
