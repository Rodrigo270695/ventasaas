import type { FormSelectOption } from '@/components/form';
import type { StatBadgeItem } from '@/components/page-header';

export type ProductType = 'good' | 'service';

export type ProductVariantPriceRow = {
    id: string;
    price_list_id: string;
    price_list_code: string | null;
    price_list_name: string | null;
    currency_code: string;
    amount: string;
};

export type ProductVariantTaxProfileRow = {
    id: string;
    tax_profile_id: string | null;
    tax_profile_code: string | null;
    tax_profile_name: string | null;
    sunat_affectation_code: string;
    igv_rate: string;
    isc_rate: string | null;
};

export type ProductVariantStockRow = {
    warehouse_id: string;
    quantity_on_hand: string;
    avg_cost: string;
};

export type ProductVariantRow = {
    id: string;
    sku: string;
    label: string | null;
    barcode: string | null;
    minimum_stock: string;
    is_default: boolean;
    is_active: boolean;
    prices: ProductVariantPriceRow[];
    tax_profile: ProductVariantTaxProfileRow | null;
    stock: ProductVariantStockRow | null;
};

export type WarehouseOption = FormSelectOption & {
    code: string;
    is_default: boolean;
};

export type TaxProfileOption = FormSelectOption & {
    code: string;
    sunat_affectation_code: string;
    igv_rate: string;
    isc_rate: string;
    is_default: boolean;
};

export type PriceListOption = FormSelectOption & {
    code: string;
    currency_code: string;
    is_default: boolean;
};

export type ProductStockSummaryRow = {
    variant_id: string;
    sku: string;
    label: string | null;
    is_default: boolean;
    minimum_stock: string;
    quantity_on_hand: string;
    avg_cost: string;
    stock_value: string;
    is_low_stock: boolean;
    is_out_of_stock: boolean;
};

export type ProductStockSummaryResponse = {
    product_id: string;
    product_name: string;
    track_stock: boolean;
    warehouse_id: string | null;
    warehouse_label: string | null;
    variants: ProductStockSummaryRow[];
};

export type ProductRow = {
    id: string;
    name: string;
    description: string | null;
    type: ProductType;
    category_id: string | null;
    category_name: string | null;
    brand_id: string | null;
    brand_name: string | null;
    base_unit_id: string;
    base_unit_label: string | null;
    track_stock: boolean;
    is_active: boolean;
    variants_count: number;
    default_sku: string | null;
    default_barcode: string | null;
    default_price: string | null;
    default_tax_label: string | null;
};

export type ProductDetail = ProductRow & {
    variants: ProductVariantRow[];
};

export type ProductShowTab =
    | 'general'
    | 'variantes'
    | 'precios'
    | 'impuestos'
    | 'stock'
    | 'empaque';

export type PackagingConversionRow = {
    id: string;
    from_variant_id: string;
    to_variant_id: string;
    from_sku: string | null;
    from_label: string | null;
    to_sku: string | null;
    to_label: string | null;
    factor: string;
    label: string | null;
};

export type ProductsInitialVariantForm = {
    sku: string;
    label: string;
    barcode: string;
};

export type ProductsOldForm = {
    name: string;
    description: string;
    type: ProductType;
    category_id: string;
    brand_id: string;
    base_unit_id: string;
    track_stock: boolean;
    is_active: boolean;
    initial_variant: ProductsInitialVariantForm;
};

export type ProductStatKey = 'total' | 'active' | 'goods' | 'services';

export type ProductStatItem = StatBadgeItem & {
    key: ProductStatKey;
};

export type ProductsIndexPageProps = {
    products: ProductRow[];
    stats: ProductStatItem[];
    categoryOptions: FormSelectOption[];
    brandOptions: FormSelectOption[];
    unitOptions: FormSelectOption[];
    warehouseOptions?: WarehouseOption[];
    defaultWarehouseId?: string | null;
    productModal?: 'create' | null;
    oldForm?: ProductsOldForm;
};

export type ProductsShowPageProps = {
    product: ProductDetail;
    packagingConversions?: PackagingConversionRow[];
    tab: ProductShowTab;
    categoryOptions: FormSelectOption[];
    brandOptions: FormSelectOption[];
    unitOptions: FormSelectOption[];
    warehouseOptions: WarehouseOption[];
    defaultWarehouseId: string | null;
    defaultWarehouseLabel: string | null;
    priceListOptions: PriceListOption[];
    taxProfileOptions: TaxProfileOption[];
    oldForm?: ProductsOldForm;
};

export type ProductsPageErrors = Record<string, string>;
