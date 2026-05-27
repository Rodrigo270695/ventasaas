import { Form } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { store, update } from '@/routes/admin/catalogo/unidades';
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
import {
    sanitizeCatalogCode,
    sanitizeSunatCode,
    sanitizeSymbol,
    suggestCodeFromName,
    suggestSymbolFromName,
} from '@/lib/catalog-code';
import type { UnitFormValues, UnitsOldForm } from '@/types/admin/units';

export type { UnitFormValues };

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'create' | 'edit';
    unit?: UnitFormValues | null;
    errors?: Record<string, string>;
    oldForm?: UnitsOldForm;
};

const defaultOldForm: UnitsOldForm = {
    code: '',
    name: '',
    sunat_code: '',
    symbol: '',
    allows_decimals: false,
    is_active: true,
};

function resolveForm(
    open: boolean,
    oldForm: UnitsOldForm,
    unit?: UnitFormValues | null,
): UnitsOldForm {
    if (!open) {
        return defaultOldForm;
    }

    if (oldForm.code || oldForm.name) {
        return {
            code: oldForm.code,
            name: oldForm.name,
            sunat_code: oldForm.sunat_code,
            symbol: oldForm.symbol,
            allows_decimals: Boolean(oldForm.allows_decimals),
            is_active: Boolean(oldForm.is_active),
        };
    }

    if (unit) {
        return {
            code: unit.code,
            name: unit.name,
            sunat_code: unit.sunat_code,
            symbol: unit.symbol,
            allows_decimals: unit.allows_decimals,
            is_active: unit.is_active,
        };
    }

    return defaultOldForm;
}

export function UnitFormModal({
    open,
    onOpenChange,
    mode,
    unit,
    errors = {},
    oldForm = defaultOldForm,
}: Props) {
    const isEdit = mode === 'edit' && unit != null;
    const {
        code,
        resetCodeState,
        applyNameToCode,
        setCodeFromInput,
    } = useAutoCodeFromName('', isEdit);
    const [name, setName] = useState('');
    const [sunatCode, setSunatCode] = useState('');
    const [sunatManual, setSunatManual] = useState(false);
    const [symbol, setSymbol] = useState('');
    const [symbolManual, setSymbolManual] = useState(false);
    const [allowsDecimals, setAllowsDecimals] = useState(false);
    const [isActive, setIsActive] = useState(true);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            const values = resolveForm(true, oldForm, unit);
            resetCodeState(values.code, isEdit);
            setName(values.name);
            setSunatCode(values.sunat_code);
            setSunatManual(isEdit && Boolean(values.sunat_code));
            setSymbol(values.symbol);
            setSymbolManual(isEdit && Boolean(values.symbol));
            setAllowsDecimals(values.allows_decimals);
            setIsActive(values.is_active);
            setFieldErrors(errors);
        }
    }, [
        open,
        unit?.id,
        unit?.code,
        unit?.name,
        oldForm,
        errors,
        isEdit,
        resetCodeState,
    ]);

    const syncSunatFromCode = (nextCode: string) => {
        if (!sunatManual) {
            setSunatCode(sanitizeSunatCode(nextCode));
        }
    };

    const handleNameChange = (value: string) => {
        setName(value);
        applyNameToCode(value);
        if (!sunatManual) {
            setSunatCode(suggestCodeFromName(value, 3));
        }
        if (!symbolManual) {
            setSymbol(suggestSymbolFromName(value, 3));
        }
        clearError('name');
    };

    const resetForm = () => {
        resetCodeState('', false);
        setName('');
        setSunatCode('');
        setSunatManual(false);
        setSymbol('');
        setSymbolManual(false);
        setAllowsDecimals(false);
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

    const action = isEdit && unit ? update.url(unit.id) : store.url();

    const message = (key: string, formErrors: Record<string, string>) =>
        fieldErrors[key] ?? formErrors[key] ?? errors[key];

    return (
        <AppModal open={open} onOpenChange={handleOpenChange} size="sm">
            <Form
                key={open ? `${mode}-${unit?.id ?? 'new'}` : 'closed'}
                action={action}
                method={isEdit ? 'put' : 'post'}
                onSuccess={() => handleOpenChange(false)}
                className="contents"
            >
                {({ processing, errors: formErrors }) => (
                    <>
                        <AppModalHeader
                            title={
                                isEdit ? 'Editar unidad' : 'Nueva unidad'
                            }
                            description={
                                isEdit
                                    ? 'Actualiza la unidad de medida.'
                                    : 'Registra una unidad para el catálogo.'
                            }
                        />

                        <AppModalBody className="max-h-[min(60vh,26rem)] space-y-4 overflow-y-auto pr-1">
                            <FormSection
                                title="Identificación"
                                gridClassName="grid gap-3"
                            >
                                <FormTextField
                                    id="unit-name"
                                    name="name"
                                    label="Nombre"
                                    required
                                    value={name}
                                    onChange={handleNameChange}
                                    autoFocus
                                    placeholder="Unidad"
                                    error={message('name', formErrors)}
                                    disabled={processing}
                                    fieldClassName="sm:col-span-2"
                                />
                                <FormTextField
                                    id="unit-code"
                                    name="code"
                                    label="Código"
                                    required
                                    value={code}
                                    onChange={(v) => {
                                        setCodeFromInput(v);
                                        syncSunatFromCode(sanitizeCatalogCode(v));
                                        clearError('code');
                                    }}
                                    placeholder="Ej. UNI"
                                    maxLength={20}
                                    hint="3 primeras letras del nombre. Cámbialo si ya existe."
                                    error={message('code', formErrors)}
                                    disabled={processing}
                                />
                                <FormTextField
                                    id="unit-sunat"
                                    name="sunat_code"
                                    label="Código SUNAT"
                                    value={sunatCode}
                                    onChange={(v) => {
                                        setSunatCode(sanitizeSunatCode(v));
                                        setSunatManual(true);
                                        clearError('sunat_code');
                                    }}
                                    placeholder="NIU"
                                    maxLength={3}
                                    hint="Sugerido igual al código. Opcional."
                                    error={message('sunat_code', formErrors)}
                                    disabled={processing}
                                />
                                <FormTextField
                                    id="unit-symbol"
                                    name="symbol"
                                    label="Símbolo"
                                    value={symbol}
                                    onChange={(v) => {
                                        setSymbol(sanitizeSymbol(v));
                                        setSymbolManual(true);
                                        clearError('symbol');
                                    }}
                                    placeholder="und"
                                    maxLength={10}
                                    hint="3 primeras letras del nombre (minúsculas). Cámbialo si quieres."
                                    error={message('symbol', formErrors)}
                                    disabled={processing}
                                    fieldClassName="sm:col-span-2"
                                />
                            </FormSection>

                            <FormSection
                                title="Opciones"
                                gridClassName="grid gap-3"
                            >
                                <FormCheckboxField
                                    id="unit-decimals"
                                    name="allows_decimals"
                                    label="Permite cantidades decimales"
                                    checked={allowsDecimals}
                                    onCheckedChange={setAllowsDecimals}
                                    disabled={processing}
                                />
                                <FormCheckboxField
                                    id="unit-active"
                                    name="is_active"
                                    label="Unidad activa"
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
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
