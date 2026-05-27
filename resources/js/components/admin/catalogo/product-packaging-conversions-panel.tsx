import { router } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
    destroy as destroyConversion,
    store as storeConversion,
} from '@/routes/admin/catalogo/productos/conversiones-empaque';
import {
    FormSelectField,
    FormTextField,
} from '@/components/form';
import type { FormSelectOption } from '@/components/form';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type {
    PackagingConversionRow,
    ProductDetail,
} from '@/types/admin/products';

type Props = {
    product: ProductDetail;
    conversions: PackagingConversionRow[];
    canManage: boolean;
    errors?: Record<string, string>;
};

export function ProductPackagingConversionsPanel({
    product,
    conversions,
    canManage,
    errors = {},
}: Props) {
    const [fromVariantId, setFromVariantId] = useState('');
    const [toVariantId, setToVariantId] = useState('');
    const [factor, setFactor] = useState('');
    const [label, setLabel] = useState('');
    const [processing, setProcessing] = useState(false);

    const variantOptions: FormSelectOption[] = product.variants.map((v) => ({
        value: v.id,
        label: `${v.sku}${v.label ? ` · ${v.label}` : ''}`,
    }));

    const save = () => {
        if (!fromVariantId || !toVariantId || !factor.trim()) {
            return;
        }

        setProcessing(true);
        router.post(
            storeConversion.url({ producto: product.id }),
            {
                from_variant_id: fromVariantId,
                to_variant_id: toVariantId,
                factor: factor.replace(',', '.'),
                label: label || undefined,
            },
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            },
        );
    };

    const remove = (conversionId: string) => {
        setProcessing(true);
        router.delete(
            destroyConversion.url({
                producto: product.id,
                conversion: conversionId,
            }),
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <div className="space-y-4">
            <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#7c3aed]">
                    Conversiones de empaque
                </p>
                <p className="mt-0.5 text-[11px] text-[#7c6f8a]">
                    Define cuántas unidades salen de una caja o paquete. Se usan
                    al desglosar en Inventario → Saldos.
                </p>
            </div>

            {conversions.length > 0 ? (
                <ul className="space-y-2">
                    {conversions.map((row) => (
                        <li
                            key={row.id}
                            className="flex items-center justify-between gap-2 rounded-lg border border-violet-100/90 bg-violet-50/30 px-3 py-2"
                        >
                            <div className="min-w-0 text-sm">
                                <span className="font-mono font-semibold text-[#4c1d95]">
                                    {row.from_sku}
                                </span>
                                <span className="text-[#7c6f8a]"> → </span>
                                <span className="font-mono font-semibold text-[#4c1d95]">
                                    {row.to_sku}
                                </span>
                                <span className="ml-2 text-xs text-[#6d28d9]">
                                    × {row.factor}
                                </span>
                                {row.label ? (
                                    <span className="ml-1 text-xs text-[#7c6f8a]">
                                        ({row.label})
                                    </span>
                                ) : null}
                            </div>
                            {canManage && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="shrink-0 cursor-pointer text-red-600 hover:bg-red-50"
                                    disabled={processing}
                                    onClick={() => remove(row.id)}
                                    aria-label="Eliminar conversión"
                                >
                                    <Trash2 className="size-3.5" />
                                </Button>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-xs text-[#7c6f8a]">
                    Aún no hay conversiones. Agrega una abajo (ej. 1 caja = 24
                    unidades).
                </p>
            )}

            {canManage && product.variants.length >= 2 && (
                <div className="rounded-lg border border-dashed border-violet-200/90 bg-white/80 p-3">
                    <p className="mb-3 text-xs font-semibold text-[#5b4d6e]">
                        Nueva conversión
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <FormSelectField
                            id="conversion-from"
                            name="from_variant_id"
                            label="Desde"
                            value={fromVariantId}
                            onValueChange={setFromVariantId}
                            options={variantOptions}
                            placeholder="Caja / paquete"
                            disabled={processing}
                            error={errors.from_variant_id}
                        />
                        <FormSelectField
                            id="conversion-to"
                            name="to_variant_id"
                            label="Hacia"
                            value={toVariantId}
                            onValueChange={setToVariantId}
                            options={variantOptions.filter(
                                (opt) => opt.value !== fromVariantId,
                            )}
                            placeholder="Unidad"
                            disabled={processing}
                            error={errors.to_variant_id}
                        />
                        <FormTextField
                            id="conversion-factor"
                            name="factor"
                            label="Factor (1 origen = N destino)"
                            value={factor}
                            onChange={setFactor}
                            inputMode="decimal"
                            placeholder="Ej. 24"
                            disabled={processing}
                            error={errors.factor}
                        />
                        <FormTextField
                            id="conversion-label"
                            name="label"
                            label="Descripción"
                            value={label}
                            onChange={setLabel}
                            placeholder="Ej. Caja x24"
                            disabled={processing}
                        />
                    </div>
                    <div className="mt-3 flex justify-end">
                        <Button
                            type="button"
                            size="sm"
                            disabled={
                                processing ||
                                !fromVariantId ||
                                !toVariantId ||
                                !factor.trim()
                            }
                            className="cursor-pointer gap-1 rounded-lg bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
                            onClick={save}
                        >
                            {processing ? (
                                <Spinner />
                            ) : (
                                <Plus className="size-3.5" />
                            )}
                            Agregar conversión
                        </Button>
                    </div>
                </div>
            )}

            {product.variants.length < 2 && (
                <p className="text-xs text-amber-700">
                    Crea al menos dos variantes (caja y unidad) en la pestaña
                    Variantes.
                </p>
            )}
        </div>
    );
}
