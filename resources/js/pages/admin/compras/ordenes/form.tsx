import { Head } from '@inertiajs/react';
import { PurchaseOrderForm } from '@/components/admin/compras/purchase-order-form';
import {
    PageHeader,
    PageHeaderTitle,
    PageHeaderTop,
} from '@/components/page-header';
import { comprasOrdenForm } from '@/lib/admin-breadcrumbs';

const INDEX_URL = '/admin/compras/ordenes';

type Props = {
    order?: Parameters<typeof PurchaseOrderForm>[0]['order'];
    supplierOptions: Parameters<typeof PurchaseOrderForm>[0]['supplierOptions'];
    variantOptions: Parameters<typeof PurchaseOrderForm>[0]['variantOptions'];
    productOptions: Parameters<typeof PurchaseOrderForm>[0]['productOptions'];
    canManage?: boolean;
    canReceive?: boolean;
    receiveUrl?: string | null;
    purchaseFlow?: Parameters<typeof PurchaseOrderForm>[0]['purchaseFlow'];
    supplierEmail?: Parameters<typeof PurchaseOrderForm>[0]['supplierEmail'];
    sendEmailUrl?: string | null;
};

export default function PurchaseOrderFormPage({
    order,
    ...rest
}: Props) {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
            <Head
                title={
                    order
                        ? `Orden ${order.internal_number}`
                        : 'Nueva orden de compra'
                }
            />
            <PageHeader className="mb-0 border-b pb-3">
                <PageHeaderTop>
                    <PageHeaderTitle
                        title={
                            order
                                ? order.internal_number
                                : 'Nueva orden de compra'
                        }
                        description="Documento interno: qué comprarás, a quién y en qué cantidades. No mueve stock hasta la recepción."
                    />
                </PageHeaderTop>
            </PageHeader>
            <PurchaseOrderForm
                order={order}
                indexUrl={INDEX_URL}
                sendEmailUrl={
                    order?.id
                        ? `${INDEX_URL}/${order.id}/enviar-correo`
                        : null
                }
                {...rest}
            />
        </div>
    );
}

PurchaseOrderFormPage.layout = (props: Props) => ({
    breadcrumbs: comprasOrdenForm(props.order?.id, props.order?.internal_number),
});
