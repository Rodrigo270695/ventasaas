import { Form } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { store, update } from '@/routes/admin/tesoreria/cajas';
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
    CashRegisterFormValues,
    CashRegistersOldForm,
} from '@/types/admin/treasury';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'create' | 'edit';
    register?: CashRegisterFormValues | null;
    warehouseOptions: Array<{ value: string; label: string; sublabel?: string }>;
    errors?: Record<string, string>;
    oldForm?: CashRegistersOldForm;
};

const defaultOldForm: CashRegistersOldForm = {
    name: '',
    warehouse_id: '',
    is_active: true,
};

function resolveForm(
    open: boolean,
    oldForm: CashRegistersOldForm,
    register?: CashRegisterFormValues | null,
): CashRegistersOldForm {
    if (!open) {
        return defaultOldForm;
    }

    if (oldForm.name) {
        return oldForm;
    }

    if (register) {
        return {
            name: register.name,
            warehouse_id: register.warehouse_id,
            is_active: register.is_active,
        };
    }

    return defaultOldForm;
}

export function CashRegisterFormModal({
    open,
    onOpenChange,
    mode,
    register,
    warehouseOptions,
    errors = {},
    oldForm = defaultOldForm,
}: Props) {
    const isEdit = mode === 'edit' && register != null;
    const [name, setName] = useState('');
    const [warehouseId, setWarehouseId] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            const values = resolveForm(true, oldForm, register);
            setName(values.name);
            setWarehouseId(values.warehouse_id);
            setIsActive(values.is_active);
            setFieldErrors(errors);
        }
    }, [open, register?.id, oldForm, errors]);

    const resetForm = () => {
        setName('');
        setWarehouseId('');
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
    const action = isEdit && register ? update.url(register.id) : store.url();

    const message = (key: string, formErrors: Record<string, string>) =>
        fieldErrors[key] ?? formErrors[key] ?? errors[key];

    return (
        <AppModal open={open} onOpenChange={handleOpenChange} size="sm">
            <Form
                key={open ? `${mode}-${register?.id ?? 'new'}` : 'closed'}
                action={action}
                method={isEdit ? 'put' : 'post'}
                onSuccess={() => handleOpenChange(false)}
                className="contents"
            >
                {({ processing, errors: formErrors }) => (
                    <>
                        <AppModalHeader
                            title={isEdit ? 'Editar caja' : 'Nueva caja'}
                            description={
                                isEdit
                                    ? 'Actualiza el punto de cobro.'
                                    : 'El código y el orden se asignan automáticamente.'
                            }
                        />

                        <AppModalBody className="space-y-4">
                            <FormSection
                                title="Caja"
                                gridClassName="grid w-full min-w-0 grid-cols-1 gap-3"
                            >
                                <FormTextField
                                    id="cash-register-name"
                                    name="name"
                                    label="Nombre"
                                    required
                                    value={name}
                                    onChange={(v) => {
                                        setName(v);
                                        clearError('name');
                                    }}
                                    autoFocus
                                    placeholder="Caja principal"
                                    error={message('name', formErrors)}
                                    disabled={processing}
                                />
                                <FormSelectField
                                    id="cash-register-warehouse"
                                    name="warehouse_id"
                                    label="Almacén (opcional)"
                                    value={warehouseId}
                                    onValueChange={(v) => {
                                        setWarehouseId(v);
                                        clearError('warehouse_id');
                                    }}
                                    options={warehouseOptions}
                                    emptyOptionLabel="Sin almacén"
                                    disabled={processing}
                                    error={message('warehouse_id', formErrors)}
                                />
                            </FormSection>

                            <FormSection
                                title="Estado"
                                gridClassName="grid w-full min-w-0 grid-cols-1 gap-3"
                            >
                                <FormCheckboxField
                                    id="cash-register-active"
                                    name="is_active"
                                    label="Caja activa"
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
