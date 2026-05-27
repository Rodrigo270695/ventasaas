import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    AppModal,
    AppModalBody,
    AppModalFooter,
    AppModalHeader,
} from '@/components/modal';
import { FormSection, FormTextField } from '@/components/form';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import type { TreasuryPaymentHistoryItem } from '@/types/admin/treasury';

const UPDATE_URL = '/admin/tesoreria/pagos-proveedor';

const btnCancel =
    'border-violet-200 text-[#5b21b6] hover:bg-violet-50 hover:text-[#5b21b6]';

const btnPrimary =
    'border-transparent bg-linear-to-r from-[#ec4899] to-[#7c3aed] font-bold text-white shadow-md shadow-violet-300/30 hover:opacity-95 hover:text-white disabled:opacity-50';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    payment: TreasuryPaymentHistoryItem | null;
    redirect?: 'payables_index' | 'purchase_edit' | 'purchases_index' | 'disbursements_index';
    errors?: Record<string, string>;
    onSuccess?: () => void;
};

export function DisbursementPaymentEditModal({
    open,
    onOpenChange,
    payment,
    redirect = 'payables_index',
    errors = {},
    onSuccess,
}: Props) {
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open && payment) {
            setReference(payment.reference ?? '');
            setNotes(payment.notes ?? '');
            setProofFile(null);
            setFieldErrors(errors);
        }
    }, [open, payment?.id, payment?.reference, payment?.notes, errors]);

    if (!payment) {
        return null;
    }

    const message = (key: string) => fieldErrors[key] ?? errors[key];

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            setProofFile(null);
            setFieldErrors({});
        }

        onOpenChange(next);
    };

    const submit = () => {
        const formData = new FormData();
        formData.append('_method', 'patch');
        formData.append('redirect', redirect);
        formData.append('reference', reference);
        formData.append('notes', notes);

        if (proofFile) {
            formData.append('proof_file', proofFile);
        }

        setProcessing(true);

        router.post(`${UPDATE_URL}/${payment.id}`, formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                handleOpenChange(false);
                onSuccess?.();
            },
            onError: (pageErrors) => {
                setFieldErrors(pageErrors as Record<string, string>);
            },
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AppModal
            open={open}
            onOpenChange={handleOpenChange}
            size="md"
            className="max-w-[min(100%,calc(100vw-1rem))]"
        >
            <AppModalHeader
                className="px-4 py-3 sm:px-6 sm:py-4"
                title="Editar pago"
                description={`${payment.payment_date_label} · ${payment.currency_code} ${payment.amount_label}`}
            />

            <AppModalBody className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
                <FormSection
                    title="Datos del pago"
                    gridClassName="grid w-full min-w-0 grid-cols-1 gap-3"
                >
                    <FormTextField
                        id="edit-payment-reference"
                        label="Referencia (opcional)"
                        value={reference}
                        onChange={setReference}
                        placeholder="Nº operación, voucher…"
                        error={message('reference')}
                        disabled={processing}
                    />
                    <FormTextField
                        id="edit-payment-notes"
                        label="Notas (opcional)"
                        value={notes}
                        onChange={setNotes}
                        error={message('notes')}
                        disabled={processing}
                    />
                    <div>
                        <label className="mb-1 block text-sm font-medium text-[#3b2d4a]">
                            Comprobante de pago (PDF o imagen)
                        </label>
                        {payment.has_proof ? (
                            <p className="mb-2 text-xs text-[#6b5b7a]">
                                Archivo actual:{' '}
                                <span className="font-medium text-[#4c1d95]">
                                    {payment.proof_file_name ?? 'adjunto'}
                                </span>
                                . Sube uno nuevo para reemplazarlo.
                            </p>
                        ) : (
                            <p className="mb-2 text-xs text-amber-700">
                                Este pago no tiene comprobante. Puedes subirlo
                                ahora.
                            </p>
                        )}
                        <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            className="block w-full text-sm text-[#6b5b7a] file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-2 file:text-[#7c3aed]"
                            disabled={processing}
                            onChange={(e) =>
                                setProofFile(e.target.files?.[0] ?? null)
                            }
                        />
                        {message('proof_file') ? (
                            <p className="mt-1 text-xs text-red-600">
                                {message('proof_file')}
                            </p>
                        ) : null}
                    </div>
                </FormSection>
            </AppModalBody>

            <AppModalFooter className="flex-col gap-2 px-4 py-3 sm:flex-row sm:px-6 sm:py-4">
                <Button
                    type="button"
                    variant="outline"
                    className={cn(
                        'w-full cursor-pointer rounded-xl sm:w-auto',
                        btnCancel,
                    )}
                    onClick={() => handleOpenChange(false)}
                    disabled={processing}
                >
                    Cancelar
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    className={cn(
                        'w-full cursor-pointer rounded-xl sm:w-auto',
                        btnPrimary,
                    )}
                    disabled={processing}
                    onClick={submit}
                >
                    {processing && <Spinner />}
                    Guardar cambios
                </Button>
            </AppModalFooter>
        </AppModal>
    );
}
