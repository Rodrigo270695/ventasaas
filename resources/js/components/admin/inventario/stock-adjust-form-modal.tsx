import { Form } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { store as storeAdjustment } from '@/routes/admin/inventario/saldos/ajustes';
import { StockAdjustPriceSyncSection } from '@/components/admin/inventario/stock-adjust-price-sync-section';
import {
    AppModal,
    AppModalBody,
    AppModalFooter,
    AppModalHeader,
} from '@/components/modal';
import {
    FormComboboxField,
    FormSection,
    FormSelectField,
    FormTextField,
} from '@/components/form';
import type { FormComboboxOption, FormSelectOption } from '@/components/form';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { formatDecimalInput, formatDecimalDisplay } from '@/lib/format-decimal';
import type { SalePriceMarkupType } from '@/lib/selling-price-from-cost';
import type { PriceListOption } from '@/types/admin/products';
import type { StockAdjustmentType, StockAdjustOldForm } from '@/types/admin/stock-balances';
import { cn } from '@/lib/utils';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    warehouseId: string;
    warehouseOptions?: FormSelectOption[];
    variantOptions: FormComboboxOption[];
    priceListOptions?: PriceListOption[];
    canSyncSalePrices?: boolean;
    initialVariantId?: string | null;
    initialQuantity?: string;
    initialUnitCost?: string;
    oldForm?: StockAdjustOldForm;
    errors?: Record<string, string>;
};

const defaultOldForm: StockAdjustOldForm = {
    product_variant_id: '',
    adjustment_type: 'in',
    quantity_on_hand: '',
    unit_cost: '',
    notes: '',
    sync_sale_prices: false,
    price_list_ids: [],
    markup_type: 'percent',
    markup_value: '',
};

const STOCK_BALANCE_LOOKUP_URL = '/admin/inventario/saldos/consulta';

type BalanceInfo = {
    quantity_on_hand: string;
    avg_cost: string;
};

const MODE_OPTIONS: { value: StockAdjustmentType; label: string }[] = [
    { value: 'in', label: 'Entrada' },
    { value: 'out', label: 'Salida' },
    { value: 'set', label: 'Fijar cantidad' },
];

function defaultSelectedLists(
    options: PriceListOption[],
    oldIds: string[],
): string[] {
    if (oldIds.length > 0) {
        return oldIds;
    }

    const defaults = options.filter((list) => list.is_default).map((l) => l.value);

    return defaults.length > 0
        ? defaults
        : options.map((list) => list.value);
}

export function StockAdjustFormModal({
    open,
    onOpenChange,
    warehouseId,
    warehouseOptions = [],
    variantOptions,
    priceListOptions = [],
    canSyncSalePrices = false,
    initialVariantId = null,
    initialQuantity = '',
    initialUnitCost = '',
    oldForm = defaultOldForm,
    errors = {},
}: Props) {
    const [selectedWarehouseId, setSelectedWarehouseId] = useState(warehouseId);
    const [adjustmentType, setAdjustmentType] = useState<StockAdjustmentType>('in');
    const [variantId, setVariantId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unitCost, setUnitCost] = useState('');
    const [notes, setNotes] = useState('');
    const [syncSalePrices, setSyncSalePrices] = useState(false);
    const [selectedPriceListIds, setSelectedPriceListIds] = useState<string[]>([]);
    const [markupType, setMarkupType] = useState<SalePriceMarkupType>('percent');
    const [markupValue, setMarkupValue] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [loadingBalance, setLoadingBalance] = useState(false);
    const [currentBalance, setCurrentBalance] = useState<BalanceInfo | null>(null);

    const showWarehouseSelector = warehouseOptions.length > 1;

    const loadBalance = useCallback(
        async (nextWarehouseId: string, nextVariantId: string) => {
            if (!nextWarehouseId || !nextVariantId) {
                setCurrentBalance(null);

                return;
            }

            setLoadingBalance(true);

            try {
                const params = new URLSearchParams({
                    warehouse_id: nextWarehouseId,
                    product_variant_id: nextVariantId,
                });
                const response = await fetch(
                    `${STOCK_BALANCE_LOOKUP_URL}?${params.toString()}`,
                    {
                        credentials: 'same-origin',
                        headers: { Accept: 'application/json' },
                    },
                );

                if (!response.ok) {
                    return;
                }

                const body = (await response.json()) as BalanceInfo;
                setCurrentBalance(body);

                // En modo "fijar", pre-carga la cantidad y costo actuales
                if (adjustmentType === 'set') {
                    setQuantity(formatDecimalInput(body.quantity_on_hand ?? '0'));
                    setUnitCost(formatDecimalInput(body.avg_cost ?? '0'));
                }
            } finally {
                setLoadingBalance(false);
            }
        },
        [adjustmentType],
    );

    useEffect(() => {
        if (open) {
            const type = (oldForm.adjustment_type as StockAdjustmentType) || 'in';
            setSelectedWarehouseId(warehouseId);
            setAdjustmentType(type);
            setVariantId(oldForm.product_variant_id || initialVariantId || '');
            setQuantity(formatDecimalInput(oldForm.quantity_on_hand || initialQuantity || ''));
            setUnitCost(formatDecimalInput(oldForm.unit_cost || initialUnitCost || ''));
            setNotes(oldForm.notes || '');
            setSyncSalePrices(Boolean(oldForm.sync_sale_prices));
            setSelectedPriceListIds(
                defaultSelectedLists(priceListOptions, oldForm.price_list_ids ?? []),
            );
            setMarkupType((oldForm.markup_type as SalePriceMarkupType) || 'percent');
            setMarkupValue(oldForm.markup_value ?? '');
            setFieldErrors(errors);
            setCurrentBalance(null);
        }
    }, [
        open,
        oldForm,
        initialVariantId,
        initialQuantity,
        initialUnitCost,
        errors,
        priceListOptions,
        warehouseId,
    ]);

    useEffect(() => {
        if (!open) return;

        const presetVariantId = oldForm.product_variant_id || initialVariantId || '';

        if (presetVariantId && warehouseId) {
            void loadBalance(warehouseId, presetVariantId);
        }
    }, [open, warehouseId, initialVariantId, oldForm.product_variant_id, loadBalance]);

    const resetForm = () => {
        setSelectedWarehouseId(warehouseId);
        setAdjustmentType('in');
        setVariantId('');
        setQuantity('');
        setUnitCost('');
        setNotes('');
        setSyncSalePrices(false);
        setSelectedPriceListIds([]);
        setMarkupType('percent');
        setMarkupValue('');
        setFieldErrors({});
        setCurrentBalance(null);
    };

    const handleOpenChange = (next: boolean) => {
        if (!next) resetForm();
        onOpenChange(next);
    };

    const handleModeChange = (mode: StockAdjustmentType) => {
        setAdjustmentType(mode);
        setQuantity('');
        setFieldErrors({});

        // En modo "fijar", auto-carga la cantidad actual
        if (mode === 'set' && currentBalance) {
            setQuantity(formatDecimalInput(currentBalance.quantity_on_hand));
            setUnitCost(formatDecimalInput(currentBalance.avg_cost));
        }
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

    const message = (key: string, formErrors: Record<string, string>) =>
        fieldErrors[key] ?? formErrors[key] ?? errors[key];

    const handleWarehouseChange = (value: string) => {
        setSelectedWarehouseId(value);
        clearError('warehouse_id');

        if (variantId) {
            void loadBalance(value, variantId);
        }
    };

    const handleVariantChange = (value: string) => {
        setVariantId(value);
        clearError('product_variant_id');

        if (selectedWarehouseId) {
            void loadBalance(selectedWarehouseId, value);
        }
    };

    const togglePriceList = (listId: string, checked: boolean) => {
        setSelectedPriceListIds((current) => {
            if (checked) {
                return current.includes(listId) ? current : [...current, listId];
            }

            return current.filter((id) => id !== listId);
        });
        clearError('price_list_ids');
    };

    const canSubmit = useMemo(() => {
        if (!selectedWarehouseId || !variantId) return false;
        const trimmed = quantity.trim();
        if (trimmed.length === 0) return false;
        const num = parseFloat(trimmed.replace(',', '.'));
        if (isNaN(num)) return false;
        if (adjustmentType !== 'set' && num <= 0) return false;
        if (adjustmentType === 'set' && num < 0) return false;

        return true;
    }, [selectedWarehouseId, variantId, quantity, adjustmentType]);

    const showPriceSync = canSyncSalePrices && priceListOptions.length > 0;

    const modalSize = useMemo(
        () => (showPriceSync && syncSalePrices ? 'md' : 'sm'),
        [showPriceSync, syncSalePrices],
    );

    // Labels y hints según el modo
    const quantityLabel =
        adjustmentType === 'in'
            ? 'Cantidad a ingresar'
            : adjustmentType === 'out'
              ? 'Cantidad a retirar'
              : 'Cantidad en stock';

    const quantityHint =
        adjustmentType === 'in'
            ? 'Se sumará al stock actual.'
            : adjustmentType === 'out'
              ? 'Se restará del stock actual.'
              : 'Cantidad final después del ajuste.';

    const showUnitCost = adjustmentType !== 'out';

    const unitCostHint =
        adjustmentType === 'in'
            ? 'Requerido. Actualiza el costo promedio.'
            : 'Si el stock no cambia (ej. está en 0), ingresa solo el costo para registrarlo.';

    return (
        <AppModal open={open} onOpenChange={handleOpenChange} size={modalSize}>
            <Form
                key={open ? `adjust-${variantId || 'new'}` : 'closed'}
                action={storeAdjustment.url()}
                method="post"
                onSuccess={() => handleOpenChange(false)}
                className="contents"
            >
                {({ processing, errors: formErrors }) => (
                    <>
                        <input type="hidden" name="warehouse_id" value={selectedWarehouseId} />
                        <input type="hidden" name="adjustment_type" value={adjustmentType} />

                        <AppModalHeader
                            title="Ajuste de stock"
                            description="Registra entradas, salidas o fija la cantidad exacta del inventario."
                        />

                        <AppModalBody className="space-y-4">
                            {/* Selector de modo */}
                            <div className="flex overflow-hidden rounded-lg border border-violet-200">
                                {MODE_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => handleModeChange(opt.value)}
                                        disabled={processing || loadingBalance}
                                        className={cn(
                                            'flex-1 py-1.5 text-xs font-semibold transition-colors',
                                            adjustmentType === opt.value
                                                ? opt.value === 'in'
                                                    ? 'cursor-pointer bg-emerald-600 text-white'
                                                    : opt.value === 'out'
                                                      ? 'cursor-pointer bg-rose-500 text-white'
                                                      : 'cursor-pointer bg-violet-600 text-white'
                                                : 'cursor-pointer text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed',
                                        )}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            <FormSection title="Movimiento" gridClassName="grid gap-3">
                                {showWarehouseSelector ? (
                                    <FormSelectField
                                        id="stock-adjust-warehouse"
                                        name="warehouse_id_display"
                                        label="Almacén / tienda"
                                        required
                                        value={selectedWarehouseId}
                                        onValueChange={handleWarehouseChange}
                                        options={warehouseOptions}
                                        placeholder="Seleccionar almacén…"
                                        disabled={processing || loadingBalance}
                                        fieldClassName="sm:col-span-2"
                                        error={message('warehouse_id', formErrors)}
                                    />
                                ) : null}

                                <FormComboboxField
                                    key={open ? 'adjust-open' : 'adjust-closed'}
                                    id="stock-adjust-variant"
                                    name="product_variant_id"
                                    label="Variante"
                                    required
                                    value={variantId}
                                    onValueChange={handleVariantChange}
                                    options={variantOptions}
                                    placeholder="Buscar producto o SKU…"
                                    emptyMessage="Ninguna variante coincide."
                                    disabled={processing || loadingBalance}
                                    fieldClassName="sm:col-span-2"
                                    error={message('product_variant_id', formErrors)}
                                />

                                {/* Info del stock actual (en modo entrada / salida) */}
                                {adjustmentType !== 'set' && currentBalance !== null && variantId && (
                                    <div className="sm:col-span-2 flex gap-4 rounded-lg bg-slate-50 px-3 py-2 text-sm ring-1 ring-slate-200">
                                        <div>
                                            <span className="text-slate-500">Stock actual:</span>
                                            <span className="ml-1 font-semibold">
                                                {formatDecimalDisplay(currentBalance.quantity_on_hand)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500">Costo prom.:</span>
                                            <span className="ml-1 font-semibold">
                                                S/ {formatDecimalDisplay(currentBalance.avg_cost)}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <FormTextField
                                    id="stock-adjust-qty"
                                    name="quantity_on_hand"
                                    label={quantityLabel}
                                    required
                                    value={quantity}
                                    onChange={(v) => {
                                        setQuantity(v);
                                        clearError('quantity_on_hand');
                                    }}
                                    inputMode="decimal"
                                    step="0.01"
                                    placeholder="0.00"
                                    hint={quantityHint}
                                    error={message('quantity_on_hand', formErrors)}
                                    disabled={processing || loadingBalance}
                                />

                                {showUnitCost && (
                                    <FormTextField
                                        id="stock-adjust-cost"
                                        name="unit_cost"
                                        label="Costo unitario"
                                        required={adjustmentType === 'in'}
                                        value={unitCost}
                                        onChange={(v) => {
                                            setUnitCost(v);
                                            clearError('unit_cost');
                                        }}
                                        inputMode="decimal"
                                        step="0.01"
                                        placeholder="0.00"
                                        hint={unitCostHint}
                                        error={message('unit_cost', formErrors)}
                                        disabled={processing || loadingBalance}
                                    />
                                )}

                                <FormTextField
                                    id="stock-adjust-notes"
                                    name="notes"
                                    label="Notas"
                                    value={notes}
                                    onChange={setNotes}
                                    placeholder="Opcional"
                                    maxLength={500}
                                    disabled={processing}
                                    fieldClassName="sm:col-span-2"
                                />
                            </FormSection>

                            {showPriceSync && (
                                <StockAdjustPriceSyncSection
                                    unitCost={unitCost}
                                    syncSalePrices={syncSalePrices}
                                    onSyncSalePricesChange={setSyncSalePrices}
                                    selectedPriceListIds={selectedPriceListIds}
                                    onTogglePriceList={togglePriceList}
                                    markupType={markupType}
                                    onMarkupTypeChange={setMarkupType}
                                    markupValue={markupValue}
                                    onMarkupValueChange={(v) => {
                                        setMarkupValue(v);
                                        clearError('markup_value');
                                    }}
                                    priceListOptions={priceListOptions}
                                    disabled={processing}
                                    errors={{
                                        price_list_ids:
                                            message('price_list_ids', formErrors) ||
                                            message('price_list_ids.0', formErrors),
                                        markup_type: message('markup_type', formErrors),
                                        markup_value: message('markup_value', formErrors),
                                    }}
                                />
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
                                type="submit"
                                disabled={processing || loadingBalance || !canSubmit}
                                className={cn(
                                    'cursor-pointer rounded-xl font-bold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50',
                                    adjustmentType === 'in'
                                        ? 'bg-emerald-600'
                                        : adjustmentType === 'out'
                                          ? 'bg-rose-500'
                                          : 'bg-linear-to-r from-[#ec4899] to-[#7c3aed]',
                                )}
                            >
                                {processing && <Spinner />}
                                {adjustmentType === 'in'
                                    ? 'Registrar entrada'
                                    : adjustmentType === 'out'
                                      ? 'Registrar salida'
                                      : syncSalePrices && showPriceSync
                                        ? 'Guardar stock y precios'
                                        : 'Guardar stock'}
                            </Button>
                        </AppModalFooter>
                    </>
                )}
            </Form>
        </AppModal>
    );
}
