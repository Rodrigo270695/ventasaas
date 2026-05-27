import { Form } from '@inertiajs/react';
import { destroy } from '@/routes/admin/catalogo/categorias';
import {
    AppModal,
    AppModalBody,
    AppModalFooter,
    AppModalHeader,
} from '@/components/modal';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    category: { id: string; code: string; name: string } | null;
    isOffline?: boolean;
    onOfflineDelete?: (categoryId: string) => void;
};

export function CategoryDeleteModal({
    open,
    onOpenChange,
    category,
    isOffline = false,
    onOfflineDelete,
}: Props) {
    if (!category) {
        return null;
    }

    if (isOffline) {
        return (
            <AppModal open={open} onOpenChange={onOpenChange} size="sm">
                <AppModalHeader
                    title="Eliminar categoría"
                    description="Se eliminará localmente y se sincronizará al reconectar."
                />
                <AppModalBody>
                    <p className="text-sm text-[#6b5b7a]">
                        ¿Eliminar{' '}
                        <strong className="text-[#4c1d95]">
                            {category.name}
                        </strong>{' '}
                        ({category.code})?
                    </p>
                </AppModalBody>
                <AppModalFooter>
                    <Button
                        type="button"
                        variant="outline"
                        className="cursor-pointer rounded-xl border-violet-200"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        className="cursor-pointer rounded-xl"
                        onClick={() => {
                            onOfflineDelete?.(category.id);
                            onOpenChange(false);
                        }}
                    >
                        Eliminar
                    </Button>
                </AppModalFooter>
            </AppModal>
        );
    }

    return (
        <AppModal open={open} onOpenChange={onOpenChange} size="sm">
            <Form
                action={destroy.url(category.id)}
                method="delete"
                onSuccess={() => onOpenChange(false)}
                className="contents"
            >
                {({ processing }) => (
                    <>
                        <AppModalHeader
                            title="Eliminar categoría"
                            description="Esta acción no se puede deshacer."
                        />
                        <AppModalBody>
                            <p className="text-sm text-[#6b5b7a]">
                                ¿Eliminar{' '}
                                <strong className="text-[#4c1d95]">
                                    {category.name}
                                </strong>{' '}
                                ({category.code})?
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
                                variant="destructive"
                                disabled={processing}
                                className="cursor-pointer rounded-xl"
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
