import { Head, usePage } from '@inertiajs/react';
import { Banknote, Printer, WifiOff } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { CollectionPaymentModal } from '@/components/admin/ventas/collection-payment-modal';
import { SalesDocumentForm } from '@/components/admin/ventas/sales-document-form';
import { SalesPrintPromptDialog } from '@/components/admin/ventas/sales-print-prompt-dialog';
import {
    PageHeader,
    PageHeaderActions,
    PageHeaderBadges,
    PageHeaderTitle,
    PageHeaderTop,
} from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCan } from '@/hooks/use-can';
import { useOfflineQuickSaleForm } from '@/hooks/use-offline-quick-sale-form';
import {
    ventasComprobantesCreate,
    ventasTicketsInternosCreate,
    ventasTicketsInternosEdit,
} from '@/lib/admin-breadcrumbs';
import {
    SALES_INTERNAL_PERMISSIONS,
    SALES_PERMISSIONS,
    TREASURY_COLLECTIONS_PERMISSIONS,
} from '@/lib/admin-permissions';
import { toPaymentListRow } from '@/lib/sales-document-payment-row';
import type {
    SalesDocumentFormPageProps,
    SalesSaleMode,
} from '@/types/admin/sales-documents';

type PageProps = SalesDocumentFormPageProps & {
    errors?: Record<string, string>;
};

function formPaths(saleMode: SalesSaleMode, id?: string) {
    const base =
        saleMode === 'internal'
            ? '/admin/ventas/tickets-internos'
            : '/admin/ventas/comprobantes';

    return {
        base,
        storeUrl: base,
        updateUrl: id ? `${base}/${id}` : undefined,
        confirmUrl: id ? `${base}/${id}/confirmar` : undefined,
        destroyUrl: id ? `${base}/${id}` : undefined,
        indexUrl: base,
    };
}

export default function SalesDocumentFormPage({
    saleMode = 'fiscal',
    document,
    paymentMethods = [],
    canRecordPayment = false,
    openCashSession = null,
    showPrintPrompt = false,
    selectedCustomerPartyId = null,
    openPartyQuickCreate = false,
    partyQuickOldForm = null,
    seriesOptions,
    customerOptions,
    warehouseOptions,
    defaultWarehouseId,
    variantOptions,
    stockByWarehouse = {},
    oldForm,
}: SalesDocumentFormPageProps) {
    const { errors = {} } = usePage<PageProps>().props;
    const { can } = useCan();
    const [printDialogOpen, setPrintDialogOpen] = useState(showPrintPrompt);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);

    const paymentRow = useMemo(
        () => (document ? toPaymentListRow(document) : null),
        [document],
    );

    const showPaymentAction =
        canRecordPayment &&
        can(TREASURY_COLLECTIONS_PERMISSIONS.CREATE) &&
        paymentRow != null &&
        paymentMethods.length > 0;

    useEffect(() => {
        if (showPrintPrompt) {
            setPrintDialogOpen(true);
        }
    }, [showPrintPrompt]);

    const isInternal = saleMode === 'internal';
    const initialPaths = formPaths(saleMode, document?.id);

    const offlineQuickSale = useOfflineQuickSaleForm({
        seriesOptions,
        customerOptions,
        warehouseOptions,
        defaultWarehouseId,
        variantOptions,
        stockByWarehouse,
        paymentMethods,
        openCashSession,
        oldForm,
        document,
        storeUrl: initialPaths.storeUrl,
        updateUrl: initialPaths.updateUrl,
        confirmUrl: initialPaths.confirmUrl,
    });

    const effectiveDocument = isInternal
        ? offlineQuickSale.activeDocument
        : document;
    const paths = formPaths(saleMode, effectiveDocument?.id);
    const effectiveIsEdit = Boolean(effectiveDocument?.id);
    const effectiveIsConfirmed = effectiveDocument?.status === 'confirmed';
    const effectiveIsDraft =
        !effectiveDocument || effectiveDocument.status === 'draft';
    const effectiveId = effectiveDocument?.id;

    const collectOnConfirm =
        !offlineQuickSale.isOffline &&
        effectiveIsDraft &&
        canRecordPayment &&
        can(TREASURY_COLLECTIONS_PERMISSIONS.CREATE) &&
        paymentMethods.length > 0;

    const title = effectiveIsEdit
        ? effectiveDocument?.full_number
            ? isInternal
                ? `Ticket ${effectiveDocument.full_number}`
                : `Comprobante ${effectiveDocument.full_number}`
            : isInternal
              ? 'Editar ticket'
              : 'Editar comprobante'
        : isInternal
          ? 'Nueva venta rápida'
          : 'Nuevo comprobante';

    return (
        <div className="flex flex-1 flex-col gap-2 p-4 pb-6 md:gap-3 md:p-6 md:pb-6">
            <Head title={title} />

            <PageHeader className="mb-0 border-b pb-3">
                <PageHeaderTop>
                    <PageHeaderTitle
                        title={title}
                        description={
                            effectiveDocument?.status === 'confirmed'
                                ? isInternal
                                    ? 'Ticket interno confirmado. No es comprobante de pago SUNAT.'
                                    : 'Comprobante confirmado y numerado.'
                                : isInternal
                                  ? offlineQuickSale.isOffline
                                      ? 'Sin internet: usa datos en caché. Guarda y confirma; se sincronizará al reconectar.'
                                      : 'Agrega productos y confirma. Cliente opcional; sin envío a SUNAT.'
                                  : 'Guarda como borrador y confirma para asignar correlativo SUNAT.'
                        }
                    />
                    {isInternal && offlineQuickSale.isOffline ? (
                        <PageHeaderBadges>
                            <Badge
                                variant="outline"
                                className="gap-1 border-amber-300 bg-amber-50 text-amber-900"
                            >
                                <WifiOff className="size-3" />
                                Modo offline
                            </Badge>
                            {offlineQuickSale.pendingCount > 0 ? (
                                <Badge
                                    variant="outline"
                                    className="border-violet-300 bg-violet-50 text-violet-900"
                                >
                                    {offlineQuickSale.pendingCount} pendiente
                                    {offlineQuickSale.pendingCount === 1
                                        ? ''
                                        : 's'}{' '}
                                    de sync
                                </Badge>
                            ) : null}
                        </PageHeaderBadges>
                    ) : null}
                    {effectiveIsConfirmed && effectiveId ? (
                        <PageHeaderActions>
                            {showPaymentAction ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="cursor-pointer gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                    onClick={() => setPaymentModalOpen(true)}
                                >
                                    <Banknote className="size-4" />
                                    Registrar cobro
                                </Button>
                            ) : null}
                            <Button
                                type="button"
                                variant="outline"
                                className="cursor-pointer gap-2 border-violet-200 text-[#5b21b6] hover:bg-violet-50"
                                onClick={() => setPrintDialogOpen(true)}
                            >
                                <Printer className="size-4" />
                                Imprimir ticket
                            </Button>
                        </PageHeaderActions>
                    ) : null}
                </PageHeaderTop>
            </PageHeader>

            {effectiveIsConfirmed && effectiveId && effectiveDocument?.full_number ? (
                <SalesPrintPromptDialog
                    open={printDialogOpen}
                    onOpenChange={setPrintDialogOpen}
                    documentId={effectiveId}
                    fullNumber={effectiveDocument.full_number}
                    internal={isInternal}
                />
            ) : null}

            {showPaymentAction && paymentRow ? (
                <CollectionPaymentModal
                    open={paymentModalOpen}
                    onOpenChange={setPaymentModalOpen}
                    document={paymentRow}
                    paymentMethods={paymentMethods}
                    openCashSession={openCashSession}
                    saleMode={saleMode}
                    redirect="sales_edit"
                    errors={errors}
                />
            ) : null}

            <SalesDocumentForm
                key={effectiveDocument?.id ?? 'quick-sale-new'}
                saleMode={saleMode}
                selectedCustomerPartyId={selectedCustomerPartyId}
                openPartyQuickCreate={
                    isInternal && offlineQuickSale.isOffline
                        ? false
                        : openPartyQuickCreate
                }
                partyQuickOldForm={partyQuickOldForm}
                document={effectiveDocument}
                seriesOptions={
                    isInternal
                        ? offlineQuickSale.seriesOptions
                        : seriesOptions
                }
                customerOptions={
                    isInternal
                        ? offlineQuickSale.customerOptions
                        : customerOptions
                }
                warehouseOptions={
                    isInternal
                        ? offlineQuickSale.warehouseOptions
                        : warehouseOptions
                }
                defaultWarehouseId={
                    isInternal
                        ? offlineQuickSale.defaultWarehouseId
                        : defaultWarehouseId
                }
                variantOptions={
                    isInternal
                        ? offlineQuickSale.variantOptions
                        : variantOptions
                }
                stockByWarehouse={
                    isInternal
                        ? offlineQuickSale.stockByWarehouse
                        : stockByWarehouse
                }
                oldForm={
                    isInternal ? offlineQuickSale.oldForm : oldForm
                }
                errors={errors}
                canUpdate={
                    isInternal
                        ? can(SALES_INTERNAL_PERMISSIONS.UPDATE) ||
                          can(SALES_PERMISSIONS.UPDATE)
                        : can(SALES_PERMISSIONS.UPDATE)
                }
                canConfirm={
                    isInternal
                        ? can(SALES_INTERNAL_PERMISSIONS.CONFIRM)
                        : can(SALES_PERMISSIONS.CONFIRM)
                }
                canDelete={
                    isInternal
                        ? can(SALES_INTERNAL_PERMISSIONS.DELETE)
                        : can(SALES_PERMISSIONS.DELETE)
                }
                storeUrl={paths.storeUrl}
                updateUrl={paths.updateUrl}
                confirmUrl={paths.confirmUrl}
                destroyUrl={paths.destroyUrl}
                indexUrl={paths.indexUrl}
                paymentMethods={
                    isInternal
                        ? offlineQuickSale.paymentMethods
                        : paymentMethods
                }
                openCashSession={
                    isInternal
                        ? offlineQuickSale.openCashSession
                        : openCashSession
                }
                collectOnConfirm={collectOnConfirm}
                isOffline={isInternal && offlineQuickSale.isOffline}
                onOfflineSave={
                    isInternal ? offlineQuickSale.saveOffline : undefined
                }
                onOfflineConfirm={
                    isInternal ? offlineQuickSale.confirmOffline : undefined
                }
            />
        </div>
    );
}

SalesDocumentFormPage.layout = (props: SalesDocumentFormPageProps) => {
    const id = props.document?.id;
    const internal = props.saleMode === 'internal';

    return {
        breadcrumbs: internal
            ? id
                ? ventasTicketsInternosEdit(id)
                : ventasTicketsInternosCreate()
            : ventasComprobantesCreate(),
    };
};
