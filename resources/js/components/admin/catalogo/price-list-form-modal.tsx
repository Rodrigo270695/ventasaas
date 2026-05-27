import { Form } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { store, update } from '@/routes/admin/catalogo/listas-precios';
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
    PriceListFormValues,
    PriceListsOldForm,
} from '@/types/admin/price-lists';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'create' | 'edit';
    priceList?: PriceListFormValues | null;
    errors?: Record<string, string>;
    oldForm?: PriceListsOldForm;
};

const defaultOldForm: PriceListsOldForm = {
    code: '',
    name: '',
    currency_code: 'PEN',
    is_default: false,
    is_active: true,
    sort_order: 0,
};

function resolveForm(
    open: boolean,
    oldForm: PriceListsOldForm,
    priceList?: PriceListFormValues | null,
): PriceListsOldForm {
    if (!open) {
        return defaultOldForm;
    }

    if (oldForm.code || oldForm.name) {
        return oldForm;
    }

    if (priceList) {
        return {
            code: priceList.code,
            name: priceList.name,
            currency_code: priceList.currency_code,
            is_default: priceList.is_default,
            is_active: priceList.is_active,
            sort_order: priceList.sort_order,
        };
    }

    return defaultOldForm;
}

export function PriceListFormModal({
    open,
    onOpenChange,
    mode,
    priceList,
    errors = {},
    oldForm = defaultOldForm,
}: Props) {
    const isEdit = mode === 'edit' && priceList != null;
    const {
        code,
        resetCodeState,
        applyNameToCode,
        setCodeFromInput,
    } = useAutoCodeFromName('', isEdit);
    const [name, setName] = useState('');
    const [currencyCode, setCurrencyCode] = useState('PEN');
    const [sortOrder, setSortOrder] = useState('0');
    const [isDefault, setIsDefault] = useState(false);
    const [isActive, setIsActive] = useState(true);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            const values = resolveForm(true, oldForm, priceList);
            resetCodeState(values.code, isEdit);
            setName(values.name);
            setCurrencyCode(values.currency_code);
            setSortOrder(String(values.sort_order));
            setIsDefault(values.is_default);
            setIsActive(values.is_active);
            setFieldErrors(errors);
        }
    }, [
        open,
        priceList?.id,
        oldForm,
        errors,
        isEdit,
        resetCodeState,
    ]);

    const resetForm = () => {
        resetCodeState('', false);
        setName('');
        setCurrencyCode('PEN');
        setSortOrder('0');
        setIsDefault(false);
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

    const canSubmit =
        code.trim().length > 0 &&
        name.trim().length > 0 &&
        currencyCode.trim().length === 3;

    const action =
        isEdit && priceList ? update.url(priceList.id) : store.url();

    const message = (key: string, formErrors: Record<string, string>) =>
        fieldErrors[key] ?? formErrors[key] ?? errors[key];

    return (
        <AppModal open={open} onOpenChange={handleOpenChange} size="sm">
            <Form
                key={open ? `${mode}-${priceList?.id ?? 'new'}` : 'closed'}
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
                                    ? 'Editar lista de precios'
                                    : 'Nueva lista de precios'
                            }
                            description={
                                isEdit
                                    ? 'Canal o segmento de venta (tienda, web, mayorista).'
                                    : 'Define un canal para asignar precios por variante.'
                            }
                        />

                        <AppModalBody className="space-y-4">
                            <FormSection
                                title="Lista"
                                gridClassName="grid gap-3"
                            >
                                <FormTextField
                                    id="price-list-name"
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
                                    placeholder="Ej. Tienda web"
                                    error={message('name', formErrors)}
                                    disabled={processing}
                                    fieldClassName="sm:col-span-2"
                                />
                                <FormTextField
                                    id="price-list-code"
                                    name="code"
                                    label="Código"
                                    required
                                    value={code}
                                    onChange={(v) => {
                                        setCodeFromInput(v);
                                        clearError('code');
                                    }}
                                    placeholder="Ej. WEB"
                                    maxLength={20}
                                    hint="Identificador corto (RETAIL, WEB)."
                                    error={message('code', formErrors)}
                                    disabled={processing}
                                />
                                <FormTextField
                                    id="price-list-currency"
                                    name="currency_code"
                                    label="Moneda"
                                    required
                                    value={currencyCode}
                                    onChange={(v) => {
                                        setCurrencyCode(
                                            v.toUpperCase().slice(0, 3),
                                        );
                                        clearError('currency_code');
                                    }}
                                    placeholder="PEN"
                                    maxLength={3}
                                    error={message(
                                        'currency_code',
                                        formErrors,
                                    )}
                                    disabled={processing}
                                />
                                <FormTextField
                                    id="price-list-sort"
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
                                    id="price-list-default"
                                    name="is_default"
                                    label="Lista por defecto (POS)"
                                    checked={isDefault}
                                    onCheckedChange={setIsDefault}
                                    disabled={processing}
                                    className="sm:col-span-2"
                                />
                                <FormCheckboxField
                                    id="price-list-active"
                                    name="is_active"
                                    label="Lista activa"
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
