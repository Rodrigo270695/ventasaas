import type { StatBadgeItem } from '@/components/page-header';
import type { FormComboboxOption } from '@/components/form';

export type StockMovementRow = {
    id: string;
    movement_id: string;
    movement_date: string | null;
    movement_date_sort?: number;
    movement_date_label: string | null;
    document_number: string | null;
    movement_type: string | null;
    movement_type_label: string;
    warehouse_code: string | null;
    warehouse_name: string | null;
    product_name: string | null;
    variant_sku: string | null;
    variant_label: string | null;
    quantity: string;
    quantity_label: string;
    is_inbound: boolean;
    unit_cost: string;
    total_cost: string;
    balance_after: string | null;
    created_by_name: string | null;
    notes: string | null;
};

export type StockMovementFilters = {
    warehouse_id: string | null;
    product_variant_id: string | null;
    movement_type: string | null;
    date_from: string | null;
    date_to: string | null;
};

export type StockMovementStatKey = 'total' | 'entries' | 'exits' | 'inbound';

export type StockMovementStatItem = StatBadgeItem & {
    key: StockMovementStatKey;
};

export type StockMovementsIndexPageProps = {
    movements: StockMovementRow[];
    filters: StockMovementFilters;
    warehouseOptions: Array<{ value: string; label: string }>;
    variantOptions: FormComboboxOption[];
    movementTypeOptions: Array<{ value: string; label: string }>;
    showBalanceColumn: boolean;
    stats: StockMovementStatItem[];
};
