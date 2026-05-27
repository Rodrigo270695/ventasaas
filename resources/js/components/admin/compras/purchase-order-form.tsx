import { Link, router } from '@inertiajs/react';
import { Mail, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import {
    PurchaseFlowTimeline,
    type PurchaseFlowData,
} from '@/components/admin/compras/purchase-flow-timeline';
import {
    PurchaseOrderSendEmailModal,
    type PurchaseOrderSupplierEmailMeta,
} from '@/components/admin/compras/purchase-order-send-email-modal';
import { PurchaseVariantQuickModal } from '@/components/admin/compras/purchase-variant-quick-modal';
import {
    FormComboboxField,
    FormSection,
    FormTextField,
} from '@/components/form';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
    formatPurchaseDecimal,
    formatPurchaseDecimalDisplay,
    normalizePurchaseDecimalOnBlur,
} from '@/lib/purchase-decimals';
import {
    purchaseBtnDangerOutline,
    purchaseBtnGhostDanger,
    purchaseBtnOutline,
    purchaseBtnPrimary,
} from '@/lib/purchase-form-styles';
import {
    datetimeLocalToServer,
    nowDatetimeLocalValue,
    toDatetimeLocalValue,
} from '@/lib/peru-datetime';
import { cn } from '@/lib/utils';

type LineForm = {
    product_variant_id: string;
    quantity: string;
    unit_cost: string;
    description?: string;
};

type OrderForm = {
    supplier_party_id: string;
    order_date: string;
    expected_date: string;
    currency_code: string;
    exchange_rate: string;
    notes: string;
    lines: LineForm[];
};

type Props = {
    order?: {
        id: string;
        internal_number: string;
        status: string;
        status_label: string;
        supplier_party_id: string;
        order_date: string;
        expected_date: string;
        currency_code: string;
        exchange_rate: string;
        notes: string;
        lines: Array<
            LineForm & {
                id?: string;
                quantity_ordered?: string;
                quantity_received?: string;
                product_name?: string;
                variant_sku?: string;
            }
        >;
    } | null;
    supplierOptions: Array<{ value: string; label: string; sublabel?: string }>;
    variantOptions: Array<{ value: string; label: string; sublabel?: string }>;
    productOptions: Array<{ value: string; label: string }>;
    canManage?: boolean;
    canReceive?: boolean;
    receiveUrl?: string | null;
    purchaseFlow?: PurchaseFlowData | null;
    supplierEmail?: PurchaseOrderSupplierEmailMeta | null;
    sendEmailUrl?: string | null;
    indexUrl: string;
};

function emptyLine(): LineForm {
    return { product_variant_id: '', quantity: '1.00', unit_cost: '0.00' };
}

function mapOrderLine(
    line: LineForm & {
        quantity_ordered?: string;
        quantity_received?: string;
    },
): LineForm {
    return {
        product_variant_id: line.product_variant_id,
        quantity: formatPurchaseDecimal(line.quantity),
        unit_cost: formatPurchaseDecimal(line.unit_cost),
        description: line.description,
    };
}

export function PurchaseOrderForm({
    order,
    supplierOptions,
    variantOptions,
    productOptions,
    canManage = true,
    canReceive = false,
    receiveUrl,
    purchaseFlow = null,
    supplierEmail = null,
    sendEmailUrl = null,
    indexUrl,
}: Props) {
    const isEdit = Boolean(order?.id);
    const readOnly = isEdit && order?.status !== 'draft';

    const [form, setForm] = useState<OrderForm>(() => ({
        supplier_party_id: order?.supplier_party_id ?? '',
        order_date: order?.order_date
            ? toDatetimeLocalValue(order.order_date)
            : nowDatetimeLocalValue(),
        expected_date: order?.expected_date ?? '',
        currency_code: order?.currency_code ?? 'PEN',
        exchange_rate: order?.exchange_rate ?? '1',
        notes: order?.notes ?? '',
        lines: order?.lines?.length
            ? order.lines.map((line) => mapOrderLine(line))
            : [emptyLine()],
    }));
    const [processing, setProcessing] = useState(false);
    const [quickOpen, setQuickOpen] = useState(false);
    const [emailModalOpen, setEmailModalOpen] = useState(false);

    const setField = useCallback(
        <K extends keyof OrderForm>(key: K, value: OrderForm[K]) => {
            setForm((prev) => ({ ...prev, [key]: value }));
        },
        [],
    );

    const setLine = useCallback((index: number, patch: Partial<LineForm>) => {
        setForm((prev) => {
            const lines = [...(prev.lines ?? [])];
            lines[index] = { ...lines[index], ...patch };

            return { ...prev, lines };
        });
    }, []);

    const addLine = () => setField('lines', [...(form.lines ?? []), emptyLine()]);

    const removeLine = (index: number) => {
        const lines = [...(form.lines ?? [])];
        lines.splice(index, 1);
        setField('lines', lines.length ? lines : [emptyLine()]);
    };

    const onVariantPick = (index: number, variantId: string) => {
        const variant = variantOptions.find((v) => v.value === variantId);
        setLine(index, {
            product_variant_id: variantId,
            unit_cost: formatPurchaseDecimal('0'),
        });
    };

    const payload = useMemo(
        () => ({
            ...form,
            order_date: datetimeLocalToServer(form.order_date),
            lines: form.lines
                .filter((l) => l.product_variant_id)
                .map((line) => ({
                    ...line,
                    quantity: formatPurchaseDecimal(line.quantity),
                    unit_cost: formatPurchaseDecimal(line.unit_cost),
                })),
        }),
        [form],
    );

    const submit = (approve: boolean) => {
        setProcessing(true);
        const url = isEdit ? `${indexUrl}/${order!.id}` : indexUrl;
        const data = { ...payload, approve };

        if (isEdit) {
            router.put(url, data, {
                onFinish: () => setProcessing(false),
            });
        } else {
            router.post(url, data, {
                onFinish: () => setProcessing(false),
            });
        }
    };

    const approveOrder = () => {
        if (!order?.id) return;
        setProcessing(true);
        router.post(
            `${indexUrl}/${order.id}/aprobar`,
            {},
            { onFinish: () => setProcessing(false) },
        );
    };

    const cancelOrder = () => {
        if (!order?.id || !confirm('¿Anular esta orden de compra?')) return;
        setProcessing(true);
        router.post(
            `${indexUrl}/${order.id}/anular`,
            {},
            { onFinish: () => setProcessing(false) },
        );
    };

    return (
        <>
            {isEdit ? (
                <>
                    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-violet-100 bg-violet-50/50 px-4 py-3 text-sm">
                        <span className="font-semibold text-[#4c1d95]">
                            {order?.status_label}
                        </span>
                        {canReceive && receiveUrl ? (
                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className={purchaseBtnOutline}
                            >
                                <Link href={receiveUrl}>
                                    Registrar recepción
                                </Link>
                            </Button>
                        ) : null}
                        {canManage &&
                        supplierEmail?.can_send &&
                        sendEmailUrl &&
                        order?.id ? (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className={purchaseBtnOutline}
                                onClick={() => setEmailModalOpen(true)}
                            >
                                <Mail className="size-4" />
                                Enviar al proveedor
                            </Button>
                        ) : null}
                    </div>
                    {purchaseFlow ? (
                        <PurchaseFlowTimeline
                            flow={purchaseFlow}
                            canManage={canManage}
                        />
                    ) : null}
                </>
            ) : null}

            <FormSection title="Proveedor y fechas">
                <FormComboboxField
                    id="supplier_party_id"
                    label="Proveedor"
                    required
                    value={form.supplier_party_id}
                    onValueChange={(v) => setField('supplier_party_id', v)}
                    options={supplierOptions}
                    disabled={readOnly || processing}
                />
                <FormTextField
                    id="order_date"
                    name="order_date"
                    label="Fecha y hora orden"
                    type="datetime-local"
                    required
                    value={form.order_date}
                    onChange={(v) => setField('order_date', v)}
                    disabled={readOnly || processing}
                />
                <FormTextField
                    id="expected_date"
                    label="Entrega esperada"
                    type="date"
                    value={form.expected_date}
                    onChange={(v) => setField('expected_date', v)}
                    disabled={readOnly || processing}
                />
                <FormTextField
                    id="notes"
                    label="Notas"
                    value={form.notes}
                    onChange={(v) => setField('notes', v)}
                    disabled={readOnly || processing}
                />
            </FormSection>

            {!readOnly ? (
                <FormSection
                    title="Productos solicitados"
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
                            <Plus className="size-4" /> Línea
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={purchaseBtnOutline}
                            onClick={() => setQuickOpen(true)}
                        >
                            Nuevo SKU
                        </Button>
                    </div>
                    {(form.lines ?? []).map((line, index) => (
                        <div
                            key={index}
                            className="grid gap-2 rounded-xl border border-violet-100 p-3 md:grid-cols-[1fr_5rem_6rem_auto]"
                        >
                            <FormComboboxField
                                id={`oc-variant-${index}`}
                                label="Producto"
                                value={line.product_variant_id}
                                onValueChange={(v) => onVariantPick(index, v)}
                                options={variantOptions}
                            />
                            <FormTextField
                                id={`oc-qty-${index}`}
                                name={`oc-qty-${index}`}
                                label="Cant."
                                type="number"
                                min="0"
                                step="0.01"
                                inputMode="decimal"
                                value={line.quantity}
                                onChange={(v) => setLine(index, { quantity: v })}
                                onBlur={() =>
                                    setLine(index, {
                                        quantity: normalizePurchaseDecimalOnBlur(
                                            line.quantity,
                                        ),
                                    })
                                }
                            />
                            <FormTextField
                                id={`oc-cost-${index}`}
                                name={`oc-cost-${index}`}
                                label="Costo"
                                type="number"
                                min="0"
                                step="0.01"
                                inputMode="decimal"
                                value={line.unit_cost}
                                onChange={(v) => setLine(index, { unit_cost: v })}
                                onBlur={() =>
                                    setLine(index, {
                                        unit_cost: normalizePurchaseDecimalOnBlur(
                                            line.unit_cost,
                                        ),
                                    })
                                }
                            />
                            <div className="flex items-end">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className={purchaseBtnGhostDanger}
                                    onClick={() => removeLine(index)}
                                >
                                    <Trash2 className="size-4 text-red-600" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </FormSection>
            ) : (
                <FormSection title="Líneas de la orden">
                    <ul className="space-y-2 text-sm">
                        {order?.lines.map((line, index) => (
                            <li
                                key={line.id ?? `oc-line-${index}`}
                                className="flex justify-between rounded-lg border border-violet-100 px-3 py-2"
                            >
                                <span>
                                    {line.product_name ?? line.variant_sku} ·{' '}
                                    pedido{' '}
                                    {formatPurchaseDecimalDisplay(
                                        line.quantity_ordered,
                                    )}{' '}
                                    · recibido{' '}
                                    {formatPurchaseDecimalDisplay(
                                        line.quantity_received,
                                    )}
                                </span>
                                <span className="font-semibold tabular-nums">
                                    {formatPurchaseDecimalDisplay(
                                        line.unit_cost,
                                    )}
                                </span>
                            </li>
                        ))}
                    </ul>
                </FormSection>
            )}

            {canManage ? (
                <div className="flex flex-wrap gap-2 border-t border-violet-100 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        className={purchaseBtnOutline}
                        asChild
                    >
                        <Link href={indexUrl}>Volver</Link>
                    </Button>
                    {!readOnly ? (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                className={purchaseBtnOutline}
                                disabled={processing}
                                onClick={() => submit(false)}
                            >
                                {processing && <Spinner />}
                                Guardar borrador
                            </Button>
                            <Button
                                type="button"
                                className={cn(purchaseBtnPrimary)}
                                disabled={processing}
                                onClick={() => submit(true)}
                            >
                                Guardar y aprobar
                            </Button>
                        </>
                    ) : order?.status === 'draft' ? (
                        <Button
                            type="button"
                            className={purchaseBtnPrimary}
                            disabled={processing}
                            onClick={approveOrder}
                        >
                            Aprobar orden
                        </Button>
                    ) : null}
                    {isEdit &&
                    order?.status !== 'cancelled' &&
                    order?.status !== 'received' ? (
                        <Button
                            type="button"
                            variant="outline"
                            className={purchaseBtnDangerOutline}
                            disabled={processing}
                            onClick={cancelOrder}
                        >
                            Anular
                        </Button>
                    ) : null}
                </div>
            ) : null}

            {supplierEmail && sendEmailUrl && order?.id ? (
                <PurchaseOrderSendEmailModal
                    open={emailModalOpen}
                    onOpenChange={setEmailModalOpen}
                    orderId={order.id}
                    orderNumber={order.internal_number}
                    sendUrl={sendEmailUrl}
                    meta={supplierEmail}
                />
            ) : null}

            <PurchaseVariantQuickModal
                open={quickOpen}
                onOpenChange={setQuickOpen}
                productOptions={productOptions}
                onCreated={(variant) => {
                    setField('lines', [
                        ...(form.lines ?? []),
                        {
                            product_variant_id: variant.value,
                            quantity: '1.00',
                            unit_cost: formatPurchaseDecimal(
                                variant.unit_price ?? '0',
                            ),
                        },
                    ]);
                }}
            />
        </>
    );
}
