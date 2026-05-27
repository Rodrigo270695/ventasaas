import type { StatBadgeItem } from '@/components/page-header';

export type DocumentSeriesRow = {
    id: string;
    sunat_document_type_code: string;
    document_type_label: string;
    series: string;
    name: string | null;
    is_electronic: boolean;
    next_number: number;
    next_number_preview: string;
    is_active: boolean;
};

export type DocumentSeriesFormValues = DocumentSeriesRow;

export type DocumentSeriesStatKey = 'total' | 'active' | 'inactive' | 'electronic';

export type DocumentSeriesStatItem = StatBadgeItem & {
    key: DocumentSeriesStatKey;
};

export type DocumentSeriesOldForm = {
    sunat_document_type_code: string;
    series: string;
    name: string;
    is_electronic: boolean;
    next_number: number;
    is_active: boolean;
};

export type DocumentSeriesIndexPageProps = {
    documentSeries: DocumentSeriesRow[];
    stats: DocumentSeriesStatItem[];
    documentSeriesModal?: 'create' | 'edit' | null;
    documentSeriesModalId?: string | null;
    oldForm: DocumentSeriesOldForm;
};

export type DocumentSeriesPageErrors = Record<string, string>;
