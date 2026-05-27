import { Form } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    store,
    update,
} from '@/routes/admin/tesoreria/metodos-pago';
import {
    AppModal,
    AppModalBody,
    AppModalFooter,
    AppModalHeader,
} from '@/components/modal';
import {
    FormCheckboxField,
    FormSection,
    FormSelectField,
    FormTextField,
} from '@/components/form';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type {
    PaymentMethodFormValues,
    PaymentMethodTypeOption,
    PaymentMethodsOldForm,
} from '@/types/admin/treasury';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'create' | 'edit';
    method?: PaymentMethodFormValues | null;
    typeOptions: PaymentMethodTypeOption[];
    errors?: Record<string, string>;
    oldForm?: PaymentMethodsOldForm;
};

const defaultOldForm: PaymentMethodsOldForm = {
    name: '',
    type: 'cash',
    is_active: true,
};

function resolveForm(
    open: boolean,
    oldForm: PaymentMethodsOldForm,
    method?: PaymentMethodFormValues | null,
): PaymentMethodsOldForm {
    if (!open) {
        return defaultOldForm;
    }

    if (oldForm.name) {
        return oldForm;
    }

    if (method) {
        return {
            name: method.name,
            type: method.type,
            is_active: method.is_active,
        };
    }

    return defaultOldForm;
}

export function PaymentMethodFormModal({
    open,
    onOpenChange,
    mode,
    method,
    typeOptions,
    errors = {},
    oldForm = defaultOldForm,
}: Props) {
    const isEdit = mode === 'edit' && method != null;
    const [name, setName] = useState('');
    const [type, setType] = useState<PaymentMethodsOldForm['type']>('cash');
    const [isActive, setIsActive] = useState(true);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            const values = resolveForm(true, oldForm, method);
            setName(values.name);
            setType(values.type);
            setIsActive(values.is_active);
            setFieldErrors(errors);
        }
    }, [open, method?.id, method?.name, oldForm, errors]);

    const resetForm = () => {
        setName('');
        setType('cash');
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

    const canSubmit = name.trim().length > 0;
    const action = isEdit && method ? update.url(method.id) : store.url();

    const message = (key: string, formErrors: Record<string, string>) =>
        fieldErrors[key] ?? formErrors[key] ?? errors[key];

    return (
        <AppModal open={open} onOpenChange={handleOpenChange} size="sm">
            <Form
                key={open ? `${mode}-${method?.id ?? 'new'}` : 'closed'}
                action={action}
                method={isEdit ? 'put' : 'post'}
                onSuccess={() => handleOpenChange(false)}
                className="contents"
            >
                {({ processing, errors: formErrors }) => (
                    <>
                        <AppModalHeader
                            title={
                                isEdit
                                    ? 'Editar método de pago'
                                    : 'Nuevo método de pago'
                            }
                            description={
                                isEdit
                                    ? 'Actualiza el método de cobro.'
                                    : 'El código y el orden se asignan automáticamente.'
                            }
                        />

                        <AppModalBody className="space-y-4">
                            <FormSection
                                title="Método"
                                gridClassName="grid w-full min-w-0 grid-cols-1 gap-3"
                            >
                                <FormTextField
                                    id="payment-method-name"
                                    name="name"
                                    label="Nombre"
                                    required
                                    value={name}
                                    onChange={(v) => {
                                        setName(v);
                                        clearError('name');
                                    }}
                                    autoFocus
                                    placeholder="Transferencia"
                                    error={message('name', formErrors)}
                                    disabled={processing}
                                />
                                <FormSelectField
                                    id="payment-method-type"
                                    name="type"
                                    label="Tipo"
                                    required
                                    value={type}
                                    onValueChange={(v) => {
                                        setType(
                                            v as PaymentMethodsOldForm['type'],
                                        );
                                        clearError('type');
                                    }}
                                    options={typeOptions.map((opt) => ({
                                        value: opt.value,
                                        label: opt.label,
                                    }))}
                                    error={message('type', formErrors)}
                                    disabled={processing}
                                />
                            </FormSection>

                            <FormSection
                                title="Estado"
                                gridClassName="grid w-full min-w-0 grid-cols-1 gap-3"
                            >
                                <FormCheckboxField
                                    id="payment-method-active"
                                    name="is_active"
                                    label="Método activo"
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
                                    disabled={processing}
                                    className="w-full min-w-0"
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
