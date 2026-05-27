import { Form } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { store, update } from '@/routes/admin/sistema/roles';
import {
    AppModal,
    AppModalBody,
    AppModalFooter,
    AppModalHeader,
} from '@/components/modal';
import { FormSection, FormTextField } from '@/components/form';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export type RoleFormValues = {
    id: number;
    name: string;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'create' | 'edit';
    role?: RoleFormValues | null;
    errors?: Record<string, string>;
    defaultName?: string;
};

function resolveName(
    open: boolean,
    defaultName: string,
    role?: RoleFormValues | null,
): string {
    if (!open) {
        return '';
    }

    return defaultName || role?.name || '';
}

export function RoleFormModal({
    open,
    onOpenChange,
    mode,
    role,
    errors = {},
    defaultName = '',
}: Props) {
    const isEdit = mode === 'edit';
    const [name, setName] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            setName(resolveName(true, defaultName, role));
            setFieldErrors(errors);
        }
    }, [open, role?.id, role?.name, defaultName, errors]);

    const resetForm = () => {
        setName('');
        setFieldErrors({});
    };

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            resetForm();
        }

        onOpenChange(next);
    };

    const canSubmit = name.trim().length > 0;

    const action = isEdit ? update.url(role!.id) : store.url();

    const message = (key: string, formErrors: Record<string, string>) =>
        fieldErrors[key] ?? formErrors[key] ?? errors[key];

    return (
        <AppModal open={open} onOpenChange={handleOpenChange} size="sm">
            <Form
                key={open ? `${mode}-${role?.id ?? 'new'}` : 'closed'}
                action={action}
                method={isEdit ? 'put' : 'post'}
                onSuccess={() => handleOpenChange(false)}
                className="contents"
            >
                {({ processing, errors: formErrors }) => (
                    <>
                        <AppModalHeader
                            title={isEdit ? 'Editar rol' : 'Nuevo rol'}
                            description={
                                isEdit
                                    ? 'Actualiza el nombre del rol.'
                                    : 'Define un rol para asignar permisos.'
                            }
                        />

                        <AppModalBody>
                            <FormSection
                                title="Rol"
                                gridClassName="grid gap-3"
                            >
                                <FormTextField
                                    id="role-name"
                                    name="name"
                                    label="Nombre"
                                    required
                                    value={name}
                                    onChange={(v) => {
                                        setName(v);
                                        if (fieldErrors.name) {
                                            setFieldErrors((prev) => {
                                                const next = { ...prev };
                                                delete next.name;

                                                return next;
                                            });
                                        }
                                    }}
                                    autoFocus
                                    placeholder="ej. supervisor"
                                    error={message('name', formErrors)}
                                    disabled={processing}
                                />
                            </FormSection>
                        </AppModalBody>

                        <AppModalFooter>
                            <Button
                                type="button"
                                variant="outline"
                                className="cursor-pointer rounded-xl border-violet-200"
                                onClick={() => handleOpenChange(false)}
                                disabled={processing}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing || !canSubmit}
                                className="cursor-pointer rounded-xl bg-linear-to-r from-[#ec4899] to-[#7c3aed] font-bold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing && <Spinner />}
                                {isEdit ? 'Guardar' : 'Crear'}
                            </Button>
                        </AppModalFooter>
                    </>
                )}
            </Form>
        </AppModal>
    );
}
