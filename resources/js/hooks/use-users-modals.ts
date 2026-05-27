import { router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import { index as usersIndex } from '@/routes/admin/sistema/usuarios';
import type { UserFormValues, UserRow, UsersIndexPageProps } from '@/types/admin/users';

export type UsersModalFlash = Pick<
    UsersIndexPageProps,
    'userModal' | 'userModalUserId'
>;

type FormState = {
    open: boolean;
    mode: 'create' | 'edit';
    user: UserFormValues | null;
};

function buildInitialFormState(
    userModal: UsersIndexPageProps['userModal'],
    userModalUserId: UsersIndexPageProps['userModalUserId'],
    users: UserRow[],
): FormState {
    if (userModal === 'create') {
        return { open: true, mode: 'create', user: null };
    }

    if (userModal === 'edit' && userModalUserId) {
        const user = users.find((row) => row.id === userModalUserId);

        if (user) {
            return {
                open: true,
                mode: 'edit',
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    is_active: user.is_active,
                },
            };
        }
    }

    return { open: false, mode: 'create', user: null };
}

const usersIndexResetUrl = usersIndex.url({
    query: { _reset: 1 },
});

export function useUsersModals(users: UserRow[], flash: UsersModalFlash) {
    const initial = buildInitialFormState(
        flash.userModal,
        flash.userModalUserId,
        users,
    );

    const [formOpen, setFormOpen] = useState(initial.open);
    const [formMode, setFormMode] = useState(initial.mode);
    const [editingUser, setEditingUser] = useState(initial.user);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deletingUser, setDeletingUser] = useState<UserRow | null>(null);

    const [rolesOpen, setRolesOpen] = useState(false);
    const [rolesUser, setRolesUser] = useState<UserRow | null>(null);

    const closeFormModal = useCallback(() => {
        setFormOpen(false);
        setEditingUser(null);

        router.visit(usersIndexResetUrl, {
            preserveScroll: true,
            replace: true,
        });
    }, []);

    const openCreate = useCallback(() => {
        setFormMode('create');
        setEditingUser(null);
        setFormOpen(true);
    }, []);

    const openEdit = useCallback((user: UserRow) => {
        setFormMode('edit');
        setEditingUser({
            id: user.id,
            name: user.name,
            email: user.email,
            is_active: user.is_active,
        });
        setFormOpen(true);
    }, []);

    const openDelete = useCallback((user: UserRow) => {
        setDeletingUser(user);
        setDeleteOpen(true);
    }, []);

    const openRoles = useCallback((user: UserRow) => {
        setRolesUser(user);
        setRolesOpen(true);
    }, []);

    const handleDeleteOpenChange = useCallback((open: boolean) => {
        setDeleteOpen(open);

        if (!open) {
            setDeletingUser(null);
        }
    }, []);

    const handleRolesOpenChange = useCallback((open: boolean) => {
        setRolesOpen(open);

        if (!open) {
            setRolesUser(null);
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
        editingUser,
        deleteOpen,
        deletingUser,
        rolesOpen,
        rolesUser,
        openCreate,
        openEdit,
        openDelete,
        openRoles,
        closeFormModal,
        handleFormOpenChange,
        handleDeleteOpenChange,
        handleRolesOpenChange,
    };
}
