import { Form } from '@inertiajs/react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { store, update } from '@/routes/admin/catalogo/categorias';
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
import type { FormSelectOption } from '@/components/form';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useAutoCodeFromName } from '@/hooks/use-auto-code-from-name';
import type {
    CategoriesOldForm,
    CategoryFormValues,
} from '@/types/admin/categories';

type CategoryOfflinePayload = {
    parent_id: string;
    code: string;
    name: string;
    is_active: boolean;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'create' | 'edit';
    category?: CategoryFormValues | null;
    parentOptions: FormSelectOption[];
    errors?: Record<string, string>;
    oldForm?: CategoriesOldForm;
    isOffline?: boolean;
    onOfflineCreate?: (payload: CategoryOfflinePayload) => void;
    onOfflineUpdate?: (
        categoryId: string,
        payload: CategoryOfflinePayload,
    ) => void;
};

const defaultOldForm: CategoriesOldForm = {
    parent_id: '',
    code: '',
    name: '',
    is_active: true,
};

function resolveForm(
    open: boolean,
    oldForm: CategoriesOldForm,
    category?: CategoryFormValues | null,
): CategoriesOldForm {
    if (!open) {
        return defaultOldForm;
    }

    if (oldForm.code || oldForm.name) {
        return {
            parent_id: oldForm.parent_id ?? '',
            code: oldForm.code,
            name: oldForm.name,
            is_active: Boolean(oldForm.is_active),
        };
    }

    if (category) {
        return {
            parent_id: category.parent_id ?? '',
            code: category.code,
            name: category.name,
            is_active: category.is_active,
        };
    }

    return defaultOldForm;
}

export function CategoryFormModal({
    open,
    onOpenChange,
    mode,
    category,
    parentOptions,
    errors = {},
    oldForm = defaultOldForm,
    isOffline = false,
    onOfflineCreate,
    onOfflineUpdate,
}: Props) {
    const isEdit = mode === 'edit' && category != null;
    const {
        code,
        resetCodeState,
        applyNameToCode,
        setCodeFromInput,
    } = useAutoCodeFromName('', isEdit);
    const [parentId, setParentId] = useState('');
    const [name, setName] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const parentSelectOptions = useMemo<FormSelectOption[]>(
        () =>
            parentOptions.filter((option) => option.value !== category?.id),
        [parentOptions, category?.id],
    );

    useEffect(() => {
        if (open) {
            const values = resolveForm(true, oldForm, category);
            setParentId(values.parent_id);
            resetCodeState(values.code, isEdit);
            setName(values.name);
            setIsActive(values.is_active);
            setFieldErrors(errors);
        }
    }, [open, category?.id, oldForm, errors, isEdit, resetCodeState]);

    const resetForm = () => {
        setParentId('');
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

    const action = isEdit && category ? update.url(category.id) : store.url();

    const message = (key: string, formErrors: Record<string, string>) =>
        fieldErrors[key] ?? formErrors[key] ?? errors[key];

    const formFields = (processing: boolean, formErrors: Record<string, string>) => (
        <>
            <AppModalHeader
                title={isEdit ? 'Editar categoría' : 'Nueva categoría'}
                description={
                    isEdit
                        ? 'Actualiza la categoría del catálogo.'
                        : 'Organiza productos por categorías y subcategorías.'
                }
            />

            <AppModalBody className="space-y-4">
                {isOffline ? (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        Sin internet: los cambios se guardan localmente y se
                        sincronizan al reconectar.
                    </p>
                ) : null}
                <FormSection title="Categoría" gridClassName="grid gap-3">
                    <FormSelectField
                        id="category-parent"
                        name="parent_id"
                        label="Categoría padre"
                        value={parentId}
                        onValueChange={(v) => {
                            setParentId(v);
                            clearError('parent_id');
                        }}
                        options={parentSelectOptions}
                        emptyOptionLabel="Sin categoría padre"
                        error={message('parent_id', formErrors)}
                        disabled={processing}
                        fieldClassName="sm:col-span-2"
                    />
                    <FormTextField
                        id="category-name"
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
                        placeholder="Electrónica"
                        error={message('name', formErrors)}
                        disabled={processing}
                        fieldClassName="sm:col-span-2"
                    />
                    <FormTextField
                        id="category-code"
                        name="code"
                        label="Código"
                        required
                        value={code}
                        onChange={(v) => {
                            setCodeFromInput(v);
                            clearError('code');
                        }}
                        placeholder="Ej. ELE"
                        maxLength={20}
                        hint="3 primeras letras del nombre. Cámbialo si ya existe."
                        error={message('code', formErrors)}
                        disabled={processing}
                        fieldClassName="sm:col-span-2"
                    />
                    <FormCheckboxField
                        id="category-active"
                        name="is_active"
                        label="Categoría activa"
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
    );

    const handleOfflineSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!canSubmit) {
            return;
        }

        const payload: CategoryOfflinePayload = {
            parent_id: parentId,
            code: code.trim(),
            name: name.trim(),
            is_active: isActive,
        };

        if (isEdit && category) {
            onOfflineUpdate?.(category.id, payload);
        } else {
            onOfflineCreate?.(payload);
        }

        handleOpenChange(false);
    };

    if (isOffline) {
        return (
            <AppModal open={open} onOpenChange={handleOpenChange} size="sm">
                <form onSubmit={handleOfflineSubmit} className="contents">
                    {formFields(false, {})}
                </form>
            </AppModal>
        );
    }

    return (
        <AppModal open={open} onOpenChange={handleOpenChange} size="sm">
            <Form
                key={open ? `${mode}-${category?.id ?? 'new'}` : 'closed'}
                action={action}
                method={isEdit ? 'put' : 'post'}
                onSuccess={() => handleOpenChange(false)}
                className="contents"
            >
                {({ processing, errors: formErrors }) =>
                    formFields(processing, formErrors)
                }
            </Form>
        </AppModal>
    );
}
