import { Form } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { store, update } from '@/routes/admin/inventario/almacenes';
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
import { useAutoCodeFromName } from '@/hooks/use-auto-code-from-name';
import type {
    WarehouseFormValues,
    WarehousesOldForm,
} from '@/types/admin/warehouses';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'create' | 'edit';
    warehouse?: WarehouseFormValues | null;
    errors?: Record<string, string>;
    oldForm?: WarehousesOldForm;
};

const defaultOldForm: WarehousesOldForm = {
    code: '',
    name: '',
    is_default: false,
    is_saleable: true,
    is_active: true,
    sort_order: 0,
};

function resolveForm(
    open: boolean,
    oldForm: WarehousesOldForm,
    warehouse?: WarehouseFormValues | null,
): WarehousesOldForm {
    if (!open) {
        return defaultOldForm;
    }

    if (oldForm.code || oldForm.name) {
        return oldForm;
    }

    if (warehouse) {
        return {
            code: warehouse.code,
            name: warehouse.name,
            is_default: warehouse.is_default,
            is_saleable: warehouse.is_saleable,
            is_active: warehouse.is_active,
            sort_order: warehouse.sort_order,
        };
    }

    return defaultOldForm;
}

export function WarehouseFormModal({
    open,
    onOpenChange,
    mode,
    warehouse,
    errors = {},
    oldForm = defaultOldForm,
}: Props) {
    const isEdit = mode === 'edit' && warehouse != null;
    const {
        code,
        resetCodeState,
        applyNameToCode,
        setCodeFromInput,
    } = useAutoCodeFromName('', isEdit);
    const [name, setName] = useState('');
    const [sortOrder, setSortOrder] = useState('0');
    const [isDefault, setIsDefault] = useState(false);
    const [isSaleable, setIsSaleable] = useState(true);
    const [isActive, setIsActive] = useState(true);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            const values = resolveForm(true, oldForm, warehouse);
            resetCodeState(values.code, isEdit);
            setName(values.name);
            setSortOrder(String(values.sort_order));
            setIsDefault(values.is_default);
            setIsSaleable(values.is_saleable);
            setIsActive(values.is_active);
            setFieldErrors(errors);
        }
    }, [open, warehouse?.id, oldForm, errors, isEdit, resetCodeState]);

    const resetForm = () => {
        resetCodeState('', false);
        setName('');
        setSortOrder('0');
        setIsDefault(false);
        setIsSaleable(true);
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

    const canSubmit = code.trim().length > 0 && name.trim().length > 0;

    const action =
        isEdit && warehouse ? update.url(warehouse.id) : store.url();

    const message = (key: string, formErrors: Record<string, string>) =>
        fieldErrors[key] ?? formErrors[key] ?? errors[key];

    return (
        <AppModal open={open} onOpenChange={handleOpenChange} size="sm">
            <Form
                key={open ? `${mode}-${warehouse?.id ?? 'new'}` : 'closed'}
                action={action}
                method={isEdit ? 'put' : 'post'}
                onSuccess={() => handleOpenChange(false)}
                className="contents"
            >
                {({ processing, errors: formErrors }) => (
                    <>
                        <AppModalHeader
                            title={
                                isEdit ? 'Editar almacén' : 'Nuevo almacén'
                            }
                            description={
                                isEdit
                                    ? 'Ubicación física o lógica donde se controla el stock.'
                                    : 'Define dónde se almacenan y despachan los productos.'
                            }
                        />

                        <AppModalBody className="space-y-4">
                            <FormSection
                                title="Almacén"
                                gridClassName="grid gap-3"
                            >
                                <FormTextField
                                    id="warehouse-name"
                                    name="name"
                                    label="Nombre"
                                    required
                                    value={name}
                                    onChange={(v) => {
                                        setName(v);
                                        applyNameToCode(v);
                                        clearError('name');
                                    }}
                                    placeholder="Ej. Almacén principal"
                                    maxLength={100}
                                    error={message('name', formErrors)}
                                    disabled={processing}
                                    fieldClassName="sm:col-span-2"
                                />
                                <FormTextField
                                    id="warehouse-code"
                                    name="code"
                                    label="Código"
                                    required
                                    value={code}
                                    onChange={(v) => {
                                        setCodeFromInput(v);
                                        clearError('code');
                                    }}
                                    placeholder="Ej. MAIN"
                                    maxLength={20}
                                    hint="Identificador corto (MAIN, TIENDA)."
                                    error={message('code', formErrors)}
                                    disabled={processing}
                                />
                                <FormTextField
                                    id="warehouse-sort"
                                    name="sort_order"
                                    label="Orden"
                                    type="number"
                                    value={sortOrder}
                                    onChange={(v) => {
                                        setSortOrder(v);
                                        clearError('sort_order');
                                    }}
                                    min={0}
                                    max={9999}
                                    error={message('sort_order', formErrors)}
                                    disabled={processing}
                                />
                                <FormCheckboxField
                                    id="warehouse-default"
                                    name="is_default"
                                    label="Almacén por defecto"
                                    checked={isDefault}
                                    onCheckedChange={setIsDefault}
                                    disabled={processing}
                                    className="sm:col-span-2"
                                />
                                <FormCheckboxField
                                    id="warehouse-saleable"
                                    name="is_saleable"
                                    label="Disponible para ventas"
                                    checked={isSaleable}
                                    onCheckedChange={setIsSaleable}
                                    disabled={processing}
                                    className="sm:col-span-2"
                                />
                                <FormCheckboxField
                                    id="warehouse-active"
                                    name="is_active"
                                    label="Almacén activo"
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
