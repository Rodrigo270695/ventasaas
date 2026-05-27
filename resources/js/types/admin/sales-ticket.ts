export type SalesTicketLine = {
    description: string;
    sku: string | null;
    quantity: string;
    unit_price: string;
    line_total: string;
};

export type SalesTicketPrintPageProps = {
    document: {
        id: string;
        full_number: string;
        document_type_label: string;
        is_internal?: boolean;
        issue_date_label: string;
        issue_time_label: string;
        currency_code: string;
        subtotal: string;
        tax_amount: string;
        total: string;
        subtotal_label: string;
        tax_amount_label: string;
        global_discount: string | null;
        global_discount_label: string | null;
        total_label: string;
        notes: string | null;
        customer_name: string | null;
        customer_document: string | null;
        lines: SalesTicketLine[];
    };
    store: {
        ruc: string | null;
        legal_name: string | null;
        address: string | null;
        logo_url: string | null;
    };
    format: '80mm' | '58mm' | 'a4';
    autoPrint: boolean;
};
