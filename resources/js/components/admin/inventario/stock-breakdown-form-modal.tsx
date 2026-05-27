import { Form } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { store as storeBreakdown } from '@/routes/admin/inventario/saldos/desgloses';
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
import type { PackagingConversionOption } from '@/types/admin/stock-balances';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    warehouseOptions: FormSelectOption[];
    variantOptions: FormComboboxOption[];
    packagingConversions: PackagingConversionOption[];
    defaultWarehouseId?: string;
    initialVariantId?: string | null;
    errors?: Record<string, string>;
};

function normalizeQty(value: string): number {
    const n = Number(value.replace(',', '.'));

    return Number.isNaN(n) ? 0 : n;
}

export function StockBreakdownFormModal({
    open,
    onOpenChange,
    warehouseOptions,
    variantOptions,
    packagingConversions,
    defaultWarehouseId = '',
    initialVariantId = null,
    errors = {},
}: Props) {
    const [warehouseId, setWarehouseId] = useState('');
    const [fromVariantId, setFromVariantId] = useState('');
    const [toVariantId, setToVariantId] = useState('');
    const [quantityFrom, setQuantityFrom] = useState('1');
    const [quantityTo, setQuantityTo] = useState('');
    const [notes, setNotes] = useState('');

    const activeConversion = useMemo(
        () =>
            packagingConversions.find(
                (row) =>
                    row.from_variant_id === fromVariantId &&
                    row.to_variant_id === toVariantId,
            ),
        [packagingConversions, fromVariantId, toVariantId],
    );

    const toVariantOptions = useMemo(() => {
        if (!fromVariantId) {
            return variantOptions;
        }

        const allowedIds = new Set(
            packagingConversions
                .filter((row) => row.from_variant_id === fromVariantId)
                .map((row) => row.to_variant_id),
        );

        if (allowedIds.size === 0) {
            return variantOptions.filter((opt) => opt.value !== fromVariantId);
        }

        return variantOptions.filter((opt) => allowedIds.has(opt.value));
    }, [fromVariantId, packagingConversions, variantOptions]);

    useEffect(() => {
        if (open) {
            setWarehouseId(defaultWarehouseId);
            setFromVariantId(initialVariantId ?? '');
            setToVariantId('');
            setQuantityFrom('1');
            setQuantityTo('');
            setNotes('');
        }
    }, [open, defaultWarehouseId, initialVariantId]);

    useEffect(() => {
        if (!activeConversion) {
            return;
        }

        const fromQty = normalizeQty(quantityFrom);

        if (fromQty <= 0) {
            return;
        }

        const factor = Number(activeConversion.factor);

        if (Number.isNaN(factor) || factor <= 0) {
            return;
        }

        setQuantityTo(String(Number((fromQty * factor).toFixed(4))));
    }, [quantityFrom, activeConversion]);

    const resetForm = () => {
        setWarehouseId('');
        setFromVariantId('');
        setToVariantId('');
        setQuantityFrom('1');
        setQuantityTo('');
        setNotes('');
    };

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            resetForm();
        }

        onOpenChange(next);
    };

    const canSubmit =
        warehouseId &&
        fromVariantId &&
        toVariantId &&
        normalizeQty(quantityFrom) > 0 &&
        normalizeQty(quantityTo) > 0;

    return (
        <AppModal open={open} onOpenChange={handleOpenChange} size="xl">
            <Form
                key={open ? `breakdown-${defaultWarehouseId}` : 'breakdown-closed'}
                action={storeBreakdown.url()}
                method="post"
                onSuccess={() => handleOpenChange(false)}
                className="contents"
            >
                {({ processing, errors: formErrors }) => (
                    <>
                        <AppModalHeader
                            title="Desglose de empaque"
                            description="Convierte cajas o paquetes en unidades vendibles en el mismo almacén (ej. 1 caja → 24 unidades)."
                        />

                        <AppModalBody className="space-y-4">
                            <FormSection
                                title="Conversión"
                                gridClassName="grid gap-3 sm:grid-cols-2"
                            >
                                <FormSelectField
                                    id="breakdown-warehouse"
                                    name="warehouse_id"
                                    label="Almacén"
                                    required
                                    value={warehouseId}
                                    onValueChange={setWarehouseId}
                                    options={warehouseOptions}
                                    placeholder="Seleccionar almacén…"
                                    disabled={processing}
                                    fieldClassName="sm:col-span-2"
                                    error={
                                        errors.warehouse_id ??
                                        formErrors.warehouse_id
                                    }
                                />
                                <FormComboboxField
                                    key={
                                        open
                                            ? 'breakdown-from-open'
                                            : 'breakdown-from-closed'
                                    }
                                    id="breakdown-from-variant"
                                    name="from_variant_id"
                                    label="Desde (caja / paquete)"
                                    required
                                    value={fromVariantId}
                                    onValueChange={(v) => {
                                        setFromVariantId(v);
                                        setToVariantId('');
                                    }}
                                    options={variantOptions}
                                    placeholder="Buscar producto o SKU…"
                                    emptyMessage="Ninguna variante coincide."
                                    disabled={processing}
                                    error={
                                        errors.from_variant_id ??
                                        formErrors.from_variant_id
                                    }
                                />
                                <FormComboboxField
                                    key={
                                        open
                                            ? `breakdown-to-${fromVariantId}`
                                            : 'breakdown-to-closed'
                                    }
                                    id="breakdown-to-variant"
                                    name="to_variant_id"
                                    label="Hacia (unidad / paquete)"
                                    required
                                    value={toVariantId}
                                    onValueChange={setToVariantId}
                                    options={toVariantOptions}
                                    placeholder="Buscar producto o SKU…"
                                    emptyMessage="Ninguna variante coincide."
                                    disabled={processing || !fromVariantId}
                                    error={
                                        errors.to_variant_id ??
                                        formErrors.to_variant_id
                                    }
                                />
                                <FormTextField
                                    id="breakdown-qty-from"
                                    name="quantity_from"
                                    label="Cantidad origen"
                                    required
                                    value={quantityFrom}
                                    onChange={setQuantityFrom}
                                    inputMode="decimal"
                                    disabled={processing}
                                    error={
                                        errors.quantity_from ??
                                        formErrors.quantity_from
                                    }
                                />
                                <FormTextField
                                    id="breakdown-qty-to"
                                    name="quantity_to"
                                    label="Cantidad destino"
                                    required
                                    value={quantityTo}
                                    onChange={setQuantityTo}
                                    inputMode="decimal"
                                    hint={
                                        activeConversion
                                            ? `Factor guardado: 1 → ${activeConversion.factor}`
                                            : 'Define la conversión en el producto o ingresa manualmente.'
                                    }
                                    disabled={processing}
                                    error={
                                        errors.quantity_to ??
                                        formErrors.quantity_to
                                    }
                                />
                                <FormTextField
                                    id="breakdown-notes"
                                    name="notes"
                                    label="Notas"
                                    value={notes}
                                    onChange={setNotes}
                                    placeholder="Opcional"
                                    maxLength={500}
                                    disabled={processing}
                                />
                            </FormSection>
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
                                Desglosar
                            </Button>
                        </AppModalFooter>
                    </>
                )}
            </Form>
        </AppModal>
    );
}
