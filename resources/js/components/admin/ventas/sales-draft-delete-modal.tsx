import { Form } from '@inertiajs/react';
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
    destroyUrl: string;
    documentLabel?: string | null;
    isInternal?: boolean;
};

export function SalesDraftDeleteModal({
    open,
    onOpenChange,
    destroyUrl,
    documentLabel,
    isInternal = false,
}: Props) {
    const kind = isInternal ? 'ticket interno' : 'comprobante';
    const reference = documentLabel?.trim() || 'este borrador';

    return (
        <AppModal open={open} onOpenChange={onOpenChange} size="sm">
            <Form
                action={destroyUrl}
                method="delete"
                onSuccess={() => onOpenChange(false)}
                className="contents"
            >
                {({ processing }) => (
                    <>
                        <AppModalHeader
                            title="Eliminar borrador"
                            description="Esta acción no se puede deshacer."
                        />
                        <AppModalBody>
                            <p className="text-sm leading-relaxed text-[#6b5b7a]">
                                ¿Eliminar el borrador del {kind}{' '}
                                <strong className="text-[#4c1d95]">
                                    {reference}
                                </strong>
                                ? Se perderán las líneas y los datos no
                                guardados en otra sesión.
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
                                Eliminar borrador
                            </Button>
                        </AppModalFooter>
                    </>
                )}
            </Form>
        </AppModal>
    );
}
