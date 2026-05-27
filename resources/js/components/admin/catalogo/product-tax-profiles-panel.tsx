import { router } from '@inertiajs/react';
import { Check, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    destroy as destroyTaxProfile,
    store as storeTaxProfile,
    update as updateTaxProfile,
} from '@/routes/admin/catalogo/productos/perfiles-tributarios';
import { FormSelectField, FormTextField } from '@/components/form';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import type {
    ProductVariantRow,
    ProductVariantTaxProfileRow,
    TaxProfileOption,
} from '@/types/admin/products';

type Props = {
    productId: string;
    variants: ProductVariantRow[];
    taxProfileOptions: TaxProfileOption[];
    canManage: boolean;
    errors?: Record<string, string>;
};

type VariantTaxEditorProps = {
    productId: string;
    variant: ProductVariantRow;
    taxProfileOptions: TaxProfileOption[];
    existing: ProductVariantTaxProfileRow | null;
    canManage: boolean;
    error?: string;
};

function VariantTaxEditor({
    productId,
    variant,
    taxProfileOptions,
    existing,
    canManage,
    error,
}: VariantTaxEditorProps) {
    const defaultTemplate =
        taxProfileOptions.find((row) => row.is_default) ??
        taxProfileOptions[0];

    const [taxProfileId, setTaxProfileId] = useState(
        existing?.tax_profile_id ?? defaultTemplate?.value ?? '',
    );
    const [affectationCode, setAffectationCode] = useState(
        existing?.sunat_affectation_code ??
            defaultTemplate?.sunat_affectation_code ??
            '10',
    );
    const [igvRate, setIgvRate] = useState(
        existing?.igv_rate ?? defaultTemplate?.igv_rate ?? '18',
    );
    const [iscRate, setIscRate] = useState(existing?.isc_rate ?? '');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (existing) {
            setTaxProfileId(existing.tax_profile_id ?? '');
            setAffectationCode(existing.sunat_affectation_code);
            setIgvRate(existing.igv_rate);
            setIscRate(existing.isc_rate ?? '');

            return;
        }

        if (defaultTemplate) {
            setTaxProfileId(defaultTemplate.value);
            setAffectationCode(defaultTemplate.sunat_affectation_code);
            setIgvRate(defaultTemplate.igv_rate);
            setIscRate(defaultTemplate.isc_rate);
        }
    }, [existing, defaultTemplate]);

    const applyTemplate = (templateId: string) => {
        setTaxProfileId(templateId);

        const template = taxProfileOptions.find((row) => row.value === templateId);

        if (template) {
            setAffectationCode(template.sunat_affectation_code);
            setIgvRate(template.igv_rate);
            setIscRate(template.isc_rate);
        }
    };

    const save = () => {
        if (!taxProfileId || !affectationCode || !igvRate.trim()) {
            return;
        }

        setProcessing(true);

        const payload = {
            tax_profile_id: taxProfileId,
            sunat_affectation_code: affectationCode,
            igv_rate: igvRate.trim().replace(',', '.'),
            isc_rate: iscRate.trim() ? iscRate.trim().replace(',', '.') : null,
        };

        const options = {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        };

        if (existing) {
            router.put(
                updateTaxProfile.url({
                    producto: productId,
                    perfil: existing.id,
                }),
                payload,
                options,
            );

            return;
        }

        router.post(
            storeTaxProfile.url({ producto: productId }),
            {
                product_variant_id: variant.id,
                ...payload,
            },
            options,
        );
    };

    const remove = () => {
        if (!existing) {
            return;
        }

        setProcessing(true);
        router.delete(
            destroyTaxProfile.url({
                producto: productId,
                perfil: existing.id,
            }),
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            },
        );
    };

    if (!canManage) {
        return (
            <p className="text-xs text-[#6b5b7a]">
                {existing
                    ? `${existing.tax_profile_code ?? existing.sunat_affectation_code} · IGV ${existing.igv_rate}%`
                    : 'Sin perfil tributario'}
            </p>
        );
    }

    if (taxProfileOptions.length === 0) {
        return (
            <p className="text-xs text-[#7c6f8a]">
                Crea perfiles en Catálogo → Perfiles tributarios.
            </p>
        );
    }

    return (
        <div className="space-y-3">
            <FormSelectField
                id={`tax-template-${variant.id}`}
                name={`tax_profile_id_${variant.id}`}
                label="Perfil tributario"
                required
                value={taxProfileId}
                onValueChange={applyTemplate}
                options={taxProfileOptions}
                disabled={processing}
            />
            <div className="grid gap-3 sm:grid-cols-3">
                <FormTextField
                    id={`tax-affectation-${variant.id}`}
                    name={`sunat_affectation_code_${variant.id}`}
                    label="Afectación"
                    value={affectationCode}
                    onChange={setAffectationCode}
                    maxLength={2}
                    disabled={processing}
                    className="font-mono"
                />
                <FormTextField
                    id={`tax-igv-${variant.id}`}
                    name={`igv_rate_${variant.id}`}
                    label="IGV %"
                    value={igvRate}
                    onChange={setIgvRate}
                    inputMode="decimal"
                    disabled={processing}
                    error={error}
                />
                <FormTextField
                    id={`tax-isc-${variant.id}`}
                    name={`isc_rate_${variant.id}`}
                    label="ISC %"
                    value={iscRate}
                    onChange={setIscRate}
                    placeholder="Opc."
                    inputMode="decimal"
                    disabled={processing}
                />
            </div>
            <div className="flex justify-end gap-2">
                {existing && (
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={processing}
                        className="cursor-pointer text-red-600 hover:bg-red-50"
                        onClick={remove}
                    >
                        <Trash2 className="mr-1 size-3.5" />
                        Quitar
                    </Button>
                )}
                <Button
                    type="button"
                    size="sm"
                    disabled={processing || !taxProfileId}
                    className="cursor-pointer rounded-lg bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
                    onClick={save}
                >
                    {processing ? (
                        <Spinner />
                    ) : (
                        <Check className="mr-1 size-3.5" />
                    )}
                    Guardar perfil
                </Button>
            </div>
        </div>
    );
}

export function ProductTaxProfilesPanel({
    productId,
    variants,
    taxProfileOptions,
    canManage,
    errors = {},
}: Props) {
    const globalError =
        errors.igv_rate ??
        errors.sunat_affectation_code ??
        errors.tax_profile_id ??
        errors.product_variant_id;

    return (
        <div className="space-y-3 border-t border-violet-100/90 pt-4">
            <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#7c3aed]">
                    Perfil tributario (SUNAT)
                </p>
                <p className="mt-0.5 text-[11px] text-[#7c6f8a]">
                    Un perfil por variante. Pulsa «Guardar perfil» en cada una.
                    «Guardar datos» no aplica aquí.
                </p>
            </div>

            {globalError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 ring-1 ring-red-100">
                    {globalError}
                </p>
            )}

            <ul className="space-y-3">
                {variants.map((variant) => (
                    <li
                        key={variant.id}
                        className={cn(
                            'rounded-lg border px-3 py-3',
                            variant.is_default
                                ? 'border-[#7c3aed]/35 bg-violet-50/40'
                                : 'border-violet-100/90 bg-white/80',
                        )}
                    >
                        <p className="mb-2 font-mono text-sm font-semibold text-[#4c1d95]">
                            {variant.sku}
                            {variant.label ? (
                                <span className="ml-2 font-sans text-xs font-normal text-[#6b5b7a]">
                                    {variant.label}
                                </span>
                            ) : null}
                        </p>
                        <VariantTaxEditor
                            productId={productId}
                            variant={variant}
                            taxProfileOptions={taxProfileOptions}
                            existing={variant.tax_profile}
                            canManage={canManage}
                            error={errors.igv_rate}
                        />
                    </li>
                ))}
            </ul>
        </div>
    );
}
