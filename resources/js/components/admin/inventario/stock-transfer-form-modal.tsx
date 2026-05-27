import { Form } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { store as storeTransfer } from '@/routes/admin/inventario/saldos/traslados';
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

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    warehouseOptions: FormSelectOption[];
    variantOptions: FormComboboxOption[];
    defaultFromWarehouseId?: string;
    initialVariantId?: string | null;
    errors?: Record<string, string>;
};

export function StockTransferFormModal({
    open,
    onOpenChange,
    warehouseOptions,
    variantOptions,
    defaultFromWarehouseId = '',
    initialVariantId = null,
    errors = {},
}: Props) {
    const [fromWarehouseId, setFromWarehouseId] = useState('');
    const [toWarehouseId, setToWarehouseId] = useState('');
    const [variantId, setVariantId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (open) {
            setFromWarehouseId(defaultFromWarehouseId);
            setToWarehouseId('');
            setVariantId(initialVariantId ?? '');
            setQuantity('');
            setNotes('');
        }
    }, [open, defaultFromWarehouseId, initialVariantId]);

    const resetForm = () => {
        setFromWarehouseId('');
        setToWarehouseId('');
        setVariantId('');
        setQuantity('');
        setNotes('');
    };

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            resetForm();
        }

        onOpenChange(next);
    };

    const toWarehouseOptions = warehouseOptions.filter(
        (w) => w.value !== fromWarehouseId,
    );

    const canSubmit =
        fromWarehouseId &&
        toWarehouseId &&
        variantId &&
        quantity.trim().length > 0;

    return (
        <AppModal open={open} onOpenChange={handleOpenChange} size="md">
            <Form
                key={open ? `transfer-${defaultFromWarehouseId}` : 'transfer-closed'}
                action={storeTransfer.url()}
                method="post"
                onSuccess={() => handleOpenChange(false)}
                className="contents"
            >
                {({ processing, errors: formErrors }) => (
                    <>
                        <AppModalHeader
                            title="Traslado entre almacenes"
                            description="Mueve stock de bodega a mostrador (u otro almacén). El costo promedio viaja con la mercadería."
                        />

                        <AppModalBody className="space-y-4">
                            <FormSection
                                title="Traslado"
                                gridClassName="grid gap-3 sm:grid-cols-2"
                            >
                                <FormSelectField
                                    id="transfer-from-warehouse"
                                    name="from_warehouse_id"
                                    label="Almacén origen"
                                    required
                                    value={fromWarehouseId}
                                    onValueChange={setFromWarehouseId}
                                    options={warehouseOptions}
                                    placeholder="Ej. Bodega"
                                    disabled={processing}
                                    error={
                                        errors.from_warehouse_id ??
                                        formErrors.from_warehouse_id
                                    }
                                />
                                <FormSelectField
                                    id="transfer-to-warehouse"
                                    name="to_warehouse_id"
                                    label="Almacén destino"
                                    required
                                    value={toWarehouseId}
                                    onValueChange={setToWarehouseId}
                                    options={toWarehouseOptions}
                                    placeholder="Ej. Venta / mostrador"
                                    disabled={processing || !fromWarehouseId}
                                    error={
                                        errors.to_warehouse_id ??
                                        formErrors.to_warehouse_id
                                    }
                                />
                                <FormComboboxField
                                    key={
                                        open
                                            ? 'transfer-variant-open'
                                            : 'transfer-variant-closed'
                                    }
                                    id="transfer-variant"
                                    name="product_variant_id"
                                    label="Variante"
                                    required
                                    value={variantId}
                                    onValueChange={setVariantId}
                                    options={variantOptions}
                                    placeholder="Buscar producto o SKU…"
                                    emptyMessage="Ninguna variante coincide."
                                    disabled={processing}
                                    fieldClassName="sm:col-span-2"
                                    error={
                                        errors.product_variant_id ??
                                        formErrors.product_variant_id
                                    }
                                />
                                <FormTextField
                                    id="transfer-quantity"
                                    name="quantity"
                                    label="Cantidad a trasladar"
                                    required
                                    value={quantity}
                                    onChange={setQuantity}
                                    inputMode="decimal"
                                    placeholder="0.00"
                                    disabled={processing}
                                    fieldClassName="sm:col-span-2"
                                    error={
                                        errors.quantity ?? formErrors.quantity
                                    }
                                />
                                <FormTextField
                                    id="transfer-notes"
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
                                Trasladar
                            </Button>
                        </AppModalFooter>
                    </>
                )}
            </Form>
        </AppModal>
    );
}
