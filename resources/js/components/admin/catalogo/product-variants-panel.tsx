import { router } from '@inertiajs/react';
import { Check, Pencil, Plus, Star, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    destroy as destroyVariant,
    store as storeVariant,
    update as updateVariant,
} from '@/routes/admin/catalogo/productos/variantes';
import { FormCheckboxField, FormTextField } from '@/components/form';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useAutoCodeFromName } from '@/hooks/use-auto-code-from-name';
import { sanitizeSku } from '@/lib/catalog-code';
import { cn } from '@/lib/utils';
import type { ProductVariantRow } from '@/types/admin/products';

type Props = {
    productId: string;
    productName: string;
    variants: ProductVariantRow[];
    canManage: boolean;
    canDelete: boolean;
    errors?: Record<string, string>;
};

function VariantBadges({
    isDefault,
    isActive,
}: {
    isDefault: boolean;
    isActive: boolean;
}) {
    return (
        <div className="flex flex-wrap gap-1">
            {isDefault && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-[#7c3aed]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#6d28d9] ring-1 ring-[#7c3aed]/25">
                    <Star className="size-2.5 fill-current" />
                    Principal
                </span>
            )}
            <span
                className={cn(
                    'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                    isActive
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80'
                        : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80',
                )}
            >
                {isActive ? 'Activa' : 'Inactiva'}
            </span>
        </div>
    );
}

type VariantEditFormProps = {
    productId: string;
    variant: ProductVariantRow;
    onCancel: () => void;
    errors: Record<string, string>;
};

function toTwoDecimals(value: string): string {
    const normalized = value.replace(',', '.').trim();
    const parsed = Number(normalized === '' ? 0 : normalized);

    if (!Number.isFinite(parsed)) {
        return '0.00';
    }

    return parsed.toFixed(2);
}

function VariantEditForm({
    productId,
    variant,
    onCancel,
    errors,
}: VariantEditFormProps) {
    const [sku, setSku] = useState(variant.sku);
    const [label, setLabel] = useState(variant.label ?? '');
    const [barcode, setBarcode] = useState(variant.barcode ?? '');
    const [minimumStock, setMinimumStock] = useState(
        toTwoDecimals(variant.minimum_stock ?? '0'),
    );
    const [isDefault, setIsDefault] = useState(variant.is_default);
    const [isActive, setIsActive] = useState(variant.is_active);
    const [processing, setProcessing] = useState(false);

    const submit = () => {
        setProcessing(true);
        router.put(
            updateVariant.url({ producto: productId, variante: variant.id }),
            {
                sku,
                label: label || null,
                barcode: barcode || null,
                minimum_stock: minimumStock || 0,
                is_default: isDefault,
                is_active: isActive,
            },
            {
                preserveScroll: true,
                onSuccess: () => onCancel(),
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <div className="rounded-lg border border-violet-200/90 bg-white p-3">
            <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                    <FormTextField
                        id={`variant-edit-sku-${variant.id}`}
                        name="sku"
                        label="SKU"
                        required
                        value={sku}
                        onChange={(v) => setSku(sanitizeSku(v))}
                        maxLength={50}
                        error={errors.sku}
                        disabled={processing}
                    />
                    <FormTextField
                        id={`variant-edit-label-${variant.id}`}
                        name="label"
                        label="Presentación"
                        value={label}
                        onChange={setLabel}
                        placeholder="Ej. Rojo / M"
                        maxLength={120}
                        error={errors.label}
                        disabled={processing}
                    />
                    <FormTextField
                        id={`variant-edit-barcode-${variant.id}`}
                        name="barcode"
                        label="Código de barras"
                        value={barcode}
                        onChange={setBarcode}
                        maxLength={50}
                        placeholder="EAN / UPC"
                        error={errors.barcode}
                        disabled={processing}
                        fieldClassName="sm:col-span-2"
                    />
                    <FormTextField
                        id={`variant-edit-minimum-stock-${variant.id}`}
                        name="minimum_stock"
                        label="Stock mínimo"
                        type="number"
                        value={minimumStock}
                        onChange={setMinimumStock}
                        onBlur={() => setMinimumStock((prev) => toTwoDecimals(prev))}
                        step="0.01"
                        min={0}
                        placeholder="0"
                        error={errors.minimum_stock}
                        disabled={processing}
                    />
                </div>
                <div className="flex flex-wrap gap-4">
                    <FormCheckboxField
                        id={`variant-edit-default-${variant.id}`}
                        name="is_default"
                        label="Variante principal"
                        checked={isDefault}
                        onCheckedChange={setIsDefault}
                        disabled={processing}
                    />
                    <FormCheckboxField
                        id={`variant-edit-active-${variant.id}`}
                        name="is_active"
                        label="Activa"
                        checked={isActive}
                        onCheckedChange={setIsActive}
                        disabled={processing}
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="cursor-pointer rounded-lg border-violet-200"
                        onClick={onCancel}
                        disabled={processing}
                    >
                        <X className="mr-1 size-3.5" />
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        disabled={processing || !sku.trim()}
                        className="cursor-pointer rounded-lg bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
                        onClick={submit}
                    >
                        {processing ? <Spinner /> : <Check className="mr-1 size-3.5" />}
                        Guardar
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function ProductVariantsPanel({
    productId,
    productName,
    variants,
    canManage,
    canDelete,
    errors = {},
}: Props) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const {
        code: newSku,
        applyNameToCode,
        setCodeFromInput,
        resetCodeState,
    } = useAutoCodeFromName('', false, {
        maxLength: 50,
        suggestLength: 8,
        sanitize: sanitizeSku,
    });
    const [newLabel, setNewLabel] = useState('');
    const [newBarcode, setNewBarcode] = useState('');
    const [newMinimumStock, setNewMinimumStock] = useState('0.00');

    useEffect(() => {
        if (editingId && !variants.some((variant) => variant.id === editingId)) {
            setEditingId(null);
        }
    }, [variants, editingId]);

    useEffect(() => {
        if (deletingId && !variants.some((variant) => variant.id === deletingId)) {
            setDeletingId(null);
        }
    }, [variants, deletingId]);

    const handleSuggestSku = (name: string) => {
        const base = name.trim() || productName;
        applyNameToCode(base);
    };

    const submitNewVariant = () => {
        setAdding(true);
        router.post(
            storeVariant.url({ producto: productId }),
            {
                sku: newSku,
                label: newLabel || null,
                barcode: newBarcode || null,
                minimum_stock: newMinimumStock || 0,
                is_active: true,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowAddForm(false);
                    resetCodeState('', false);
                    setNewLabel('');
                    setNewBarcode('');
                    setNewMinimumStock('0');
                },
                onFinish: () => setAdding(false),
            },
        );
    };

    const deleteVariant = (variantId: string) => {
        setDeletingId(variantId);
        router.delete(
            destroyVariant.url({ producto: productId, variante: variantId }),
            {
                preserveScroll: true,
                onFinish: () => setDeletingId(null),
            },
        );
    };

    return (
        <div className="space-y-3 border-t border-violet-100/90 pt-4">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#7c3aed]">
                        Variantes de venta
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#7c6f8a]">
                        Cada variante tiene su SKU y su código de barras
                        (escáner en POS).
                    </p>
                </div>
                <span className="shrink-0 rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-[#5b21b6]">
                    {variants.length}
                </span>
            </div>

            <ul className="space-y-2">
                {variants.map((variant) => (
                    <li key={variant.id}>
                        {editingId === variant.id && canManage ? (
                            <VariantEditForm
                                productId={productId}
                                variant={variant}
                                onCancel={() => setEditingId(null)}
                                errors={errors}
                            />
                        ) : (
                            <div
                                className={cn(
                                    'flex flex-col gap-2 rounded-lg border px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between',
                                    variant.is_default
                                        ? 'border-[#7c3aed]/35 bg-violet-50/50'
                                        : 'border-violet-100/90 bg-white/80',
                                )}
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="font-mono text-sm font-semibold text-[#4c1d95]">
                                        {variant.sku}
                                    </p>
                                    <p className="truncate text-xs text-[#6b5b7a]">
                                        {variant.label || 'Sin presentación'}
                                        {variant.barcode
                                            ? ` · C.B. ${variant.barcode}`
                                            : ''}
                                    </p>
                                    <p className="mt-0.5 text-[11px] font-medium text-amber-700">
                                        Stock mínimo: {variant.minimum_stock}
                                    </p>
                                    <div className="mt-1.5">
                                        <VariantBadges
                                            isDefault={variant.is_default}
                                            isActive={variant.is_active}
                                        />
                                    </div>
                                </div>
                                {(canManage || canDelete) && (
                                    <div className="flex shrink-0 gap-1 self-end sm:self-center">
                                        {canManage && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 cursor-pointer rounded-lg text-[#7c3aed] hover:bg-[#7c3aed] hover:text-white"
                                                onClick={() =>
                                                    setEditingId(variant.id)
                                                }
                                                aria-label={`Editar variante ${variant.sku}`}
                                            >
                                                <Pencil className="size-4" />
                                            </Button>
                                        )}
                                        {canDelete && variants.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                disabled={
                                                    deletingId === variant.id
                                                }
                                                className="size-8 cursor-pointer rounded-lg text-red-600 hover:bg-red-600 hover:text-white"
                                                onClick={() =>
                                                    deleteVariant(variant.id)
                                                }
                                                aria-label={`Eliminar variante ${variant.sku}`}
                                            >
                                                {deletingId === variant.id ? (
                                                    <Spinner />
                                                ) : (
                                                    <Trash2 className="size-4" />
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </li>
                ))}
            </ul>

            {canManage && (
                <div className="space-y-2">
                    {!showAddForm ? (
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full cursor-pointer rounded-xl border-dashed border-violet-300 text-[#6d28d9] hover:bg-violet-50"
                            onClick={() => {
                                setShowAddForm(true);
                                handleSuggestSku(productName);
                            }}
                        >
                            <Plus className="mr-2 size-4" />
                            Agregar variante
                        </Button>
                    ) : (
                        <div className="rounded-lg border border-dashed border-violet-200 bg-violet-50/40 p-3">
                            <div className="space-y-3">
                                <p className="text-xs font-semibold text-[#4c1d95]">
                                    Nueva variante
                                </p>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <FormTextField
                                        id="variant-new-sku"
                                        name="sku"
                                        label="SKU"
                                        required
                                        value={newSku}
                                        onChange={(v) => setCodeFromInput(v)}
                                        maxLength={50}
                                        error={errors.sku}
                                        disabled={adding}
                                    />
                                    <FormTextField
                                        id="variant-new-label"
                                        name="label"
                                        label="Presentación"
                                        value={newLabel}
                                        onChange={setNewLabel}
                                        placeholder="Ej. 500 ml, Azul L"
                                        maxLength={120}
                                        error={errors.label}
                                        disabled={adding}
                                    />
                                    <FormTextField
                                        id="variant-new-barcode"
                                        name="barcode"
                                        label="Código de barras"
                                        value={newBarcode}
                                        onChange={setNewBarcode}
                                        maxLength={50}
                                        placeholder="EAN / UPC"
                                        error={errors.barcode}
                                        disabled={adding}
                                        fieldClassName="sm:col-span-2"
                                    />
                                    <FormTextField
                                        id="variant-new-minimum-stock"
                                        name="minimum_stock"
                                        label="Stock mínimo"
                                        type="number"
                                        value={newMinimumStock}
                                        onChange={setNewMinimumStock}
                                        onBlur={() => setNewMinimumStock((prev) => toTwoDecimals(prev))}
                                        step="0.01"
                                        min={0}
                                        placeholder="0"
                                        error={errors.minimum_stock}
                                        disabled={adding}
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="cursor-pointer rounded-lg border-violet-200"
                                        onClick={() => {
                                            setShowAddForm(false);
                                            resetCodeState('', false);
                                        }}
                                        disabled={adding}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={adding || !newSku.trim()}
                                        className="cursor-pointer rounded-lg bg-linear-to-r from-[#ec4899] to-[#7c3aed] font-semibold text-white"
                                        onClick={submitNewVariant}
                                    >
                                        {adding && <Spinner />}
                                        Agregar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
