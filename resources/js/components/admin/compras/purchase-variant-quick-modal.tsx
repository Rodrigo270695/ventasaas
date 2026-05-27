import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

const btnToggleActive =
    'border-transparent bg-linear-to-r from-[#ec4899] to-[#7c3aed] text-white shadow-xs hover:opacity-95 hover:text-white';

const btnToggleInactive =
    'border-violet-200 bg-white text-[#5b21b6] hover:bg-violet-50 hover:text-[#5b21b6]';

const btnPrimary =
    'border-transparent bg-linear-to-r from-[#ec4899] to-[#7c3aed] font-bold text-white shadow-md shadow-violet-300/30 hover:opacity-95 hover:text-white disabled:opacity-50';

const btnCancel =
    'border-violet-200 text-[#5b21b6] hover:bg-violet-50 hover:text-[#5b21b6]';

const QUICK_VARIANT_URL = '/admin/compras/variantes-rapidas';

type ProductOption = { value: string; label: string };

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    productOptions: ProductOption[];
    onCreated: (variant: {
        value: string;
        label: string;
        sublabel?: string;
        unit_price?: string;
        track_stock?: boolean;
    }) => void;
};

export function PurchaseVariantQuickModal({
    open,
    onOpenChange,
    productOptions,
    onCreated,
}: Props) {
    const [mode, setMode] = useState<'existing' | 'new'>('existing');
    const [productId, setProductId] = useState('');
    const [productName, setProductName] = useState('');
    const [sku, setSku] = useState('');
    const [label, setLabel] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    const reset = () => {
        setMode('existing');
        setProductId('');
        setProductName('');
        setSku('');
        setLabel('');
        setError('');
        setProcessing(false);
    };

    const handleSubmit = async () => {
        setProcessing(true);
        setError('');

        const xsrf = document.cookie
            .split('; ')
            .find((row) => row.startsWith('XSRF-TOKEN='))
            ?.split('=')[1];

        try {
            const response = await fetch(QUICK_VARIANT_URL, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    ...(xsrf ? { 'X-XSRF-TOKEN': decodeURIComponent(xsrf) } : {}),
                },
                body: JSON.stringify({
                    product_id: mode === 'existing' ? productId : null,
                    product_name: mode === 'new' ? productName : null,
                    sku: sku.toUpperCase(),
                    label: label || null,
                }),
            });

            const body = (await response.json()) as {
                variant?: {
                    value: string;
                    label: string;
                    sublabel?: string;
                    unit_price?: string;
                };
                message?: string;
                errors?: Record<string, string[]>;
            };

            if (!response.ok) {
                const first = body.errors
                    ? Object.values(body.errors)[0]?.[0]
                    : body.message;
                setError(first ?? 'No se pudo crear el SKU.');

                return;
            }

            if (body.variant) {
                onCreated(body.variant);
            }

            reset();
            onOpenChange(false);
        } catch {
            setError('Error de conexión al crear el SKU.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AppModal
            open={open}
            onOpenChange={(next) => {
                if (!next) {
                    reset();
                }

                onOpenChange(next);
            }}
            size="sm"
        >
            <AppModalHeader
                title="Nuevo producto / SKU"
                description="Crea una variante en el catálogo para registrarla en la compra."
            />

            <AppModalBody className="space-y-4">
                <div className="flex gap-2">
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className={cn(
                            'cursor-pointer rounded-lg',
                            mode === 'existing'
                                ? btnToggleActive
                                : btnToggleInactive,
                        )}
                        onClick={() => setMode('existing')}
                    >
                        Producto existente
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className={cn(
                            'cursor-pointer rounded-lg',
                            mode === 'new' ? btnToggleActive : btnToggleInactive,
                        )}
                        onClick={() => setMode('new')}
                    >
                        Producto nuevo
                    </Button>
                </div>

                <FormSection gridClassName="grid grid-cols-1 gap-3">
                    {mode === 'existing' ? (
                        <FormComboboxField
                            id="quick-product-id"
                            name="product_id"
                            label="Producto"
                            required
                            value={productId}
                            onValueChange={setProductId}
                            options={productOptions}
                        />
                    ) : (
                        <FormTextField
                            id="quick-product-name"
                            name="product_name"
                            label="Nombre del producto"
                            required
                            value={productName}
                            onChange={setProductName}
                        />
                    )}
                    <FormTextField
                        id="quick-sku"
                        name="sku"
                        label="SKU"
                        required
                        value={sku}
                        onChange={(v) => setSku(v.toUpperCase())}
                        placeholder="EJ-001"
                    />
                    <FormTextField
                        id="quick-label"
                        name="label"
                        label="Presentación (opcional)"
                        value={label}
                        onChange={setLabel}
                    />
                </FormSection>

                {error ? (
                    <p className="text-sm text-red-600">{error}</p>
                ) : null}
            </AppModalBody>

            <AppModalFooter>
                <Button
                    type="button"
                    variant="outline"
                    className={cn('cursor-pointer rounded-xl', btnCancel)}
                    onClick={() => onOpenChange(false)}
                    disabled={processing}
                >
                    Cancelar
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    className={cn('cursor-pointer rounded-xl', btnPrimary)}
                    disabled={
                        processing ||
                        !sku ||
                        (mode === 'existing' ? !productId : !productName)
                    }
                    onClick={handleSubmit}
                >
                    {processing && <Spinner />}
                    Crear SKU
                </Button>
            </AppModalFooter>
        </AppModal>
    );
}
