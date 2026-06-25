import { Form, router } from '@inertiajs/react';
import { AlertCircle, Info, Plus, Trash2, UserPlus, Warehouse } from 'lucide-react';
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    useSyncExternalStore,
    type ReactNode,
} from 'react';
import { chokoSectionTitleClass } from '@/components/form/field-styles';
import {
    FormComboboxField,
    FormSelectField,
    FormTextField,
} from '@/components/form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { PartyFormModal } from '@/components/admin/socios/party-form-modal';
import { CollectionPaymentModal } from '@/components/admin/ventas/collection-payment-modal';
import { SalesDocumentPaymentSummary } from '@/components/admin/ventas/sales-document-payment-status';
import { SalesDraftDeleteModal } from '@/components/admin/ventas/sales-draft-delete-modal';
import { SalesQuantityField } from '@/components/admin/ventas/sales-quantity-field';
import { useCan } from '@/hooks/use-can';
import { PARTIES_PERMISSIONS } from '@/lib/admin-permissions';
import { buildSalesDocumentPayload } from '@/lib/sales-document-payload';
import { toPaymentPreviewFromForm } from '@/lib/sales-document-payment-row';
import { formatDecimalInput } from '@/lib/format-decimal';
import { notify } from '@/lib/notify';
import {
    calcSalesLineTotals,
    sumSalesDocumentTotals,
} from '@/lib/sales-line-totals';
import { formatSalesMoney } from '@/lib/sales-money';
import {
    buildSalesVariantLookups,
    resolveVariantIdFromScan,
} from '@/lib/sales-variant-lookup';
import { cn } from '@/lib/utils';
import type { PartiesOldForm } from '@/types/admin/parties';
import type {
    SalesDocumentFormData,
    SalesDocumentLineForm,
    SalesDocumentListRow,
    SalesSaleMode,
    SalesStockByWarehouse,
    SalesVariantOption,
} from '@/types/admin/sales-documents';
import type {
    OpenCashSessionSummary,
    TreasuryPaymentMethodOption,
} from '@/types/admin/treasury';

const FORM_CARD_CLASS =
    'overflow-hidden rounded-2xl border border-violet-200/80 bg-white shadow-sm ring-1 ring-violet-100/40';

const fieldScopeClass = cn(
    '[&_label]:mb-1 [&_label]:!text-[11px] [&_label]:!font-semibold [&_label]:!text-[#5b21b6]',
    '[&_input]:border-violet-200 [&_input]:text-[#3b2d4a] [&_input]:shadow-xs',
    '[&_input]:placeholder:text-[#9d8fb0] [&_input]:focus-visible:border-[#ec4899] [&_input]:focus-visible:ring-[#ec4899]/20',
    '[&_button]:border-violet-200 [&_button]:text-[#3b2d4a] [&_button]:shadow-xs',
    '[&_button]:focus-visible:border-[#ec4899] [&_button]:focus-visible:ring-[#ec4899]/25',
);

const HEADER_GRID_CLASS = cn(
    'grid gap-x-3 gap-y-4 md:grid-cols-3',
    fieldScopeClass,
    '[&_input]:h-9 [&_input]:rounded-xl [&_input]:text-sm',
    '[&_button]:h-9 [&_button]:rounded-xl [&_button]:text-sm',
);

const DETAIL_PANEL_CLASS = cn(
    'overflow-hidden rounded-xl border border-violet-200/90 bg-white shadow-xs ring-1 ring-violet-50',
    fieldScopeClass,
    '[&_input]:h-8 [&_input]:rounded-lg [&_input]:px-2 [&_input]:text-[13px]',
    '[&_button]:h-8 [&_button]:rounded-lg [&_button]:text-[13px]',
);

const TABLE_TH_CLASS =
    'text-[10px] font-bold tracking-wide text-[#7c3aed] uppercase';

const LINE_TABLE_CELL = 'px-2 py-2 align-middle';

const LINE_TABLE_TH = cn(
    TABLE_TH_CLASS,
    'px-2 py-2 whitespace-nowrap',
);

const META_CHIP_CLASS =
    'h-6 gap-1 rounded-lg border-violet-200/90 bg-violet-50/50 px-2 text-[10px] font-semibold text-[#5b21b6]';

const btnOutlineClass =
    'h-10 cursor-pointer rounded-xl border-violet-200 px-4 text-sm font-semibold text-[#5b21b6] hover:bg-violet-50';

const btnPrimaryClass = cn(
    'h-10 cursor-pointer rounded-xl px-5 text-sm font-bold text-white shadow-md shadow-violet-300/30',
    'bg-linear-to-r from-[#ec4899] to-[#7c3aed] hover:opacity-95',
    'active:scale-[0.99] transition-all',
    'disabled:cursor-not-allowed disabled:opacity-50',
);

const btnConfirmClass = cn(
    'h-10 cursor-pointer rounded-xl px-5 text-sm font-bold text-white shadow-md shadow-emerald-300/30',
    'bg-emerald-600 hover:bg-emerald-700',
    'disabled:cursor-not-allowed disabled:opacity-50',
);

const btnDangerOutlineClass =
    'h-10 cursor-pointer rounded-xl border-red-200 px-4 text-sm font-semibold text-red-700 hover:bg-red-50';

/** Oculta etiquetas en escritorio cuando hay cabecera de tabla. */
const lineFieldClass = '[&_label]:md:sr-only [&_label]:md:mb-0';

const DECIMAL_INPUT_PROPS = {
    step: '0.01',
    inputMode: 'decimal' as const,
};

function toInputDecimal(
    value: string | number | null | undefined,
    fallback = '0.00',
): string {
    if (value === null || value === undefined || String(value).trim() === '') {
        return fallback;
    }

    return formatDecimalInput(value, 2);
}

function normalizeLine(line: SalesDocumentLineForm): SalesDocumentLineForm {
    return {
        ...line,
        product_variant_id: line.product_variant_id ?? '',
        description: line.description ?? '',
        quantity: toInputDecimal(line.quantity, '1.00'),
        unit_price: toInputDecimal(line.unit_price, '0.00'),
        discount: toInputDecimal(line.discount, '0.00'),
    };
}

function normalizeForm(data: SalesDocumentFormData): SalesDocumentFormData {
    return {
        ...data,
        customer_party_id: data.customer_party_id ?? '',
        due_date: data.due_date ?? '',
        notes: data.notes ?? '',
        global_discount: toInputDecimal(data.global_discount, '0.00'),
        lines:
            data.lines?.length > 0
                ? data.lines.map(normalizeLine)
                : [emptyLine()],
    };
}

type LookupOption = {
    value: string;
    label: string;
    sublabel?: string;
    searchText?: string;
};

type Props = {
    saleMode?: SalesSaleMode;
    document: SalesDocumentFormData | null;
    seriesOptions: LookupOption[];
    customerOptions: LookupOption[];
    warehouseOptions: LookupOption[];
    defaultWarehouseId?: string | null;
    variantOptions: SalesVariantOption[];
    stockByWarehouse?: SalesStockByWarehouse;
    oldForm: SalesDocumentFormData;
    errors?: Record<string, string>;
    canUpdate: boolean;
    canConfirm: boolean;
    canDelete: boolean;
    storeUrl: string;
    updateUrl?: string;
    confirmUrl?: string;
    destroyUrl?: string;
    indexUrl: string;
    selectedCustomerPartyId?: string | null;
    openPartyQuickCreate?: boolean;
    partyQuickOldForm?: PartiesOldForm | null;
    paymentMethods?: TreasuryPaymentMethodOption[];
    openCashSession?: OpenCashSessionSummary | null;
    collectOnConfirm?: boolean;
    isOffline?: boolean;
    onOfflineSave?: (form: SalesDocumentFormData) => SalesDocumentFormData;
    onOfflineConfirm?: (form: SalesDocumentFormData) => void;
};

function emptyLine(): SalesDocumentLineForm {
    return {
        product_variant_id: '',
        quantity: '1.00',
        unit_price: '0.00',
        discount: '0.00',
        description: '',
    };
}

function resolveInitial(
    document: SalesDocumentFormData | null,
    oldForm: SalesDocumentFormData,
    defaultWarehouseId?: string | null,
): SalesDocumentFormData {
    if (oldForm.customer_party_id || oldForm.lines?.length) {
        return normalizeForm({
            ...oldForm,
            warehouse_id:
                oldForm.warehouse_id || defaultWarehouseId || null,
            lines: oldForm.lines?.length ? oldForm.lines : [emptyLine()],
        });
    }

    if (document) {
        return normalizeForm({
            ...document,
            warehouse_id:
                document.warehouse_id ||
                defaultWarehouseId ||
                null,
            lines: document.lines.length ? document.lines : [emptyLine()],
        });
    }

    const warehouseId =
        defaultWarehouseId ||
        oldForm.warehouse_id ||
        '';

    return normalizeForm({
        document_series_id: oldForm.document_series_id || '',
        customer_party_id: '',
        warehouse_id: warehouseId,
        issue_date: oldForm.issue_date || new Date().toISOString().slice(0, 10),
        due_date: '',
        currency_code: 'PEN',
        exchange_rate: '1',
        global_discount: '0.00',
        notes: '',
        lines: [emptyLine()],
    });
}

function calcLinePreview(line: SalesDocumentLineForm, igvRate: string) {
    return calcSalesLineTotals(
        line.quantity,
        line.unit_price,
        line.discount,
        igvRate,
    );
}

function useMediaQuery(query: string): boolean {
    return useSyncExternalStore(
        (onStoreChange) => {
            const media = window.matchMedia(query);
            media.addEventListener('change', onStoreChange);

            return () => media.removeEventListener('change', onStoreChange);
        },
        () => window.matchMedia(query).matches,
        () => false,
    );
}

function formatMoney(value: string): string {
    const num = parseFloat(value);
    if (Number.isNaN(num)) {
        return '0.00';
    }
    return num.toLocaleString('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function parseQty(value: string): number {
    const num = parseFloat(value);
    return Number.isNaN(num) ? 0 : num;
}

function availableStock(
    stockByWarehouse: SalesStockByWarehouse,
    warehouseId: string | null | undefined,
    variantId: string,
): number {
    if (!warehouseId || !variantId) {
        return 0;
    }

    return parseQty(stockByWarehouse[warehouseId]?.[variantId] ?? '0');
}

function variantAvailableInWarehouse(
    variant: SalesVariantOption,
    warehouseId: string | null | undefined,
    stockByWarehouse: SalesStockByWarehouse,
): boolean {
    if (!warehouseId) {
        return false;
    }

    if (!variant.track_stock) {
        return true;
    }

    return availableStock(stockByWarehouse, warehouseId, variant.value) > 0;
}

function filterVariantOptionsForWarehouse(
    variantOptions: SalesVariantOption[],
    warehouseId: string | null | undefined,
    stockByWarehouse: SalesStockByWarehouse,
    keepVariantIds: Set<string>,
): SalesVariantOption[] {
    if (!warehouseId) {
        return [];
    }

    return variantOptions.filter(
        (variant) =>
            keepVariantIds.has(variant.value) ||
            variantAvailableInWarehouse(
                variant,
                warehouseId,
                stockByWarehouse,
            ),
    );
}

function clearLineVariant(line: SalesDocumentLineForm): SalesDocumentLineForm {
    return {
        ...line,
        product_variant_id: '',
        description: '',
        unit_price: '0.00',
        discount: toInputDecimal(line.discount, '0.00'),
    };
}

function SectionHeading({
    title,
    description,
    trailing,
}: {
    title: string;
    description?: string;
    trailing?: ReactNode;
}) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-violet-100/90 pb-3">
            <div className="flex min-w-0 items-center gap-3">
                <span
                    className="h-7 w-0.5 shrink-0 rounded-full bg-[#7c3aed]"
                    aria-hidden
                />
                <div className="min-w-0">
                    <h3 className={chokoSectionTitleClass}>{title}</h3>
                    {description ? (
                        <p className="mt-0.5 text-[11px] leading-snug text-[#7c6f8a]">
                            {description}
                        </p>
                    ) : null}
                </div>
            </div>
            {trailing ? (
                <div className="flex flex-wrap items-center gap-1.5">
                    {trailing}
                </div>
            ) : null}
        </div>
    );
}

function InfoCallout({
    children,
    tone = 'info',
}: {
    children: ReactNode;
    tone?: 'info' | 'warning';
}) {
    const Icon = tone === 'warning' ? AlertCircle : Info;

    return (
        <div
            className={cn(
                'flex gap-2.5 rounded-lg border px-3 py-2.5 md:col-span-3',
                tone === 'warning'
                    ? 'border-amber-200/80 bg-amber-50/50'
                    : 'border-violet-200/60 bg-violet-50/40',
            )}
            role="note"
        >
            <Icon
                className={cn(
                    'mt-px size-3.5 shrink-0',
                    tone === 'warning' ? 'text-amber-600' : 'text-[#7c3aed]',
                )}
                strokeWidth={2}
            />
            <p
                className={cn(
                    'text-[11px] leading-relaxed',
                    tone === 'warning' ? 'text-amber-900/85' : 'text-[#5c4d6e]',
                )}
            >
                {children}
            </p>
        </div>
    );
}

function SummaryAmountRow({
    label,
    value,
    muted = false,
}: {
    label: string;
    value: string;
    muted?: boolean;
}) {
    return (
        <div className="flex items-baseline justify-between gap-3">
            <span
                className={cn(
                    'text-[11px] font-medium',
                    muted ? 'text-[#9d8fb0]' : 'text-[#7c6f8a]',
                )}
            >
                {label}
            </span>
            <span
                className={cn(
                    'font-mono text-sm font-semibold tabular-nums',
                    muted ? 'text-[#9d8fb0]' : 'text-[#3b2d4a]',
                )}
            >
                {value}
            </span>
        </div>
    );
}

type OrderSummaryAsideProps = {
    isInternal?: boolean;
    subtotal: string;
    taxAmount: string;
    total: string;
    globalDiscount: string;
    currencyCode: string;
    indexUrl: string;
    readOnly: boolean;
    processing: boolean;
    confirming: boolean;
    deleting: boolean;
    document: SalesDocumentFormData | null;
    isDraft: boolean;
    canDelete: boolean;
    canConfirm: boolean;
    confirmUrl?: string;
    collectOnConfirm?: boolean;
    isOffline?: boolean;
    onConfirmWithPayment: () => void;
    onConfirmOnCredit: () => void;
    onDelete: () => void;
    onSaveDraft?: () => void;
    offlineSaving?: boolean;
    lines: SalesDocumentLineForm[];
    variantMap: Map<string, SalesVariantOption>;
};

function OrderSummaryAside({
    isInternal = false,
    subtotal,
    taxAmount,
    total,
    globalDiscount,
    currencyCode,
    indexUrl,
    readOnly,
    processing,
    confirming,
    deleting,
    document,
    isDraft,
    canDelete,
    canConfirm,
    confirmUrl,
    collectOnConfirm = false,
    isOffline = false,
    onConfirmWithPayment,
    onConfirmOnCredit,
    onDelete,
    onSaveDraft,
    offlineSaving = false,
    lines,
    variantMap,
}: OrderSummaryAsideProps) {
    const discountAmount = parseFloat(globalDiscount || '0');
    const hasDiscount = !Number.isNaN(discountAmount) && discountAmount > 0;

    const cartItems = lines.filter((l) => l.product_variant_id.trim() !== '');
    const cartCount = cartItems.length;

    return (
        <aside className="flex w-full flex-col gap-3 lg:sticky lg:top-4 lg:w-62 lg:shrink-0">
            {/* Carrito dinámico */}
            <div className="overflow-hidden rounded-xl border border-violet-200/80 bg-white shadow-xs ring-1 ring-violet-100/50">
                <div className="flex items-center justify-between border-b border-violet-100/90 px-4 py-2.5">
                    <p className="text-[10px] font-bold tracking-wide text-[#7c3aed] uppercase">
                        Carrito
                    </p>
                    <span
                        className={cn(
                            'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold tabular-nums',
                            cartCount > 0
                                ? 'bg-violet-600 text-white'
                                : 'bg-slate-100 text-slate-400',
                        )}
                    >
                        {cartCount}
                    </span>
                </div>

                {cartCount === 0 ? (
                    <p className="px-4 py-4 text-center text-[11px] text-[#9d8fb0]">
                        Sin productos aún
                    </p>
                ) : (
                    <ul className="max-h-[260px] divide-y divide-violet-100/70 overflow-y-auto">
                        {cartItems.map((line, i) => {
                            const variant = variantMap.get(line.product_variant_id);
                            const preview = calcLinePreview(
                                line,
                                variant?.igv_rate ?? '0.18',
                            );
                            const qty = parseFloat(line.quantity) || 0;
                            const qtyLabel =
                                qty % 1 === 0
                                    ? qty.toFixed(0)
                                    : qty.toFixed(2);

                            return (
                                <li
                                    key={i}
                                    className="flex items-start gap-2 px-3 py-2.5"
                                >
                                    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded bg-violet-100 text-[9px] font-bold text-violet-700">
                                        {i + 1}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="line-clamp-2 text-[11px] font-semibold leading-snug text-[#3b2d4a]">
                                            {variant?.label ?? '—'}
                                        </p>
                                        <p className="mt-0.5 text-[10px] text-[#9d8fb0]">
                                            {qtyLabel} ×{' '}
                                            {formatSalesMoney(
                                                line.unit_price,
                                                currencyCode,
                                            )}
                                        </p>
                                    </div>
                                    <span className="shrink-0 font-mono text-[11px] font-semibold tabular-nums text-[#5b21b6]">
                                        {formatSalesMoney(
                                            preview.line_total,
                                            currencyCode,
                                        )}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* Resumen de totales */}
            <div className="rounded-xl border border-violet-200/80 bg-white p-4 shadow-xs ring-1 ring-violet-100/50">
                <p className="text-[10px] font-bold tracking-wide text-[#7c3aed] uppercase">
                    Resumen
                </p>
                <div className="mt-3 space-y-2 border-b border-violet-100/90 pb-3">
                    <SummaryAmountRow label="Subtotal" value={subtotal} />
                    <SummaryAmountRow label="IGV" value={taxAmount} muted />
                    {hasDiscount ? (
                        <SummaryAmountRow
                            label="Desc. global"
                            value={`-${formatSalesMoney(globalDiscount, currencyCode)}`}
                            muted
                        />
                    ) : null}
                </div>
                <div className="mt-3 rounded-xl bg-linear-to-br from-[#ec4899] to-[#7c3aed] px-4 py-3 shadow-md shadow-violet-300/25">
                    <p className="text-[10px] font-bold tracking-wide text-violet-100 uppercase">
                        Total
                    </p>
                    <p className="mt-1 font-mono text-2xl font-bold text-white tabular-nums">
                        {total}
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-2.5">
                {isDraft &&
                canConfirm &&
                (confirmUrl || isOffline) ? (
                    <div className="space-y-1.5">
                        {collectOnConfirm ? (
                            <>
                                <Button
                                    type="button"
                                    disabled={confirming || processing}
                                    className={cn(
                                        btnConfirmClass,
                                        'h-11 w-full text-base',
                                    )}
                                    onClick={onConfirmWithPayment}
                                >
                                    Cobrar y numerar
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    disabled={confirming || processing}
                                    className="h-9 w-full cursor-pointer text-sm font-semibold text-[#5b21b6] hover:bg-violet-50"
                                    onClick={onConfirmOnCredit}
                                >
                                    {confirming ? (
                                        <Spinner className="size-4" />
                                    ) : (
                                        'Confirmar a crédito'
                                    )}
                                </Button>
                            </>
                        ) : (
                            <Button
                                type="button"
                                disabled={confirming || processing}
                                className={cn(
                                    btnConfirmClass,
                                    'h-11 w-full text-base',
                                )}
                                onClick={onConfirmOnCredit}
                            >
                                {confirming ? (
                                    <Spinner className="size-4" />
                                ) : (
                                    'Confirmar y numerar'
                                )}
                            </Button>
                        )}
                    </div>
                ) : null}

                {!readOnly ? (
                    onSaveDraft ? (
                        <Button
                            type="button"
                            disabled={offlineSaving}
                            variant="outline"
                            className={cn(
                                btnOutlineClass,
                                'h-9 w-full border-violet-200/90 text-sm',
                            )}
                            onClick={onSaveDraft}
                        >
                            {offlineSaving ? (
                                <Spinner className="size-4" />
                            ) : document ? (
                                'Guardar borrador'
                            ) : (
                                'Crear borrador'
                            )}
                        </Button>
                    ) : (
                        <Button
                            type="submit"
                            disabled={processing}
                            variant="outline"
                            className={cn(
                                btnOutlineClass,
                                'h-9 w-full border-violet-200/90 text-sm',
                            )}
                        >
                            {processing ? (
                                <Spinner className="size-4" />
                            ) : document ? (
                                'Guardar borrador'
                            ) : (
                                'Crear borrador'
                            )}
                        </Button>
                    )
                ) : null}

                <div className="flex items-center justify-between gap-2 border-t border-violet-100/90 pt-2">
                    <Button
                        type="button"
                        variant="ghost"
                        asChild
                        className="h-8 cursor-pointer px-2 text-xs font-semibold text-[#6b5b7a] hover:text-[#5b21b6]"
                    >
                        <a href={indexUrl}>← Volver</a>
                    </Button>
                    {document && canDelete && isDraft ? (
                        <Button
                            type="button"
                            variant="ghost"
                            disabled={deleting}
                            className="h-8 cursor-pointer px-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={onDelete}
                        >
                            {deleting ? (
                                <Spinner className="size-3.5" />
                            ) : (
                                'Eliminar'
                            )}
                        </Button>
                    ) : null}
                </div>
            </div>
        </aside>
    );
}

function LineStockDisplay({
    warehouseId,
    variantId,
    lineQty,
    trackStock,
    stockByWarehouse,
}: {
    warehouseId: string | null | undefined;
    variantId: string;
    lineQty: string;
    trackStock: boolean;
    stockByWarehouse: SalesStockByWarehouse;
}) {
    if (!trackStock) {
        return (
            <span className="inline-flex rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-[#9d8fb0] ring-1 ring-violet-100">
                —
            </span>
        );
    }

    if (!warehouseId) {
        return (
            <span className="inline-flex rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 ring-1 ring-amber-200/70">
                —
            </span>
        );
    }

    if (!variantId) {
        return (
            <span className="inline-flex rounded-md px-1.5 py-0.5 text-[10px] text-[#c4b5d5]">
                —
            </span>
        );
    }

    const available = availableStock(
        stockByWarehouse,
        warehouseId,
        variantId,
    );
    const requested = parseQty(lineQty);
    const insufficient = requested > available;
    const isEmpty = available <= 0;

    return (
        <div className="flex flex-col items-end gap-0.5 md:items-end">
            <span
                className={cn(
                    'inline-flex min-w-10 justify-center rounded-md px-1.5 py-0.5 font-mono text-[12px] font-semibold tabular-nums ring-1',
                    insufficient
                        ? 'bg-red-50 text-red-700 ring-red-200/80'
                        : isEmpty
                          ? 'bg-amber-50 text-amber-800 ring-amber-200/70'
                          : 'bg-emerald-50 text-emerald-800 ring-emerald-200/70',
                )}
            >
                {formatMoney(String(available))}
            </span>
            {insufficient ? (
                <span className="text-[9px] font-medium text-red-500">
                    −{formatMoney(String(requested - available))}
                </span>
            ) : null}
        </div>
    );
}

export function SalesDocumentForm({
    saleMode = 'fiscal',
    document,
    seriesOptions,
    customerOptions,
    warehouseOptions,
    defaultWarehouseId = null,
    variantOptions,
    stockByWarehouse = {},
    oldForm,
    errors = {},
    canUpdate,
    canConfirm,
    canDelete,
    storeUrl,
    updateUrl,
    confirmUrl,
    destroyUrl,
    indexUrl,
    selectedCustomerPartyId = null,
    openPartyQuickCreate = false,
    partyQuickOldForm = null,
    paymentMethods = [],
    openCashSession = null,
    collectOnConfirm = false,
    isOffline = false,
    onOfflineSave,
    onOfflineConfirm,
}: Props) {
    const { can } = useCan();
    const canCreateCustomer = can(PARTIES_PERMISSIONS.CREATE);
    const isInternal = saleMode === 'internal' || Boolean(document?.is_internal);
    const isDraft = !document || document.status === 'draft';
    const readOnly = !isDraft || !canUpdate;
    const lockSeries = isInternal && seriesOptions.length <= 1;
    /** Validación de saldo vs cantidad solo al armar el borrador. */
    const showStockValidation = isDraft;
    const initial = useMemo(
        () => resolveInitial(document, oldForm, defaultWarehouseId),
        [document, oldForm, defaultWarehouseId],
    );

    const [form, setForm] = useState<SalesDocumentFormData>(initial);
    const [confirmPaymentModalOpen, setConfirmPaymentModalOpen] =
        useState(false);
    const [confirmPaymentPreview, setConfirmPaymentPreview] =
        useState<SalesDocumentListRow | null>(null);
    const isMdUp = useMediaQuery('(min-width: 768px)');
    const desktopLineDisabled = readOnly || !isMdUp;
    const mobileLineDisabled = readOnly || isMdUp;

    const saleWarehouseRequired = warehouseOptions.length > 0;
    const [confirming, setConfirming] = useState(false);
    const [offlineSaving, setOfflineSaving] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [partyModalOpen, setPartyModalOpen] = useState(openPartyQuickCreate);
    const [customerOptionsList, setCustomerOptionsList] =
        useState(customerOptions);

    const salesReturnUrl =
        typeof window !== 'undefined'
            ? `${window.location.pathname}${window.location.search}`
            : '';

    useEffect(() => {
        setCustomerOptionsList(customerOptions);
    }, [customerOptions]);

    useEffect(() => {
        if (openPartyQuickCreate) {
            setPartyModalOpen(true);
        }
    }, [openPartyQuickCreate]);

    useEffect(() => {
        if (!selectedCustomerPartyId) {
            return;
        }

        setForm((prev) => ({
            ...prev,
            customer_party_id: selectedCustomerPartyId,
        }));
    }, [selectedCustomerPartyId]);

    useEffect(() => {
        if (!document?.id) {
            return;
        }

        setForm((prev) => {
            if (prev.id === document.id) {
                return prev;
            }

            return normalizeForm({
                ...prev,
                id: document.id,
                status: document.status,
                status_label: document.status_label,
                full_number: document.full_number,
                subtotal: document.subtotal,
                tax_amount: document.tax_amount,
                total: document.total,
                total_label: document.total_label,
            });
        });
    }, [
        document?.id,
        document?.status,
        document?.status_label,
        document?.full_number,
        document?.subtotal,
        document?.tax_amount,
        document?.total,
        document?.total_label,
    ]);

    const openCustomerQuickCreate = useCallback(() => {
        setPartyModalOpen(true);
    }, []);

    const variantMap = useMemo(
        () => new Map(variantOptions.map((v) => [v.value, v])),
        [variantOptions],
    );

    const selectedVariantIds = useMemo(
        () =>
            new Set(
                form.lines
                    .map((line) => line.product_variant_id)
                    .filter(Boolean),
            ),
        [form.lines],
    );

    const variantOptionsForWarehouse = useMemo(
        () =>
            filterVariantOptionsForWarehouse(
                variantOptions,
                form.warehouse_id,
                stockByWarehouse,
                selectedVariantIds,
            ),
        [
            variantOptions,
            form.warehouse_id,
            stockByWarehouse,
            selectedVariantIds,
        ],
    );

    const variantLookups = useMemo(
        () => buildSalesVariantLookups(variantOptionsForWarehouse),
        [variantOptionsForWarehouse],
    );

    const selectedWarehouseLabel = useMemo(
        () =>
            warehouseOptions.find((w) => w.value === form.warehouse_id)?.label ??
            null,
        [warehouseOptions, form.warehouse_id],
    );

    const filledLineCount = useMemo(
        () =>
            form.lines.filter((line) => line.product_variant_id.trim() !== '')
                .length,
        [form.lines],
    );

    const totals = useMemo(() => {
        if (
            document &&
            document.status !== 'draft' &&
            document.subtotal != null &&
            document.tax_amount != null &&
            document.total != null
        ) {
            return {
                subtotal: parseFloat(document.subtotal).toFixed(2),
                tax_amount: parseFloat(document.tax_amount).toFixed(2),
                total: parseFloat(document.total).toFixed(2),
            };
        }

        return sumSalesDocumentTotals(
            form.lines,
            (variantId) =>
                variantMap.get(variantId)?.igv_rate ?? '0.18',
            form.global_discount,
        );
    }, [document, form.lines, form.global_discount, variantMap]);

    const needsWarehouse = form.lines.some((line) => {
        const variant = variantMap.get(line.product_variant_id);
        return variant?.track_stock;
    });

    useEffect(() => {
        if (!defaultWarehouseId || readOnly) {
            return;
        }

        setForm((prev) => {
            if (prev.warehouse_id) {
                return prev;
            }

            return { ...prev, warehouse_id: defaultWarehouseId };
        });
    }, [defaultWarehouseId, readOnly]);

    const handleWarehouseChange = useCallback(
        (value: string) => {
            const warehouseId = value || null;

            setForm((prev) => {
                const lines = prev.lines.map((line) => {
                    if (!line.product_variant_id) {
                        return line;
                    }

                    const variant = variantMap.get(line.product_variant_id);

                    if (
                        !warehouseId ||
                        !variant ||
                        !variantAvailableInWarehouse(
                            variant,
                            warehouseId,
                            stockByWarehouse,
                        )
                    ) {
                        return clearLineVariant(line);
                    }

                    return line;
                });

                return { ...prev, warehouse_id: warehouseId, lines };
            });
        },
        [variantMap, stockByWarehouse],
    );

    const setLine = useCallback(
        (index: number, patch: Partial<SalesDocumentLineForm>) => {
            setForm((prev) => {
                const lines = [...prev.lines];
                lines[index] = { ...lines[index], ...patch };
                return { ...prev, lines };
            });
        },
        [],
    );

    const addLine = () => {
        setForm((prev) => ({
            ...prev,
            lines: [...prev.lines, emptyLine()],
        }));
    };

    const removeLine = (index: number) => {
        setForm((prev) => ({
            ...prev,
            lines: prev.lines.filter((_, i) => i !== index),
        }));
    };

    const assignVariantToLine = useCallback(
        (targetIndex: number, variantId: string, quantity = '1.00') => {
            const variant = variantMap.get(variantId);

            if (!variant) {
                return;
            }

            setLine(targetIndex, {
                product_variant_id: variantId,
                unit_price: toInputDecimal(variant.unit_price, '0.00'),
                quantity: toInputDecimal(quantity, '1.00'),
                description: '',
            });
        },
        [variantMap, setLine],
    );

    const mergeVariantLine = useCallback(
        (targetIndex: number, variantId: string, quantityDelta: number) => {
            setForm((prev) => {
                let lines = [...prev.lines];
                const existingIndex = lines.findIndex(
                    (line, index) =>
                        index !== targetIndex &&
                        line.product_variant_id === variantId,
                );

                if (existingIndex < 0) {
                    return prev;
                }

                const existingQty =
                    parseFloat(lines[existingIndex].quantity) || 0;

                lines[existingIndex] = {
                    ...lines[existingIndex],
                    quantity: toInputDecimal(
                        existingQty + quantityDelta,
                        '1.00',
                    ),
                };

                if (targetIndex !== existingIndex) {
                    lines.splice(targetIndex, 1);
                }

                if (lines.length === 0) {
                    lines = [emptyLine()];
                }

                return { ...prev, lines };
            });
        },
        [],
    );

    const onVariantPick = (index: number, variantId: string) => {
        if (!variantId) {
            setLine(index, {
                product_variant_id: '',
                unit_price: '0.00',
            });

            return;
        }

        const existingIndex = form.lines.findIndex(
            (line, lineIndex) =>
                lineIndex !== index &&
                line.product_variant_id === variantId,
        );

        if (existingIndex >= 0) {
            const quantityDelta =
                parseFloat(form.lines[index]?.quantity) || 1;

            mergeVariantLine(index, variantId, quantityDelta);
            notify.info(
                'Producto ya estaba en el detalle; se sumó la cantidad.',
            );

            return;
        }

        assignVariantToLine(index, variantId, form.lines[index]?.quantity);
    };

    const resolveVariantOptionOnEnter = useCallback(
        (code: string) => {
            const variantId = resolveVariantIdFromScan(code, variantLookups);

            if (!variantId) {
                return null;
            }

            return (
                variantOptionsForWarehouse.find(
                    (option) => option.value === variantId,
                ) ?? null
            );
        },
        [variantLookups, variantOptionsForWarehouse],
    );

    const postConfirm = () => {
        const payload = buildSalesDocumentPayload(form);

        if (payload.lines.length === 0) {
            return;
        }

        if (isOffline && onOfflineConfirm) {
            setConfirming(true);

            try {
                onOfflineConfirm(form);
            } finally {
                setConfirming(false);
            }

            return;
        }

        if (!confirmUrl) {
            return;
        }

        setConfirming(true);
        router.post(confirmUrl, payload, {
            preserveScroll: true,
            onFinish: () => setConfirming(false),
        });
    };

    const handleOfflineSaveDraft = useCallback(() => {
        if (!onOfflineSave) {
            return;
        }

        const payload = buildSalesDocumentPayload(form);

        if (payload.lines.length === 0) {
            notify.error('Agrega al menos un producto al detalle.');

            return;
        }

        setOfflineSaving(true);

        try {
            onOfflineSave(form);
        } finally {
            setOfflineSaving(false);
        }
    }, [form, onOfflineSave]);

    const handleConfirmOnCredit = () => {
        postConfirm();
    };

    const handleConfirmWithPayment = () => {
        if (!confirmUrl || !document?.id) {
            return;
        }

        const payload = buildSalesDocumentPayload(form);

        if (payload.lines.length === 0) {
            return;
        }

        setConfirmPaymentPreview(
            toPaymentPreviewFromForm(document.id, form, totals.total),
        );
        setConfirmPaymentModalOpen(true);
    };

    useEffect(() => {
        if (
            !confirmPaymentModalOpen ||
            !document?.id ||
            !collectOnConfirm
        ) {
            return;
        }

        setConfirmPaymentPreview(
            toPaymentPreviewFromForm(document.id, form, totals.total),
        );
    }, [
        confirmPaymentModalOpen,
        collectOnConfirm,
        document?.id,
        form,
        totals.total,
    ]);

    const handleDeleteRequest = () => {
        if (destroyUrl) {
            setDeleteModalOpen(true);
        }
    };

    const actionUrl = document && updateUrl ? updateUrl : storeUrl;
    const method = document && updateUrl ? 'put' : 'post';

    const formFields = (processing: boolean) => (
        <>
            <div className={FORM_CARD_CLASS}>
                            <div className="space-y-4 p-4 md:p-5">
                                <SectionHeading
                                    title="Cabecera"
                                    description={
                                        isInternal
                                            ? 'Ticket interno · cliente opcional · almacén de salida'
                                            : 'Comprobante, cliente y almacén de salida'
                                    }
                                    trailing={
                                        canCreateCustomer && !readOnly && !isOffline ? (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-8 cursor-pointer gap-1.5 rounded-lg border-violet-200 px-2.5 text-xs font-semibold text-[#5b21b6] hover:bg-violet-50"
                                                onClick={openCustomerQuickCreate}
                                            >
                                                <UserPlus className="size-3.5" />
                                                Registrar cliente
                                            </Button>
                                        ) : undefined
                                    }
                                />
                                {isInternal ? (
                                    <p className="rounded-xl border border-amber-200/90 bg-amber-50/80 px-3 py-2 text-xs leading-snug text-amber-950">
                                        {isOffline
                                            ? 'Sin conexión: el ticket se guardará localmente y se numerará al reconectar.'
                                            : 'Documento interno: no se envía a SUNAT y no es válido como comprobante de pago.'}
                                    </p>
                                ) : null}
                                <div className={HEADER_GRID_CLASS}>
                                    <FormSelectField
                                        id="document_series_id"
                                        name="document_series_id"
                                        label="Serie / tipo"
                                        value={form.document_series_id}
                                        onValueChange={(value) =>
                                            setForm((p) => ({
                                                ...p,
                                                document_series_id: value,
                                            }))
                                        }
                                        options={seriesOptions}
                                        required
                                        disabled={readOnly || lockSeries}
                                        error={errors.document_series_id}
                                    />
                                    <FormComboboxField
                                        id="customer_party_id"
                                        name="customer_party_id"
                                        label={
                                            isInternal
                                                ? 'Cliente (opcional)'
                                                : 'Cliente'
                                        }
                                        value={form.customer_party_id ?? ''}
                                        onValueChange={(value) =>
                                            setForm((p) => ({
                                                ...p,
                                                customer_party_id: value,
                                            }))
                                        }
                                        options={customerOptionsList}
                                        placeholder={
                                            isInternal
                                                ? 'Sin cliente — venta al mostrador'
                                                : 'Buscar cliente…'
                                        }
                                        emptyMessage="Ningún cliente coincide."
                                        emptyAction={
                                            canCreateCustomer &&
                                            !readOnly &&
                                            !isOffline
                                                ? {
                                                      label: '+ Registrar cliente nuevo',
                                                      onClick:
                                                          openCustomerQuickCreate,
                                                  }
                                                : undefined
                                        }
                                        menuPlacement="portal"
                                        required={!isInternal}
                                        disabled={readOnly}
                                        error={errors.customer_party_id}
                                    />
                                    <FormSelectField
                                        id="warehouse_id"
                                        name="warehouse_id"
                                        label={
                                            needsWarehouse
                                                ? 'Almacén de salida (requerido)'
                                                : 'Almacén de salida'
                                        }
                                        required={
                                            saleWarehouseRequired &&
                                            (needsWarehouse ||
                                                saleWarehouseRequired)
                                        }
                                        value={form.warehouse_id ?? ''}
                                        onValueChange={handleWarehouseChange}
                                        options={warehouseOptions}
                                        placeholder={
                                            warehouseOptions.length === 0
                                                ? 'Sin almacenes activos'
                                                : 'Seleccionar almacén'
                                        }
                                        disabled={
                                            readOnly ||
                                            warehouseOptions.length === 0
                                        }
                                        error={errors.warehouse_id}
                                    />
                                    <FormTextField
                                        id="issue_date"
                                        name="issue_date"
                                        label="Fecha de emisión"
                                        type="date"
                                        value={form.issue_date}
                                        onChange={(value) =>
                                            setForm((p) => ({
                                                ...p,
                                                issue_date: value,
                                            }))
                                        }
                                        required
                                        disabled={readOnly}
                                        error={errors.issue_date}
                                    />
                                    <FormTextField
                                        id="due_date"
                                        name="due_date"
                                        label="Fecha de vencimiento"
                                        type="date"
                                        value={form.due_date ?? ''}
                                        onChange={(value) =>
                                            setForm((p) => ({
                                                ...p,
                                                due_date: value,
                                            }))
                                        }
                                        disabled={readOnly}
                                        error={errors.due_date}
                                    />
                                    <FormTextField
                                        id="global_discount"
                                        name="global_discount"
                                        label="Descuento global"
                                        value={form.global_discount}
                                        onChange={(value) =>
                                            setForm((p) => ({
                                                ...p,
                                                global_discount: value,
                                            }))
                                        }
                                        onBlur={() =>
                                            setForm((p) => ({
                                                ...p,
                                                global_discount: toInputDecimal(
                                                    p.global_discount,
                                                    '0.00',
                                                ),
                                            }))
                                        }
                                        disabled={readOnly}
                                        error={errors.global_discount}
                                        {...DECIMAL_INPUT_PROPS}
                                    />
                                    {warehouseOptions.length === 0 ? (
                                        <InfoCallout tone="warning">
                                            Crea al menos un almacén activo en
                                            Inventario → Almacenes.
                                        </InfoCallout>
                                    ) : showStockValidation ? (
                                        <InfoCallout>
                                            El stock se descuenta del almacén
                                            elegido. En el detalle solo verás
                                            SKU con saldo en ese almacén; los
                                            servicios no requieren stock.
                                        </InfoCallout>
                                    ) : null}
                                    <FormTextField
                                        id="notes"
                                        name="notes"
                                        label="Notas"
                                        value={form.notes ?? ''}
                                        onChange={(value) =>
                                            setForm((p) => ({
                                                ...p,
                                                notes: value,
                                            }))
                                        }
                                        disabled={readOnly}
                                        hint="Opcional — referencia interna del comprobante"
                                        fieldClassName="md:col-span-3"
                                    />
                                </div>
                                <input
                                    type="hidden"
                                    name="currency_code"
                                    value={form.currency_code}
                                />
                                <input
                                    type="hidden"
                                    name="exchange_rate"
                                    value={form.exchange_rate}
                                />
                            </div>

                            <div className="space-y-4 border-t border-violet-100/90 bg-violet-50/20 p-4 md:p-5">
                                <SectionHeading
                                    title="Detalle"
                                    description="IGV incluido · busca por nombre, SKU o escanea en el campo producto"
                                    trailing={
                                        <>
                                            {form.warehouse_id &&
                                            selectedWarehouseLabel ? (
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        META_CHIP_CLASS,
                                                        'max-w-[200px]',
                                                    )}
                                                >
                                                    <Warehouse className="size-3 shrink-0 text-violet-500" />
                                                    <span className="truncate">
                                                        {selectedWarehouseLabel}
                                                    </span>
                                                </Badge>
                                            ) : null}
                                            {form.warehouse_id ? (
                                                <Badge
                                                    variant="outline"
                                                    className={META_CHIP_CLASS}
                                                >
                                                    {variantOptionsForWarehouse.length}{' '}
                                                    SKU
                                                </Badge>
                                            ) : null}
                                            {filledLineCount > 0 ? (
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        META_CHIP_CLASS,
                                                        'border-emerald-200/80 bg-emerald-50/80 text-emerald-800',
                                                    )}
                                                >
                                                    {filledLineCount}{' '}
                                                    {filledLineCount === 1
                                                        ? 'línea'
                                                        : 'líneas'}
                                                </Badge>
                                            ) : null}
                                        </>
                                    }
                                />
                                <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_15.5rem] lg:items-start lg:gap-5">
                                <div className="flex min-w-0 flex-col gap-3">
                                {errors.lines ? (
                                    <p className="flex items-start gap-2 rounded-lg border border-red-200/80 bg-red-50/80 px-3 py-2.5 text-[13px] text-red-800">
                                        <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                                        {errors.lines}
                                    </p>
                                ) : null}

                                {showStockValidation &&
                                form.warehouse_id &&
                                variantOptionsForWarehouse.length === 0 &&
                                !readOnly ? (
                                    <InfoCallout tone="warning">
                                        No hay productos con stock en este
                                        almacén. Cambia el almacén de salida o
                                        registra entrada de inventario.
                                    </InfoCallout>
                                ) : null}

                                <div className={DETAIL_PANEL_CLASS}>
                                    <div className="hidden md:block md:overflow-x-auto">
                                        <table className="w-full min-w-[44rem] table-fixed border-collapse">
                                            <colgroup>
                                                <col className="w-[2rem]" />
                                                <col className="w-auto" />
                                                {showStockValidation ? (
                                                    <col className="w-[4.5rem]" />
                                                ) : null}
                                                <col className="w-[7.5rem]" />
                                                <col className="w-[5rem]" />
                                                <col className="w-[4.5rem]" />
                                                <col className="w-[5.5rem]" />
                                                <col className="w-[2.5rem]" />
                                            </colgroup>
                                            <thead className="border-b border-violet-200/60 bg-linear-to-r from-violet-50/90 to-white">
                                                <tr>
                                                    <th
                                                        scope="col"
                                                        className={cn(
                                                            LINE_TABLE_TH,
                                                            'text-center',
                                                        )}
                                                    >
                                                        #
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className={cn(
                                                            LINE_TABLE_TH,
                                                            'text-left',
                                                        )}
                                                    >
                                                        Producto
                                                    </th>
                                                    {showStockValidation ? (
                                                        <th
                                                            scope="col"
                                                            className={cn(
                                                                LINE_TABLE_TH,
                                                                'text-right',
                                                            )}
                                                        >
                                                            Stock
                                                        </th>
                                                    ) : null}
                                                    <th
                                                        scope="col"
                                                        className={cn(
                                                            LINE_TABLE_TH,
                                                            'text-right',
                                                        )}
                                                    >
                                                        Cant.
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className={cn(
                                                            LINE_TABLE_TH,
                                                            'text-right',
                                                        )}
                                                    >
                                                        Precio
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className={cn(
                                                            LINE_TABLE_TH,
                                                            'text-right',
                                                        )}
                                                    >
                                                        Desc.
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className={cn(
                                                            LINE_TABLE_TH,
                                                            'text-right',
                                                        )}
                                                    >
                                                        Total
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="sr-only"
                                                    >
                                                        Quitar
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {form.lines.map((line, index) => {
                                                    const variant = variantMap.get(
                                                        line.product_variant_id,
                                                    );
                                                    const preview = calcLinePreview(
                                                        line,
                                                        variant?.igv_rate ??
                                                            '0.18',
                                                    );

                                                    return (
                                                        <tr
                                                            key={index}
                                                            className="border-t border-violet-100/90 transition-colors hover:bg-violet-50/50"
                                                        >
                                                            <td
                                                                className={cn(
                                                                    LINE_TABLE_CELL,
                                                                    'text-center text-[10px] font-bold text-[#9d8fb0] tabular-nums',
                                                                )}
                                                            >
                                                                {index + 1}
                                                            </td>
                                                            <td
                                                                className={cn(
                                                                    LINE_TABLE_CELL,
                                                                    'min-w-0',
                                                                )}
                                                            >
                                                                <FormComboboxField
                                                                    id={`line_${index}_variant`}
                                                                    name={`lines[${index}][product_variant_id]`}
                                                                    label="Producto"
                                                                    value={
                                                                        line.product_variant_id
                                                                    }
                                                                    onValueChange={(
                                                                        value,
                                                                    ) =>
                                                                        onVariantPick(
                                                                            index,
                                                                            value,
                                                                        )
                                                                    }
                                                                    options={
                                                                        variantOptionsForWarehouse
                                                                    }
                                                                    disabled={
                                                                        desktopLineDisabled ||
                                                                        !form.warehouse_id
                                                                    }
                                                                    menuPlacement="portal"
                                                                    menuMinWidth={
                                                                        340
                                                                    }
                                                                    placeholder={
                                                                        form.warehouse_id
                                                                            ? 'Buscar producto, SKU o código de barras…'
                                                                            : 'Selecciona un almacén primero'
                                                                    }
                                                                    fieldClassName={
                                                                        lineFieldClass
                                                                    }
                                                                    error={
                                                                        errors[
                                                                            `lines.${index}.product_variant_id`
                                                                        ]
                                                                    }
                                                                    resolveOptionOnEnter={
                                                                        resolveVariantOptionOnEnter
                                                                    }
                                                                />
                                                            </td>
                                                            {showStockValidation ? (
                                                                <td
                                                                    className={cn(
                                                                        LINE_TABLE_CELL,
                                                                        'text-right',
                                                                    )}
                                                                >
                                                                    <LineStockDisplay
                                                                        warehouseId={
                                                                            form.warehouse_id
                                                                        }
                                                                        variantId={
                                                                            line.product_variant_id
                                                                        }
                                                                        lineQty={
                                                                            line.quantity
                                                                        }
                                                                        trackStock={
                                                                            variant?.track_stock ??
                                                                            false
                                                                        }
                                                                        stockByWarehouse={
                                                                            stockByWarehouse
                                                                        }
                                                                    />
                                                                </td>
                                                            ) : null}
                                                            <td
                                                                className={
                                                                    LINE_TABLE_CELL
                                                                }
                                                            >
                                                                <SalesQuantityField
                                                                    id={`line_${index}_qty`}
                                                                    name={`lines[${index}][quantity]`}
                                                                    label="Cantidad"
                                                                    value={
                                                                        line.quantity
                                                                    }
                                                                    onChange={(
                                                                        value,
                                                                    ) =>
                                                                        setLine(
                                                                            index,
                                                                            {
                                                                                quantity:
                                                                                    value,
                                                                            },
                                                                        )
                                                                    }
                                                                    onBlur={() =>
                                                                        setLine(
                                                                            index,
                                                                            {
                                                                                quantity:
                                                                                    toInputDecimal(
                                                                                        line.quantity,
                                                                                        '1.00',
                                                                                    ),
                                                                            },
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        desktopLineDisabled
                                                                    }
                                                                    fieldClassName={
                                                                        lineFieldClass
                                                                    }
                                                                    error={
                                                                        errors[
                                                                            `lines.${index}.quantity`
                                                                        ]
                                                                    }
                                                                />
                                                            </td>
                                                            <td
                                                                className={
                                                                    LINE_TABLE_CELL
                                                                }
                                                            >
                                                                <FormTextField
                                                                    id={`line_${index}_price`}
                                                                    name={`lines[${index}][unit_price]`}
                                                                    label="Precio unitario"
                                                                    value={
                                                                        line.unit_price
                                                                    }
                                                                    onChange={(
                                                                        value,
                                                                    ) =>
                                                                        setLine(
                                                                            index,
                                                                            {
                                                                                unit_price:
                                                                                    value,
                                                                            },
                                                                        )
                                                                    }
                                                                    onBlur={() =>
                                                                        setLine(
                                                                            index,
                                                                            {
                                                                                unit_price:
                                                                                    toInputDecimal(
                                                                                        line.unit_price,
                                                                                        '0.00',
                                                                                    ),
                                                                            },
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        desktopLineDisabled
                                                                    }
                                                                    fieldClassName={cn(
                                                                        lineFieldClass,
                                                                        '[&_input]:text-right',
                                                                    )}
                                                                    {...DECIMAL_INPUT_PROPS}
                                                                />
                                                            </td>
                                                            <td
                                                                className={
                                                                    LINE_TABLE_CELL
                                                                }
                                                            >
                                                                <FormTextField
                                                                    id={`line_${index}_discount`}
                                                                    name={`lines[${index}][discount]`}
                                                                    label="Descuento"
                                                                    value={
                                                                        line.discount
                                                                    }
                                                                    onChange={(
                                                                        value,
                                                                    ) =>
                                                                        setLine(
                                                                            index,
                                                                            {
                                                                                discount:
                                                                                    value,
                                                                            },
                                                                        )
                                                                    }
                                                                    onBlur={() =>
                                                                        setLine(
                                                                            index,
                                                                            {
                                                                                discount:
                                                                                    toInputDecimal(
                                                                                        line.discount,
                                                                                        '0.00',
                                                                                    ),
                                                                            },
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        desktopLineDisabled
                                                                    }
                                                                    fieldClassName={cn(
                                                                        lineFieldClass,
                                                                        '[&_input]:text-right',
                                                                    )}
                                                                    {...DECIMAL_INPUT_PROPS}
                                                                />
                                                            </td>
                                                            <td
                                                                className={cn(
                                                                    LINE_TABLE_CELL,
                                                                    'text-right',
                                                                )}
                                                            >
                                                                <span
                                                                    className="inline-flex min-w-14 justify-center rounded-lg bg-violet-50/90 px-2 py-1 font-mono text-[13px] font-bold text-[#4c1d95] tabular-nums ring-1 ring-violet-100"
                                                                    aria-label={`Total línea ${index + 1}`}
                                                                >
                                                                    {formatMoney(
                                                                        preview.line_total,
                                                                    )}
                                                                </span>
                                                            </td>
                                                            <td
                                                                className={cn(
                                                                    LINE_TABLE_CELL,
                                                                    'text-center',
                                                                )}
                                                            >
                                                                {!readOnly &&
                                                                form.lines
                                                                    .length >
                                                                    1 ? (
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="size-8 shrink-0 cursor-pointer rounded-lg text-red-600 hover:bg-red-50"
                                                                        onClick={() =>
                                                                            removeLine(
                                                                                index,
                                                                            )
                                                                        }
                                                                        aria-label={`Quitar línea ${index + 1}`}
                                                                    >
                                                                        <Trash2 className="size-4" />
                                                                    </Button>
                                                                ) : null}
                                                                <input
                                                                    type="hidden"
                                                                    name={`lines[${index}][description]`}
                                                                    value={
                                                                        line.description ??
                                                                        ''
                                                                    }
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    <ul className="divide-y divide-violet-100/90 md:hidden">
                                        {form.lines.map((line, index) => {
                                            const variant = variantMap.get(
                                                line.product_variant_id,
                                            );
                                            const preview = calcLinePreview(
                                                line,
                                                variant?.igv_rate ?? '0.18',
                                            );

                                            return (
                                                <li
                                                    key={index}
                                                    className="space-y-3 px-3 py-3"
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-violet-100 text-[10px] font-bold text-[#6d28d9]">
                                                            {index + 1}
                                                        </span>
                                                        {!readOnly &&
                                                        form.lines.length >
                                                            1 ? (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-8 shrink-0 cursor-pointer text-red-600 hover:bg-red-50"
                                                                onClick={() =>
                                                                    removeLine(
                                                                        index,
                                                                    )
                                                                }
                                                                aria-label={`Quitar línea ${index + 1}`}
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </Button>
                                                        ) : null}
                                                    </div>
                                                    <FormComboboxField
                                                        id={`line_${index}_variant_mobile`}
                                                        name={`lines[${index}][product_variant_id]`}
                                                        label="Producto"
                                                        value={
                                                            line.product_variant_id
                                                        }
                                                        onValueChange={(
                                                            value,
                                                        ) =>
                                                            onVariantPick(
                                                                index,
                                                                value,
                                                            )
                                                        }
                                                        options={
                                                            variantOptionsForWarehouse
                                                        }
                                                        disabled={
                                                            mobileLineDisabled ||
                                                            !form.warehouse_id
                                                        }
                                                        menuPlacement="portal"
                                                        menuMinWidth={340}
                                                        placeholder={
                                                            form.warehouse_id
                                                                ? 'Buscar producto, SKU o código de barras…'
                                                                : 'Selecciona un almacén primero'
                                                        }
                                                        error={
                                                            errors[
                                                                `lines.${index}.product_variant_id`
                                                            ]
                                                        }
                                                        resolveOptionOnEnter={
                                                            resolveVariantOptionOnEnter
                                                        }
                                                    />
                                                    {showStockValidation ? (
                                                        <div className="flex items-center justify-between gap-2 rounded-lg bg-violet-50/60 px-2 py-1.5">
                                                            <span className="text-xs font-semibold text-[#7c6f8a]">
                                                                Stock disponible
                                                            </span>
                                                            <LineStockDisplay
                                                                warehouseId={
                                                                    form.warehouse_id
                                                                }
                                                                variantId={
                                                                    line.product_variant_id
                                                                }
                                                                lineQty={
                                                                    line.quantity
                                                                }
                                                                trackStock={
                                                                    variant?.track_stock ??
                                                                    false
                                                                }
                                                                stockByWarehouse={
                                                                    stockByWarehouse
                                                                }
                                                            />
                                                        </div>
                                                    ) : null}
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <SalesQuantityField
                                                            id={`line_${index}_qty_mobile`}
                                                            name={`lines[${index}][quantity]`}
                                                            label="Cantidad"
                                                            value={
                                                                line.quantity
                                                            }
                                                            onChange={(
                                                                value,
                                                            ) =>
                                                                setLine(
                                                                    index,
                                                                    {
                                                                        quantity:
                                                                            value,
                                                                    },
                                                                )
                                                            }
                                                            onBlur={() =>
                                                                setLine(
                                                                    index,
                                                                    {
                                                                        quantity:
                                                                            toInputDecimal(
                                                                                line.quantity,
                                                                                '1.00',
                                                                            ),
                                                                    },
                                                                )
                                                            }
                                                            disabled={
                                                                mobileLineDisabled
                                                            }
                                                            error={
                                                                errors[
                                                                    `lines.${index}.quantity`
                                                                ]
                                                            }
                                                        />
                                                        <FormTextField
                                                            id={`line_${index}_price_mobile`}
                                                            name={`lines[${index}][unit_price]`}
                                                            label="Precio unit."
                                                            value={
                                                                line.unit_price
                                                            }
                                                            onChange={(
                                                                value,
                                                            ) =>
                                                                setLine(
                                                                    index,
                                                                    {
                                                                        unit_price:
                                                                            value,
                                                                    },
                                                                )
                                                            }
                                                            onBlur={() =>
                                                                setLine(
                                                                    index,
                                                                    {
                                                                        unit_price:
                                                                            toInputDecimal(
                                                                                line.unit_price,
                                                                                '0.00',
                                                                            ),
                                                                    },
                                                                )
                                                            }
                                                            disabled={
                                                                mobileLineDisabled
                                                            }
                                                            {...DECIMAL_INPUT_PROPS}
                                                        />
                                                        <FormTextField
                                                            id={`line_${index}_discount_mobile`}
                                                            name={`lines[${index}][discount]`}
                                                            label="Descuento"
                                                            value={
                                                                line.discount
                                                            }
                                                            onChange={(
                                                                value,
                                                            ) =>
                                                                setLine(
                                                                    index,
                                                                    {
                                                                        discount:
                                                                            value,
                                                                    },
                                                                )
                                                            }
                                                            onBlur={() =>
                                                                setLine(
                                                                    index,
                                                                    {
                                                                        discount:
                                                                            toInputDecimal(
                                                                                line.discount,
                                                                                '0.00',
                                                                            ),
                                                                    },
                                                                )
                                                            }
                                                            disabled={
                                                                mobileLineDisabled
                                                            }
                                                            className="col-span-2"
                                                            {...DECIMAL_INPUT_PROPS}
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between rounded-lg bg-violet-50/90 px-3 py-2 ring-1 ring-violet-100">
                                                        <span className="text-xs font-bold text-[#7c3aed] uppercase">
                                                            Total línea
                                                        </span>
                                                        <span className="font-mono text-base font-bold text-[#4c1d95] tabular-nums">
                                                            S/{' '}
                                                            {formatMoney(
                                                                preview.line_total,
                                                            )}
                                                        </span>
                                                    </div>
                                                    <input
                                                        type="hidden"
                                                        name={`lines[${index}][description]`}
                                                        value={
                                                            line.description ??
                                                            ''
                                                        }
                                                    />
                                                </li>
                                            );
                                        })}
                                    </ul>
                                    {!readOnly ? (
                                        <div className="border-t border-violet-100 bg-violet-50/25 p-2.5 md:px-3">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className={cn(
                                                    'h-9 w-full cursor-pointer rounded-xl border-2 border-dashed border-violet-300/90',
                                                    'bg-white text-sm font-semibold text-[#6d28d9]',
                                                    'hover:border-violet-400 hover:bg-violet-50/80',
                                                )}
                                                onClick={addLine}
                                            >
                                                <Plus className="mr-2 size-4" />
                                                Agregar línea
                                            </Button>
                                        </div>
                                    ) : null}
                                </div>
                                </div>

                                <OrderSummaryAside
                                    isInternal={isInternal}
                                    subtotal={formatSalesMoney(
                                        totals.subtotal,
                                        form.currency_code,
                                    )}
                                    taxAmount={formatSalesMoney(
                                        totals.tax_amount,
                                        form.currency_code,
                                    )}
                                    total={formatSalesMoney(
                                        totals.total,
                                        form.currency_code,
                                    )}
                                    globalDiscount={form.global_discount}
                                    currencyCode={form.currency_code}
                                    indexUrl={indexUrl}
                                    readOnly={readOnly}
                                    processing={processing}
                                    confirming={confirming}
                                    deleting={deleteModalOpen}
                                    document={document}
                                    isDraft={isDraft}
                                    canDelete={canDelete}
                                    canConfirm={canConfirm}
                                    confirmUrl={confirmUrl}
                                    collectOnConfirm={collectOnConfirm}
                                    isOffline={isOffline}
                                    onConfirmWithPayment={
                                        handleConfirmWithPayment
                                    }
                                    onConfirmOnCredit={handleConfirmOnCredit}
                                    onDelete={handleDeleteRequest}
                                    onSaveDraft={
                                        isOffline ? handleOfflineSaveDraft : undefined
                                    }
                                    offlineSaving={offlineSaving}
                                    lines={form.lines}
                                    variantMap={variantMap}
                                />
                                </div>
                            </div>
                        </div>
        </>
    );

    return (
        <div className="space-y-3">
            {canCreateCustomer && !isOffline ? (
                <PartyFormModal
                    open={partyModalOpen}
                    onOpenChange={setPartyModalOpen}
                    mode="create"
                    customerOnly
                    embeddedReturnUrl={salesReturnUrl || null}
                    errors={partyModalOpen ? errors : {}}
                    oldForm={partyQuickOldForm ?? undefined}
                />
            ) : null}
            {collectOnConfirm &&
            confirmPaymentPreview &&
            confirmUrl ? (
                <CollectionPaymentModal
                    open={confirmPaymentModalOpen}
                    onOpenChange={setConfirmPaymentModalOpen}
                    document={confirmPaymentPreview}
                    paymentMethods={paymentMethods}
                    openCashSession={openCashSession}
                    saleMode={saleMode}
                    errors={errors}
                    confirmAndCollect={{
                        confirmUrl,
                        buildConfirmPayload: () =>
                            buildSalesDocumentPayload(form),
                    }}
                />
            ) : null}
            {destroyUrl && !isOffline ? (
                <SalesDraftDeleteModal
                    open={deleteModalOpen}
                    onOpenChange={setDeleteModalOpen}
                    destroyUrl={destroyUrl}
                    documentLabel={
                        document?.full_number ??
                        (isInternal ? 'venta rápida' : 'comprobante')
                    }
                    isInternal={isInternal}
                />
            ) : null}
            {document?.status === 'confirmed' &&
            document.payment_status_label ? (
                <SalesDocumentPaymentSummary
                    paymentStatus={document.payment_status}
                    paymentStatusLabel={document.payment_status_label}
                    currencyCode={form.currency_code}
                    totalLabel={document.total_label}
                    amountPaidLabel={document.amount_paid_label}
                    balanceDue={document.balance_due}
                    balanceDueLabel={document.balance_due_label}
                />
            ) : null}

            {document?.full_number ? (
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-violet-200/80 bg-linear-to-r from-violet-50/90 to-white px-5 py-4 shadow-sm">
                    <div>
                        <p className="text-[10px] font-bold tracking-widest text-[#7c3aed] uppercase">
                            {document.status_label}
                        </p>
                        <p className="mt-0.5 font-mono text-xl font-bold text-[#3b2d4a]">
                            {document.full_number}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold tracking-wide text-[#9d8fb0] uppercase">
                            Total
                        </p>
                        <p className="font-mono text-lg font-bold text-[#6d28d9] tabular-nums">
                            {formatSalesMoney(
                                totals.total,
                                form.currency_code,
                            )}
                        </p>
                    </div>
                </div>
            ) : null}

            {!isInternal && document?.electronic_document ? (
                <div
                    className={cn(
                        'rounded-xl border px-4 py-3 text-sm',
                        document.electronic_document.status === 'accepted'
                            ? 'border-emerald-200 bg-emerald-50/80 text-emerald-900'
                            : document.electronic_document.status === 'rejected'
                              ? 'border-red-200 bg-red-50/80 text-red-900'
                              : 'border-violet-200 bg-violet-50/60 text-[#4c1d95]',
                    )}
                >
                    <p className="font-semibold">
                        CPE SUNAT: {document.electronic_document.status_label}
                    </p>
                    {document.electronic_document.sunat_description ? (
                        <p className="mt-1 text-[13px] opacity-90">
                            {document.electronic_document.sunat_description}
                        </p>
                    ) : null}
                </div>
            ) : null}

            {isOffline ? (
                <form
                    className="space-y-3"
                    onSubmit={(event) => event.preventDefault()}
                >
                    {formFields(offlineSaving)}
                </form>
            ) : (
                <Form action={actionUrl} method={method} className="space-y-3">
                    {({ processing }) => formFields(processing)}
                </Form>
            )}
        </div>
    );
}
