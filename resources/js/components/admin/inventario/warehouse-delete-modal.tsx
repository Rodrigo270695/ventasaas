import { Form } from '@inertiajs/react';
import { destroy } from '@/routes/admin/inventario/almacenes';
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
    warehouse: { id: string; code: string; name: string } | null;
};

export function WarehouseDeleteModal({ open, onOpenChange, warehouse }: Props) {
    if (!warehouse) {
        return null;
    }

    return (
        <AppModal open={open} onOpenChange={onOpenChange} size="sm">
            <Form
                action={destroy.url(warehouse.id)}
                method="delete"
                onSuccess={() => onOpenChange(false)}
                className="contents"
            >
                {({ processing }) => (
                    <>
                        <AppModalHeader
                            title="Eliminar almacén"
                            description="Esta acción no se puede deshacer."
                        />
                        <AppModalBody>
                            <p className="text-sm text-[#6b5b7a]">
                                ¿Eliminar{' '}
                                <strong className="text-[#4c1d95]">
                                    {warehouse.name}
                                </strong>{' '}
                                ({warehouse.code})?
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
