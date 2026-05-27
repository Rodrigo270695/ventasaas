import { Form, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { store } from '@/routes/admin/tesoreria/cobros';
import {
    AppModal,
    AppModalBody,
    AppModalFooter,
    AppModalHeader,
} from '@/components/modal';
import {
    FormSection,
    FormSelectField,
    FormTextField,
} from '@/components/form';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { SalesDocumentListRow, SalesSaleMode } from '@/types/admin/sales-documents';
import type {
    OpenCashSessionSummary,
    TreasuryPaymentMethodOption,
} from '@/types/admin/treasury';

export type ConfirmAndCollectConfig = {
    confirmUrl: string;
    buildConfirmPayload: () => Record<string, unknown>;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    document: SalesDocumentListRow | null;
    paymentMethods: TreasuryPaymentMethodOption[];
    openCashSession?: OpenCashSessionSummary | null;
    saleMode?: SalesSaleMode;
    redirect?:
        | 'sales_index'
        | 'internal_sales_index'
        | 'sales_edit'
        | 'receivables_index';
    errors?: Record<string, string>;
    confirmAndCollect?: ConfirmAndCollectConfig;
};

export function CollectionPaymentModal({
    open,
    onOpenChange,
    document,
    paymentMethods,
    openCashSession = null,
    saleMode = 'fiscal',
    redirect,
    errors = {},
    confirmAndCollect,
}: Props) {
    const [paymentMethodId, setPaymentMethodId] = useState('');
    const [paymentDate, setPaymentDate] = useState('');
    const [amount, setAmount] = useState('');
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const isConfirmFlow = Boolean(confirmAndCollect);
    const redirectTarget =
        redirect ??
        (saleMode === 'internal' ? 'internal_sales_index' : 'sales_index');

    useEffect(() => {
        if (open && document) {
            setPaymentMethodId(paymentMethods[0]?.id ?? '');
            setPaymentDate(new Date().toISOString().slice(0, 10));
            setAmount(
                String(document.balance_due ?? document.total ?? ''),
            );
            setReference('');
            setNotes('');
            setFieldErrors(errors);
        }
    }, [open, document?.id, document?.balance_due, document?.total, paymentMethods, errors]);

    if (!document) {
        return null;
    }

    const balance = document.balance_due ?? document.total;
    const balanceLabel = document.balance_due_label ?? document.total_label;

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            setPaymentMethodId('');
            setAmount('');
            setFieldErrors({});
            setProcessing(false);
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
        paymentMethodId.length > 0 &&
        paymentDate.length > 0 &&
        parseFloat(amount) > 0;

    const message = (key: string, formErrors: Record<string, string> = {}) =>
        fieldErrors[key] ?? formErrors[key] ?? errors[key];

    const submitConfirmAndCollect = () => {
        if (!confirmAndCollect || !canSubmit) {
            return;
        }

        setProcessing(true);

        router.post(
            confirmAndCollect.confirmUrl,
            {
                ...confirmAndCollect.buildConfirmPayload(),
                record_payment: true,
                payment_method_id: paymentMethodId,
                payment_date: paymentDate,
                amount,
                reference: reference || null,
                notes: notes || null,
                cash_register_session_id: openCashSession?.id ?? null,
            },
            {
                preserveScroll: true,
                onSuccess: () => handleOpenChange(false),
                onError: (pageErrors) => {
                    setFieldErrors(pageErrors as Record<string, string>);
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    const modalTitle = isConfirmFlow ? 'Cobrar y numerar' : 'Registrar cobro';
    const modalDescription = isConfirmFlow
        ? `Total: ${document.currency_code} ${balanceLabel}. Registra el cobro (total o parcial); si es venta a crédito, cierra y usa «Confirmar a crédito» en el formulario.`
        : `${document.full_number} · Saldo pendiente: ${document.currency_code} ${balanceLabel}`;

    const submitLabel = isConfirmFlow ? 'Cobrar y numerar' : 'Registrar cobro';

    const formBody = (
        formErrors: Record<string, string> = {},
        formProcessing = false,
    ) => (
        <>
            <AppModalHeader title={modalTitle} description={modalDescription} />

            <AppModalBody className="space-y-4">
                <FormSection
                    title="Cobro"
                    gridClassName="grid w-full min-w-0 grid-cols-1 gap-3"
                >
                    <FormSelectField
                        id="collection-payment-method"
                        name="payment_method_id"
                        label="Método de pago"
                        required
                        value={paymentMethodId}
                        onValueChange={(v) => {
                            setPaymentMethodId(v);
                            clearError('payment_method_id');
                        }}
                        options={paymentMethods.map((m) => ({
                            value: m.id,
                            label: m.name,
                        }))}
                        error={message('payment_method_id', formErrors)}
                        disabled={
                            processing ||
                            formProcessing ||
                            paymentMethods.length === 0
                        }
                    />
                    <FormTextField
                        id="collection-payment-date"
                        name="payment_date"
                        label="Fecha de cobro"
                        type="date"
                        required
                        value={paymentDate}
                        onChange={setPaymentDate}
                        error={message('payment_date', formErrors)}
                        disabled={processing || formProcessing}
                    />
                    <FormTextField
                        id="collection-payment-amount"
                        name="amount"
                        label="Monto"
                        type="number"
                        required
                        value={amount}
                        onChange={(v) => {
                            setAmount(v);
                            clearError('amount');
                        }}
                        min="0.01"
                        step="0.01"
                        hint={`Máximo: ${document.currency_code} ${balanceLabel}`}
                        error={message('amount', formErrors)}
                        disabled={processing || formProcessing}
                    />
                    <FormTextField
                        id="collection-payment-reference"
                        name="reference"
                        label="Referencia (opcional)"
                        value={reference}
                        onChange={setReference}
                        placeholder="Nº operación, voucher…"
                        maxLength={80}
                        error={message('reference', formErrors)}
                        disabled={processing || formProcessing}
                    />
                    <FormTextField
                        id="collection-payment-notes"
                        name="notes"
                        label="Notas (opcional)"
                        value={notes}
                        onChange={setNotes}
                        error={message('notes', formErrors)}
                        disabled={processing || formProcessing}
                    />
                </FormSection>

                {!isConfirmFlow ? (
                    <p className="text-xs text-[#6b5b7a]">
                        Total: {document.currency_code} {document.total_label}
                        {document.amount_paid_label
                            ? ` · Cobrado: ${document.currency_code} ${document.amount_paid_label}`
                            : null}
                    </p>
                ) : null}

                {openCashSession ? (
                    <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800 ring-1 ring-emerald-200/80">
                        Sesión abierta:{' '}
                        <strong>{openCashSession.cash_register_name}</strong>{' '}
                        (fondo PEN {openCashSession.opening_float_label})
                    </p>
                ) : (
                    <p className="text-xs text-amber-700">
                        Sin sesión de caja abierta: el cobro no se asignará a
                        una sesión.
                    </p>
                )}
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
                    type={isConfirmFlow ? 'button' : 'submit'}
                    disabled={
                        processing ||
                        formProcessing ||
                        !canSubmit ||
                        paymentMethods.length === 0 ||
                        parseFloat(amount) > parseFloat(balance) + 0.0001
                    }
                    onClick={
                        isConfirmFlow ? submitConfirmAndCollect : undefined
                    }
                    className="cursor-pointer rounded-xl bg-linear-to-r from-[#ec4899] to-[#7c3aed] font-bold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {(processing || formProcessing) && <Spinner />}
                    {submitLabel}
                </Button>
            </AppModalFooter>
        </>
    );

    if (isConfirmFlow) {
        return (
            <AppModal open={open} onOpenChange={handleOpenChange} size="sm">
                <div className="contents">{formBody({}, processing)}</div>
            </AppModal>
        );
    }

    return (
        <AppModal open={open} onOpenChange={handleOpenChange} size="sm">
            <Form
                key={open ? document.id : 'closed'}
                action={store.url()}
                method="post"
                onSuccess={() => handleOpenChange(false)}
                className="contents"
            >
                {({ processing: formProcessing, errors: formErrors }) => (
                    <>
                        <input
                            type="hidden"
                            name="sales_document_id"
                            value={document.id}
                        />
                        <input
                            type="hidden"
                            name="redirect"
                            value={redirectTarget}
                        />
                        {openCashSession ? (
                            <input
                                type="hidden"
                                name="cash_register_session_id"
                                value={openCashSession.id}
                            />
                        ) : null}
                        {formBody(formErrors, formProcessing)}
                    </>
                )}
            </Form>
        </AppModal>
    );
}
