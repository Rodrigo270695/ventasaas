import { Form } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { RolePermissionsTree } from '@/components/admin/sistema/role-permissions-tree';
import { AppModal, AppModalBody, AppModalFooter, AppModalHeader } from '@/components/modal';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { update as syncRolePermissions } from '@/routes/admin/sistema/roles/permissions';
import type { PermissionGroup, RoleRow } from '@/types/admin/roles';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    role: RoleRow | null;
    catalog: PermissionGroup[];
};

export function RolePermissionsModal({
    open,
    onOpenChange,
    role,
    catalog,
}: Props) {
    const isAdmin = role?.name === 'admin';

    if (!role) {
        return null;
    }

    return (
        <AppModal open={open} onOpenChange={onOpenChange} size="md">
            <RolePermissionsModalContent
                key={`${role.id}-${open ? 'open' : 'closed'}`}
                role={role}
                catalog={catalog}
                isAdmin={isAdmin}
                onOpenChange={onOpenChange}
            />
        </AppModal>
    );
}

function RolePermissionsModalContent({
    role,
    catalog,
    isAdmin,
    onOpenChange,
}: {
    role: RoleRow;
    catalog: PermissionGroup[];
    isAdmin: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [selected, setSelected] = useState<string[]>(role.permission_names);
    const selectedSet = useMemo(() => new Set(selected), [selected]);
    const activePermissionNames = useMemo(
        () =>
            catalog
                .filter((group) => group.implemented)
                .flatMap((group) =>
                    group.permissions.map((permission) => permission.name),
                ),
        [catalog],
    );

    const togglePermission = (name: string, checked: boolean) => {
        setSelected((prev) => {
            if (checked) {
                return prev.includes(name) ? prev : [...prev, name];
            }

            return prev.filter((item) => item !== name);
        });
    };

    const toggleGroup = (names: string[], checked: boolean) => {
        setSelected((prev) => {
            const next = new Set(prev);

            for (const name of names) {
                if (checked) {
                    next.add(name);
                } else {
                    next.delete(name);
                }
            }

            return [...next];
        });
    };

    return (
        <Form
            action={syncRolePermissions.url(role.id)}
            method="put"
            onSuccess={() => onOpenChange(false)}
            className="contents"
        >
            {({ processing }) => (
                <>
                    <AppModalHeader
                        title="Permisos del rol"
                        description={
                            isAdmin
                                ? 'El rol administrador conserva todos los permisos.'
                                : `«${role.name}»`
                        }
                    />

                    <AppModalBody className="max-h-[min(70vh,32rem)] overflow-y-auto py-3">
                        {isAdmin ? (
                            <p className="rounded-lg border border-violet-200/80 bg-violet-50 px-3 py-2 text-xs text-[#5b21b6]">
                                Este rol no se puede editar desde aquí.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-violet-100 bg-violet-50/50 px-2.5 py-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-7 cursor-pointer border-violet-200 text-[#5b21b6] hover:bg-violet-100"
                                        onClick={() => setSelected(activePermissionNames)}
                                        disabled={processing}
                                    >
                                        Marcar todo (activo)
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-7 cursor-pointer border-violet-200 text-[#5b21b6] hover:bg-violet-100"
                                        onClick={() => setSelected([])}
                                        disabled={processing}
                                    >
                                        Limpiar selección
                                    </Button>
                                    <span className="ml-auto text-[11px] font-medium text-[#7c6f8a]">
                                        {selected.length} seleccionados
                                    </span>
                                </div>
                                <RolePermissionsTree
                                    catalog={catalog}
                                    roleId={role.id}
                                    selected={selectedSet}
                                    disabled={processing}
                                    onTogglePermission={togglePermission}
                                    onToggleGroup={toggleGroup}
                                />
                            </div>
                        )}
                        {!isAdmin &&
                            selected.map((name) => (
                                <input
                                    key={name}
                                    type="hidden"
                                    name="permissions[]"
                                    value={name}
                                />
                            ))}
                    </AppModalBody>

                    <AppModalFooter>
                        <Button
                            type="button"
                            variant="outline"
                            className="cursor-pointer rounded-xl border-violet-200"
                            onClick={() => onOpenChange(false)}
                            disabled={processing}
                        >
                            Cancelar
                        </Button>
                        {!isAdmin && (
                            <Button
                                type="submit"
                                disabled={processing}
                                className="cursor-pointer rounded-xl bg-linear-to-r from-[#ec4899] to-[#7c3aed] font-bold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing && <Spinner />}
                                Guardar
                            </Button>
                        )}
                    </AppModalFooter>
                </>
            )}
        </Form>
    );
}
