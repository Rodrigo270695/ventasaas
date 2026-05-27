import { Form } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { store, update } from '@/routes/admin/documentos/series';
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
import { SUNAT_DOCUMENT_TYPE_OPTIONS } from '@/lib/sunat-document-type-options';
import type {
    DocumentSeriesFormValues,
    DocumentSeriesOldForm,
} from '@/types/admin/document-series';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'create' | 'edit';
    row?: DocumentSeriesFormValues | null;
    errors?: Record<string, string>;
    oldForm?: DocumentSeriesOldForm;
};

const defaultOldForm: DocumentSeriesOldForm = {
    sunat_document_type_code: '01',
    series: '',
    name: '',
    is_electronic: true,
    next_number: 1,
    is_active: true,
};

function resolveForm(
    open: boolean,
    oldForm: DocumentSeriesOldForm,
    row: DocumentSeriesFormValues | null | undefined,
    mode: 'create' | 'edit',
): DocumentSeriesOldForm {
    if (!open) {
        return defaultOldForm;
    }

    // Tras error de validación Laravel devuelve old('series') con valor.
    if (oldForm.series.trim().length > 0) {
        return oldForm;
    }

    if (mode === 'edit' && row) {
        return {
            sunat_document_type_code: row.sunat_document_type_code,
            series: row.series,
            name: row.name ?? '',
            is_electronic: row.is_electronic,
            next_number: row.next_number,
            is_active: row.is_active,
        };
    }

    return oldForm;
}

function previewNumber(series: string, nextNumber: string): string {
    const digits = series.trim().length > 0 ? series.trim() : '????';
    const num = Math.max(1, parseInt(nextNumber, 10) || 1);

    return `${digits}-${String(num).padStart(8, '0')}`;
}

export function DocumentSeriesFormModal({
    open,
    onOpenChange,
    mode,
    row,
    errors = {},
    oldForm = defaultOldForm,
}: Props) {
    const isEdit = mode === 'edit' && row != null;

    const [documentType, setDocumentType] = useState('01');
    const [series, setSeries] = useState('');
    const [name, setName] = useState('');
    const [nextNumber, setNextNumber] = useState('1');
    const [isElectronic, setIsElectronic] = useState(true);
    const [isActive, setIsActive] = useState(true);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            const values = resolveForm(true, oldForm, row, mode);
            setDocumentType(values.sunat_document_type_code);
            setSeries(values.series);
            setName(values.name);
            setNextNumber(String(values.next_number));
            setIsElectronic(values.is_electronic);
            setIsActive(values.is_active);
            setFieldErrors(errors);
        }
    }, [open, mode, row, oldForm, errors]);

    const resetForm = () => {
        setDocumentType('01');
        setSeries('');
        setName('');
        setNextNumber('1');
        setIsElectronic(true);
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

    const numberPreview = useMemo(
        () => previewNumber(series, nextNumber),
        [series, nextNumber],
    );

    const canSubmit =
        documentType.length === 2 &&
        series.trim().length === 4 &&
        Number(nextNumber) >= 1;

    const action = isEdit && row ? update.url(row.id) : store.url();

    const message = (key: string, formErrors: Record<string, string>) =>
        fieldErrors[key] ?? formErrors[key] ?? errors[key];

    return (
        <AppModal open={open} onOpenChange={handleOpenChange} size="md">
            <Form
                key={open ? `${mode}-${row?.id ?? 'new'}` : 'closed'}
                action={action}
                method={isEdit ? 'put' : 'post'}
                onSuccess={() => handleOpenChange(false)}
                className="contents"
            >
                {({ processing, errors: formErrors }) => (
                    <>
                        <AppModalHeader
                            title={isEdit ? 'Editar serie' : 'Nueva serie'}
                            description={
                                isEdit
                                    ? 'Correlativo SUNAT para facturación y comprobantes.'
                                    : 'Registra una serie autorizada (ej. F001, B001).'
                            }
                        />

                        <AppModalBody className="space-y-4">
                            {isEdit ? (
                                <>
                                    <input
                                        type="hidden"
                                        name="sunat_document_type_code"
                                        value={documentType}
                                    />
                                    <input type="hidden" name="series" value={series} />
                                </>
                            ) : null}
                            <FormSection
                                title="Comprobante"
                                gridClassName="grid gap-3 sm:grid-cols-2"
                            >
                                <FormSelectField
                                    id="series-document-type"
                                    name="sunat_document_type_code"
                                    label="Tipo SUNAT"
                                    required
                                    value={documentType}
                                    onValueChange={(v) => {
                                        setDocumentType(v);
                                        clearError('sunat_document_type_code');
                                    }}
                                    options={SUNAT_DOCUMENT_TYPE_OPTIONS}
                                    disabled={processing || isEdit}
                                    fieldClassName="sm:col-span-2"
                                    error={message(
                                        'sunat_document_type_code',
                                        formErrors,
                                    )}
                                />
                                <FormTextField
                                    id="series-code"
                                    name="series"
                                    label="Serie"
                                    required
                                    value={series}
                                    onChange={(v) => {
                                        setSeries(
                                            v
                                                .toUpperCase()
                                                .replace(/[^A-Z0-9]/g, '')
                                                .slice(0, 4),
                                        );
                                        clearError('series');
                                    }}
                                    placeholder="F001"
                                    maxLength={4}
                                    disabled={processing || isEdit}
                                    hint="4 caracteres alfanuméricos (SUNAT)."
                                    error={message('series', formErrors)}
                                />
                                <FormTextField
                                    id="series-next"
                                    name="next_number"
                                    label="Próximo número"
                                    required
                                    type="number"
                                    value={nextNumber}
                                    onChange={(v) => {
                                        setNextNumber(v);
                                        clearError('next_number');
                                    }}
                                    min={1}
                                    max={99999999}
                                    disabled={processing}
                                    error={message('next_number', formErrors)}
                                />
                                <FormTextField
                                    id="series-name"
                                    name="name"
                                    label="Descripción"
                                    value={name}
                                    onChange={setName}
                                    maxLength={120}
                                    disabled={processing}
                                    fieldClassName="sm:col-span-2"
                                    error={message('name', formErrors)}
                                />
                                <p className="rounded-lg border border-violet-100 bg-violet-50/60 px-3 py-2 text-xs text-[#5b21b6] sm:col-span-2">
                                    Vista previa del siguiente correlativo:{' '}
                                    <strong className="font-mono">
                                        {numberPreview}
                                    </strong>
                                </p>
                                <FormCheckboxField
                                    id="series-electronic"
                                    name="is_electronic"
                                    label="Comprobante electrónico"
                                    checked={isElectronic}
                                    onCheckedChange={setIsElectronic}
                                    disabled={processing}
                                    className="sm:col-span-2"
                                />
                                <FormCheckboxField
                                    id="series-active"
                                    name="is_active"
                                    label="Serie activa"
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
