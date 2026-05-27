import { FileDigit, FileText, Power, PowerOff } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { DocumentSeriesStatKey } from '@/types/admin/document-series';

export const DOCUMENT_SERIES_STAT_ICONS: Record<DocumentSeriesStatKey, LucideIcon> = {
    total: FileText,
    active: Power,
    inactive: PowerOff,
    electronic: FileDigit,
};
