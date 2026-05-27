import { CheckCircle2, FolderTree, Hash, Layers } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CategoryStatKey } from '@/types/admin/categories';

export const CATEGORY_STAT_ICONS: Record<CategoryStatKey, LucideIcon> = {
    total: Layers,
    active: CheckCircle2,
    inactive: Hash,
    with_parent: FolderTree,
};
