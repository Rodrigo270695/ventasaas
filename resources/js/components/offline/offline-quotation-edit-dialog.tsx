import { SalesQuotationForm } from '@/components/admin/ventas/sales-quotation-form';
import {
    AppModal,
    AppModalBody,
    AppModalHeader,
} from '@/components/modal';
import {
    loadOfflineQuotationDraft,
    loadQuotationFormSnapshot,
    saveQuotationOffline,
} from '@/lib/offline-quotations';
import { notify } from '@/lib/notify';
import type { SalesQuotationFormData } from '@/types/admin/sales-quotations';

type Props = {
    quotationId: string | null;
    onClose: () => void;
    onSaved: () => void;
};

const STORE_URL = '/admin/ventas/cotizaciones';

export function OfflineQuotationEditDialog({
    quotationId,
    onClose,
    onSaved,
}: Props) {
    if (!quotationId) {
        return null;
    }

    const draft = loadOfflineQuotationDraft(quotationId);
    const lookups = loadQuotationFormSnapshot();

    if (!draft || !lookups) {
        return null;
    }

    const handleSave = (form: SalesQuotationFormData) => {
        saveQuotationOffline(
            { ...form, id: quotationId },
            {
                storeUrl: STORE_URL,
                updateUrl: `${STORE_URL}/${quotationId}`,
            },
            lookups.customerOptions,
        );
        notify.success('Cotización actualizada localmente');
        onSaved();
        onClose();
    };

    return (
        <AppModal open onOpenChange={(open) => !open && onClose()} size="xl">
            <AppModalHeader
                title={`Editar borrador offline · ${draft.internal_number ?? quotationId}`}
                description="Los cambios se guardan localmente y se sincronizarán al reconectar."
            />
            <AppModalBody className="max-h-[min(85vh,48rem)] overflow-y-auto">
                <SalesQuotationForm
                    quotation={draft}
                    oldForm={lookups.oldForm}
                    customerOptions={lookups.customerOptions}
                    variantOptions={lookups.variantOptions}
                    storeUrl={STORE_URL}
                    updateUrl={`${STORE_URL}/${quotationId}`}
                    isOffline
                    onOfflineSave={handleSave}
                />
            </AppModalBody>
        </AppModal>
    );
}
