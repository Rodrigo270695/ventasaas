export type CatalogVariant = {
    id: string;
    sku: string;
    label: string | null;
    is_default: boolean;
    price: string;
    currency_code: string;
};

export type CatalogProduct = {
    id: string;
    name: string;
    description: string | null;
    type: 'good' | 'service';
    category_id: string | null;
    category_name: string | null;
    brand_name: string | null;
    variants: CatalogVariant[];
};

export type CatalogCategory = {
    id: string;
    name: string;
};

export type WelcomeStore = {
    name: string | null;
    whatsapp_number: string | null;
};

export type WelcomePageProps = {
    store: WelcomeStore;
    categories: CatalogCategory[];
    products: CatalogProduct[];
};

export type CartLine = {
    key: string;
    productId: string;
    productName: string;
    variantId: string;
    sku: string;
    variantLabel: string | null;
    unitPrice: string;
    currencyCode: string;
    quantity: number;
};
