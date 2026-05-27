import { Form } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { store, update } from '@/routes/admin/catalogo/marcas';
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
import type { BrandFormValues, BrandsOldForm } from '@/types/admin/brands';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'create' | 'edit';
    brand?: BrandFormValues | null;
    errors?: Record<string, string>;
    oldForm?: BrandsOldForm;
};

const defaultOldForm: BrandsOldForm = {
    code: '',
    name: '',
    is_active: true,
};

function resolveForm(
    open: boolean,
    oldForm: BrandsOldForm,
    brand?: BrandFormValues | null,
): BrandsOldForm {
    if (!open) {
        return defaultOldForm;
    }

    if (oldForm.code || oldForm.name) {
        return {
            code: oldForm.code,
            name: oldForm.name,
            is_active: Boolean(oldForm.is_active),
        };
    }

    if (brand) {
        return {
            code: brand.code,
            name: brand.name,
            is_active: brand.is_active,
        };
    }

    return defaultOldForm;
}

export function BrandFormModal({
    open,
    onOpenChange,
    mode,
    brand,
    errors = {},
    oldForm = defaultOldForm,
}: Props) {
    const isEdit = mode === 'edit' && brand != null;
    const {
        code,
        resetCodeState,
        applyNameToCode,
        setCodeFromInput,
    } = useAutoCodeFromName('', isEdit);
    const [name, setName] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            const values = resolveForm(true, oldForm, brand);
            resetCodeState(values.code, isEdit);
            setName(values.name);
            setIsActive(values.is_active);
            setFieldErrors(errors);
        }
    }, [open, brand?.id, brand?.code, brand?.name, oldForm, errors, isEdit, resetCodeState]);

    const resetForm = () => {
        resetCodeState('', false);
        setName('');
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

    const action = isEdit && brand ? update.url(brand.id) : store.url();

    const message = (key: string, formErrors: Record<string, string>) =>
        fieldErrors[key] ?? formErrors[key] ?? errors[key];

    return (
        <AppModal open={open} onOpenChange={handleOpenChange} size="sm">
            <Form
                key={open ? `${mode}-${brand?.id ?? 'new'}` : 'closed'}
                action={action}
                method={isEdit ? 'put' : 'post'}
                onSuccess={() => handleOpenChange(false)}
                className="contents"
            >
                {({ processing, errors: formErrors }) => (
                    <>
                        <AppModalHeader
                            title={isEdit ? 'Editar marca' : 'Nueva marca'}
                            description={
                                isEdit
                                    ? 'Actualiza los datos de la marca.'
                                    : 'Registra una marca para el catálogo.'
                            }
                        />

                        <AppModalBody className="space-y-4">
                            <FormSection
                                title="Marca"
                                gridClassName="grid gap-3"
                            >
                                <FormTextField
                                    id="brand-name"
                                    name="name"
                                    label="Nombre"
                                    required
                                    value={name}
                                    onChange={(v) => {
                                        setName(v);
                                        applyNameToCode(v);
                                        clearError('name');
                                    }}
                                    autoFocus
                                    placeholder="Nombre comercial"
                                    error={message('name', formErrors)}
                                    disabled={processing}
                                    fieldClassName="sm:col-span-2"
                                />
                                <FormTextField
                                    id="brand-code"
                                    name="code"
                                    label="Código"
                                    required
                                    value={code}
                                    onChange={(v) => {
                                        setCodeFromInput(v);
                                        clearError('code');
                                    }}
                                    placeholder="Ej. NIK"
                                    maxLength={20}
                                    hint="3 primeras letras del nombre. Cámbialo si ya existe."
                                    error={message('code', formErrors)}
                                    disabled={processing}
                                    fieldClassName="sm:col-span-2"
                                />
                                <FormCheckboxField
                                    id="brand-active"
                                    name="is_active"
                                    label="Marca activa"
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
