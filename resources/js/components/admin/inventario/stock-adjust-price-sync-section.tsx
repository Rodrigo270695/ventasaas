import { useMemo } from 'react';
import {
    FormCheckboxField,
    FormSelectField,
    FormTextField,
} from '@/components/form';
import { calcSellingPriceFromCost } from '@/lib/selling-price-from-cost';
import { cn } from '@/lib/utils';
import type { PriceListOption } from '@/types/admin/products';
import type { SalePriceMarkupType } from '@/lib/selling-price-from-cost';

const MARKUP_TYPE_OPTIONS = [
    { value: 'percent', label: 'Margen % sobre costo' },
    { value: 'fixed', label: 'Ganancia fija (S/)' },
];

type Props = {
    unitCost: string;
    syncSalePrices: boolean;
    onSyncSalePricesChange: (checked: boolean) => void;
    selectedPriceListIds: string[];
    onTogglePriceList: (listId: string, checked: boolean) => void;
    markupType: SalePriceMarkupType;
    onMarkupTypeChange: (value: SalePriceMarkupType) => void;
    markupValue: string;
    onMarkupValueChange: (value: string) => void;
    priceListOptions: PriceListOption[];
    disabled?: boolean;
    errors?: Record<string, string>;
};

export function StockAdjustPriceSyncSection({
    unitCost,
    syncSalePrices,
    onSyncSalePricesChange,
    selectedPriceListIds,
    onTogglePriceList,
    markupType,
    onMarkupTypeChange,
    markupValue,
    onMarkupValueChange,
    priceListOptions,
    disabled = false,
    errors = {},
}: Props) {
    const previewPrice = useMemo(
        () => calcSellingPriceFromCost(unitCost, markupType, markupValue),
        [unitCost, markupType, markupValue],
    );

    const hasUnitCost =
        unitCost.trim().length > 0 &&
        !Number.isNaN(Number(unitCost.replace(',', '.'))) &&
        Number(unitCost.replace(',', '.')) > 0;

    if (!hasUnitCost || priceListOptions.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3 rounded-lg border border-violet-200/80 bg-violet-50/35 p-3">
            <input
                type="hidden"
                name="sync_sale_prices"
                value={syncSalePrices ? '1' : '0'}
            />

            <FormCheckboxField
                id="stock-adjust-sync-prices"
                name="_sync_sale_prices_ui"
                label="Actualizar precios de venta según este costo"
                checked={syncSalePrices}
                onCheckedChange={onSyncSalePricesChange}
                disabled={disabled}
                hint="Recalcula las listas que elijas con un margen en % o soles."
            />

            {syncSalePrices && (
                <div className="space-y-3 border-t border-violet-100/90 pt-3">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#7c3aed]">
                            Listas de precio
                        </p>
                        <ul className="mt-2 space-y-1.5">
                            {priceListOptions.map((list) => {
                                const checked = selectedPriceListIds.includes(
                                    list.value,
                                );

                                return (
                                    <li key={list.value}>
                                        <label
                                            className={cn(
                                                'flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-sm transition-colors',
                                                checked
                                                    ? 'border-[#7c3aed]/40 bg-white'
                                                    : 'border-transparent bg-white/60 hover:bg-white',
                                                disabled &&
                                                    'cursor-not-allowed opacity-60',
                                            )}
                                        >
                                            <input
                                                type="checkbox"
                                                name="price_list_ids[]"
                                                value={list.value}
                                                checked={checked}
                                                disabled={disabled}
                                                onChange={(event) =>
                                                    onTogglePriceList(
                                                        list.value,
                                                        event.target.checked,
                                                    )
                                                }
                                                className="size-3.5 rounded border-violet-300 text-[#7c3aed] focus:ring-[#7c3aed]/30"
                                            />
                                            <span className="font-medium text-[#4c1d95]">
                                                {list.label}
                                            </span>
                                        </label>
                                    </li>
                                );
                            })}
                        </ul>
                        {errors.price_list_ids && (
                            <p className="mt-1 text-xs text-red-600">
                                {errors.price_list_ids}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <FormSelectField
                            id="stock-adjust-markup-type"
                            name="markup_type"
                            label="Tipo de aumento"
                            value={markupType}
                            onValueChange={(v) =>
                                onMarkupTypeChange(v as SalePriceMarkupType)
                            }
                            options={MARKUP_TYPE_OPTIONS}
                            disabled={disabled}
                            error={errors.markup_type}
                        />
                        <FormTextField
                            id="stock-adjust-markup-value"
                            name="markup_value"
                            label={
                                markupType === 'percent'
                                    ? 'Margen (%)'
                                    : 'Ganancia (S/)'
                            }
                            value={markupValue}
                            onChange={onMarkupValueChange}
                            inputMode="decimal"
                            placeholder={
                                markupType === 'percent' ? 'Ej. 30' : 'Ej. 2.50'
                            }
                            disabled={disabled}
                            error={errors.markup_value}
                        />
                    </div>

                    {previewPrice && selectedPriceListIds.length > 0 && (
                        <p className="rounded-lg bg-white/90 px-3 py-2 text-xs text-[#5b4d6e] ring-1 ring-violet-100">
                            <span className="font-semibold text-[#6d28d9]">
                                Vista previa:
                            </span>{' '}
                            precio de venta{' '}
                            <span className="font-mono font-bold text-[#4c1d95]">
                                S/ {previewPrice}
                            </span>{' '}
                            en{' '}
                            {selectedPriceListIds.length ===
                            priceListOptions.length
                                ? 'todas las listas seleccionadas'
                                : `${selectedPriceListIds.length} lista(s)`}
                            .
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
