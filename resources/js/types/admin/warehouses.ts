import type { StatBadgeItem } from '@/components/page-header';

export type WarehouseFormValues = {
    id: string;
    code: string;
    name: string;
    is_default: boolean;
    is_saleable: boolean;
    is_active: boolean;
    sort_order: number;
};

export type WarehouseRow = WarehouseFormValues;

export type WarehouseStatKey = 'total' | 'active' | 'inactive' | 'saleable';

export type WarehouseStatItem = StatBadgeItem & {
    key: WarehouseStatKey;
};

export type WarehousesOldForm = {
    code: string;
    name: string;
    is_default: boolean;
    is_saleable: boolean;
    is_active: boolean;
    sort_order: number;
};

export type WarehousesIndexPageProps = {
    warehouses: WarehouseRow[];
    stats: WarehouseStatItem[];
    warehouseModal?: 'create' | 'edit' | null;
    warehouseModalId?: string | null;
    oldForm: WarehousesOldForm;
};

export type WarehousesPageErrors = Record<string, string>;
