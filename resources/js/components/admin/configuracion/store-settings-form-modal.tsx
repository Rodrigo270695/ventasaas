import { Form } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { store, update } from '@/routes/admin/configuracion/tienda';
import {
    AppModal,
    AppModalBody,
    AppModalFooter,
    AppModalHeader,
} from '@/components/modal';
import {
    FormField,
    FormFileField,
    FormSection,
    FormSelectField,
    FormTextField,
} from '@/components/form';
import { chokoInputClass } from '@/components/form/field-styles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { lookupPartyDocument } from '@/lib/party-document-lookup';
import {
    PARTY_DOC_RUC,
    partyDocumentIsComplete,
    sanitizePartyDocumentNumber,
} from '@/lib/party-document-type-options';
import { cn } from '@/lib/utils';
import {
    BILLING_CHANNEL_OPTIONS,
    SUNAT_ENVIRONMENT_OPTIONS,
    TAX_REGIME_OPTIONS,
} from '@/lib/store-settings-options';
import type {
    StoreSettingsFormValues,
    StoreSettingsRow,
} from '@/types/admin/store-settings';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    settings: StoreSettingsRow | null;
    oldForm: StoreSettingsFormValues;
    errors?: Record<string, string>;
};

function resolveForm(
    open: boolean,
    oldForm: StoreSettingsFormValues,
    settings: StoreSettingsRow | null,
): StoreSettingsFormValues {
    if (!open) {
        return oldForm;
    }

    if (oldForm.ruc || oldForm.razon_social) {
        return oldForm;
    }

    if (settings) {
        return {
            ruc: settings.ruc,
            razon_social: settings.razon_social,
            ubigeo: settings.ubigeo,
            direccion: settings.direccion ?? '',
            tax_regime: settings.tax_regime,
            billing_channel: settings.billing_channel,
            sunat_environment: settings.sunat_environment,
            default_igv_rate: String(settings.default_igv_rate),
            cdt_password_enc: '',
            sol_user: settings.sol_user ?? '',
            sol_password_enc: '',
            apisunat_token_enc: '',
        };
    }

    return oldForm;
}

export function StoreSettingsFormModal({
    open,
    onOpenChange,
    settings,
    oldForm,
    errors = {},
}: Props) {
    const isEdit = settings !== null;
    const [form, setForm] = useState<StoreSettingsFormValues>(oldForm);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [certificateFile, setCertificateFile] = useState<File | null>(null);
    const [removeCertificate, setRemoveCertificate] = useState(false);
    const [consultandoRuc, setConsultandoRuc] = useState(false);

    useEffect(() => {
        if (open) {
            setForm(resolveForm(true, oldForm, settings));
            setFieldErrors(errors);
            setCertificateFile(null);
            setRemoveCertificate(false);
        }
    }, [open, settings?.id, oldForm, errors]);

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            setFieldErrors({});
            setCertificateFile(null);
            setRemoveCertificate(false);
        }

        onOpenChange(next);
    };

    const canSubmit =
        form.ruc.trim().length === 11 &&
        form.razon_social.trim().length > 0 &&
        form.ubigeo.trim().length === 6;

    const isProductionSunat = form.sunat_environment === 'production';

    const action = isEdit ? update.url(settings.id) : store.url();

    const updateField = <K extends keyof StoreSettingsFormValues>(
        key: K,
        value: StoreSettingsFormValues[K],
    ) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        if (fieldErrors[key]) {
            setFieldErrors((prev) => {
                const next = { ...prev };
                delete next[key];

                return next;
            });
        }
    };

    const err = (key: string) =>
        fieldErrors[key] ?? errors[key];

    const onConsultarRuc = async () => {
        setConsultandoRuc(true);

        try {
            const data = await lookupPartyDocument(PARTY_DOC_RUC, form.ruc);

            if (!data) {
                return;
            }

            updateField('ruc', data.document_number);
            updateField('razon_social', data.legal_name);

            if (data.ubigeo) {
                updateField('ubigeo', data.ubigeo);
            }

            if (data.address) {
                updateField('direccion', data.address);
            }
        } finally {
            setConsultandoRuc(false);
        }
    };

    return (
        <AppModal
            open={open}
            onOpenChange={handleOpenChange}
            size="xl"
            className="sm:max-h-[min(92dvh,52rem)]"
        >
            <Form
                key={open ? (settings?.id ?? 'new') : 'closed'}
                action={action}
                method="post"
                onSuccess={() => handleOpenChange(false)}
                className="contents"
            >
                {({ processing, errors: formErrors }) => {
                    const message = (key: string) =>
                        err(key) ?? formErrors[key];

                    return (
                        <>
                            {isEdit && (
                                <input type="hidden" name="_method" value="PUT" />
                            )}
                            <AppModalHeader
                                className="px-5 py-3"
                                title={
                                    isEdit
                                        ? 'Editar datos de la tienda'
                                        : 'Configurar tienda'
                                }
                                description="Datos fiscales y facturación electrónica."
                            />

                            <AppModalBody className="max-h-[min(78vh,44rem)] space-y-3 overflow-y-auto px-5 py-3 pr-1">
                                <FormSection
                                    title="Identificación"
                                    className="space-y-2"
                                    gridClassName="grid grid-cols-1 gap-2 sm:grid-cols-2"
                                >
                                    <FormField
                                        id="store-ruc"
                                        label="RUC"
                                        required
                                        error={message('ruc')}
                                    >
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                            <div className="relative min-w-0 flex-1">
                                                <Input
                                                    id="store-ruc"
                                                    name="ruc"
                                                    required
                                                    value={form.ruc}
                                                    onChange={(e) =>
                                                        updateField(
                                                            'ruc',
                                                            sanitizePartyDocumentNumber(
                                                                PARTY_DOC_RUC,
                                                                e.target.value,
                                                            ),
                                                        )
                                                    }
                                                    placeholder="20123456789"
                                                    maxLength={11}
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    autoComplete="off"
                                                    disabled={processing}
                                                    aria-invalid={Boolean(
                                                        message('ruc'),
                                                    )}
                                                    className={cn(
                                                        chokoInputClass,
                                                        'w-full pr-14',
                                                    )}
                                                />
                                                <span
                                                    className={cn(
                                                        'pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold tabular-nums',
                                                        form.ruc.length === 0
                                                            ? 'text-[#9d8fb0]'
                                                            : form.ruc.length ===
                                                                11
                                                              ? 'text-blue-600'
                                                              : 'text-red-500',
                                                    )}
                                                    aria-hidden
                                                >
                                                    {form.ruc.length}/11
                                                </span>
                                            </div>
                                            <Button
                                                type="button"
                                                size="icon"
                                                className="size-10 shrink-0 cursor-pointer rounded-xl border-0 bg-linear-to-r from-[#ec4899] to-[#7c3aed] text-white shadow-xs hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                                                disabled={
                                                    consultandoRuc ||
                                                    processing ||
                                                    !partyDocumentIsComplete(
                                                        PARTY_DOC_RUC,
                                                        form.ruc,
                                                    )
                                                }
                                                aria-label={
                                                    consultandoRuc
                                                        ? 'Consultando RUC'
                                                        : 'Consultar RUC'
                                                }
                                                title="Consultar RUC"
                                                onClick={() =>
                                                    void onConsultarRuc()
                                                }
                                            >
                                                {consultandoRuc ? (
                                                    <Spinner className="text-white" />
                                                ) : (
                                                    <Search
                                                        className="size-4"
                                                        aria-hidden
                                                    />
                                                )}
                                            </Button>
                                        </div>
                                    </FormField>
                                    <FormTextField
                                        id="store-razon"
                                        name="razon_social"
                                        label="Razón social"
                                        required
                                        value={form.razon_social}
                                        onChange={(v) =>
                                            updateField('razon_social', v)
                                        }
                                        error={message('razon_social')}
                                        disabled={processing}
                                    />
                                    <FormTextField
                                        id="store-ubigeo"
                                        name="ubigeo"
                                        label="Ubigeo"
                                        required
                                        value={form.ubigeo}
                                        onChange={(v) =>
                                            updateField(
                                                'ubigeo',
                                                v.replace(/\D/g, '').slice(0, 6),
                                            )
                                        }
                                        placeholder="150101"
                                        maxLength={6}
                                        error={message('ubigeo')}
                                        disabled={processing}
                                    />
                                    <FormTextField
                                        id="store-direccion"
                                        name="direccion"
                                        label="Dirección"
                                        value={form.direccion}
                                        onChange={(v) =>
                                            updateField('direccion', v)
                                        }
                                        error={message('direccion')}
                                        disabled={processing}
                                    />
                                </FormSection>

                                <FormSection
                                    title="Facturación"
                                    description={
                                        isProductionSunat
                                            ? 'Emisión real: canal SUNAT directo y ambiente Producción.'
                                            : 'Ambiente Beta solo para pruebas; no emite comprobantes válidos ante SUNAT.'
                                    }
                                    className="space-y-2"
                                    gridClassName="grid gap-2 sm:grid-cols-2"
                                >
                                    <FormSelectField
                                        id="store-tax-regime"
                                        name="tax_regime"
                                        label="Régimen tributario"
                                        required
                                        value={form.tax_regime}
                                        onValueChange={(v) =>
                                            updateField('tax_regime', v)
                                        }
                                        options={TAX_REGIME_OPTIONS}
                                        error={message('tax_regime')}
                                        disabled={processing}
                                    />
                                    <FormSelectField
                                        id="store-billing-channel"
                                        name="billing_channel"
                                        label="Canal de facturación"
                                        required
                                        value={form.billing_channel}
                                        onValueChange={(v) =>
                                            updateField('billing_channel', v)
                                        }
                                        options={BILLING_CHANNEL_OPTIONS}
                                        error={message('billing_channel')}
                                        disabled={processing}
                                    />
                                    <FormSelectField
                                        id="store-sunat-env"
                                        name="sunat_environment"
                                        label="Ambiente SUNAT"
                                        required
                                        value={form.sunat_environment}
                                        onValueChange={(v) =>
                                            updateField('sunat_environment', v)
                                        }
                                        options={SUNAT_ENVIRONMENT_OPTIONS}
                                        error={message('sunat_environment')}
                                        disabled={processing}
                                    />
                                    <FormTextField
                                        id="store-igv"
                                        name="default_igv_rate"
                                        label="IGV por defecto (%)"
                                        required
                                        type="number"
                                        min={0}
                                        max={100}
                                        step="0.01"
                                        value={form.default_igv_rate}
                                        onChange={(v) =>
                                            updateField('default_igv_rate', v)
                                        }
                                        error={message('default_igv_rate')}
                                        disabled={processing}
                                    />
                                </FormSection>

                                <FormSection
                                    title="SUNAT directo"
                                    description={
                                        isProductionSunat
                                            ? 'Certificado y Clave SOL reales (Operaciones en línea).'
                                            : 'En Beta usa MODDATOS / MODDATOS; en Producción tus credenciales reales.'
                                    }
                                    className="space-y-2"
                                    gridClassName="grid gap-2 sm:grid-cols-2"
                                >
                                    <FormFileField
                                        id="store-certificate"
                                        name="certificate"
                                        label="Certificado digital (CDT)"
                                        hint="Archivo .p12 de SUNAT. Máx. 512 KB."
                                        accept=".p12,.pfx,.pem,.crt,.key"
                                        existingFileName={
                                            settings?.certificate_name ?? null
                                        }
                                        selectedFile={certificateFile}
                                        onFileChange={(file) => {
                                            setCertificateFile(file);
                                            if (fieldErrors.certificate) {
                                                setFieldErrors((prev) => {
                                                    const next = { ...prev };
                                                    delete next.certificate;

                                                    return next;
                                                });
                                            }
                                        }}
                                        removeExisting={removeCertificate}
                                        onRemoveExistingChange={
                                            setRemoveCertificate
                                        }
                                        error={message('certificate')}
                                        disabled={processing}
                                        fieldClassName="sm:col-span-2"
                                    />
                                    <FormTextField
                                        id="store-cdt-pass"
                                        name="cdt_password_enc"
                                        label="Clave del certificado (CDT)"
                                        type="password"
                                        value={form.cdt_password_enc}
                                        onChange={(v) =>
                                            updateField('cdt_password_enc', v)
                                        }
                                        autoComplete="new-password"
                                        placeholder={
                                            isEdit &&
                                            settings?.has_certificate_password
                                                ? 'Clave guardada — dejar en blanco'
                                                : undefined
                                        }
                                        hint={
                                            isEdit &&
                                            settings?.has_certificate_password
                                                ? 'En blanco = conservar la clave guardada.'
                                                : 'Clave al descargar el .p12 (no es la SOL).'
                                        }
                                        disabled={processing}
                                    />
                                    <FormTextField
                                        id="store-sol-user"
                                        name="sol_user"
                                        label="Usuario Clave SOL"
                                        value={form.sol_user}
                                        onChange={(v) =>
                                            updateField('sol_user', v)
                                        }
                                        placeholder={
                                            isProductionSunat
                                                ? 'Usuario secundario'
                                                : 'MODDATOS'
                                        }
                                        hint={
                                            isProductionSunat
                                                ? 'Código del usuario secundario (sin el RUC), el mismo del login SUNAT.'
                                                : 'Pruebas: MODDATOS (sin el RUC).'
                                        }
                                        disabled={processing}
                                    />
                                    <FormTextField
                                        id="store-sol-pass"
                                        name="sol_password_enc"
                                        label="Contraseña Clave SOL"
                                        type="password"
                                        value={form.sol_password_enc}
                                        onChange={(v) =>
                                            updateField('sol_password_enc', v)
                                        }
                                        autoComplete="new-password"
                                        placeholder={
                                            isEdit &&
                                            settings?.has_sol_password
                                                ? 'En blanco = conservar'
                                                : isProductionSunat
                                                  ? 'Contraseña SOL real'
                                                  : 'MODDATOS'
                                        }
                                        hint={
                                            isProductionSunat
                                                ? 'Contraseña del usuario secundario en Operaciones en línea.'
                                                : 'Pruebas: MODDATOS.'
                                        }
                                        disabled={processing}
                                    />
                                    <FormTextField
                                        id="store-api-token"
                                        name="apisunat_token_enc"
                                        label="Token API (opcional)"
                                        type="password"
                                        value={form.apisunat_token_enc}
                                        onChange={(v) =>
                                            updateField('apisunat_token_enc', v)
                                        }
                                        autoComplete="new-password"
                                        hint="Solo PSE / API SUNAT."
                                        disabled={processing}
                                        fieldClassName="sm:col-span-2"
                                    />
                                </FormSection>
                            </AppModalBody>

                            <AppModalFooter className="px-5 py-3">
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
                                    {isEdit ? 'Guardar' : 'Configurar'}
                                </Button>
                            </AppModalFooter>
                        </>
                    );
                }}
            </Form>
        </AppModal>
    );
}
