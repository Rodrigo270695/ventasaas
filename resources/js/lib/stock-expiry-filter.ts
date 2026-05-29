import type { StockBalanceRow } from '@/types/admin/stock-balances';

export type StockExpiryFilter =
    | 'all'
    | 'expiring'
    | 'expired'
    | 'with_expiry_date';

export const STOCK_EXPIRY_FILTER_OPTIONS: Array<{
    value: StockExpiryFilter;
    label: string;
}> = [
    { value: 'all', label: 'Todos los productos' },
    { value: 'expiring', label: 'Por vencer' },
    { value: 'expired', label: 'Vencidos' },
    { value: 'with_expiry_date', label: 'Con fecha de vencimiento' },
];

export function hasStockOnHand(row: StockBalanceRow): boolean {
    return Number(row.quantity_on_hand) > 0;
}

export function matchesStockExpiryFilter(
    row: StockBalanceRow,
    filter: StockExpiryFilter,
): boolean {
    switch (filter) {
        case 'expiring':
            return (
                hasStockOnHand(row) &&
                Boolean(row.expires_at) &&
                row.is_expiring_soon
            );
        case 'expired':
            return (
                hasStockOnHand(row) &&
                Boolean(row.expires_at) &&
                row.is_expired
            );
        case 'with_expiry_date':
            return Boolean(row.expires_at);
        default:
            return true;
    }
}

export function filterStockBalancesByExpiry(
    balances: StockBalanceRow[],
    filter: StockExpiryFilter,
): StockBalanceRow[] {
    if (filter === 'all') {
        return balances;
    }

    return balances.filter((row) => matchesStockExpiryFilter(row, filter));
}

export type DashboardAlertFilter =
    | 'all'
    | 'low_stock'
    | 'expiring'
    | 'expired';

export const DASHBOARD_ALERT_FILTER_OPTIONS: Array<{
    value: DashboardAlertFilter;
    label: string;
}> = [
    { value: 'all', label: 'Todas las alertas' },
    { value: 'low_stock', label: 'Stock mínimo' },
    { value: 'expiring', label: 'Por vencer' },
    { value: 'expired', label: 'Vencidos' },
];
