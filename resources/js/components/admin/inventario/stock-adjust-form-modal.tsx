import { Form } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
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
    FormTextField,
} from '@/components/form';
import type { FormComboboxOption } from '@/components/form';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { formatDecimalInput } from '@/lib/format-decimal';
import type { SalePriceMarkupType } from '@/lib/selling-price-from-cost';
import type { PriceListOption } from '@/types/admin/products';
import type { StockAdjustOldForm } from '@/types/admin/stock-balances';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    warehouseId: string;
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
    quantity_on_hand: '',
    unit_cost: '',
    notes: '',
    sync_sale_prices: false,
    price_list_ids: [],
    markup_type: 'percent',
    markup_value: '',
};

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
    variantOptions,
    priceListOptions = [],
    canSyncSalePrices = false,
    initialVariantId = null,
    initialQuantity = '',
    initialUnitCost = '',
    oldForm = defaultOldForm,
    errors = {},
}: Props) {
    const [variantId, setVariantId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unitCost, setUnitCost] = useState('');
    const [notes, setNotes] = useState('');
    const [syncSalePrices, setSyncSalePrices] = useState(false);
    const [selectedPriceListIds, setSelectedPriceListIds] = useState<string[]>(
        [],
    );
    const [markupType, setMarkupType] = useState<SalePriceMarkupType>('percent');
    const [markupValue, setMarkupValue] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            setVariantId(
                oldForm.product_variant_id ||
                    initialVariantId ||
                    '',
            );
            setQuantity(
                formatDecimalInput(
                    oldForm.quantity_on_hand || initialQuantity || '',
                ),
            );
            setUnitCost(
                formatDecimalInput(oldForm.unit_cost || initialUnitCost || ''),
            );
            setNotes(oldForm.notes || '');
            setSyncSalePrices(Boolean(oldForm.sync_sale_prices));
            setSelectedPriceListIds(
                defaultSelectedLists(
                    priceListOptions,
                    oldForm.price_list_ids ?? [],
                ),
            );
            setMarkupType(
                (oldForm.markup_type as SalePriceMarkupType) || 'percent',
            );
            setMarkupValue(oldForm.markup_value ?? '');
            setFieldErrors(errors);
        }
    }, [
        open,
        oldForm,
        initialVariantId,
        initialQuantity,
        initialUnitCost,
        errors,
        priceListOptions,
    ]);

    const resetForm = () => {
        setVariantId('');
        setQuantity('');
        setUnitCost('');
        setNotes('');
        setSyncSalePrices(false);
        setSelectedPriceListIds([]);
        setMarkupType('percent');
        setMarkupValue('');
        setFieldErrors({});
    };

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            resetForm();
        }

        onOpenChange(next);
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

    const canSubmit = variantId.length > 0 && quantity.trim().length > 0;

    const showPriceSync = canSyncSalePrices && priceListOptions.length > 0;

    const togglePriceList = (listId: string, checked: boolean) => {
        setSelectedPriceListIds((current) => {
            if (checked) {
                return current.includes(listId)
                    ? current
                    : [...current, listId];
            }

            return current.filter((id) => id !== listId);
        });
        clearError('price_list_ids');
    };

    const modalSize = useMemo(
        () => (showPriceSync && syncSalePrices ? 'md' : 'sm'),
        [showPriceSync, syncSalePrices],
    );

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
                        <input
                            type="hidden"
                            name="warehouse_id"
                            value={warehouseId}
                        />

                        <AppModalHeader
                            title="Ajuste de stock"
                            description="Define la cantidad final en almacén. Si aumentas stock, indica el costo unitario del ingreso."
                        />

                        <AppModalBody className="space-y-4">
                            <FormSection
                                title="Movimiento"
                                gridClassName="grid gap-3"
                            >
                                <FormComboboxField
                                    key={open ? 'adjust-open' : 'adjust-closed'}
                                    id="stock-adjust-variant"
                                    name="product_variant_id"
                                    label="Variante"
                                    required
                                    value={variantId}
                                    onValueChange={(v) => {
                                        setVariantId(v);
                                        clearError('product_variant_id');
                                    }}
                                    options={variantOptions}
                                    placeholder="Buscar producto o SKU…"
                                    emptyMessage="Ninguna variante coincide."
                                    disabled={processing}
                                    fieldClassName="sm:col-span-2"
                                    error={message(
                                        'product_variant_id',
                                        formErrors,
                                    )}
                                />
                                <FormTextField
                                    id="stock-adjust-qty"
                                    name="quantity_on_hand"
                                    label="Cantidad en stock"
                                    required
                                    value={quantity}
                                    onChange={(v) => {
                                        setQuantity(v);
                                        clearError('quantity_on_hand');
                                    }}
                                    inputMode="decimal"
                                    step="0.01"
                                    placeholder="0.00"
                                    hint="Cantidad final después del ajuste."
                                    error={message(
                                        'quantity_on_hand',
                                        formErrors,
                                    )}
                                    disabled={processing}
                                />
                                <FormTextField
                                    id="stock-adjust-cost"
                                    name="unit_cost"
                                    label="Costo unitario (ingreso)"
                                    value={unitCost}
                                    onChange={(v) => {
                                        setUnitCost(v);
                                        clearError('unit_cost');
                                    }}
                                    inputMode="decimal"
                                    step="0.01"
                                    placeholder="0.00"
                                    hint="Obligatorio si subes la cantidad. Sirve de base para recalcular precios."
                                    error={message('unit_cost', formErrors)}
                                    disabled={processing}
                                />
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
                                            message(
                                                'price_list_ids',
                                                formErrors,
                                            ) ||
                                            message(
                                                'price_list_ids.0',
                                                formErrors,
                                            ),
                                        markup_type: message(
                                            'markup_type',
                                            formErrors,
                                        ),
                                        markup_value: message(
                                            'markup_value',
                                            formErrors,
                                        ),
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
                                disabled={processing || !canSubmit}
                                className="cursor-pointer rounded-xl bg-linear-to-r from-[#ec4899] to-[#7c3aed] font-bold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing && <Spinner />}
                                {syncSalePrices && showPriceSync
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
