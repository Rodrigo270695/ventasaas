import { Head } from '@inertiajs/react';
import { PurchaseDocumentForm } from '@/components/admin/compras/purchase-document-form';
import {
    PageHeader,
    PageHeaderTitle,
    PageHeaderTop,
} from '@/components/page-header';
import { comprasFacturaForm } from '@/lib/admin-breadcrumbs';
import type { PurchaseDocumentFormPageProps } from '@/types/admin/purchase-documents';

const INDEX_URL = '/admin/compras/facturas';
const PAYABLES_URL = '/admin/tesoreria/cuentas-por-pagar';

export default function PurchaseDocumentFormPage(
    props: PurchaseDocumentFormPageProps,
) {
    const isEdit = Boolean(props.document?.id);
    const storeUrl = isEdit
        ? `${INDEX_URL}/${props.document!.id}`
        : INDEX_URL;

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pb-6 md:p-6">
            <Head
                title={
                    isEdit
                        ? `Compra ${props.document?.internal_number}`
                        : 'Registrar compra'
                }
            />

            <PageHeader className="mb-0 border-b pb-3">
                <PageHeaderTop>
                    <PageHeaderTitle
                        title={
                            isEdit
                                ? props.document?.internal_number ?? 'Compra'
                                : 'Registrar compra'
                        }
                        description={
                            props.prefillFromReceipt
                                ? 'Registra la factura del proveedor. El inventario ya se actualizó con la recepción.'
                                : 'Ingresa productos al inventario, adjunta la factura del proveedor y genera el saldo en cuentas por pagar. También puedes usar el flujo Orden → Recepción → Factura.'
                        }
                    />
                </PageHeaderTop>
            </PageHeader>

            <PurchaseDocumentForm
                {...props}
                storeUrl={storeUrl}
                indexUrl={INDEX_URL}
                payablesUrl={PAYABLES_URL}
            />
        </div>
    );
}

PurchaseDocumentFormPage.layout = (props: PurchaseDocumentFormPageProps) => ({
    breadcrumbs: comprasFacturaForm(
        props.document?.id,
        props.document?.internal_number,
    ),
});
