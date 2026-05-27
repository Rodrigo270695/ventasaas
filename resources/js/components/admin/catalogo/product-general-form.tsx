import { Form } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { update } from '@/routes/admin/catalogo/productos';
import {
    FormCheckboxField,
    FormSection,
    FormSelectField,
    FormTextField,
} from '@/components/form';
import type { FormSelectOption } from '@/components/form';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { PRODUCT_TYPE_OPTIONS } from '@/lib/product-type-options';
import type { ProductDetail, ProductType } from '@/types/admin/products';

type Props = {
    product: ProductDetail;
    categoryOptions: FormSelectOption[];
    brandOptions: FormSelectOption[];
    unitOptions: FormSelectOption[];
    canUpdate: boolean;
    errors?: Record<string, string>;
};

const PRODUCT_GENERAL_FORM_ID = 'product-general-form';

export function ProductGeneralForm({
    product,
    categoryOptions,
    brandOptions,
    unitOptions,
    canUpdate,
    errors = {},
}: Props) {
    const [name, setName] = useState(product.name);
    const [description, setDescription] = useState(product.description ?? '');
    const [type, setType] = useState<ProductType>(product.type);
    const [categoryId, setCategoryId] = useState(product.category_id ?? '');
    const [brandId, setBrandId] = useState(product.brand_id ?? '');
    const [baseUnitId, setBaseUnitId] = useState(product.base_unit_id);
    const [trackStock, setTrackStock] = useState(product.track_stock);
    const [isActive, setIsActive] = useState(product.is_active);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        setName(product.name);
        setDescription(product.description ?? '');
        setType(product.type);
        setCategoryId(product.category_id ?? '');
        setBrandId(product.brand_id ?? '');
        setBaseUnitId(product.base_unit_id);
        setTrackStock(product.track_stock);
        setIsActive(product.is_active);
        setFieldErrors(errors);
    }, [product.id, product, errors]);

    const clearError = (key: string) => {
        if (fieldErrors[key]) {
            setFieldErrors((prev) => {
                const next = { ...prev };
                delete next[key];

                return next;
            });
        }
    };

    const handleTypeChange = (value: string) => {
        const next = value as ProductType;
        setType(next);

        if (next === 'service') {
            setTrackStock(false);
        }

        clearError('type');
    };

    const message = (key: string, formErrors: Record<string, string>) =>
        fieldErrors[key] ?? formErrors[key] ?? errors[key];

    const canSubmit =
        canUpdate &&
        name.trim().length > 0 &&
        baseUnitId.trim().length > 0;

    return (
        <div className="space-y-4">
            <Form
                id={PRODUCT_GENERAL_FORM_ID}
                action={update.url(product.id)}
                method="put"
                onStart={() => setSubmitting(true)}
                onFinish={() => setSubmitting(false)}
                options={{ preserveScroll: true }}
                className="space-y-4"
            >
                {({ processing, errors: formErrors }) => (
                    <>
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
                                onChange={(v) => {
                                    setName(v);
                                    clearError('name');
                                }}
                                placeholder="Nombre del producto"
                                error={message('name', formErrors)}
                                disabled={processing || !canUpdate}
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
                                disabled={processing || !canUpdate}
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
                                disabled={processing || !canUpdate}
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
                                disabled={processing || !canUpdate}
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
                                disabled={processing || !canUpdate}
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
                                disabled={processing || !canUpdate}
                                fieldClassName="sm:col-span-2"
                            />
                            <FormCheckboxField
                                id="product-track-stock"
                                name="track_stock"
                                label="Controlar stock"
                                checked={trackStock}
                                onCheckedChange={setTrackStock}
                                disabled={
                                    processing ||
                                    !canUpdate ||
                                    type === 'service'
                                }
                                hint={
                                    trackStock
                                        ? 'Las cantidades se cargan y corrigen en Inventario → Saldos por almacén.'
                                        : 'Los servicios no llevan inventario.'
                                }
                            />
                            <FormCheckboxField
                                id="product-active"
                                name="is_active"
                                label="Producto activo"
                                checked={isActive}
                                onCheckedChange={setIsActive}
                                disabled={processing || !canUpdate}
                            />
                        </FormSection>

                        {canUpdate && (
                            <div className="flex justify-end border-t border-violet-100/80 pt-4">
                                <Button
                                    type="submit"
                                    disabled={
                                        submitting || !canSubmit || processing
                                    }
                                    className="cursor-pointer rounded-xl bg-linear-to-r from-[#ec4899] to-[#7c3aed] font-bold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {(submitting || processing) && <Spinner />}
                                    Guardar producto
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </Form>
        </div>
    );
}
