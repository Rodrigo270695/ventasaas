import { Form } from '@inertiajs/react';
import { useEffect, useState, type FormEvent } from 'react';
import { store } from '@/routes/admin/catalogo/productos';
import {
    AppModal,
    AppModalBody,
    AppModalFooter,
    AppModalHeader,
} from '@/components/modal';
import {
    FormCheckboxField,
    FormSection,
    FormSelectField,
    FormTextField,
} from '@/components/form';
import type { FormSelectOption } from '@/components/form';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useAutoCodeFromName } from '@/hooks/use-auto-code-from-name';
import { sanitizeSku, suggestSkuFromName } from '@/lib/catalog-code';
import { PRODUCT_TYPE_OPTIONS } from '@/lib/product-type-options';
import type { ProductType, ProductsOldForm } from '@/types/admin/products';

const PRODUCT_FORM_ID = 'product-catalog-form';

export type ProductOfflinePayload = {
    name: string;
    description: string;
    type: ProductType;
    category_id: string;
    brand_id: string;
    base_unit_id: string;
    track_stock: boolean;
    is_active: boolean;
    initial_variant: {
        sku: string;
        label: string;
        barcode: string;
    };
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categoryOptions: FormSelectOption[];
    brandOptions: FormSelectOption[];
    unitOptions: FormSelectOption[];
    errors?: Record<string, string>;
    oldForm?: ProductsOldForm;
    isOffline?: boolean;
    onOfflineCreate?: (payload: ProductOfflinePayload) => void;
};

const defaultOldForm: ProductsOldForm = {
    name: '',
    description: '',
    type: 'good',
    category_id: '',
    brand_id: '',
    base_unit_id: '',
    track_stock: true,
    is_active: true,
    initial_variant: { sku: '', label: '', barcode: '' },
};

function resolveForm(open: boolean, oldForm: ProductsOldForm): ProductsOldForm {
    if (!open) {
        return defaultOldForm;
    }

    if (oldForm.name) {
        return oldForm;
    }

    return defaultOldForm;
}

export function ProductFormModal({
    open,
    onOpenChange,
    categoryOptions,
    brandOptions,
    unitOptions,
    errors = {},
    oldForm = defaultOldForm,
    isOffline = false,
    onOfflineCreate,
}: Props) {
    const {
        code: initialSku,
        resetCodeState,
        applyNameToCode,
        setCodeFromInput,
    } = useAutoCodeFromName('', false, {
        maxLength: 50,
        suggestLength: 8,
        suggestFromName: suggestSkuFromName,
        sanitize: sanitizeSku,
    });
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<ProductType>('good');
    const [categoryId, setCategoryId] = useState('');
    const [brandId, setBrandId] = useState('');
    const [baseUnitId, setBaseUnitId] = useState('');
    const [initialLabel, setInitialLabel] = useState('');
    const [initialBarcode, setInitialBarcode] = useState('');
    const [trackStock, setTrackStock] = useState(true);
    const [isActive, setIsActive] = useState(true);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            const values = resolveForm(true, oldForm);
            setName(values.name);
            setDescription(values.description);
            setType(values.type);
            setCategoryId(values.category_id);
            setBrandId(values.brand_id);
            setBaseUnitId(values.base_unit_id);
            setTrackStock(values.track_stock);
            setIsActive(values.is_active);
            resetCodeState(values.initial_variant.sku, false);
            setInitialLabel(values.initial_variant.label);
            setInitialBarcode(values.initial_variant.barcode);
            setFieldErrors(errors);
        }
    }, [open, oldForm, errors, resetCodeState]);

    const handleNameChange = (value: string) => {
        setName(value);
        applyNameToCode(value);
        clearError('name');
    };

    const handleTypeChange = (value: string) => {
        const next = value as ProductType;
        setType(next);

        if (next === 'service') {
            setTrackStock(false);
        }

        clearError('type');
    };

    const resetForm = () => {
        resetCodeState('', false);
        setName('');
        setDescription('');
        setType('good');
        setCategoryId('');
        setBrandId('');
        setBaseUnitId('');
        setInitialLabel('');
        setInitialBarcode('');
        setTrackStock(true);
        setIsActive(true);
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

    const canSubmit =
        name.trim().length > 0 &&
        baseUnitId.trim().length > 0 &&
        initialSku.trim().length > 0;

    const message = (key: string, formErrors: Record<string, string>) =>
        fieldErrors[key] ?? formErrors[key] ?? errors[key];

    const handleOfflineSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!canSubmit) {
            return;
        }

        onOfflineCreate?.({
            name,
            description,
            type,
            category_id: categoryId,
            brand_id: brandId,
            base_unit_id: baseUnitId,
            track_stock: trackStock,
            is_active: isActive,
            initial_variant: {
                sku: initialSku.trim(),
                label: initialLabel,
                barcode: initialBarcode,
            },
        });

        handleOpenChange(false);
    };

    const formFields = (processing: boolean, formErrors: Record<string, string>) => (
        <>
            {isOffline ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Sin internet: el producto se guardará localmente y se
                    sincronizará al reconectar.
                </p>
            ) : null}
            <FormSection
                                title="Datos del producto"
                                gridClassName="grid gap-3 sm:grid-cols-2"
                            >
                                <FormTextField
                                    id="product-name"
                                    name="name"
                                    label="Nombre"
                                    required
                                    value={name}
                                    onChange={handleNameChange}
                                    autoFocus
                                    placeholder="Nombre del producto"
                                    error={message('name', formErrors)}
                                    disabled={processing}
                                    fieldClassName="sm:col-span-2"
                                />
                                <FormSelectField
                                    id="product-type"
                                    name="type"
                                    label="Tipo"
                                    required
                                    value={type}
                                    onValueChange={handleTypeChange}
                                    options={PRODUCT_TYPE_OPTIONS}
                                    error={message('type', formErrors)}
                                    disabled={processing}
                                />
                                <FormTextField
                                    id="product-description"
                                    name="description"
                                    label="Descripción"
                                    value={description}
                                    onChange={(v) => {
                                        setDescription(v);
                                        clearError('description');
                                    }}
                                    placeholder="Opcional"
                                    maxLength={2000}
                                    error={message('description', formErrors)}
                                    disabled={processing}
                                />
                                <FormSelectField
                                    id="product-category"
                                    name="category_id"
                                    label="Categoría"
                                    value={categoryId}
                                    onValueChange={(v) => {
                                        setCategoryId(v);
                                        clearError('category_id');
                                    }}
                                    options={categoryOptions}
                                    emptyOptionLabel="Sin categoría"
                                    error={message('category_id', formErrors)}
                                    disabled={processing}
                                />
                                <FormSelectField
                                    id="product-brand"
                                    name="brand_id"
                                    label="Marca"
                                    value={brandId}
                                    onValueChange={(v) => {
                                        setBrandId(v);
                                        clearError('brand_id');
                                    }}
                                    options={brandOptions}
                                    emptyOptionLabel="Sin marca"
                                    error={message('brand_id', formErrors)}
                                    disabled={processing}
                                />
                                <FormSelectField
                                    id="product-unit"
                                    name="base_unit_id"
                                    label="Unidad de medida"
                                    required
                                    value={baseUnitId}
                                    onValueChange={(v) => {
                                        setBaseUnitId(v);
                                        clearError('base_unit_id');
                                    }}
                                    options={unitOptions}
                                    placeholder="Seleccionar unidad"
                                    error={message('base_unit_id', formErrors)}
                                    disabled={processing}
                                    fieldClassName="sm:col-span-2"
                                />
                                <FormCheckboxField
                                    id="product-track-stock"
                                    name="track_stock"
                                    label="Controlar stock"
                                    checked={trackStock}
                                    onCheckedChange={setTrackStock}
                                    disabled={
                                        processing || type === 'service'
                                    }
                                    hint={
                                        trackStock
                                            ? 'Podrás cargar cantidades en Inventario → Saldos.'
                                            : 'Los servicios no llevan inventario.'
                                    }
                                />
                                <FormCheckboxField
                                    id="product-active"
                                    name="is_active"
                                    label="Producto activo"
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
                                    disabled={processing}
                                />
                            </FormSection>

                            <FormSection
                                title="Variante principal"
                                gridClassName="grid gap-3 sm:grid-cols-2"
                            >
                                <p className="text-[11px] text-[#7c6f8a] sm:col-span-2">
                                    Es la primera forma de vender este producto.
                                    Luego podrás agregar más en la ficha
                                    (tallas, colores, presentaciones).
                                </p>
                                <FormTextField
                                    id="product-initial-sku"
                                    name="initial_variant[sku]"
                                    label="SKU"
                                    required
                                    value={initialSku}
                                    onChange={(v) => {
                                        setCodeFromInput(v);
                                        clearError('initial_variant.sku');
                                    }}
                                    maxLength={50}
                                    hint="Sugerido desde el nombre."
                                    error={message(
                                        'initial_variant.sku',
                                        formErrors,
                                    )}
                                    disabled={processing}
                                />
                                <FormTextField
                                    id="product-initial-label"
                                    name="initial_variant[label]"
                                    label="Presentación"
                                    value={initialLabel}
                                    onChange={(v) => {
                                        setInitialLabel(v);
                                        clearError('initial_variant.label');
                                    }}
                                    placeholder="Ej. Estándar, 1 kg"
                                    maxLength={120}
                                    error={message(
                                        'initial_variant.label',
                                        formErrors,
                                    )}
                                    disabled={processing}
                                />
                                <FormTextField
                                    id="product-initial-barcode"
                                    name="initial_variant[barcode]"
                                    label="Código de barras"
                                    value={initialBarcode}
                                    onChange={(v) => {
                                        setInitialBarcode(v);
                                        clearError('initial_variant.barcode');
                                    }}
                                    placeholder="EAN / UPC"
                                    maxLength={50}
                                    hint="Del SKU que vendes en POS o inventario."
                                    error={message(
                                        'initial_variant.barcode',
                                        formErrors,
                                    )}
                                    disabled={processing}
                                    fieldClassName="sm:col-span-2"
                                />
                            </FormSection>
        </>
    );

    const footer = (processing: boolean) => (
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
                form={PRODUCT_FORM_ID}
                disabled={processing || !canSubmit}
                className="cursor-pointer rounded-xl bg-linear-to-r from-[#ec4899] to-[#7c3aed] font-bold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {processing && <Spinner />}
                Guardar producto
            </Button>
        </AppModalFooter>
    );

    if (isOffline) {
        return (
            <AppModal open={open} onOpenChange={handleOpenChange} size="lg">
                <AppModalHeader
                    title="Nuevo producto"
                    description="Registra el producto y su primera variante. Se sincronizará al reconectar."
                />
                <AppModalBody className="max-h-[min(75vh,36rem)] space-y-4 overflow-y-auto pr-1">
                    <form
                        id={PRODUCT_FORM_ID}
                        onSubmit={handleOfflineSubmit}
                        className="space-y-4"
                    >
                        {formFields(false, {})}
                    </form>
                </AppModalBody>
                {footer(submitting)}
            </AppModal>
        );
    }

    return (
        <AppModal open={open} onOpenChange={handleOpenChange} size="lg">
            <AppModalHeader
                title="Nuevo producto"
                description="Registra el producto y su primera variante. Luego podrás completar precios, impuestos y stock en la ficha."
            />

            <AppModalBody className="max-h-[min(75vh,36rem)] space-y-4 overflow-y-auto pr-1">
                <Form
                    key={open ? 'new' : 'closed'}
                    id={PRODUCT_FORM_ID}
                    action={store.url()}
                    method="post"
                    onStart={() => setSubmitting(true)}
                    onFinish={() => setSubmitting(false)}
                    onSuccess={() => handleOpenChange(false)}
                    options={{ preserveScroll: true }}
                    className="space-y-4"
                >
                    {({ processing, errors: formErrors }) =>
                        formFields(processing, formErrors)
                    }
                </Form>
            </AppModalBody>

            {footer(submitting)}
        </AppModal>
    );
}
