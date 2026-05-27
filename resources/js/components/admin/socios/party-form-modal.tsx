import { Form } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { store, update } from '@/routes/admin/socios';
import {
    AppModal,
    AppModalBody,
    AppModalFooter,
    AppModalHeader,
} from '@/components/modal';
import {
    FormCheckboxField,
    FormField,
    FormSection,
    FormSelectField,
    FormTextField,
} from '@/components/form';
import { PartyDocumentNumberField } from '@/components/admin/socios/party-document-number-field';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { formatDecimalInput } from '@/lib/format-decimal';
import { PartySunatBadges } from '@/components/admin/socios/party-sunat-badges';
import {
    canLookupPartyDocument,
    lookupPartyDocument,
    partyDocumentLookupLabel,
} from '@/lib/party-document-lookup';
import {
    PARTY_DOC_RUC,
    PARTY_DOCUMENT_TYPE_OPTIONS,
    partyDocumentIsComplete,
    sanitizePartyDocumentNumber,
} from '@/lib/party-document-type-options';
import { PARTY_TYPE_OPTIONS } from '@/lib/party-type-options';
import type { PartyFormPayload } from '@/lib/offline-parties';
import type {
    PartiesOldForm,
    PartyFormValues,
    PartyType,
} from '@/types/admin/parties';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'create' | 'edit';
    party?: PartyFormValues | null;
    errors?: Record<string, string>;
    oldForm?: PartiesOldForm;
    /** Vuelve a la URL de ventas tras crear (registro rápido desde comprobante). */
    embeddedReturnUrl?: string | null;
    /** Solo cliente / ambos; título orientado a ventas. */
    customerOnly?: boolean;
    isOffline?: boolean;
    onOfflineCreate?: (payload: PartyFormPayload) => void;
    onOfflineUpdate?: (partyId: string, payload: PartyFormPayload) => void;
};

const defaultOldForm: PartiesOldForm = {
    type: 'customer',
    document_type: '6',
    document_number: '',
    legal_name: '',
    trade_name: '',
    address: '',
    sunat_estado: '',
    sunat_condicion: '',
    email: '',
    phone: '',
    credit_limit: '0',
    payment_term_days: 0,
    is_active: true,
};

function resolveForm(
    open: boolean,
    oldForm: PartiesOldForm,
    party?: PartyFormValues | null,
): PartiesOldForm {
    if (!open) {
        return defaultOldForm;
    }

    if (oldForm.legal_name || oldForm.document_number) {
        return {
            ...oldForm,
            credit_limit: formatDecimalInput(oldForm.credit_limit),
        };
    }

    if (party) {
        return {
            type: party.type,
            document_type: party.document_type,
            document_number: party.document_number,
            legal_name: party.legal_name,
            trade_name: party.trade_name ?? '',
            address: party.address ?? '',
            sunat_estado: party.sunat_estado ?? '',
            sunat_condicion: party.sunat_condicion ?? '',
            email: party.email ?? '',
            phone: party.phone ?? '',
            credit_limit: formatDecimalInput(party.credit_limit),
            payment_term_days: party.payment_term_days,
            is_active: party.is_active,
        };
    }

    return defaultOldForm;
}

const CUSTOMER_TYPE_OPTIONS = PARTY_TYPE_OPTIONS.filter((option) =>
    ['customer', 'both'].includes(option.value),
);

export function PartyFormModal({
    open,
    onOpenChange,
    mode,
    party,
    errors = {},
    oldForm = defaultOldForm,
    embeddedReturnUrl = null,
    customerOnly = false,
    isOffline = false,
    onOfflineCreate,
    onOfflineUpdate,
}: Props) {
    const isEdit = mode === 'edit' && party != null;
    const typeOptions = customerOnly ? CUSTOMER_TYPE_OPTIONS : PARTY_TYPE_OPTIONS;

    const [type, setType] = useState<PartyType>('customer');
    const [documentType, setDocumentType] = useState('6');
    const [documentNumber, setDocumentNumber] = useState('');
    const [legalName, setLegalName] = useState('');
    const [tradeName, setTradeName] = useState('');
    const [address, setAddress] = useState('');
    const [sunatEstado, setSunatEstado] = useState('');
    const [sunatCondicion, setSunatCondicion] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [creditLimit, setCreditLimit] = useState('0.00');
    const [paymentTermDays, setPaymentTermDays] = useState('0');
    const [isActive, setIsActive] = useState(true);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [consultandoDocumento, setConsultandoDocumento] = useState(false);

    useEffect(() => {
        if (open) {
            const values = resolveForm(true, oldForm, party);
            setType(values.type);
            setDocumentType(values.document_type);
            setDocumentNumber(values.document_number);
            setLegalName(values.legal_name);
            setTradeName(values.trade_name);
            setAddress(values.address);
            setSunatEstado(values.sunat_estado);
            setSunatCondicion(values.sunat_condicion);
            setEmail(values.email);
            setPhone(values.phone);
            setCreditLimit(values.credit_limit);
            setPaymentTermDays(String(values.payment_term_days));
            setIsActive(values.is_active);
            setFieldErrors(errors);
        }
    }, [open, party?.id, oldForm, errors]);

    const resetForm = () => {
        setType('customer');
        setDocumentType('6');
        setDocumentNumber('');
        setLegalName('');
        setTradeName('');
        setAddress('');
        setSunatEstado('');
        setSunatCondicion('');
        setEmail('');
        setPhone('');
        setCreditLimit('0.00');
        setPaymentTermDays('0');
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
        legalName.trim().length > 0 &&
        partyDocumentIsComplete(documentType, documentNumber);

    const action = isEdit && party ? update.url(party.id) : store.url();

    const message = (key: string, formErrors: Record<string, string>) =>
        fieldErrors[key] ?? formErrors[key] ?? errors[key];

    const documentPlaceholder =
        documentType === '1'
            ? '8 dígitos'
            : documentType === '6'
              ? '11 dígitos'
              : 'Número';

    const onConsultarDocumento = async () => {
        setConsultandoDocumento(true);

        try {
            const data = await lookupPartyDocument(documentType, documentNumber);

            if (!data) {
                return;
            }

            setDocumentNumber(data.document_number);
            setLegalName(data.legal_name);

            if (data.trade_name) {
                setTradeName(data.trade_name);
            }

            if (data.address) {
                setAddress(data.address);
            }

            if (data.sunat_estado) {
                setSunatEstado(data.sunat_estado);
            }

            if (data.sunat_condicion) {
                setSunatCondicion(data.sunat_condicion);
            }

            clearError('document_number');
            clearError('legal_name');
            clearError('address');
        } finally {
            setConsultandoDocumento(false);
        }
    };

    const buildOfflinePayload = (): PartyFormPayload => ({
        type,
        document_type: documentType,
        document_number: documentNumber,
        legal_name: legalName,
        trade_name: tradeName,
        address,
        sunat_estado: sunatEstado,
        sunat_condicion: sunatCondicion,
        email,
        phone,
        credit_limit: creditLimit,
        payment_term_days: Number(paymentTermDays) || 0,
        is_active: isActive,
    });

    const handleOfflineSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!canSubmit) {
            return;
        }

        const payload = buildOfflinePayload();

        if (isEdit && party) {
            onOfflineUpdate?.(party.id, payload);
        } else {
            onOfflineCreate?.(payload);
        }

        handleOpenChange(false);
    };

    const modalContent = (
        processing: boolean,
        formErrors: Record<string, string>,
    ) => (
        <>
            <AppModalHeader
                            title={
                                customerOnly && !isEdit
                                    ? 'Registrar cliente'
                                    : isEdit
                                      ? 'Editar socio'
                                      : 'Nuevo socio'
                            }
                            description={
                                customerOnly && !isEdit
                                    ? 'Alta rápida desde la venta. Quedará disponible en el selector de cliente.'
                                    : isEdit
                                      ? 'Cliente o proveedor para ventas y compras.'
                                      : 'Registra un cliente, proveedor o ambos.'
                            }
                        />

            <AppModalBody className="space-y-4">
                {isOffline ? (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        Sin internet: los cambios se guardan localmente. La
                        consulta SUNAT no está disponible offline.
                    </p>
                ) : null}
                {embeddedReturnUrl ? (
                                <input
                                    type="hidden"
                                    name="return_url"
                                    value={embeddedReturnUrl}
                                />
                            ) : null}
                            <FormSection
                                title="Identificación"
                                gridClassName="grid gap-3 sm:grid-cols-2"
                            >
                                <FormSelectField
                                    id="party-type"
                                    name="type"
                                    label="Tipo de socio"
                                    required
                                    value={type}
                                    onValueChange={(v) => {
                                        setType(v as PartyType);
                                        clearError('type');
                                    }}
                                    options={typeOptions}
                                    disabled={processing}
                                    error={message('type', formErrors)}
                                />
                                <FormSelectField
                                    id="party-document-type"
                                    name="document_type"
                                    label="Tipo de documento"
                                    required
                                    value={documentType}
                                    onValueChange={(v) => {
                                        setDocumentType(v);
                                        setDocumentNumber((prev) =>
                                            sanitizePartyDocumentNumber(v, prev),
                                        );
                                        if (v !== PARTY_DOC_RUC) {
                                            setSunatEstado('');
                                            setSunatCondicion('');
                                        }
                                        clearError('document_type');
                                    }}
                                    options={PARTY_DOCUMENT_TYPE_OPTIONS}
                                    disabled={processing}
                                    error={message(
                                        'document_type',
                                        formErrors,
                                    )}
                                />
                                <FormField
                                    id="party-document-number"
                                    label="Número de documento"
                                    required
                                    className="sm:col-span-2"
                                    error={message(
                                        'document_number',
                                        formErrors,
                                    )}
                                >
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                        <PartyDocumentNumberField
                                            id="party-document-number"
                                            name="document_number"
                                            documentType={documentType}
                                            required
                                            value={documentNumber}
                                            onChange={(next) => {
                                                setDocumentNumber(next);
                                                clearError('document_number');
                                            }}
                                            placeholder={documentPlaceholder}
                                            disabled={processing}
                                            aria-invalid={Boolean(
                                                message(
                                                    'document_number',
                                                    formErrors,
                                                ),
                                            )}
                                        />
                                        {canLookupPartyDocument(documentType) &&
                                            !isOffline && (
                                            <Button
                                                type="button"
                                                className="h-10 w-full shrink-0 cursor-pointer gap-2 rounded-xl border-0 bg-linear-to-r from-[#ec4899] to-[#7c3aed] px-4 font-semibold text-white shadow-xs hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                                                disabled={
                                                    consultandoDocumento ||
                                                    processing ||
                                                    !partyDocumentIsComplete(
                                                        documentType,
                                                        documentNumber,
                                                    )
                                                }
                                                onClick={() =>
                                                    void onConsultarDocumento()
                                                }
                                            >
                                                {consultandoDocumento ? (
                                                    <Spinner className="text-white" />
                                                ) : (
                                                    <Search
                                                        className="size-4"
                                                        aria-hidden
                                                    />
                                                )}
                                                {consultandoDocumento
                                                    ? 'Consultando…'
                                                    : partyDocumentLookupLabel(
                                                          documentType,
                                                      )}
                                            </Button>
                                        )}
                                    </div>
                                </FormField>
                                <FormTextField
                                    id="party-legal-name"
                                    name="legal_name"
                                    label="Razón social / nombre completo"
                                    required
                                    value={legalName}
                                    onChange={(v) => {
                                        setLegalName(v);
                                        clearError('legal_name');
                                    }}
                                    maxLength={255}
                                    disabled={processing}
                                    fieldClassName="sm:col-span-2"
                                    error={message('legal_name', formErrors)}
                                />
                                <FormTextField
                                    id="party-trade-name"
                                    name="trade_name"
                                    label="Nombre comercial"
                                    value={tradeName}
                                    onChange={setTradeName}
                                    maxLength={255}
                                    disabled={processing}
                                    fieldClassName="sm:col-span-2"
                                />
                                <FormTextField
                                    id="party-address"
                                    name="address"
                                    label="Dirección"
                                    value={address}
                                    onChange={(v) => {
                                        setAddress(v);
                                        clearError('address');
                                    }}
                                    maxLength={500}
                                    disabled={processing}
                                    fieldClassName="sm:col-span-2"
                                    error={message('address', formErrors)}
                                />
                                {documentType === '6' &&
                                (sunatEstado || sunatCondicion) ? (
                                    <div className="space-y-2 sm:col-span-2">
                                        <input
                                            type="hidden"
                                            name="sunat_estado"
                                            value={sunatEstado}
                                        />
                                        <input
                                            type="hidden"
                                            name="sunat_condicion"
                                            value={sunatCondicion}
                                        />
                                        <p className="text-xs font-semibold uppercase tracking-wide text-[#9d8fb0]">
                                            Situación SUNAT
                                        </p>
                                        <PartySunatBadges
                                            sunatEstado={sunatEstado}
                                            sunatCondicion={sunatCondicion}
                                        />
                                    </div>
                                ) : null}
                            </FormSection>

                            <FormSection
                                title="Contacto"
                                gridClassName="grid gap-3 sm:grid-cols-2"
                            >
                                <FormTextField
                                    id="party-email"
                                    name="email"
                                    label="Correo"
                                    type="email"
                                    value={email}
                                    onChange={setEmail}
                                    maxLength={255}
                                    disabled={processing}
                                    error={message('email', formErrors)}
                                />
                                <FormTextField
                                    id="party-phone"
                                    name="phone"
                                    label="Teléfono"
                                    value={phone}
                                    onChange={setPhone}
                                    maxLength={30}
                                    disabled={processing}
                                    error={message('phone', formErrors)}
                                />
                            </FormSection>

                            <FormSection
                                title="Condiciones comerciales"
                                gridClassName="grid gap-3 sm:grid-cols-2"
                            >
                                <FormTextField
                                    id="party-credit-limit"
                                    name="credit_limit"
                                    label="Línea de crédito (S/)"
                                    value={creditLimit}
                                    onChange={setCreditLimit}
                                    inputMode="decimal"
                                    step="0.01"
                                    disabled={processing}
                                    error={message('credit_limit', formErrors)}
                                />
                                <FormTextField
                                    id="party-payment-term"
                                    name="payment_term_days"
                                    label="Días de crédito"
                                    type="number"
                                    value={paymentTermDays}
                                    onChange={setPaymentTermDays}
                                    min={0}
                                    max={3650}
                                    disabled={processing}
                                    error={message(
                                        'payment_term_days',
                                        formErrors,
                                    )}
                                />
                                <FormCheckboxField
                                    id="party-active"
                                    name="is_active"
                                    label="Socio activo"
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

    if (isOffline) {
        return (
            <AppModal open={open} onOpenChange={handleOpenChange} size="md">
                <form onSubmit={handleOfflineSubmit} className="contents">
                    {modalContent(false, {})}
                </form>
            </AppModal>
        );
    }

    return (
        <AppModal open={open} onOpenChange={handleOpenChange} size="md">
            <Form
                key={open ? `${mode}-${party?.id ?? 'new'}` : 'closed'}
                action={action}
                method={isEdit ? 'put' : 'post'}
                onSuccess={() => handleOpenChange(false)}
                className="contents"
            >
                {({ processing, errors: formErrors }) =>
                    modalContent(processing, formErrors)
                }
            </Form>
        </AppModal>
    );
}
