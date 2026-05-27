import { router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import { index as rolesIndex } from '@/routes/admin/sistema/roles';
import type { RoleFormValues } from '@/components/admin/sistema/role-form-modal';
import type { RoleRow, RolesIndexPageProps } from '@/types/admin/roles';

export type RolesModalFlash = Pick<
    RolesIndexPageProps,
    'roleModal' | 'roleModalRoleId' | 'oldName'
>;

type FormState = {
    open: boolean;
    mode: 'create' | 'edit';
    role: RoleFormValues | null;
};

function buildInitialFormState(
    roleModal: RolesIndexPageProps['roleModal'],
    roleModalRoleId: RolesIndexPageProps['roleModalRoleId'],
    roles: RoleRow[],
): FormState {
    if (roleModal === 'create') {
        return { open: true, mode: 'create', role: null };
    }

    if (roleModal === 'edit' && roleModalRoleId) {
        const role = roles.find((row) => row.id === roleModalRoleId);

        if (role) {
            return {
                open: true,
                mode: 'edit',
                role: { id: role.id, name: role.name },
            };
        }
    }

    return { open: false, mode: 'create', role: null };
}

const rolesIndexResetUrl = rolesIndex.url({
    query: { _reset: 1 },
});

export function useRolesModals(roles: RoleRow[], flash: RolesModalFlash) {
    const initial = buildInitialFormState(
        flash.roleModal,
        flash.roleModalRoleId,
        roles,
    );

    const [formOpen, setFormOpen] = useState(initial.open);
    const [formMode, setFormMode] = useState(initial.mode);
    const [editingRole, setEditingRole] = useState(initial.role);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletingRole, setDeletingRole] = useState<RoleRow | null>(null);

    const [permissionsOpen, setPermissionsOpen] = useState(false);
    const [permissionsRole, setPermissionsRole] = useState<RoleRow | null>(
        null,
    );

    const closeFormModal = useCallback(() => {
        setFormOpen(false);
        setEditingRole(null);

        router.visit(rolesIndexResetUrl, {
            preserveScroll: true,
            replace: true,
        });
    }, []);

    const openCreate = useCallback(() => {
        setFormMode('create');
        setEditingRole(null);
        setFormOpen(true);
    }, []);

    const openEdit = useCallback((role: RoleRow) => {
        setFormMode('edit');
        setEditingRole({ id: role.id, name: role.name });
        setFormOpen(true);
    }, []);

    const openDelete = useCallback((role: RoleRow) => {
        setDeletingRole(role);
        setDeleteOpen(true);
    }, []);

    const openPermissions = useCallback((role: RoleRow) => {
        setPermissionsRole(role);
        setPermissionsOpen(true);
    }, []);

    const handlePermissionsOpenChange = useCallback((open: boolean) => {
        setPermissionsOpen(open);

        if (!open) {
            setPermissionsRole(null);
        }
    }, []);

    const handleDeleteOpenChange = useCallback((open: boolean) => {
        setDeleteOpen(open);

        if (!open) {
            setDeletingRole(null);
        }
    }, []);

    const handleFormOpenChange = useCallback(
        (open: boolean) => {
            if (!open) {
                closeFormModal();

                return;
            }

            setFormOpen(true);
        },
        [closeFormModal],
    );

    return {
        formOpen,
        formMode,
        editingRole,
        deleteOpen,
        deletingRole,
        permissionsOpen,
        permissionsRole,
        openCreate,
        openEdit,
        openDelete,
        openPermissions,
        handlePermissionsOpenChange,
        closeFormModal,
        handleFormOpenChange,
        handleDeleteOpenChange,
        rolesIndexResetUrl,
    };
}
