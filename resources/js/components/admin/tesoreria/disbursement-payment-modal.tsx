import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
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
import { cn } from '@/lib/utils';
import type {
    OpenCashSessionSummary,
    PayableDocumentRow,
    TreasuryPaymentMethodOption,
} from '@/types/admin/treasury';

const DISBURSEMENT_STORE_URL = '/admin/tesoreria/pagos-proveedor';

const btnCancel =
    'border-violet-200 text-[#5b21b6] hover:bg-violet-50 hover:text-[#5b21b6]';

const btnPrimary =
    'border-transparent bg-linear-to-r from-[#ec4899] to-[#7c3aed] font-bold text-white shadow-md shadow-violet-300/30 hover:opacity-95 hover:text-white disabled:opacity-50';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    document: PayableDocumentRow | null;
    paymentMethods: TreasuryPaymentMethodOption[];
    openCashSession?: OpenCashSessionSummary | null;
    redirect?: 'payables_index' | 'purchase_edit' | 'purchases_index';
    errors?: Record<string, string>;
};

export function DisbursementPaymentModal({
    open,
    onOpenChange,
    document,
    paymentMethods,
    openCashSession = null,
    redirect = 'payables_index',
    errors = {},
}: Props) {
    const [paymentMethodId, setPaymentMethodId] = useState('');
    const [paymentDate, setPaymentDate] = useState('');
    const [amount, setAmount] = useState('');
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open && document) {
            setPaymentMethodId(paymentMethods[0]?.id ?? '');
            setPaymentDate(new Date().toISOString().slice(0, 10));
            setAmount(String(document.balance_due ?? document.total ?? ''));
            setReference('');
            setNotes('');
            setProofFile(null);
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
            setProofFile(null);
            setFieldErrors({});
        }

        onOpenChange(next);
    };

    const submit = () => {
        const formData = new FormData();
        formData.append('purchase_document_id', document.id);
        formData.append('redirect', redirect);
        formData.append('payment_method_id', paymentMethodId);
        formData.append('payment_date', paymentDate);
        formData.append('amount', amount);
        if (reference) {
            formData.append('reference', reference);
        }
        if (notes) {
            formData.append('notes', notes);
        }
        if (proofFile) {
            formData.append('proof_file', proofFile);
        }
        if (openCashSession) {
            formData.append('cash_register_session_id', openCashSession.id);
        }

        setProcessing(true);

        router.post(DISBURSEMENT_STORE_URL, formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => handleOpenChange(false),
            onError: (pageErrors) => {
                setFieldErrors(pageErrors as Record<string, string>);
            },
            onFinish: () => setProcessing(false),
        });
    };

    const message = (key: string) => fieldErrors[key] ?? errors[key];

    return (
        <AppModal open={open} onOpenChange={handleOpenChange} size="md">
            <AppModalHeader
                title="Registrar pago a proveedor"
                description={`${document.display_number} · Saldo: ${document.currency_code} ${balanceLabel}`}
            />

            <AppModalBody className="space-y-4">
                <FormSection
                    title="Pago"
                    gridClassName="grid w-full min-w-0 grid-cols-1 gap-3"
                >
                    <FormSelectField
                        id="disbursement-payment-method"
                        label="Método de pago"
                        required
                        value={paymentMethodId}
                        onValueChange={setPaymentMethodId}
                        options={paymentMethods.map((m) => ({
                            value: m.id,
                            label: m.name,
                        }))}
                        error={message('payment_method_id')}
                        disabled={processing || paymentMethods.length === 0}
                    />
                    <FormTextField
                        id="disbursement-payment-date"
                        label="Fecha de pago"
                        type="date"
                        required
                        value={paymentDate}
                        onChange={setPaymentDate}
                        error={message('payment_date')}
                        disabled={processing}
                    />
                    <FormTextField
                        id="disbursement-payment-amount"
                        label="Monto"
                        type="number"
                        required
                        value={amount}
                        onChange={setAmount}
                        min="0.01"
                        step="0.01"
                        hint={`Máximo: ${document.currency_code} ${balanceLabel}`}
                        error={message('amount')}
                        disabled={processing}
                    />
                    <FormTextField
                        id="disbursement-payment-reference"
                        label="Referencia (opcional)"
                        value={reference}
                        onChange={setReference}
                        placeholder="Nº operación, voucher…"
                        disabled={processing}
                    />
                    <FormTextField
                        id="disbursement-payment-notes"
                        label="Notas (opcional)"
                        value={notes}
                        onChange={setNotes}
                        disabled={processing}
                    />
                    <div>
                        <label className="mb-1 block text-sm font-medium text-[#3b2d4a]">
                            Comprobante de pago (PDF o imagen)
                        </label>
                        <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            className="block w-full text-sm text-[#6b5b7a] file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-2 file:text-[#7c3aed]"
                            disabled={processing}
                            onChange={(e) =>
                                setProofFile(e.target.files?.[0] ?? null)
                            }
                        />
                        <p className="mt-1 text-xs text-[#9d8fb0]">
                            Captura de transferencia, voucher Yape/Plin, etc.
                        </p>
                        {message('proof_file') ? (
                            <p className="mt-1 text-xs text-red-600">
                                {message('proof_file')}
                            </p>
                        ) : null}
                    </div>
                </FormSection>
            </AppModalBody>

            <AppModalFooter>
                <Button
                    type="button"
                    variant="outline"
                    className={cn('cursor-pointer rounded-xl', btnCancel)}
                    onClick={() => handleOpenChange(false)}
                    disabled={processing}
                >
                    Cancelar
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    className={cn('cursor-pointer rounded-xl', btnPrimary)}
                    disabled={
                        processing ||
                        paymentMethods.length === 0 ||
                        parseFloat(amount) <= 0 ||
                        parseFloat(amount) > parseFloat(balance) + 0.0001
                    }
                    onClick={submit}
                >
                    {processing && <Spinner />}
                    Registrar pago
                </Button>
            </AppModalFooter>
        </AppModal>
    );
}
