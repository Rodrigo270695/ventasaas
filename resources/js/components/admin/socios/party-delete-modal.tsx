import { Form } from '@inertiajs/react';
import { destroy } from '@/routes/admin/socios';
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
    party: {
        id: string;
        legal_name: string;
        document_label: string;
    } | null;
    isOffline?: boolean;
    onOfflineDelete?: (partyId: string) => void;
};

export function PartyDeleteModal({
    open,
    onOpenChange,
    party,
    isOffline = false,
    onOfflineDelete,
}: Props) {
    if (!party) {
        return null;
    }

    if (isOffline) {
        return (
            <AppModal open={open} onOpenChange={onOpenChange} size="sm">
                <AppModalHeader
                    title="Eliminar socio"
                    description="Se eliminará localmente y se sincronizará al reconectar."
                />
                <AppModalBody>
                    <p className="text-sm text-[#6b5b7a]">
                        ¿Eliminar{' '}
                        <strong className="text-[#4c1d95]">
                            {party.legal_name}
                        </strong>{' '}
                        ({party.document_label})?
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
                            onOfflineDelete?.(party.id);
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
                action={destroy.url(party.id)}
                method="delete"
                onSuccess={() => onOpenChange(false)}
                className="contents"
            >
                {({ processing }) => (
                    <>
                        <AppModalHeader
                            title="Eliminar socio"
                            description="Esta acción no se puede deshacer."
                        />
                        <AppModalBody>
                            <p className="text-sm text-[#6b5b7a]">
                                ¿Eliminar{' '}
                                <strong className="text-[#4c1d95]">
                                    {party.legal_name}
                                </strong>{' '}
                                ({party.document_label})?
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
