export type TreasuryPaymentMethodType =
    | 'cash'
    | 'bank_transfer'
    | 'digital_wallet'
    | 'card'
    | 'other';

export type PaymentMethodRow = {
    id: string;
    code: string;
    name: string;
    type: TreasuryPaymentMethodType;
    type_label: string;
    is_active: boolean;
    sort_order: number;
};

export type PaymentMethodFormValues = {
    id?: string;
    name: string;
    type: TreasuryPaymentMethodType;
    is_active: boolean;
};

export type PaymentMethodsOldForm = PaymentMethodFormValues;

export type PaymentMethodStatItem = {
    key: string;
    label: string;
    value: number;
    tone: string;
    icon?: import('lucide-react').LucideIcon;
};

export type PaymentMethodTypeOption = {
    value: TreasuryPaymentMethodType;
    label: string;
};

export type PaymentMethodsIndexPageProps = {
    methods: PaymentMethodRow[];
    stats: PaymentMethodStatItem[];
    paymentMethodModal?: 'create' | 'edit' | null;
    paymentMethodModalId?: string | null;
    oldForm: PaymentMethodsOldForm;
    typeOptions: PaymentMethodTypeOption[];
    nextSortOrder?: number;
};

export type PaymentMethodsPageErrors = Record<string, string>;

export type TreasuryPaymentMethodOption = {
    id: string;
    name: string;
    code: string;
};

export type TreasuryPaymentHistoryItem = {
    id: string;
    payment_date: string;
    payment_date_label: string;
    amount: string;
    amount_label: string;
    currency_code: string;
    reference: string | null;
    notes: string | null;
    payment_method_name: string | null;
    created_by_name: string | null;
    has_proof: boolean;
    proof_file_name: string | null;
    proof_download_url: string | null;
    proof_view_url?: string | null;
};

export type DisbursementPaymentRow = TreasuryPaymentHistoryItem & {
    party_name: string | null;
    party_document: string | null;
    purchase_document_id: string | null;
    purchase_document_number: string | null;
};

export type CollectionPaymentRow = {
    id: string;
    payment_date: string;
    payment_date_label: string;
    amount: string;
    amount_label: string;
    currency_code: string;
    reference: string | null;
    notes: string | null;
    payment_method_name: string | null;
    party_name: string | null;
    party_document: string | null;
    sales_document_id: string | null;
    sales_document_number: string | null;
    created_by_name: string | null;
};

export type OpenCashSessionSummary = {
    id: string;
    cash_register_id: string;
    cash_register_name: string | null;
    cash_register_code: string | null;
    opened_at_label: string | null;
    opening_float: string;
    opening_float_label: string;
};

export type CashRegisterRow = {
    id: string;
    code: string;
    name: string;
    warehouse_id: string | null;
    warehouse_name: string | null;
    is_active: boolean;
    sort_order: number;
    has_open_session: boolean;
    open_session_id: string | null;
    open_session_opened_at_label: string | null;
};

export type CashRegisterFormValues = {
    id?: string;
    name: string;
    warehouse_id: string;
    is_active: boolean;
};

export type CashRegistersOldForm = CashRegisterFormValues;

export type CashSessionsOldForm = {
    cash_register_id: string;
    opening_float: string;
    opening_notes: string;
};

export type CashRegistersIndexPageProps = {
    registers: CashRegisterRow[];
    warehouseOptions: Array<{ value: string; label: string; sublabel?: string }>;
    stats: CashRegisterStatItem[];
    cashRegisterModal?: 'create' | 'edit' | null;
    cashRegisterModalId?: string | null;
    oldForm: CashRegistersOldForm;
};

export type CashRegistersPageErrors = Record<string, string>;

export type CashRegisterSessionRow = {
    id: string;
    status: 'open' | 'closed';
    status_label: string;
    cash_register_id: string;
    cash_register_name: string | null;
    cash_register_code: string | null;
    opened_at_label: string;
    closed_at_label: string | null;
    opened_by_name: string | null;
    closed_by_name: string | null;
    opening_float_label: string;
    expected_cash_label: string | null;
    closing_cash_counted_label: string | null;
    cash_difference_label: string | null;
    summary: {
        cash_collected_label: string;
        non_cash_collected_label: string;
        total_collected_label: string;
        payments_count: number;
    } | null;
    can_close: boolean;
};

export type CashSessionStatItem = {
    key: string;
    label: string;
    value: number;
    tone: string;
    icon?: import('lucide-react').LucideIcon;
};

export type CashSessionsIndexPageProps = {
    sessions: CashRegisterSessionRow[];
    cashRegisterOptions: Array<{ value: string; label: string; sublabel?: string }>;
    userOpenSession: OpenCashSessionSummary | null;
    filters: { status: string | null };
    stats: CashSessionStatItem[];
    openSessionModal?: boolean;
    sessionCloseModalId?: string | null;
    oldForm: CashSessionsOldForm;
};

export type CashSessionsPageErrors = Record<string, string>;

export type CashRegisterStatItem = {
    key: string;
    label: string;
    value: number;
    tone: string;
    icon?: import('lucide-react').LucideIcon;
};

export type CollectionsPeriodFilter = 'month' | 'today';

export type CollectionStatFilter = {
    period?: CollectionsPeriodFilter;
};

export type CollectionStatItem = {
    key: string;
    label: string;
    value: string | number;
    tone: string;
    icon?: import('lucide-react').LucideIcon;
    filter?: CollectionStatFilter;
};

export type CollectionsIndexPageProps = {
    payments: CollectionPaymentRow[];
    filters: {
        search: string;
        from: string | null;
        to: string | null;
        period?: CollectionsPeriodFilter | null;
    };
    stats: CollectionStatItem[];
};

export type ReceivableAgingFilter = 'overdue' | 'current';

export type ReceivableDocumentRow = {
    id: string;
    full_number: string;
    document_type_label: string;
    is_internal?: boolean;
    issue_date: string;
    issue_date_label: string | null;
    due_date: string | null;
    due_date_label: string | null;
    customer_name: string;
    customer_document: string | null;
    payment_status: string;
    payment_status_label: string;
    amount_paid: string;
    amount_paid_label: string;
    balance_due: string;
    balance_due_label: string;
    total: string;
    total_label: string;
    currency_code: string;
    can_receive_payment: boolean;
    is_overdue: boolean;
    days_overdue: number;
    aging_label: string;
    document_edit_url: string;
};

export type ReceivableStatFilter = {
    aging?: ReceivableAgingFilter;
};

export type ReceivableStatItem = {
    key: string;
    label: string;
    value: string | number;
    tone: string;
    icon?: import('lucide-react').LucideIcon;
    filter?: ReceivableStatFilter;
};

export type AccountsReceivableIndexPageProps = {
    documents: ReceivableDocumentRow[];
    filters: {
        search: string;
        from: string | null;
        to: string | null;
        aging: ReceivableAgingFilter | null;
        payment_status: string | null;
    };
    stats: ReceivableStatItem[];
    paymentMethods?: TreasuryPaymentMethodOption[];
    canRecordPayment?: boolean;
    openCashSession?: OpenCashSessionSummary | null;
};

export type PayableAgingFilter = ReceivableAgingFilter;

export type PayableDocumentRow = {
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
    payment_status: string;
    payment_status_label: string;
    amount_paid: string;
    amount_paid_label: string;
    balance_due: string;
    balance_due_label: string;
    total: string;
    total_label: string;
    currency_code: string;
    can_receive_payment: boolean;
    is_overdue: boolean;
    days_overdue: number;
    aging_label: string;
    document_edit_url: string;
    payment_history?: TreasuryPaymentHistoryItem[];
};

export type PayableStatItem = ReceivableStatItem;

export type AccountsPayableIndexPageProps = {
    documents: PayableDocumentRow[];
    filters: {
        search: string;
        from: string | null;
        to: string | null;
        aging: PayableAgingFilter | null;
        payment_status: string | null;
    };
    stats: PayableStatItem[];
    paymentMethods?: TreasuryPaymentMethodOption[];
    canRecordPayment?: boolean;
    canUpdatePayment?: boolean;
    canCreateInvoice?: boolean;
    openCashSession?: OpenCashSessionSummary | null;
};

