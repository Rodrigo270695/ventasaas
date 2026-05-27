import { router } from '@inertiajs/react';
import { Check, Copy, FileText, Mail, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FormComboboxField, FormTextField } from '@/components/form';
import { Spinner } from '@/components/ui/spinner';
import { purchaseBtnOutline, purchaseBtnPrimary } from '@/lib/purchase-form-styles';
import { SalesQuotationPdfPreviewDialog } from '@/components/admin/ventas/sales-quotation-pdf-preview-dialog';
import { SalesQuotationSendEmailModal } from '@/components/admin/ventas/sales-quotation-send-email-modal';
import type { SalesQuotationFormData, SalesQuotationLineForm } from '@/types/admin/sales-quotations';

type Option = { value: string; label: string; sublabel?: string };
type VariantOption = { value: string; label: string; sublabel?: string; unit_price?: string };

type Props = {
    quotation: SalesQuotationFormData | null;
    oldForm: SalesQuotationFormData;
    customerOptions: Array<Option & { email?: string | null }>;
    variantOptions: VariantOption[];
    errors?: Record<string, string>;
    storeUrl: string;
    updateUrl?: string;
    sendEmailUrl?: string;
    acceptUrl?: string;
    rejectUrl?: string;
    cancelUrl?: string;
    duplicateUrl?: string;
    convertUrl?: string;
    printUrl?: string;
    isOffline?: boolean;
    onOfflineSave?: (form: SalesQuotationFormData) => void;
};

function emptyLine(): SalesQuotationLineForm {
    return {
        product_variant_id: '',
        manual_sku: '',
        description: '',
        quantity: '1.00',
        unit_price: '0.00',
        discount: '0.00',
    };
}

export function SalesQuotationForm({
    quotation,
    oldForm,
    customerOptions,
    variantOptions,
    errors = {},
    storeUrl,
    updateUrl,
    sendEmailUrl,
    acceptUrl,
    rejectUrl,
    cancelUrl,
    duplicateUrl,
    convertUrl,
    printUrl,
    isOffline = false,
    onOfflineSave,
}: Props) {
    const initial = quotation ?? oldForm;
    const [processing, setProcessing] = useState(false);
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
    const [toEmail, setToEmail] = useState(
        quotation?.customer_email_to ?? quotation?.customer_email ?? '',
    );
    const [ccEmails, setCcEmails] = useState(quotation?.customer_email_cc ?? '');
    const [form, setForm] = useState<SalesQuotationFormData>({
        customer_party_id: initial.customer_party_id ?? '',
        issue_date: initial.issue_date ?? '',
        valid_until: initial.valid_until ?? '',
        currency_code: initial.currency_code ?? 'PEN',
        exchange_rate: initial.exchange_rate ?? '1',
        global_discount: initial.global_discount ?? '0',
        notes: initial.notes ?? '',
        lines: initial.lines?.length ? initial.lines : [emptyLine()],
    });

    const variantMap = useMemo(
        () => new Map(variantOptions.map((v) => [v.value, v])),
        [variantOptions],
    );
    const customerMap = useMemo(
        () => new Map(customerOptions.map((v) => [v.value, v])),
        [customerOptions],
    );
    const isLocked = Boolean(quotation && quotation.status !== 'draft');

    const totals = useMemo(() => {
        let subtotal = 0;
        let tax = 0;
        let total = 0;

        form.lines.forEach((line) => {
            const qty = Number(line.quantity || 0);
            const price = Number(line.unit_price || 0);
            const discount = Number(line.discount || 0);
            const lineTotal = Math.max(0, qty * price - discount);
            const lineSubtotal = lineTotal / 1.18;
            const lineTax = lineTotal - lineSubtotal;

            subtotal += lineSubtotal;
            tax += lineTax;
            total += lineTotal;
        });

        const globalDiscount = Number(form.global_discount || 0);
        total = Math.max(0, total - globalDiscount);

        return {
            subtotal: subtotal.toFixed(2),
            tax: tax.toFixed(2),
            total: total.toFixed(2),
        };
    }, [form.lines, form.global_discount]);

    const updateLine = (index: number, patch: Partial<SalesQuotationLineForm>) => {
        setForm((prev) => ({
            ...prev,
            lines: prev.lines.map((line, idx) => (idx === index ? { ...line, ...patch } : line)),
        }));
    };

    const addLine = () => {
        setForm((prev) => ({ ...prev, lines: [...prev.lines, emptyLine()] }));
    };

    const removeLine = (index: number) => {
        setForm((prev) => {
            const lines = prev.lines.filter((_, idx) => idx !== index);
            return { ...prev, lines: lines.length ? lines : [emptyLine()] };
        });
    };

    const submit = () => {
        const payload = {
            ...form,
            lines: form.lines.map((line) => ({
                product_variant_id: line.product_variant_id || null,
                manual_sku: line.manual_sku || null,
                description: line.description || null,
                quantity: line.quantity,
                unit_price: line.unit_price,
                discount: line.discount,
            })),
        };

        if (payload.lines.length === 0) {
            return;
        }

        if (isOffline && onOfflineSave) {
            setProcessing(true);

            try {
                onOfflineSave({
                    ...form,
                    id: quotation?.id,
                    internal_number: quotation?.internal_number,
                    status: quotation?.status,
                    status_label: quotation?.status_label,
                });
            } finally {
                setProcessing(false);
            }

            return;
        }

        setProcessing(true);

        if (updateUrl) {
            router.put(updateUrl, payload, {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            });
            return;
        }

        router.post(storeUrl, payload, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <div className="space-y-4 rounded-2xl border border-violet-200/80 bg-white p-4 shadow-sm md:p-5">
            {isOffline ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
                    Sin internet: la cotización se guardará localmente. Enviar correo,
                    PDF y conversión requieren conexión.
                </div>
            ) : null}
            {isLocked ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
                    Esta cotización ya fue enviada. Solo lectura.
                </div>
            ) : null}
            <div className="grid gap-3 rounded-xl border border-violet-100 bg-violet-50/20 p-3 md:grid-cols-3">
                <FormComboboxField
                    id="quotation-customer"
                    name="customer_party_id"
                    label="Cliente"
                    value={form.customer_party_id}
                    onValueChange={(value) => {
                        setForm((prev) => ({ ...prev, customer_party_id: value }));
                        const customer = customerMap.get(value);
                        if (customer?.email) setToEmail(customer.email);
                    }}
                    options={customerOptions}
                    placeholder="Selecciona cliente"
                    disabled={isLocked}
                    menuPlacement="portal"
                />
                <FormTextField
                    id="quotation-issue-date"
                    label="Fecha"
                    type="datetime-local"
                    value={form.issue_date}
                    onChange={(value) => setForm((prev) => ({ ...prev, issue_date: value }))}
                    disabled={isLocked}
                />
                <FormTextField
                    id="quotation-valid-until"
                    label="Válida hasta"
                    type="date"
                    value={form.valid_until}
                    onChange={(value) => setForm((prev) => ({ ...prev, valid_until: value }))}
                    disabled={isLocked}
                />
            </div>

            <div className="rounded-xl border border-violet-200">
                <table className="w-full table-fixed text-sm">
                    <thead>
                        <tr className="bg-violet-50 text-left text-[11px] font-semibold uppercase tracking-wide text-[#7c3aed]">
                            <th className="px-2 py-2" style={{ width: '26%' }}>Producto/Variante (opcional)</th>
                            <th className="px-2 py-2" style={{ width: '12%' }}>SKU manual</th>
                            <th className="px-2 py-2" style={{ width: '20%' }}>Descripción</th>
                            <th className="px-2 py-2 text-right" style={{ width: '8%' }}>Cantidad</th>
                            <th className="px-2 py-2 text-right" style={{ width: '8%' }}>Precio</th>
                            <th className="px-2 py-2 text-right" style={{ width: '8%' }}>Dscto</th>
                            <th className="px-2 py-2 text-right" style={{ width: '8%' }}>Importe</th>
                            <th className="px-2 py-2 text-right" style={{ width: '4%' }} />
                        </tr>
                    </thead>
                    <tbody>
                        {form.lines.map((line, index) => {
                            const lineTotal = Math.max(
                                0,
                                Number(line.quantity || 0) * Number(line.unit_price || 0) - Number(line.discount || 0),
                            ).toFixed(2);

                            return (
                                <tr key={`${line.product_variant_id || 'manual'}-${index}`} className="border-t border-violet-100 align-middle">
                                    <td className="px-2 py-2">
                                        <FormComboboxField
                                            id={`quotation-line-variant-${index}`}
                                            name={`lines[${index}][product_variant_id]`}
                                            label="Producto"
                                            value={line.product_variant_id ?? ''}
                                            onValueChange={(variantId) => {
                                                const variant = variantMap.get(variantId);
                                                updateLine(index, {
                                                    product_variant_id: variantId,
                                                    unit_price: variant?.unit_price || line.unit_price,
                                                    description: line.description || variant?.label || '',
                                                });
                                            }}
                                            options={[
                                                {
                                                    value: '',
                                                    label: 'Ítem manual (sin inventario)',
                                                },
                                                ...variantOptions,
                                            ]}
                                            placeholder="Busca por nombre o SKU"
                                            disabled={isLocked}
                                            fieldClassName="[&_label]:sr-only [&_button]:h-9 [&_button]:rounded-lg"
                                            menuPlacement="portal"
                                        />
                                    </td>
                                    <td className="px-2 py-2">
                                        <input
                                            value={line.manual_sku ?? ''}
                                            onChange={(e) => updateLine(index, { manual_sku: e.target.value })}
                                            className="h-9 w-full rounded-lg border border-violet-200 px-2"
                                            placeholder="SKU opcional"
                                            disabled={isLocked}
                                        />
                                    </td>
                                    <td className="px-2 py-2">
                                        <input
                                            value={line.description ?? ''}
                                            onChange={(e) => updateLine(index, { description: e.target.value })}
                                            className="h-9 w-full rounded-lg border border-violet-200 px-2"
                                            placeholder="Nombre o detalle del ítem"
                                            disabled={isLocked}
                                        />
                                    </td>
                                    <td className="px-2 py-2">
                                        <input
                                            value={line.quantity}
                                            onChange={(e) => updateLine(index, { quantity: e.target.value })}
                                            className="h-9 w-full rounded-lg border border-violet-200 px-2 text-right tabular-nums"
                                            disabled={isLocked}
                                        />
                                    </td>
                                    <td className="px-2 py-2">
                                        <input
                                            value={line.unit_price}
                                            onChange={(e) => updateLine(index, { unit_price: e.target.value })}
                                            className="h-9 w-full rounded-lg border border-violet-200 px-2 text-right tabular-nums"
                                            disabled={isLocked}
                                        />
                                    </td>
                                    <td className="px-2 py-2">
                                        <input
                                            value={line.discount}
                                            onChange={(e) => updateLine(index, { discount: e.target.value })}
                                            className="h-9 w-full rounded-lg border border-violet-200 px-2 text-right tabular-nums"
                                            disabled={isLocked}
                                        />
                                    </td>
                                    <td className="px-2 py-2 text-right font-semibold tabular-nums">{lineTotal}</td>
                                    <td className="px-2 py-2 text-right">
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => removeLine(index)}
                                            className="text-red-600 transition-all hover:bg-red-600 hover:text-white hover:shadow-md hover:shadow-red-200/60"
                                            disabled={isLocked}
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <Button type="button" variant="outline" className={purchaseBtnOutline} onClick={addLine} disabled={isLocked}>
                <Plus className="size-4" />
                Agregar línea
            </Button>

            <div className="grid gap-3 rounded-xl border border-violet-100 bg-violet-50/20 p-3 md:grid-cols-3">
                <FormTextField
                    id="quotation-discount"
                    label="Descuento global"
                    value={form.global_discount}
                    onChange={(value) => setForm((prev) => ({ ...prev, global_discount: value }))}
                    disabled={isLocked}
                />
                <FormTextField
                    id="quotation-notes"
                    label="Observaciones"
                    value={form.notes ?? ''}
                    onChange={(value) => setForm((prev) => ({ ...prev, notes: value }))}
                    disabled={isLocked}
                />
                <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-3 text-sm">
                    <div>SubTotal: PEN {totals.subtotal}</div>
                    <div>IGV: PEN {totals.tax}</div>
                    <div className="text-base font-bold">Total: PEN {totals.total}</div>
                </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
                {quotation?.id && duplicateUrl && !isOffline ? (
                    <Button type="button" variant="outline" onClick={() => router.post(duplicateUrl)} className={purchaseBtnOutline}>
                        <Copy className="size-4" />
                        Duplicar
                    </Button>
                ) : null}
                {quotation?.id && acceptUrl && !isOffline ? (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.post(acceptUrl)}
                        className={purchaseBtnOutline}
                        disabled={quotation.status === 'accepted'}
                    >
                        <Check className="size-4" />
                        Aceptar
                    </Button>
                ) : null}
                {quotation?.id && rejectUrl && !isOffline ? (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.post(rejectUrl)}
                        className={purchaseBtnOutline}
                        disabled={quotation.status === 'rejected'}
                    >
                        <X className="size-4" />
                        Rechazar
                    </Button>
                ) : null}
                {quotation?.id && cancelUrl && !isOffline ? (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.post(cancelUrl)}
                        className={purchaseBtnOutline}
                        disabled={quotation.status === 'cancelled'}
                    >
                        <RefreshCw className="size-4" />
                        Anular
                    </Button>
                ) : null}
                {quotation?.id && sendEmailUrl && !isOffline ? (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEmailModalOpen(true)}
                        className={purchaseBtnOutline}
                        disabled={!quotation.can_send_email}
                    >
                        <Mail className="size-4" />
                        <span className="ml-1">Enviar correo</span>
                    </Button>
                ) : null}
                {quotation?.id && convertUrl && !isOffline ? (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.post(convertUrl)}
                        className={purchaseBtnOutline}
                        disabled={!quotation.can_convert || Boolean(quotation.sales_document_id)}
                    >
                        <FileText className="size-4" />
                        {quotation.sales_document_number ? 'Comprobante creado' : 'Convertir a comprobante'}
                    </Button>
                ) : null}
                {quotation?.id && printUrl && !isOffline ? (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setPdfPreviewOpen(true)}
                        className={purchaseBtnOutline}
                    >
                        <FileText className="size-4" />
                        Ver PDF
                    </Button>
                ) : null}
                <Button type="button" className={purchaseBtnPrimary} onClick={submit} disabled={processing || isLocked}>
                    {processing ? <Spinner /> : null}
                    Guardar cotización
                </Button>
            </div>

            {quotation?.id && printUrl ? (
                <SalesQuotationPdfPreviewDialog
                    open={pdfPreviewOpen}
                    onOpenChange={setPdfPreviewOpen}
                    quotationNumber={quotation.internal_number ?? ''}
                    pdfUrl={printUrl}
                />
            ) : null}

            {quotation?.id && sendEmailUrl ? (
                <SalesQuotationSendEmailModal
                    open={emailModalOpen}
                    onOpenChange={setEmailModalOpen}
                    quotationNumber={quotation.internal_number ?? ''}
                    sendUrl={sendEmailUrl}
                    defaultEmail={toEmail || quotation.customer_email || ''}
                    lastSentTo={quotation.customer_email_to}
                    lastSentCc={ccEmails || quotation.customer_email_cc || ''}
                    sentAtLabel={quotation.customer_email_sent_label}
                    canSend={Boolean(quotation.can_send_email)}
                />
            ) : null}

            {errors.lines ? <p className="text-sm text-red-600">{errors.lines}</p> : null}
        </div>
    );
}

