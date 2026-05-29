import type {
    FormComboboxOption,
    FormSelectOption,
} from '@/components/form';
import type { StatBadgeItem } from '@/components/page-header';
import type { PriceListOption } from '@/types/admin/products';

export type StockBalanceRow = {
    id: string;
    warehouse_id: string;
    warehouse_code: string | null;
    warehouse_name: string | null;
    product_variant_id: string;
    product_name: string | null;
    variant_sku: string | null;
    variant_label: string | null;
    minimum_stock: string;
    quantity_on_hand: string;
    quantity_reserved: string;
    avg_cost: string;
    stock_value: string;
    is_low_stock: boolean;
    is_out_of_stock: boolean;
    expires_at: string | null;
    expiry_alert_days: number | null;
    is_expired: boolean;
    is_expiring_soon: boolean;
    days_until_expiry: number | null;
    expiry_level: 'critical' | 'warning' | null;
    has_expiry_alert: boolean;
};

export type StockBalanceStatKey = 'skus' | 'with_stock' | 'zero' | 'low' | 'expiry' | 'value';

export type StockBalanceStatItem = StatBadgeItem & {
    key: StockBalanceStatKey;
};

export type StockAdjustOldForm = {
    product_variant_id: string;
    quantity_on_hand: string;
    unit_cost: string;
    notes: string;
    sync_sale_prices?: boolean;
    price_list_ids?: string[];
    markup_type?: string;
    markup_value?: string;
};

export type PackagingConversionOption = {
    id: string;
    product_id: string;
    product_name: string | null;
    from_variant_id: string;
    to_variant_id: string;
    from_sku: string | null;
    to_sku: string | null;
    factor: string;
    label: string | null;
};

export type StockBalancesIndexPageProps = {
    balances: StockBalanceRow[];
    warehouseOptions: FormSelectOption[];
    selectedWarehouseId: string | null;
    variantOptions: FormComboboxOption[];
    priceListOptions?: PriceListOption[];
    packagingConversions?: PackagingConversionOption[];
    stats: StockBalanceStatItem[];
    stockAdjustModal?: string | null;
    stockAdjustVariantId?: string | null;
    stockAdjustWarehouseId?: string | null;
    openAdjustOnLoad?: boolean;
    oldForm: StockAdjustOldForm;
};

export type StockBalancesPageErrors = Record<string, string>;
