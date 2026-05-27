import { Form } from '@inertiajs/react';
import { destroy } from '@/routes/admin/documentos/series';
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
    row: {
        id: string;
        series: string;
        document_type_label: string;
    } | null;
};

export function DocumentSeriesDeleteModal({ open, onOpenChange, row }: Props) {
    if (!row) {
        return null;
    }

    return (
        <AppModal open={open} onOpenChange={onOpenChange} size="sm">
            <Form
                action={destroy.url(row.id)}
                method="delete"
                onSuccess={() => onOpenChange(false)}
                className="contents"
            >
                {({ processing }) => (
                    <>
                        <AppModalHeader
                            title="Eliminar serie"
                            description="Esta acción no se puede deshacer."
                        />
                        <AppModalBody>
                            <p className="text-sm text-[#6b5b7a]">
                                ¿Eliminar la serie{' '}
                                <strong className="font-mono text-[#4c1d95]">
                                    {row.series}
                                </strong>{' '}
                                ({row.document_type_label})?
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
