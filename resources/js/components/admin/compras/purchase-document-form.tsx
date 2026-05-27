import { Link, router, usePage } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { PurchaseVariantQuickModal } from '@/components/admin/compras/purchase-variant-quick-modal';
import { PurchasePaymentHistory } from '@/components/admin/compras/purchase-payment-history';
import { DisbursementPaymentEditModal } from '@/components/admin/tesoreria/disbursement-payment-edit-modal';
import { DisbursementPaymentModal } from '@/components/admin/tesoreria/disbursement-payment-modal';
import {
    FormComboboxField,
    FormSection,
    FormSelectField,
    FormTextField,
} from '@/components/form';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { buildPurchaseDocumentPayload } from '@/lib/purchase-document-payload';
import {
    formatPurchaseDecimal,
    formatPurchaseDecimalDisplay,
    normalizePurchaseDecimalOnBlur,
} from '@/lib/purchase-decimals';
import {
    purchaseBtnCancel,
    purchaseBtnGhostDanger,
    purchaseBtnOutline,
    purchaseBtnPrimary,
    purchaseBtnPrimarySm,
    purchaseDecimalInputClass,
} from '@/lib/purchase-form-styles';
import {
    nowDatetimeLocalValue,
    toDatetimeLocalValue,
} from '@/lib/peru-datetime';
import { cn } from '@/lib/utils';
import type { PayableDocumentRow } from '@/types/admin/treasury';
import type {
    PurchaseDocumentFormData,
    PurchaseDocumentFormPageProps,
    PurchaseDocumentLineForm,
} from '@/types/admin/purchase-documents';

type VariantOption = {
    value: string;
    label: string;
    sublabel?: string;
    unit_price?: string;
    track_stock?: boolean;
};

function emptyLine(): PurchaseDocumentLineForm {
    return {
        product_variant_id: '',
        quantity: '1.00',
        unit_cost: '0.00',
        description: '',
    };
}

function mapDocumentLine(line: PurchaseDocumentLineForm): PurchaseDocumentLineForm {
    return {
        ...line,
        quantity: formatPurchaseDecimal(line.quantity),
        unit_cost: formatPurchaseDecimal(line.unit_cost),
    };
}

function resolveInitial(
    document: PurchaseDocumentFormData | null,
    oldForm: PurchaseDocumentFormData,
    defaultWarehouseId?: string | null,
): PurchaseDocumentFormData {
    const lines =
        oldForm.lines?.length
            ? oldForm.lines
            : document?.lines?.length
              ? document.lines
              : [emptyLine()];

    return {
        supplier_party_id:
            oldForm.supplier_party_id ?? document?.supplier_party_id ?? '',
        warehouse_id:
            oldForm.warehouse_id ??
            document?.warehouse_id ??
            defaultWarehouseId ??
            '',
        supplier_document_number:
            oldForm.supplier_document_number ??
            document?.supplier_document_number ??
            '',
        issue_date: toDatetimeLocalValue(
            oldForm.issue_date ?? document?.issue_date ?? nowDatetimeLocalValue(),
        ),
        due_date: oldForm.due_date ?? document?.due_date ?? '',
        currency_code: oldForm.currency_code ?? document?.currency_code ?? 'PEN',
        exchange_rate: oldForm.exchange_rate ?? document?.exchange_rate ?? '1',
        notes: oldForm.notes ?? document?.notes ?? '',
        lines: lines.map(mapDocumentLine),
    };
}

type Props = PurchaseDocumentFormPageProps & {
    storeUrl: string;
    indexUrl: string;
    payablesUrl: string;
    prefillFromReceipt?: PurchaseDocumentFormPageProps['prefillFromReceipt'];
};

export function PurchaseDocumentForm({
    document,
    supplierOptions,
    warehouseOptions,
    defaultWarehouseId = null,
    variantOptions: initialVariantOptions,
    productOptions,
    paymentMethods = [],
    canRecordPayment = false,
    canUpdatePayment = false,
    canUpdate = true,
    openCashSession = null,
    paymentHistory = [],
    oldForm,
    storeUrl,
    indexUrl,
    payablesUrl,
    prefillFromReceipt = null,
}: Props) {
    const isEdit = Boolean(document?.id);
    const stockPosted = Boolean(document?.stock_posted);
    const fromReceipt = Boolean(prefillFromReceipt?.goods_receipt_id);
    const readOnly = isEdit && (!canUpdate || stockPosted);

    const [variantOptions, setVariantOptions] = useState(initialVariantOptions);
    const [quickModalOpen, setQuickModalOpen] = useState(false);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [editPaymentOpen, setEditPaymentOpen] = useState(false);
    const [paymentToEdit, setPaymentToEdit] = useState<
        (typeof paymentHistory)[number] | null
    >(null);
    const [invoiceFile, setInvoiceFile] = useState<File | null>(null);

    const [form, setForm] = useState(() => {
        if (prefillFromReceipt && !document) {
            return {
                supplier_party_id: prefillFromReceipt.supplier_party_id,
                warehouse_id: prefillFromReceipt.warehouse_id ?? '',
                supplier_document_number: '',
                issue_date: toDatetimeLocalValue(
                    prefillFromReceipt.issue_date ?? nowDatetimeLocalValue(),
                ),
                due_date: '',
                currency_code: prefillFromReceipt.currency_code,
                exchange_rate: prefillFromReceipt.exchange_rate,
                notes: prefillFromReceipt.notes,
                lines: prefillFromReceipt.lines.map(mapDocumentLine),
                goods_receipt_id: prefillFromReceipt.goods_receipt_id,
            } as PurchaseDocumentFormData & { goods_receipt_id?: string };
        }

        return resolveInitial(document, oldForm, defaultWarehouseId);
    });

    const variantMap = useMemo(
        () => new Map(variantOptions.map((v) => [v.value, v])),
        [variantOptions],
    );

    const pageErrors = usePage<{ errors?: Record<string, string> }>().props.errors ?? {};
    const [processing, setProcessing] = useState(false);
    const errors = pageErrors;

    const setField = <K extends keyof PurchaseDocumentFormData>(
        key: K,
        value: PurchaseDocumentFormData[K],
    ) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const setLine = (index: number, patch: Partial<PurchaseDocumentLineForm>) => {
        setForm((prev) => {
            const lines = [...(prev.lines ?? [])];
            lines[index] = { ...lines[index], ...patch };

            return { ...prev, lines };
        });
    };

    const addLine = () => {
        setForm((prev) => ({
            ...prev,
            lines: [...(prev.lines ?? []), emptyLine()],
        }));
    };

    const removeLine = (index: number) => {
        setForm((prev) => {
            const lines = [...(prev.lines ?? [])];
            lines.splice(index, 1);

            return {
                ...prev,
                lines: lines.length ? lines : [emptyLine()],
            };
        });
    };

    const onVariantPick = (index: number, variantId: string) => {
        const variant = variantMap.get(variantId);

        if (!variant) {
            return;
        }

        setLine(index, {
            product_variant_id: variantId,
            unit_cost: formatPurchaseDecimal(variant.unit_price ?? '0'),
        });
    };

    const handleQuickVariant = useCallback(
        (variant: VariantOption) => {
            setVariantOptions((prev) => {
                if (prev.some((v) => v.value === variant.value)) {
                    return prev;
                }

                return [...prev, variant];
            });

            const lines = form.lines ?? [emptyLine()];
            const emptyIndex = lines.findIndex((l) => !l.product_variant_id);
            const target = emptyIndex >= 0 ? emptyIndex : lines.length;

            if (target >= lines.length) {
                addLine();
            }

            setTimeout(() => {
                onVariantPick(target, variant.value);
            }, 0);
        },
        [form.lines],
    );

    const paymentRow = useMemo<PayableDocumentRow | null>(() => {
        if (!document?.id || !document.can_receive_payment) {
            return null;
        }

        return {
            id: document.id,
            internal_number: document.internal_number ?? '',
            supplier_document_number: document.supplier_document_number,
            display_number: document.internal_number ?? '',
            issue_date: document.issue_date,
            issue_date_label: null,
            due_date: document.due_date || null,
            due_date_label: null,
            supplier_name: '',
            supplier_document: null,
            payment_status: document.payment_status ?? 'unpaid',
            payment_status_label: document.payment_status_label ?? '',
            amount_paid: '0',
            amount_paid_label: document.amount_paid_label ?? '0',
            balance_due: '0',
            balance_due_label: document.balance_due_label ?? '0',
            total: document.total,
            total_label: document.total,
            currency_code: document.currency_code,
            can_receive_payment: true,
            is_overdue: false,
            days_overdue: 0,
            aging_label: '',
            document_edit_url: `${storeUrl}/edit`,
            payment_history: paymentHistory,
        };
    }, [document, storeUrl, paymentHistory]);

    const submit = () => {
        const payload = buildPurchaseDocumentPayload(form);
        const formData = new FormData();

        Object.entries(payload).forEach(([key, value]) => {
            if (key === 'lines') {
                (value as typeof payload.lines).forEach((line, index) => {
                    Object.entries(line).forEach(([lineKey, lineValue]) => {
                        formData.append(
                            `lines[${index}][${lineKey}]`,
                            String(lineValue ?? ''),
                        );
                    });
                });

                return;
            }

            if (value !== null && value !== undefined) {
                formData.append(key, String(value));
            }
        });

        if (invoiceFile) {
            formData.append('invoice_file', invoiceFile);
        }

        if (isEdit) {
            formData.append('_method', 'put');
        }

        setProcessing(true);

        router.post(storeUrl, formData, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <>
            {fromReceipt && prefillFromReceipt ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-900">
                    Factura vinculada a recepción{' '}
                    <strong>{prefillFromReceipt.receipt_number}</strong>
                    {prefillFromReceipt.order_number
                        ? ` (orden ${prefillFromReceipt.order_number})`
                        : ''}
                    . El stock ya ingresó con la recepción; solo registras el
                    documento del proveedor y el saldo en CxP.
                </div>
            ) : null}

            {isEdit && document ? (
                <div className="mb-4 flex flex-wrap gap-3 rounded-xl bg-violet-50/60 px-4 py-3 text-sm ring-1 ring-violet-100">
                    <span>
                        Pago: <strong>{document.payment_status_label}</strong>
                    </span>
                    {document.balance_due_label ? (
                        <span>
                            Saldo CxP:{' '}
                            <strong className="text-amber-800">
                                {document.currency_code} {document.balance_due_label}
                            </strong>
                        </span>
                    ) : null}
                    {stockPosted ? (
                        <span className="text-emerald-700">
                            Inventario actualizado
                        </span>
                    ) : null}
                    {document.invoice_download_url ? (
                        <a
                            href={document.invoice_download_url}
                            className="font-semibold text-[#7c3aed] hover:underline"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Ver factura escaneada
                        </a>
                    ) : null}
                </div>
            ) : null}

            {isEdit && paymentHistory.length > 0 ? (
                <FormSection title="Historial de pagos">
                    <PurchasePaymentHistory
                        payments={paymentHistory}
                        currencyCode={document?.currency_code}
                        canEdit={canUpdatePayment}
                        onEdit={(payment) => {
                            setPaymentToEdit(payment);
                            setEditPaymentOpen(true);
                        }}
                    />
                </FormSection>
            ) : null}

            <div className="space-y-6">
                <FormSection title="Proveedor y factura">
                    <FormComboboxField
                        id="supplier_party_id"
                        name="supplier_party_id"
                        label="Proveedor"
                        required
                        value={form.supplier_party_id}
                        onValueChange={(v) => setField('supplier_party_id', v)}
                        options={supplierOptions}
                        error={errors.supplier_party_id}
                        disabled={processing || readOnly || fromReceipt}
                    />
                    <FormTextField
                        id="supplier_document_number"
                        label="Nº factura del proveedor"
                        value={form.supplier_document_number}
                        onChange={(v) => setField('supplier_document_number', v)}
                        disabled={processing || readOnly}
                    />
                    <FormTextField
                        id="issue_date"
                        name="issue_date"
                        label="Fecha y hora emisión"
                        type="datetime-local"
                        required
                        value={form.issue_date}
                        onChange={(v) => setField('issue_date', v)}
                        disabled={processing || readOnly}
                    />
                    <FormTextField
                        id="due_date"
                        label="Vencimiento (crédito)"
                        type="date"
                        value={form.due_date}
                        onChange={(v) => setField('due_date', v)}
                        disabled={processing || readOnly}
                    />
                    {!fromReceipt ? (
                        <FormSelectField
                            id="warehouse_id"
                            label="Almacén de ingreso"
                            value={form.warehouse_id ?? ''}
                            onValueChange={(v) => setField('warehouse_id', v)}
                            options={warehouseOptions}
                            hint="Obligatorio si los productos controlan stock."
                            disabled={processing || readOnly}
                        />
                    ) : null}
                    <div className="col-span-full">
                        <label className="mb-1 block text-sm font-medium text-[#3b2d4a]">
                            Archivo de factura (PDF o imagen)
                        </label>
                        <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            className="block w-full text-sm text-[#6b5b7a] file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-2 file:text-[#7c3aed]"
                            disabled={processing}
                            onChange={(e) =>
                                setInvoiceFile(e.target.files?.[0] ?? null)
                            }
                        />
                        {document?.invoice_file_name && !invoiceFile ? (
                            <p className="mt-1 text-xs text-[#6b5b7a]">
                                Actual: {document.invoice_file_name}
                            </p>
                        ) : null}
                    </div>
                </FormSection>

                {fromReceipt ? (
                    <FormSection
                        title="Productos (desde la recepción)"
                        gridClassName="col-span-full"
                    >
                        <p className="mb-3 text-xs text-[#6b5b7a]">
                            Cantidades fijas (recepción). Si el proveedor cobró
                            distinto, ajusta solo el{' '}
                            <strong>costo unitario</strong> por línea.
                        </p>
                        <div className="overflow-x-auto rounded-xl border border-violet-100">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-violet-50/80 text-[10px] font-semibold uppercase text-[#6b5b7a]">
                                    <tr>
                                        <th className="px-3 py-2">Producto</th>
                                        <th className="px-3 py-2 text-right">
                                            Cant.
                                        </th>
                                        <th className="min-w-[7rem] px-3 py-2 text-right">
                                            Costo unit.
                                        </th>
                                        <th className="px-3 py-2 text-right">
                                            Subtotal
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(form.lines ?? []).map((line, index) => {
                                        const qty = parseFloat(
                                            line.quantity || '0',
                                        );
                                        const cost = parseFloat(
                                            line.unit_cost || '0',
                                        );
                                        const sub =
                                            Number.isFinite(qty) &&
                                            Number.isFinite(cost)
                                                ? (qty * cost).toFixed(2)
                                                : '—';

                                        return (
                                            <tr
                                                key={
                                                    line.goods_receipt_line_id ??
                                                    line.id ??
                                                    `receipt-line-${index}`
                                                }
                                                className="border-t border-violet-50"
                                            >
                                                <td className="px-3 py-2">
                                                    {line.product_name ??
                                                        line.variant_sku ??
                                                        line.description ??
                                                        '—'}
                                                </td>
                                                <td className="px-3 py-2 text-right tabular-nums text-[#6b5b7a]">
                                                    {formatPurchaseDecimalDisplay(
                                                        line.quantity,
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        inputMode="decimal"
                                                        className={`${purchaseDecimalInputClass} max-w-26`}
                                                        value={line.unit_cost}
                                                        disabled={processing}
                                                        onChange={(e) =>
                                                            setLine(index, {
                                                                unit_cost:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                        onBlur={() =>
                                                            setLine(index, {
                                                                unit_cost:
                                                                    normalizePurchaseDecimalOnBlur(
                                                                        line.unit_cost,
                                                                    ),
                                                            })
                                                        }
                                                    />
                                                </td>
                                                <td className="px-3 py-2 text-right tabular-nums font-medium text-[#4c1d95]">
                                                    {formatPurchaseDecimalDisplay(
                                                        sub,
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </FormSection>
                ) : !readOnly ? (
                    <FormSection
                        title="Productos que ingresan"
                        gridClassName="col-span-full space-y-3"
                    >
                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className={purchaseBtnOutline}
                                onClick={addLine}
                            >
                                <Plus className="size-4" />
                                Línea
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className={purchaseBtnPrimarySm}
                                onClick={() => setQuickModalOpen(true)}
                            >
                                Nuevo producto / SKU
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {(form.lines ?? []).map((line, index) => (
                                <div
                                    key={index}
                                    className="grid gap-2 rounded-xl border border-violet-100 bg-white/80 p-3 md:grid-cols-[1fr_5rem_6rem_auto]"
                                >
                                    <FormComboboxField
                                        id={`line-variant-${index}`}
                                        label="Producto / SKU"
                                        value={line.product_variant_id}
                                        onValueChange={(v) =>
                                            onVariantPick(index, v)
                                        }
                                        options={variantOptions.map((v) => ({
                                            value: v.value,
                                            label: v.label,
                                            sublabel: v.sublabel,
                                        }))}
                                    />
                                    <FormTextField
                                        id={`line-qty-${index}`}
                                        name={`line-qty-${index}`}
                                        label="Cant."
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        inputMode="decimal"
                                        value={line.quantity}
                                        onChange={(v) =>
                                            setLine(index, { quantity: v })
                                        }
                                        onBlur={() =>
                                            setLine(index, {
                                                quantity:
                                                    normalizePurchaseDecimalOnBlur(
                                                        line.quantity,
                                                    ),
                                            })
                                        }
                                    />
                                    <FormTextField
                                        id={`line-cost-${index}`}
                                        name={`line-cost-${index}`}
                                        label="Costo unit."
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        inputMode="decimal"
                                        value={line.unit_cost}
                                        onChange={(v) =>
                                            setLine(index, { unit_cost: v })
                                        }
                                        onBlur={() =>
                                            setLine(index, {
                                                unit_cost:
                                                    normalizePurchaseDecimalOnBlur(
                                                        line.unit_cost,
                                                    ),
                                            })
                                        }
                                    />
                                    <div className="flex items-end pb-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                                'size-9',
                                                purchaseBtnGhostDanger,
                                            )}
                                            onClick={() => removeLine(index)}
                                            disabled={
                                                (form.lines?.length ?? 0) <= 1
                                            }
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {errors.lines ? (
                            <p className="text-sm text-red-600">{errors.lines}</p>
                        ) : null}
                    </FormSection>
                ) : null}

                <FormTextField
                    id="notes"
                    label="Notas"
                    value={form.notes}
                    onChange={(v) => setField('notes', v)}
                    disabled={processing}
                />

                <div className="flex flex-wrap gap-3">
                    <Button
                        type="button"
                        asChild
                        variant="outline"
                        className={purchaseBtnCancel}
                    >
                        <Link href={indexUrl}>Volver</Link>
                    </Button>
                    {isEdit ? (
                        <Button
                            type="button"
                            asChild
                            variant="outline"
                            className="cursor-pointer rounded-xl border-amber-200 text-amber-800 hover:bg-amber-50 hover:text-amber-900"
                        >
                            <Link href={payablesUrl}>Cuentas por pagar</Link>
                        </Button>
                    ) : null}
                    {canRecordPayment && paymentRow ? (
                        <Button
                            type="button"
                            variant="outline"
                            className="cursor-pointer rounded-xl border-amber-300 bg-amber-600 text-white hover:bg-amber-700 hover:text-white"
                            onClick={() => setPaymentModalOpen(true)}
                        >
                            Registrar pago
                        </Button>
                    ) : null}
                    {canUpdate && !readOnly ? (
                        <Button
                            type="button"
                            variant="outline"
                            disabled={processing}
                            className={purchaseBtnPrimary}
                            onClick={submit}
                        >
                            {processing && <Spinner />}
                            {isEdit ? 'Guardar compra' : 'Registrar compra'}
                        </Button>
                    ) : null}
                </div>
            </div>

            <PurchaseVariantQuickModal
                open={quickModalOpen}
                onOpenChange={setQuickModalOpen}
                productOptions={productOptions}
                onCreated={handleQuickVariant}
            />

            {paymentRow ? (
                <DisbursementPaymentModal
                    open={paymentModalOpen}
                    onOpenChange={setPaymentModalOpen}
                    document={paymentRow}
                    paymentMethods={paymentMethods}
                    openCashSession={openCashSession}
                    redirect="purchase_edit"
                />
            ) : null}

            {paymentToEdit ? (
                <DisbursementPaymentEditModal
                    open={editPaymentOpen}
                    onOpenChange={(open) => {
                        setEditPaymentOpen(open);

                        if (!open) {
                            setPaymentToEdit(null);
                        }
                    }}
                    payment={paymentToEdit}
                    redirect="purchase_edit"
                    onSuccess={() => {
                        router.reload({ preserveScroll: true });
                    }}
                />
            ) : null}
        </>
    );
}
