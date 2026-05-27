export type SalesQuotationLineForm = {
    id?: string;
    product_variant_id?: string | null;
    manual_sku?: string | null;
    description?: string | null;
    quantity: string;
    unit_price: string;
    discount: string;
    line_total?: string;
    variant_sku?: string | null;
    product_name?: string | null;
};

export type SalesQuotationFormData = {
    id?: string;
    internal_number?: string;
    customer_party_id: string;
    customer_name?: string | null;
    customer_email?: string | null;
    issue_date: string;
    valid_until: string;
    currency_code: string;
    exchange_rate: string;
    global_discount: string;
    subtotal?: string;
    tax_amount?: string;
    total?: string;
    status?: string;
    status_label?: string;
    notes?: string | null;
    customer_email_to?: string | null;
    customer_email_cc?: string;
    customer_email_sent_label?: string | null;
    can_edit?: boolean;
    can_send_email?: boolean;
    can_convert?: boolean;
    sales_document_id?: string | null;
    sales_document_number?: string | null;
    lines: SalesQuotationLineForm[];
};

export type SalesQuotationListRow = {
    id: string;
    internal_number: string;
    issue_date: string;
    issue_date_label: string | null;
    valid_until_label: string | null;
    customer_name: string;
    status: string;
    status_label: string;
    currency_code: string;
    total_label: string;
    is_email_sent: boolean;
    email_sent_label: string | null;
    sales_document_id?: string | null;
    sales_document_number?: string | null;
};

export type SalesQuotationPageFilters = {
    status: string;
    search: string;
    from: string;
    to: string;
};

export type SalesQuotationIndexPageProps = {
    quotations: SalesQuotationListRow[];
    filters: SalesQuotationPageFilters;
    statusOptions?: Array<{ value: string; label: string }>;
    stats: Array<{ key: string; label: string; value: number; tone: string }>;
};

export type SalesQuotationFormPageProps = {
    quotation: SalesQuotationFormData | null;
    customerOptions: Array<{ value: string; label: string; sublabel?: string; email?: string | null }>;
    variantOptions: Array<{ value: string; label: string; sublabel?: string; unit_price?: string }>;
    oldForm: SalesQuotationFormData;
    errors?: Record<string, string>;
};

