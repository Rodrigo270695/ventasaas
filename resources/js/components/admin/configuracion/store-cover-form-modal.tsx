import { Form } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import {
    AppModal,
    AppModalBody,
    AppModalFooter,
    AppModalHeader,
} from '@/components/modal';
import {
    FormCheckboxField,
    FormFileField,
    FormSection,
    FormTextField,
} from '@/components/form';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type {
    StoreCoverFormValues,
    StoreCoversOldForm,
} from '@/types/admin/store-covers';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'create' | 'edit';
    slide?: StoreCoverFormValues | null;
    previewUrl?: string | null;
    errors?: Record<string, string>;
    oldForm?: StoreCoversOldForm;
};

const defaultOldForm: StoreCoversOldForm = {
    title: '',
    subtitle: '',
    is_active: true,
};

function resolveForm(
    open: boolean,
    oldForm: StoreCoversOldForm,
    slide?: StoreCoverFormValues | null,
): StoreCoversOldForm {
    if (!open) {
        return defaultOldForm;
    }

    if (oldForm.title || oldForm.subtitle) {
        return oldForm;
    }

    if (slide) {
        return {
            title: slide.title,
            subtitle: slide.subtitle,
            is_active: slide.is_active,
        };
    }

    return defaultOldForm;
}

export function StoreCoverFormModal({
    open,
    onOpenChange,
    mode,
    slide,
    previewUrl = null,
    errors = {},
    oldForm = defaultOldForm,
}: Props) {
    const isEdit = mode === 'edit' && slide != null;
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [localPreview, setLocalPreview] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            const values = resolveForm(true, oldForm, slide);
            setTitle(values.title);
            setSubtitle(values.subtitle);
            setIsActive(values.is_active);
            setImageFile(null);
            setLocalPreview(null);
            setFieldErrors(errors);
        }
    }, [open, slide?.id, oldForm, errors]);

    useEffect(() => {
        if (!imageFile) {
            setLocalPreview(null);

            return;
        }

        const objectUrl = URL.createObjectURL(imageFile);
        setLocalPreview(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [imageFile]);

    const resetForm = () => {
        setTitle('');
        setSubtitle('');
        setIsActive(true);
        setImageFile(null);
        setLocalPreview(null);
        setFieldErrors({});
    };

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            resetForm();
        }

        onOpenChange(next);
    };

    const message = (key: string, formErrors: Record<string, string>) =>
        fieldErrors[key] ?? formErrors[key] ?? errors[key];

    const action = isEdit
        ? `/admin/configuracion/portada/${slide!.id}`
        : '/admin/configuracion/portada';

    const displayPreview = localPreview ?? previewUrl;
    const canSubmit = isEdit ? true : imageFile !== null;

    const recommendedSize = useMemo(
        () => 'Recomendado: 1920×900 px o similar, JPG/PNG/WebP.',
        [],
    );

    return (
        <AppModal open={open} onOpenChange={handleOpenChange} size="lg">
            <Form
                key={open ? (slide?.id ?? 'new') : 'closed'}
                action={action}
                method="post"
                onSuccess={() => handleOpenChange(false)}
                className="contents"
            >
                {({ processing, errors: formErrors }) => (
                    <>
                        {isEdit && (
                            <input type="hidden" name="_method" value="PUT" />
                        )}

                        <AppModalHeader
                            title={
                                isEdit
                                    ? 'Editar foto de portada'
                                    : 'Subir foto de portada'
                            }
                            description="Estas imágenes se muestran en el carrusel principal del catálogo público."
                        />

                        <AppModalBody className="space-y-4">
                            {displayPreview ? (
                                <div className="overflow-hidden rounded-2xl border border-violet-100">
                                    <img
                                        src={displayPreview}
                                        alt="Vista previa de portada"
                                        className="aspect-[21/9] w-full object-cover"
                                    />
                                </div>
                            ) : null}

                            <FormSection
                                title="Imagen"
                                gridClassName="grid gap-3"
                            >
                                <FormFileField
                                    id="cover-image"
                                    name="image"
                                    label={
                                        isEdit
                                            ? 'Reemplazar imagen'
                                            : 'Imagen de portada'
                                    }
                                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                                    hint={recommendedSize}
                                    pickLabel="Seleccionar imagen"
                                    changeLabel="Cambiar imagen"
                                    error={message('image', formErrors)}
                                    disabled={processing}
                                    fieldClassName="sm:col-span-2"
                                    selectedFile={imageFile}
                                    onFileChange={setImageFile}
                                    removeExisting={false}
                                    onRemoveExistingChange={() => undefined}
                                />
                            </FormSection>

                            <FormSection
                                title="Contenido"
                                gridClassName="grid gap-3"
                            >
                                <FormTextField
                                    id="cover-title"
                                    name="title"
                                    label="Título"
                                    value={title}
                                    onChange={setTitle}
                                    placeholder="Ej. Novedades de temporada"
                                    error={message('title', formErrors)}
                                    disabled={processing}
                                />
                                <FormTextField
                                    id="cover-subtitle"
                                    name="subtitle"
                                    label="Subtítulo"
                                    value={subtitle}
                                    onChange={setSubtitle}
                                    placeholder="Texto breve sobre la promoción"
                                    error={message('subtitle', formErrors)}
                                    disabled={processing}
                                />
                                <FormCheckboxField
                                    id="cover-active"
                                    name="is_active"
                                    label="Visible en el catálogo"
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
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
                                {isEdit ? 'Guardar cambios' : 'Subir foto'}
                            </Button>
                        </AppModalFooter>
                    </>
                )}
            </Form>
        </AppModal>
    );
}
