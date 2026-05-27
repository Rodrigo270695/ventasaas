import { router } from '@inertiajs/react';
import { Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    AppModal,
    AppModalBody,
    AppModalFooter,
    AppModalHeader,
} from '@/components/modal';
import { FormTextField } from '@/components/form';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { purchaseBtnOutline, purchaseBtnPrimary } from '@/lib/purchase-form-styles';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    quotationNumber: string;
    sendUrl: string;
    defaultEmail: string;
    lastSentTo?: string | null;
    lastSentCc?: string;
    sentAtLabel?: string | null;
    canSend: boolean;
};

export function SalesQuotationSendEmailModal({
    open,
    onOpenChange,
    quotationNumber,
    sendUrl,
    defaultEmail,
    lastSentTo = null,
    lastSentCc = '',
    sentAtLabel = null,
    canSend,
}: Props) {
    const [toEmail, setToEmail] = useState(defaultEmail);
    const [ccEmails, setCcEmails] = useState(lastSentCc);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (open) {
            setToEmail(lastSentTo ?? defaultEmail ?? '');
            setCcEmails(lastSentCc ?? '');
        }
    }, [open, defaultEmail, lastSentTo, lastSentCc]);

    const submit = () => {
        setProcessing(true);
        router.post(
            sendUrl,
            {
                to_email: toEmail,
                cc_emails: ccEmails,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => onOpenChange(false),
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <AppModal open={open} onOpenChange={onOpenChange} size="md">
            <AppModalHeader
                title="Enviar cotización al cliente"
                description={`${quotationNumber} — se enviará al cliente con el PDF de la cotización adjunto.`}
            />
            <AppModalBody className="space-y-4">
                {sentAtLabel ? (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                        Último envío: {sentAtLabel}
                        {lastSentTo ? ` a ${lastSentTo}` : ''}.
                    </p>
                ) : null}
                <FormTextField
                    id="quotation-email-to"
                    name="to_email"
                    label="Correo del cliente"
                    type="email"
                    required
                    value={toEmail}
                    onChange={setToEmail}
                    placeholder="cliente@empresa.com"
                />
                <FormTextField
                    id="quotation-email-cc"
                    name="cc_emails"
                    label="Copia (CC)"
                    value={ccEmails}
                    onChange={setCcEmails}
                    hint="Opcional. Separa varios correos con coma."
                    placeholder="ventas@miempresa.com, gerencia@..."
                />
            </AppModalBody>
            <AppModalFooter>
                <Button
                    type="button"
                    variant="outline"
                    className={purchaseBtnOutline}
                    onClick={() => onOpenChange(false)}
                    disabled={processing}
                >
                    Cancelar
                </Button>
                <Button
                    type="button"
                    className={purchaseBtnPrimary}
                    disabled={processing || !toEmail || !canSend}
                    onClick={submit}
                >
                    {processing ? <Spinner /> : <Mail className="size-4" />}
                    Enviar correo
                </Button>
            </AppModalFooter>
        </AppModal>
    );
}

