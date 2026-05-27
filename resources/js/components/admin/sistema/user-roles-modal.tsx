import { Form } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { update as syncUserRoles } from '@/routes/admin/sistema/usuarios/roles';
import {
    AppModal,
    AppModalBody,
    AppModalFooter,
    AppModalHeader,
} from '@/components/modal';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import type { RoleOption, UserRow } from '@/types/admin/users';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: UserRow | null;
    roles: RoleOption[];
};

export function UserRolesModal({
    open,
    onOpenChange,
    user,
    roles,
}: Props) {
    const [selected, setSelected] = useState<number[]>([]);

    useEffect(() => {
        if (open && user) {
            setSelected(user.role_ids);
        }
    }, [open, user?.id, user?.role_ids]);

    const selectedSet = useMemo(() => new Set(selected), [selected]);

    const toggleRole = (id: number, checked: boolean) => {
        setSelected((prev) => {
            if (checked) {
                return prev.includes(id) ? prev : [...prev, id];
            }

            return prev.filter((item) => item !== id);
        });
    };

    const toggleAll = (checked: boolean) => {
        setSelected(checked ? roles.map((r) => r.id) : []);
    };

    const allChecked =
        roles.length > 0 && roles.every((r) => selectedSet.has(r.id));
    const someChecked = !allChecked && selected.length > 0;

    if (!user) {
        return null;
    }

    return (
        <AppModal open={open} onOpenChange={onOpenChange} size="md">
            <Form
                action={syncUserRoles.url(user.id)}
                method="put"
                onSuccess={() => onOpenChange(false)}
                className="contents"
            >
                {({ processing }) => (
                    <>
                        <AppModalHeader
                            title="Roles del usuario"
                            description={`«${user.name}»`}
                        />

                        <AppModalBody className="max-h-[min(55vh,22rem)] overflow-y-auto py-3">
                            <p className="mb-2 text-[11px] font-medium text-[#7c6f8a]">
                                <span className="tabular-nums text-[#4c1d95]">
                                    {selected.length}
                                </span>{' '}
                                de{' '}
                                <span className="tabular-nums">
                                    {roles.length}
                                </span>{' '}
                                roles
                            </p>

                            <div className="overflow-hidden rounded-lg border border-violet-100/90 bg-violet-50/30">
                                <div className="flex items-center gap-2 border-b border-violet-100/80 px-2.5 py-1.5">
                                    <Checkbox
                                        id={`user-roles-all-${user.id}`}
                                        checked={
                                            allChecked
                                                ? true
                                                : someChecked
                                                  ? 'indeterminate'
                                                  : false
                                        }
                                        onCheckedChange={(value) =>
                                            toggleAll(
                                                value === true ||
                                                    value === 'indeterminate',
                                            )
                                        }
                                        disabled={processing}
                                        className="size-3.5 border-violet-300 data-[state=checked]:border-[#7c3aed] data-[state=checked]:bg-[#7c3aed] data-[state=indeterminate]:border-[#7c3aed] data-[state=indeterminate]:bg-[#7c3aed]"
                                    />
                                    <Label
                                        htmlFor={`user-roles-all-${user.id}`}
                                        className="cursor-pointer text-xs font-semibold text-[#4c1d95]"
                                    >
                                        Todos los roles
                                    </Label>
                                </div>

                                <ul className="space-y-0 border-l border-violet-200/70 py-1 pl-3 ml-2.5 mr-1">
                                    {roles.map((role) => (
                                        <li
                                            key={role.id}
                                            className="flex items-center gap-2 rounded-sm py-0.5 pr-2 hover:bg-white/70"
                                        >
                                            <Checkbox
                                                id={`user-role-${user.id}-${role.id}`}
                                                checked={selectedSet.has(
                                                    role.id,
                                                )}
                                                onCheckedChange={(value) =>
                                                    toggleRole(
                                                        role.id,
                                                        value === true,
                                                    )
                                                }
                                                disabled={processing}
                                                className="size-3.5 border-violet-300 data-[state=checked]:border-[#7c3aed] data-[state=checked]:bg-[#7c3aed]"
                                            />
                                            <Label
                                                htmlFor={`user-role-${user.id}-${role.id}`}
                                                className={cn(
                                                    'cursor-pointer truncate text-[11px] leading-tight font-normal',
                                                    selectedSet.has(role.id)
                                                        ? 'font-medium text-[#4c1d95]'
                                                        : 'text-[#5c4d6b]',
                                                )}
                                            >
                                                {role.name}
                                            </Label>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {selected.map((id) => (
                                <input
                                    key={id}
                                    type="hidden"
                                    name="roles[]"
                                    value={id}
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
                            <Button
                                type="submit"
                                disabled={processing}
                                className="cursor-pointer rounded-xl bg-linear-to-r from-[#ec4899] to-[#7c3aed] font-bold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing && <Spinner />}
                                Guardar
                            </Button>
                        </AppModalFooter>
                    </>
                )}
            </Form>
        </AppModal>
    );
}
