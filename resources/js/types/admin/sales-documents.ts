import type { PartiesOldForm } from '@/types/admin/parties';
import type {
    OpenCashSessionSummary,
    TreasuryPaymentMethodOption,
} from '@/types/admin/treasury';

export type SalesPaymentStatus = 'unpaid' | 'partial' | 'paid';

export type SalesDocumentStatus = 'draft' | 'confirmed' | 'voided';

export type ElectronicDocumentStatus =
    | 'pending'
    | 'building'
    | 'sent'
    | 'accepted'
    | 'rejected'
    | 'observed'
    | 'cancelled';

export type ElectronicDocumentSummary = {
    status: ElectronicDocumentStatus;
    status_label: string;
    sunat_response_code: string | null;
    sunat_description: string | null;
    accepted_at: string | null;
};

export type SalesSaleMode = 'fiscal' | 'internal';

export type SalesDocumentListRow = {
    id: string;
    full_number: string;
    is_internal?: boolean;
    document_type_label: string;
    series: string;
    issue_date: string;
    issue_date_label: string;
    customer_name: string | null;
    customer_document: string | null;
    status: SalesDocumentStatus;
    status_label: string;
    payment_status?: SalesPaymentStatus;
    payment_status_label?: string;
    amount_paid?: string;
    amount_paid_label?: string;
    balance_due?: string;
    balance_due_label?: string;
    can_receive_payment?: boolean;
    electronic_status?: ElectronicDocumentStatus | null;
    electronic_status_label?: string | null;
    total: string;
    total_label: string;
    currency_code: string;
};

export type SalesDocumentLineForm = {
    id?: string;
    product_variant_id: string;
    description?: string;
    quantity: string;
    unit_price: string;
    discount: string;
    tax_affectation_code?: string;
    igv_rate?: string;
    line_subtotal?: string;
    igv_amount?: string;
    line_total?: string;
    variant_sku?: string;
    product_name?: string;
};

export type SalesDocumentFormData = {
    id?: string;
    is_internal?: boolean;
    document_series_id: string;
    sunat_document_type_code?: string;
    series?: string;
    number?: number | null;
    full_number?: string | null;
    customer_party_id: string;
    warehouse_id: string | null;
    issue_date: string;
    due_date?: string | null;
    currency_code: string;
    exchange_rate: string;
    global_discount: string;
    subtotal?: string;
    tax_amount?: string;
    total?: string;
    total_label?: string;
    status?: SalesDocumentStatus;
    status_label?: string;
    payment_status?: SalesPaymentStatus;
    payment_status_label?: string;
    amount_paid?: string;
    amount_paid_label?: string;
    balance_due?: string;
    balance_due_label?: string;
    can_receive_payment?: boolean;
    electronic_document?: ElectronicDocumentSummary | null;
    notes?: string | null;
    lines: SalesDocumentLineForm[];
};

export type SalesVariantOption = {
    value: string;
    label: string;
    sublabel?: string;
    searchText?: string;
    barcode?: string | null;
    unit_price: string;
    track_stock: boolean;
    tax_affectation_code: string;
    igv_rate: string;
};

export type SalesDocumentsIndexPageProps = {
    saleMode?: SalesSaleMode;
    documents: SalesDocumentListRow[];
    paymentMethods?: TreasuryPaymentMethodOption[];
    canRecordPayment?: boolean;
    openCashSession?: OpenCashSessionSummary | null;
    filters: {
        status: string | null;
        search: string;
        from: string | null;
        to: string | null;
    };
    stats: Array<{
        key: string;
        label: string;
        value: string | number;
        tone: string;
    }>;
};

/** warehouse_id → variant_id → cantidad disponible */
export type SalesStockByWarehouse = Record<string, Record<string, string>>;

export type SalesDocumentFormPageProps = {
    saleMode?: SalesSaleMode;
    paymentMethods?: TreasuryPaymentMethodOption[];
    canRecordPayment?: boolean;
    openCashSession?: OpenCashSessionSummary | null;
    showPrintPrompt?: boolean;
    selectedCustomerPartyId?: string | null;
    openPartyQuickCreate?: boolean;
    partyQuickOldForm?: PartiesOldForm | null;
    document: SalesDocumentFormData | null;
    seriesOptions: Array<{
        value: string;
        label: string;
        sublabel?: string;
        sunat_document_type_code: string;
        series: string;
    }>;
    customerOptions: Array<{
        value: string;
        label: string;
        sublabel?: string;
        searchText?: string;
    }>;
    warehouseOptions: Array<{ value: string; label: string }>;
    defaultWarehouseId?: string | null;
    variantOptions: SalesVariantOption[];
    stockByWarehouse?: SalesStockByWarehouse;
    oldForm: SalesDocumentFormData;
};
