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

export type PurchaseOrderSupplierEmailMeta = {
    default_email: string;
    last_sent_to: string | null;
    last_sent_cc: string;
    sent_at_label: string | null;
    confirmed_at_label: string | null;
    can_send: boolean;
    is_confirmed: boolean;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orderId: string;
    orderNumber: string;
    sendUrl: string;
    meta: PurchaseOrderSupplierEmailMeta;
};

export function PurchaseOrderSendEmailModal({
    open,
    onOpenChange,
    orderId,
    orderNumber,
    sendUrl,
    meta,
}: Props) {
    const [toEmail, setToEmail] = useState(meta.default_email ?? '');
    const [ccEmails, setCcEmails] = useState(meta.last_sent_cc ?? '');
    const [saveSupplierEmail, setSaveSupplierEmail] = useState(
        !meta.default_email,
    );
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (open) {
            setToEmail(meta.last_sent_to ?? meta.default_email ?? '');
            setCcEmails(meta.last_sent_cc ?? '');
            setSaveSupplierEmail(!meta.default_email);
        }
    }, [open, meta]);

    const submit = () => {
        setProcessing(true);
        router.post(
            sendUrl,
            {
                to_email: toEmail,
                cc_emails: ccEmails,
                save_supplier_email: saveSupplierEmail,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    onOpenChange(false);
                },
                onFinish: () => {
                    setProcessing(false);
                },
            },
        );
    };

    return (
        <AppModal open={open} onOpenChange={onOpenChange} size="md">
            <AppModalHeader
                title="Enviar orden al proveedor"
                description={`${orderNumber} — el proveedor recibirá un correo con botón para confirmar.`}
            />
            <AppModalBody className="space-y-4">
                {meta.confirmed_at_label ? (
                    <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                        Confirmada por proveedor el {meta.confirmed_at_label}.
                        Puedes reenviar si necesitas una nueva confirmación.
                    </p>
                ) : null}
                {meta.sent_at_label && !meta.is_confirmed ? (
                    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                        Último envío: {meta.sent_at_label}
                        {meta.last_sent_to ? ` a ${meta.last_sent_to}` : ''}.
                    </p>
                ) : null}
                <FormTextField
                    id="po-email-to"
                    name="to_email"
                    label="Correo del proveedor"
                    type="email"
                    required
                    value={toEmail}
                    onChange={setToEmail}
                    placeholder="proveedor@empresa.com"
                />
                <FormTextField
                    id="po-email-cc"
                    name="cc_emails"
                    label="Copia (CC)"
                    value={ccEmails}
                    onChange={setCcEmails}
                    hint="Opcional. Separa varios correos con coma."
                    placeholder="compras@miempresa.com, gerencia@..."
                />
                {!meta.default_email ? (
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-[#5b21b6]">
                        <input
                            type="checkbox"
                            className="size-4 rounded border-violet-300"
                            checked={saveSupplierEmail}
                            onChange={(e) =>
                                setSaveSupplierEmail(e.target.checked)
                            }
                        />
                        Guardar este correo en la ficha del proveedor
                    </label>
                ) : null}
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
                    disabled={processing || !toEmail || !meta.can_send}
                    onClick={submit}
                >
                    {processing ? <Spinner /> : <Mail className="size-4" />}
                    Enviar correo
                </Button>
            </AppModalFooter>
        </AppModal>
    );
}
