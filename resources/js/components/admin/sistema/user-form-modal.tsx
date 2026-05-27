import { Form } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { store, update } from '@/routes/admin/sistema/usuarios';
import {
    AppModal,
    AppModalBody,
    AppModalFooter,
    AppModalHeader,
} from '@/components/modal';
import {
    FormCheckboxField,
    FormSection,
    FormTextField,
} from '@/components/form';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { UserFormValues, UsersOldForm } from '@/types/admin/users';

export type { UserFormValues };

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'create' | 'edit';
    user?: UserFormValues | null;
    errors?: Record<string, string>;
    oldForm?: UsersOldForm;
};

function resolveForm(
    open: boolean,
    oldForm: UsersOldForm,
    user?: UserFormValues | null,
) {
    if (!open) {
        return { name: '', email: '', is_active: true };
    }

    if (oldForm.name || oldForm.email) {
        return {
            name: oldForm.name,
            email: oldForm.email,
            is_active: Boolean(oldForm.is_active),
        };
    }

    if (user) {
        return {
            name: user.name,
            email: user.email,
            is_active: user.is_active,
        };
    }

    return { name: '', email: '', is_active: true };
}

export function UserFormModal({
    open,
    onOpenChange,
    mode,
    user,
    errors = {},
    oldForm = { name: '', email: '', is_active: true },
}: Props) {
    const isEdit = mode === 'edit';
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            const values = resolveForm(true, oldForm, user);
            setName(values.name);
            setEmail(values.email);
            setIsActive(values.is_active);
            setFieldErrors(errors);
        }
    }, [open, user?.id, user?.name, user?.email, user?.is_active, oldForm, errors]);

    const resetForm = () => {
        setName('');
        setEmail('');
        setIsActive(true);
        setFieldErrors({});
    };

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            resetForm();
        }

        onOpenChange(next);
    };

    const clearError = (key: string) => {
        if (fieldErrors[key]) {
            setFieldErrors((prev) => {
                const next = { ...prev };
                delete next[key];

                return next;
            });
        }
    };

    const canSubmit = name.trim().length > 0 && email.trim().length > 0;

    const action = isEdit ? update.url(user!.id) : store.url();

    const message = (key: string, formErrors: Record<string, string>) =>
        fieldErrors[key] ?? formErrors[key] ?? errors[key];

    return (
        <AppModal open={open} onOpenChange={handleOpenChange} size="sm">
            <Form
                key={open ? `${mode}-${user?.id ?? 'new'}` : 'closed'}
                action={action}
                method={isEdit ? 'put' : 'post'}
                onSuccess={() => handleOpenChange(false)}
                className="contents"
            >
                {({ processing, errors: formErrors }) => (
                    <>
                        <AppModalHeader
                            title={isEdit ? 'Editar usuario' : 'Nuevo usuario'}
                            description={
                                isEdit
                                    ? 'Actualiza los datos del usuario.'
                                    : 'Crea una cuenta para el personal.'
                            }
                        />

                        <AppModalBody className="space-y-4">
                            <FormSection
                                title="Datos de la cuenta"
                                gridClassName="grid gap-3"
                            >
                                <FormTextField
                                    id="user-name"
                                    name="name"
                                    label="Nombre"
                                    required
                                    value={name}
                                    onChange={(v) => {
                                        setName(v);
                                        clearError('name');
                                    }}
                                    autoFocus
                                    placeholder="Nombre completo"
                                    error={message('name', formErrors)}
                                    disabled={processing}
                                />
                                <FormTextField
                                    id="user-email"
                                    name="email"
                                    label="Correo"
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(v) => {
                                        setEmail(v);
                                        clearError('email');
                                    }}
                                    placeholder="correo@empresa.com"
                                    error={message('email', formErrors)}
                                    disabled={processing}
                                />
                            </FormSection>

                            <FormSection
                                title="Acceso"
                                gridClassName="grid gap-3"
                            >
                                <FormTextField
                                    id="user-password"
                                    name="password"
                                    label="Contraseña"
                                    required={!isEdit}
                                    type="password"
                                    value=""
                                    onChange={() => clearError('password')}
                                    autoComplete="new-password"
                                    placeholder={
                                        isEdit
                                            ? 'Dejar vacío para no cambiar'
                                            : 'Mínimo 8 caracteres'
                                    }
                                    error={message('password', formErrors)}
                                    disabled={processing}
                                />
                                <FormTextField
                                    id="user-password-confirmation"
                                    name="password_confirmation"
                                    label="Confirmar contraseña"
                                    type="password"
                                    value=""
                                    onChange={() =>
                                        clearError('password_confirmation')
                                    }
                                    autoComplete="new-password"
                                    error={message(
                                        'password_confirmation',
                                        formErrors,
                                    )}
                                    disabled={processing}
                                />
                                <FormCheckboxField
                                    id="user-is-active"
                                    name="is_active"
                                    label="Usuario activo"
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
                                    disabled={processing}
                                    className="sm:col-span-2"
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
