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

export type WelcomeHeroSlide = {
    id: string;
    title: string | null;
    subtitle: string | null;
    image_url: string;
};

import type { SeoMeta } from '@/types/seo';

export type WelcomePageProps = {
    store: WelcomeStore;
    heroSlides: WelcomeHeroSlide[];
    categories: CatalogCategory[];
    products: CatalogProduct[];
    seo: SeoMeta;
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
