export type ElectronicDocumentStatus =
    | 'pending'
    | 'building'
    | 'sent'
    | 'accepted'
    | 'rejected'
    | 'observed'
    | 'cancelled';

export type ElectronicDocumentListRow = {
    id: string;
    sales_document_id: string;
    full_number: string;
    document_type_label: string;
    series: string | null;
    issue_date: string | null;
    issue_date_label: string | null;
    customer_name: string | null;
    customer_document: string | null;
    total: string;
    total_label: string;
    currency_code: string;
    gateway: string;
    status: ElectronicDocumentStatus;
    status_label: string;
    sunat_response_code: string | null;
    sunat_description: string | null;
    retry_count: number;
    sent_at: string | null;
    sent_at_label: string | null;
    accepted_at: string | null;
    accepted_at_label: string | null;
    updated_at: string | null;
    can_reemit: boolean;
};

export type ElectronicDocumentEventRow = {
    id: string;
    event: string;
    event_label: string;
    payload: Record<string, unknown> | null;
    created_at: string | null;
    created_at_label: string | null;
};

export type ElectronicDocumentDetail = ElectronicDocumentListRow & {
    ubl_version: string | null;
    xml_hash: string | null;
    xml_path: string | null;
    cdr_path: string | null;
    sunat_ticket: string | null;
    created_at: string | null;
    sale_status: string | null;
    sale_status_label: string | null;
    lines_count: number;
    events: ElectronicDocumentEventRow[];
};

export type ElectronicDocumentStatItem = {
    key: string;
    label: string;
    value: number;
    tone: string;
};

export type ElectronicDocumentsIndexPageProps = {
    documents: ElectronicDocumentListRow[];
    filters: {
        status: string | null;
        search: string;
    };
    statusOptions: { value: string; label: string }[];
    stats: ElectronicDocumentStatItem[];
};

export type ElectronicDocumentsShowPageProps = {
    document: ElectronicDocumentDetail;
};
