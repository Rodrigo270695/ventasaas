import { Form } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { store, update } from '@/routes/admin/catalogo/perfiles-tributarios';
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
import { useAutoCodeFromName } from '@/hooks/use-auto-code-from-name';
import type {
    SunatAffectationOption,
    TaxProfileFormValues,
    TaxProfilesOldForm,
} from '@/types/admin/tax-profiles';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'create' | 'edit';
    taxProfile?: TaxProfileFormValues | null;
    affectationOptions: SunatAffectationOption[];
    errors?: Record<string, string>;
    oldForm?: TaxProfilesOldForm;
};

const defaultOldForm: TaxProfilesOldForm = {
    code: '',
    name: '',
    sunat_affectation_code: '10',
    igv_rate: '18',
    isc_rate: '',
    is_default: false,
    is_active: true,
    sort_order: 0,
};

function resolveForm(
    open: boolean,
    oldForm: TaxProfilesOldForm,
    taxProfile?: TaxProfileFormValues | null,
): TaxProfilesOldForm {
    if (!open) {
        return defaultOldForm;
    }

    if (oldForm.code || oldForm.name) {
        return oldForm;
    }

    if (taxProfile) {
        return {
            code: taxProfile.code,
            name: taxProfile.name,
            sunat_affectation_code: taxProfile.sunat_affectation_code,
            igv_rate: taxProfile.igv_rate,
            isc_rate: taxProfile.isc_rate ?? '',
            is_default: taxProfile.is_default,
            is_active: taxProfile.is_active,
            sort_order: taxProfile.sort_order,
        };
    }

    return defaultOldForm;
}

export function TaxProfileFormModal({
    open,
    onOpenChange,
    mode,
    taxProfile,
    affectationOptions,
    errors = {},
    oldForm = defaultOldForm,
}: Props) {
    const isEdit = mode === 'edit' && taxProfile != null;
    const {
        code,
        resetCodeState,
        applyNameToCode,
        setCodeFromInput,
    } = useAutoCodeFromName('', isEdit);
    const [name, setName] = useState('');
    const [affectationCode, setAffectationCode] = useState('10');
    const [igvRate, setIgvRate] = useState('18');
    const [iscRate, setIscRate] = useState('');
    const [sortOrder, setSortOrder] = useState('0');
    const [isDefault, setIsDefault] = useState(false);
    const [isActive, setIsActive] = useState(true);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            const values = resolveForm(true, oldForm, taxProfile);
            resetCodeState(values.code, isEdit);
            setName(values.name);
            setAffectationCode(values.sunat_affectation_code);
            setIgvRate(values.igv_rate);
            setIscRate(values.isc_rate);
            setSortOrder(String(values.sort_order));
            setIsDefault(values.is_default);
            setIsActive(values.is_active);
            setFieldErrors(errors);
        }
    }, [
        open,
        taxProfile?.id,
        oldForm,
        errors,
        isEdit,
        resetCodeState,
    ]);

    const handleAffectationChange = (value: string) => {
        setAffectationCode(value);
        clearError('sunat_affectation_code');

        const option = affectationOptions.find((row) => row.value === value);

        if (option) {
            setIgvRate(option.default_igv_rate);
        }
    };

    const resetForm = () => {
        resetCodeState('', false);
        setName('');
        setAffectationCode('10');
        setIgvRate('18');
        setIscRate('');
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
        affectationCode.trim().length === 2 &&
        igvRate.trim().length > 0;

    const action =
        isEdit && taxProfile ? update.url(taxProfile.id) : store.url();

    const message = (key: string, formErrors: Record<string, string>) =>
        fieldErrors[key] ?? formErrors[key] ?? errors[key];

    return (
        <AppModal open={open} onOpenChange={handleOpenChange} size="sm">
            <Form
                key={open ? `${mode}-${taxProfile?.id ?? 'new'}` : 'closed'}
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
                                    ? 'Editar perfil tributario'
                                    : 'Nuevo perfil tributario'
                            }
                            description="Plantilla de afectación SUNAT e IGV para asignar a variantes."
                        />

                        <AppModalBody className="space-y-4">
                            <FormSection
                                title="Perfil"
                                gridClassName="grid gap-3"
                            >
                                <FormTextField
                                    id="tax-profile-name"
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
                                    placeholder="Ej. Gravado IGV 18%"
                                    error={message('name', formErrors)}
                                    disabled={processing}
                                    fieldClassName="sm:col-span-2"
                                />
                                <FormTextField
                                    id="tax-profile-code"
                                    name="code"
                                    label="Código"
                                    required
                                    value={code}
                                    onChange={(v) => {
                                        setCodeFromInput(v);
                                        clearError('code');
                                    }}
                                    placeholder="Ej. GRAVADO-18"
                                    maxLength={20}
                                    error={message('code', formErrors)}
                                    disabled={processing}
                                    fieldClassName="sm:col-span-2"
                                />
                                <FormSelectField
                                    id="tax-profile-affectation"
                                    name="sunat_affectation_code"
                                    label="Afectación SUNAT"
                                    required
                                    value={affectationCode}
                                    onValueChange={handleAffectationChange}
                                    options={affectationOptions}
                                    error={message(
                                        'sunat_affectation_code',
                                        formErrors,
                                    )}
                                    disabled={processing}
                                    fieldClassName="sm:col-span-2"
                                />
                                <FormTextField
                                    id="tax-profile-igv"
                                    name="igv_rate"
                                    label="IGV (%)"
                                    required
                                    value={igvRate}
                                    onChange={(v) => {
                                        setIgvRate(v);
                                        clearError('igv_rate');
                                    }}
                                    inputMode="decimal"
                                    error={message('igv_rate', formErrors)}
                                    disabled={processing}
                                />
                                <FormTextField
                                    id="tax-profile-isc"
                                    name="isc_rate"
                                    label="ISC (%)"
                                    value={iscRate}
                                    onChange={(v) => {
                                        setIscRate(v);
                                        clearError('isc_rate');
                                    }}
                                    placeholder="Opcional"
                                    inputMode="decimal"
                                    error={message('isc_rate', formErrors)}
                                    disabled={processing}
                                />
                                <FormTextField
                                    id="tax-profile-sort"
                                    name="sort_order"
                                    label="Orden"
                                    value={sortOrder}
                                    onChange={(v) => {
                                        setSortOrder(v);
                                        clearError('sort_order');
                                    }}
                                    error={message('sort_order', formErrors)}
                                    disabled={processing}
                                />
                                <FormCheckboxField
                                    id="tax-profile-default"
                                    name="is_default"
                                    label="Perfil por defecto"
                                    checked={isDefault}
                                    onCheckedChange={setIsDefault}
                                    disabled={processing}
                                    className="sm:col-span-2"
                                />
                                <FormCheckboxField
                                    id="tax-profile-active"
                                    name="is_active"
                                    label="Perfil activo"
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
