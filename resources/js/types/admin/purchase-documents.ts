import type {
    OpenCashSessionSummary,
    TreasuryPaymentHistoryItem,
    TreasuryPaymentMethodOption,
} from '@/types/admin/treasury';

export type PurchasePaymentStatus = 'unpaid' | 'partial' | 'paid';

export type PurchaseDocumentListRow = {
    id: string;
    internal_number: string;
    supplier_document_number: string | null;
    display_number: string;
    issue_date: string;
    issue_date_label: string | null;
    due_date: string | null;
    due_date_label: string | null;
    supplier_name: string;
    supplier_document: string | null;
    status: string;
    status_label: string;
    payment_status: PurchasePaymentStatus;
    payment_status_label: string;
    amount_paid: string;
    amount_paid_label: string;
    balance_due: string;
    balance_due_label: string;
    can_receive_payment: boolean;
    total: string;
    total_label: string;
    currency_code: string;
    payment_history?: TreasuryPaymentHistoryItem[];
};

export type PurchaseDocumentLineForm = {
    id?: string;
    goods_receipt_line_id?: string;
    product_variant_id: string;
    description?: string;
    quantity: string;
    unit_cost: string;
    line_total?: string;
    variant_sku?: string;
    product_name?: string;
};

export type PurchaseDocumentFormData = {
    id?: string;
    internal_number?: string;
    supplier_party_id: string;
    warehouse_id?: string;
    supplier_document_number: string;
    issue_date: string;
    due_date: string;
    currency_code?: string;
    exchange_rate?: string;
    subtotal?: string;
    tax_amount?: string;
    total: string;
    notes: string;
    lines?: PurchaseDocumentLineForm[];
    payment_status?: string;
    payment_status_label?: string;
    amount_paid_label?: string;
    balance_due_label?: string;
    can_receive_payment?: boolean;
    has_invoice_file?: boolean;
    invoice_file_name?: string | null;
    invoice_download_url?: string | null;
    stock_posted?: boolean;
};

export type PendingReceiptForInvoice = {
    id: string;
    internal_number: string;
    received_date_label: string;
    purchase_order_number: string;
    supplier_name: string;
    lines_count: number;
    create_invoice_url: string;
};

export type PurchaseDocumentsIndexPageProps = {
    documents: PurchaseDocumentListRow[];
    pendingReceipts?: PendingReceiptForInvoice[];
    filters: {
        search: string;
        from: string | null;
        to: string | null;
        payment_status: string | null;
    };
    stats: Array<{
        key: string;
        label: string;
        value: string | number;
        tone: string;
    }>;
    paymentMethods?: TreasuryPaymentMethodOption[];
    canRecordPayment?: boolean;
    canUpdatePayment?: boolean;
    openCashSession?: OpenCashSessionSummary | null;
};

export type VariantCatalogOption = {
    value: string;
    label: string;
    sublabel?: string;
    unit_price?: string;
    track_stock?: boolean;
    product_id?: string;
};

export type PurchasePrefillFromReceipt = {
    goods_receipt_id: string;
    purchase_order_id?: string;
    supplier_party_id: string;
    warehouse_id?: string;
    issue_date: string;
    currency_code: string;
    exchange_rate: string;
    notes: string;
    lines: PurchaseDocumentLineForm[];
    receipt_number?: string;
    order_number?: string;
    stock_from_receipt?: boolean;
};

export type PurchaseDocumentFormPageProps = {
    document: PurchaseDocumentFormData | null;
    supplierOptions: Array<{
        value: string;
        label: string;
        sublabel?: string;
    }>;
    warehouseOptions: Array<{ value: string; label: string }>;
    defaultWarehouseId?: string | null;
    variantOptions: VariantCatalogOption[];
    stockByWarehouse?: Record<string, Record<string, string>>;
    productOptions: Array<{ value: string; label: string }>;
    paymentMethods?: TreasuryPaymentMethodOption[];
    canRecordPayment?: boolean;
    canUpdatePayment?: boolean;
    canUpdate?: boolean;
    openCashSession?: OpenCashSessionSummary | null;
    paymentHistory?: TreasuryPaymentHistoryItem[];
    prefillFromReceipt?: PurchasePrefillFromReceipt | null;
    oldForm: PurchaseDocumentFormData;
};
