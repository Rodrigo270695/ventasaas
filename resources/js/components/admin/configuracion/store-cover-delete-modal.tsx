import { Form } from '@inertiajs/react';
import {
    AppModal,
    AppModalBody,
    AppModalFooter,
    AppModalHeader,
} from '@/components/modal';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { StoreCoverSlideRow } from '@/types/admin/store-covers';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    slide: StoreCoverSlideRow | null;
};

export function StoreCoverDeleteModal({
    open,
    onOpenChange,
    slide,
}: Props) {
    if (!slide) {
        return null;
    }

    return (
        <AppModal open={open} onOpenChange={onOpenChange} size="sm">
            <Form
                action={`/admin/configuracion/portada/${slide.id}`}
                method="post"
                onSuccess={() => onOpenChange(false)}
                className="contents"
            >
                {({ processing }) => (
                    <>
                        <input type="hidden" name="_method" value="DELETE" />

                        <AppModalHeader
                            title="Eliminar foto de portada"
                            description="Se quitará del carrusel del catálogo público."
                        />
                        <AppModalBody>
                            {slide.image_url ? (
                                <img
                                    src={slide.image_url}
                                    alt={slide.title ?? 'Portada'}
                                    className="mb-4 aspect-[21/9] w-full rounded-xl object-cover"
                                />
                            ) : null}
                            <p className="text-sm text-[#6b5b7a]">
                                ¿Eliminar{' '}
                                <strong className="text-[#4c1d95]">
                                    {slide.title ?? 'esta foto'}
                                </strong>
                                ?
                            </p>
                        </AppModalBody>
                        <AppModalFooter>
                            <Button
                                type="button"
                                variant="outline"
                                className="cursor-pointer rounded-xl border-violet-200"
                                onClick={() => onOpenChange(false)}
                                disabled={processing}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="cursor-pointer rounded-xl bg-red-600 font-bold text-white hover:bg-red-700"
                            >
                                {processing && <Spinner />}
                                Eliminar
                            </Button>
                        </AppModalFooter>
                    </>
                )}
            </Form>
        </AppModal>
    );
}
