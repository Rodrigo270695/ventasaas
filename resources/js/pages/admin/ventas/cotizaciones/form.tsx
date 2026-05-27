import { Head } from '@inertiajs/react';
import { WifiOff } from 'lucide-react';
import { SalesQuotationForm } from '@/components/admin/ventas/sales-quotation-form';
import {
    PageHeader,
    PageHeaderBadges,
    PageHeaderTitle,
    PageHeaderTop,
} from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { useOfflineQuotationForm } from '@/hooks/use-offline-quotation-form';
import { ventasCotizacionesCreate, ventasCotizacionesEdit } from '@/lib/admin-breadcrumbs';
import type { SalesQuotationFormPageProps } from '@/types/admin/sales-quotations';

export default function SalesQuotationFormPage({
    quotation,
    customerOptions,
    variantOptions,
    oldForm,
    errors = {},
}: SalesQuotationFormPageProps) {
    const storeUrl = '/admin/ventas/cotizaciones';
    const offlineQuotation = useOfflineQuotationForm({
        quotation,
        customerOptions,
        variantOptions,
        oldForm,
        storeUrl,
        updateUrl: quotation?.id ? `${storeUrl}/${quotation.id}` : undefined,
    });

    const effectiveQuotation = offlineQuotation.activeQuotation;
    const effectiveId = effectiveQuotation?.id;
    const isEdit = Boolean(effectiveId);
    const title = isEdit
        ? `Cotización ${effectiveQuotation?.internal_number ?? ''}`
        : 'Nueva cotización';

    return (
        <div className="flex flex-1 flex-col gap-3 p-4 md:p-6">
            <Head title={title} />
            <PageHeader className="mb-0 border-b pb-3">
                <PageHeaderTop>
                    <PageHeaderTitle
                        title={title}
                        description={
                            offlineQuotation.isOffline
                                ? 'Sin internet: usa clientes y productos en caché. Guarda el borrador; se sincronizará al reconectar.'
                                : 'Puedes mezclar productos existentes con líneas manuales sin afectar el inventario.'
                        }
                    />
                    {offlineQuotation.isOffline ? (
                        <PageHeaderBadges>
                            <Badge
                                variant="outline"
                                className="gap-1 border-amber-300 bg-amber-50 text-amber-900"
                            >
                                <WifiOff className="size-3" />
                                Modo offline
                            </Badge>
                            {offlineQuotation.pendingCount > 0 ? (
                                <Badge
                                    variant="outline"
                                    className="border-violet-300 bg-violet-50 text-violet-900"
                                >
                                    {offlineQuotation.pendingCount} pendiente
                                    {offlineQuotation.pendingCount === 1
                                        ? ''
                                        : 's'}{' '}
                                    de sync
                                </Badge>
                            ) : null}
                        </PageHeaderBadges>
                    ) : null}
                </PageHeaderTop>
            </PageHeader>

            <SalesQuotationForm
                key={effectiveId ?? 'quotation-new'}
                quotation={effectiveQuotation}
                oldForm={offlineQuotation.oldForm}
                customerOptions={offlineQuotation.customerOptions}
                variantOptions={offlineQuotation.variantOptions}
                errors={errors}
                storeUrl={storeUrl}
                updateUrl={
                    effectiveId ? `${storeUrl}/${effectiveId}` : undefined
                }
                sendEmailUrl={
                    effectiveId && !offlineQuotation.isOffline
                        ? `${storeUrl}/${effectiveId}/enviar-correo`
                        : undefined
                }
                acceptUrl={
                    effectiveId && !offlineQuotation.isOffline
                        ? `${storeUrl}/${effectiveId}/aceptar`
                        : undefined
                }
                rejectUrl={
                    effectiveId && !offlineQuotation.isOffline
                        ? `${storeUrl}/${effectiveId}/rechazar`
                        : undefined
                }
                cancelUrl={
                    effectiveId && !offlineQuotation.isOffline
                        ? `${storeUrl}/${effectiveId}/anular`
                        : undefined
                }
                duplicateUrl={
                    effectiveId && !offlineQuotation.isOffline
                        ? `${storeUrl}/${effectiveId}/duplicar`
                        : undefined
                }
                convertUrl={
                    effectiveId && !offlineQuotation.isOffline
                        ? `${storeUrl}/${effectiveId}/convertir-comprobante`
                        : undefined
                }
                printUrl={
                    effectiveId && !offlineQuotation.isOffline
                        ? `${storeUrl}/${effectiveId}/imprimir`
                        : undefined
                }
                isOffline={offlineQuotation.isOffline}
                onOfflineSave={offlineQuotation.saveOffline}
            />
        </div>
    );
}

SalesQuotationFormPage.layout = (props: SalesQuotationFormPageProps) => ({
    breadcrumbs: props.quotation?.id
        ? ventasCotizacionesEdit(props.quotation.id)
        : ventasCotizacionesCreate(),
});
