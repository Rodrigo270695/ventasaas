import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import {
    FormSection,
    FormSelectField,
    FormTextField,
} from '@/components/form';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
    PageHeader,
    PageHeaderTitle,
    PageHeaderTop,
} from '@/components/page-header';
import { comprasRecepcionForm } from '@/lib/admin-breadcrumbs';
import {
    formatPurchaseDecimal,
    formatPurchaseDecimalDisplay,
    normalizePurchaseDecimalOnBlur,
} from '@/lib/purchase-decimals';
import {
    purchaseBtnOutline,
    purchaseBtnPrimary,
} from '@/lib/purchase-form-styles';
import {
    datetimeLocalToServer,
    toDatetimeLocalValue,
} from '@/lib/peru-datetime';

const INDEX_URL = '/admin/compras/recepciones';
const ORDERS_URL = '/admin/compras/ordenes';

type OpenLine = {
    purchase_order_line_id: string;
    product_name?: string;
    variant_sku?: string;
    quantity_pending: string;
    quantity: string;
    unit_cost: string;
};

type Props = {
    purchaseOrderId: string;
    purchaseOrderNumber?: string;
    supplierName?: string;
    openOrders: Array<{ value: string; label: string }>;
    openLines: OpenLine[];
    warehouseOptions: Array<{ value: string; label: string }>;
    defaultWarehouseId?: string | null;
    receivedDate: string;
};

function mapOpenLine(line: OpenLine): OpenLine {
    return {
        ...line,
        quantity_pending: formatPurchaseDecimalDisplay(line.quantity_pending),
        unit_cost: formatPurchaseDecimalDisplay(line.unit_cost),
        quantity: formatPurchaseDecimal(line.quantity),
    };
}

export default function GoodsReceiptFormPage({
    purchaseOrderId: initialOrderId,
    purchaseOrderNumber,
    supplierName,
    openOrders,
    openLines: initialLines,
    warehouseOptions,
    defaultWarehouseId,
    receivedDate,
}: Props) {
    const [orderId, setOrderId] = useState(initialOrderId);
    const [lines, setLines] = useState<OpenLine[]>(() =>
        initialLines.map(mapOpenLine),
    );
    const [warehouseId, setWarehouseId] = useState(
        defaultWarehouseId ?? warehouseOptions[0]?.value ?? '',
    );
    const [date, setDate] = useState(() => toDatetimeLocalValue(receivedDate));
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (initialOrderId && initialLines.length) {
            setOrderId(initialOrderId);
            setLines(initialLines.map(mapOpenLine));
        }
    }, [initialOrderId, initialLines]);

    const loadOrder = (id: string) => {
        if (!id) {
            setLines([]);

            return;
        }

        router.get(
            `${INDEX_URL}/nuevo`,
            { orden: id },
            { preserveState: true, preserveScroll: true, only: ['openLines', 'purchaseOrderId', 'purchaseOrderNumber', 'supplierName'] },
        );
    };

    const setLineQty = (index: number, quantity: string) => {
        setLines((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], quantity };

            return next;
        });
    };

    const submit = () => {
        setProcessing(true);
        router.post(
            INDEX_URL,
            {
                purchase_order_id: orderId,
                warehouse_id: warehouseId,
                received_date: date,
                notes,
                lines: lines
                    .filter((l) => parseFloat(l.quantity) > 0)
                    .map((l) => ({
                        purchase_order_line_id: l.purchase_order_line_id,
                        quantity: formatPurchaseDecimal(l.quantity),
                    })),
            },
            { onFinish: () => setProcessing(false) },
        );
    };

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
            <Head title="Nueva recepción" />
            <PageHeader className="mb-0 border-b pb-3">
                <PageHeaderTop>
                    <PageHeaderTitle
                        title="Registrar recepción"
                        description="Confirma qué llegó al almacén. El stock se actualiza aquí; la factura del proveedor se registra después."
                    />
                </PageHeaderTop>
            </PageHeader>

            <FormSection title="Orden y almacén">
                <FormSelectField
                    id="purchase_order_id"
                    label="Orden de compra"
                    required
                    value={orderId}
                    onValueChange={(v) => {
                        setOrderId(v);
                        loadOrder(v);
                    }}
                    options={openOrders}
                />
                {purchaseOrderNumber ? (
                    <p className="text-sm text-[#6b5b7a] col-span-full">
                        {purchaseOrderNumber}
                        {supplierName ? ` · ${supplierName}` : ''}
                    </p>
                ) : null}
                <FormSelectField
                    id="warehouse_id"
                    label="Almacén de ingreso"
                    required
                    value={warehouseId}
                    onValueChange={setWarehouseId}
                    options={warehouseOptions}
                />
                <FormTextField
                    id="received_date"
                    name="received_date"
                    label="Fecha y hora de recepción"
                    type="datetime-local"
                    required
                    value={date}
                    onChange={setDate}
                />
                <FormTextField
                    id="notes"
                    label="Notas"
                    value={notes}
                    onChange={setNotes}
                />
            </FormSection>

            {lines.length > 0 ? (
                <FormSection
                    title="Cantidades recibidas"
                    gridClassName="col-span-full space-y-2"
                >
                    {lines.map((line, index) => (
                        <div
                            key={
                                line.purchase_order_line_id ??
                                `receipt-line-${index}`
                            }
                            className="grid gap-2 rounded-xl border border-violet-100 p-3 md:grid-cols-[1fr_6rem_5rem]"
                        >
                            <div className="text-sm">
                                <p className="font-semibold text-[#3b2d4a]">
                                    {line.product_name ?? line.variant_sku}
                                </p>
                                <p className="text-xs text-[#9d8fb0]">
                                    Pendiente: {line.quantity_pending} · Costo{' '}
                                    {line.unit_cost}
                                </p>
                            </div>
                            <FormTextField
                                id={`qty-${index}`}
                                name={`qty-${index}`}
                                label="Recibir"
                                type="number"
                                min="0"
                                step="0.01"
                                inputMode="decimal"
                                value={line.quantity}
                                onChange={(v) => setLineQty(index, v)}
                                onBlur={() =>
                                    setLineQty(
                                        index,
                                        normalizePurchaseDecimalOnBlur(
                                            line.quantity,
                                        ),
                                    )
                                }
                            />
                        </div>
                    ))}
                </FormSection>
            ) : orderId ? (
                <p className="text-sm text-amber-700">
                    Esta orden no tiene cantidades pendientes por recibir.
                </p>
            ) : null}

            <div className="flex gap-2 border-t border-violet-100 pt-4">
                <Button variant="outline" className={purchaseBtnOutline} asChild>
                    <a href={INDEX_URL}>Volver</a>
                </Button>
                <Button
                    className={purchaseBtnPrimary}
                    disabled={processing || !orderId || lines.length === 0}
                    onClick={submit}
                >
                    {processing && <Spinner />}
                    Confirmar recepción
                </Button>
            </div>
        </div>
    );
}

GoodsReceiptFormPage.layout = () => ({
    breadcrumbs: comprasRecepcionForm(),
});
