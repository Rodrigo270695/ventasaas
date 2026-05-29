<?php

namespace App\Support;

use App\Models\CfgStoreSetting;
use Illuminate\Support\Str;

class SeoMetaBuilder
{
    /**
     * @param  array<int, array<string, mixed>>  $products
     * @param  array<int, array<string, mixed>>  $heroSlides
     * @param  array<int, array<string, mixed>>  $categories
     * @return array<string, mixed>
     */
    public function forWelcome(
        ?CfgStoreSetting $store,
        array $products,
        array $heroSlides,
        array $categories,
    ): array {
        $company = config('company');
        $seoConfig = config('seo');

        $storeSeo = is_array($store?->settings['seo'] ?? null)
            ? $store->settings['seo']
            : [];

        $storeName = $store?->razon_social ?: $company['name'];
        $tagline = filled($storeSeo['tagline'] ?? null)
            ? $storeSeo['tagline']
            : ($company['tagline'] ?: null);

        $title = filled($storeSeo['meta_title'] ?? null)
            ? $storeSeo['meta_title']
            : $this->buildTitle($storeName, $tagline);

        $description = filled($storeSeo['meta_description'] ?? null)
            ? $storeSeo['meta_description']
            : $this->buildDescription($storeName, $tagline, $categories, $products);

        $canonical = $this->absoluteUrl('/');
        $image = $this->resolveImage($storeSeo, $heroSlides, $company['logo_url'] ?? null);
        $keywords = filled($storeSeo['keywords'] ?? null)
            ? $storeSeo['keywords']
            : ($seoConfig['keywords'] ?: $this->buildKeywords($categories, $products));

        $og = [
            'title' => $title,
            'description' => $description,
            'url' => $canonical,
            'type' => $seoConfig['og_type'],
            'image' => $image,
            'site_name' => $storeName,
            'locale' => $seoConfig['locale'],
        ];

        $twitter = [
            'card' => $seoConfig['twitter_card'],
            'title' => $title,
            'description' => $description,
            'image' => $image,
        ];

        return [
            'title' => $title,
            'description' => $description,
            'keywords' => $keywords,
            'canonical' => $canonical,
            'robots' => $seoConfig['robots_public'],
            'locale' => $seoConfig['locale'],
            'og' => $og,
            'twitter' => $twitter,
            'json_ld' => $this->buildJsonLd(
                store: $store,
                storeName: $storeName,
                description: $description,
                image: $image,
                canonical: $canonical,
                products: $products,
                categories: $categories,
            ),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function sitemapUrls(): array
    {
        return [
            [
                'loc' => $this->absoluteUrl('/'),
                'changefreq' => 'daily',
                'priority' => '1.0',
                'lastmod' => now()->toAtomString(),
            ],
        ];
    }

    public function robotsTxt(): string
    {
        $sitemap = $this->absoluteUrl('/sitemap.xml');

        return implode("\n", [
            'User-agent: *',
            'Allow: /',
            '',
            'Disallow: /admin',
            'Disallow: /dashboard',
            'Disallow: /settings',
            'Disallow: /login',
            'Disallow: /forgot-password',
            'Disallow: /reset-password',
            'Disallow: /email',
            'Disallow: /user',
            'Disallow: /two-factor-challenge',
            'Disallow: /compras/orden',
            'Disallow: /up',
            '',
            "Sitemap: {$sitemap}",
        ]);
    }

    private function buildTitle(string $storeName, ?string $tagline): string
    {
        $suffix = config('seo.title_suffix');

        if (filled($suffix)) {
            return "{$storeName} | {$suffix}";
        }

        if (filled($tagline) && ! Str::contains(Str::lower($tagline), Str::lower($storeName))) {
            return "{$storeName} | {$tagline}";
        }

        return $storeName;
    }

    /**
     * @param  array<int, array<string, mixed>>  $categories
     * @param  array<int, array<string, mixed>>  $products
     */
    private function buildDescription(
        string $storeName,
        ?string $tagline,
        array $categories,
        array $products,
    ): string {
        $custom = config('seo.default_description');
        $parts = array_filter([
            $storeName,
            $tagline,
            $custom,
        ]);

        $categoryNames = collect($categories)
            ->pluck('name')
            ->filter()
            ->take(4)
            ->implode(', ');

        if ($categoryNames !== '') {
            $parts[] = "Categorías: {$categoryNames}.";
        }

        if ($products !== []) {
            $parts[] = count($products).' productos disponibles.';
        }

        return Str::limit(implode(' ', $parts), 160, '…');
    }

    /**
     * @param  array<int, array<string, mixed>>  $categories
     * @param  array<int, array<string, mixed>>  $products
     */
    private function buildKeywords(array $categories, array $products): ?string
    {
        $keywords = collect($categories)
            ->pluck('name')
            ->merge(collect($products)->pluck('name'))
            ->filter()
            ->unique()
            ->take(12)
            ->values();

        return $keywords->isEmpty() ? null : $keywords->implode(', ');
    }

    /**
     * @param  array<string, mixed>  $storeSeo
     * @param  array<int, array<string, mixed>>  $heroSlides
     */
    private function resolveImage(array $storeSeo, array $heroSlides, ?string $logoUrl): ?string
    {
        if (filled($storeSeo['og_image'] ?? null)) {
            return $this->absoluteUrl($storeSeo['og_image']);
        }

        $heroImage = collect($heroSlides)->pluck('image_url')->filter()->first();

        if (filled($heroImage)) {
            return $this->absoluteUrl($heroImage);
        }

        return filled($logoUrl) ? $this->absoluteUrl($logoUrl) : null;
    }

    /**
     * @param  array<int, array<string, mixed>>  $products
     * @param  array<int, array<string, mixed>>  $categories
     * @return array<int, array<string, mixed>>
     */
    private function buildJsonLd(
        ?CfgStoreSetting $store,
        string $storeName,
        string $description,
        ?string $image,
        string $canonical,
        array $products,
        array $categories,
    ): array {
        $company = config('company');
        $schemas = [];

        $organization = array_filter([
            '@context' => 'https://schema.org',
            '@type' => 'Store',
            'name' => $storeName,
            'description' => $description,
            'url' => $canonical,
            'image' => $image,
            'logo' => filled($company['logo_url'] ?? null)
                ? $this->absoluteUrl($company['logo_url'])
                : $image,
            'telephone' => $this->formatTelephone(
                $store?->whatsapp_number ?: ($company['phone'] ?? null),
            ),
            'email' => $company['email'] ?? null,
            'address' => filled($store?->direccion)
                ? [
                    '@type' => 'PostalAddress',
                    'streetAddress' => $store->direccion,
                    'addressCountry' => config('seo.country'),
                ]
                : (filled($company['address'] ?? null)
                    ? [
                        '@type' => 'PostalAddress',
                        'streetAddress' => $company['address'],
                        'addressCountry' => config('seo.country'),
                    ]
                    : null),
            'sameAs' => array_values(array_filter([
                filled($company['website'] ?? null) ? $company['website'] : null,
            ])),
        ], fn ($value) => $value !== null && $value !== []);

        $schemas[] = $organization;

        $schemas[] = array_filter([
            '@context' => 'https://schema.org',
            '@type' => 'WebSite',
            'name' => $storeName,
            'url' => $canonical,
            'description' => $description,
            'inLanguage' => config('seo.locale'),
            'publisher' => [
                '@type' => 'Organization',
                'name' => $storeName,
                'logo' => $organization['logo'] ?? $image,
            ],
        ], fn ($value) => $value !== null && $value !== []);

        $itemList = $this->buildProductItemList($products, $canonical);

        if ($itemList !== null) {
            $schemas[] = $itemList;
        }

        if ($categories !== []) {
            $schemas[] = [
                '@context' => 'https://schema.org',
                '@type' => 'ItemList',
                'name' => 'Categorías',
                'itemListElement' => collect($categories)
                    ->values()
                    ->map(fn (array $category, int $index) => [
                        '@type' => 'ListItem',
                        'position' => $index + 1,
                        'name' => $category['name'],
                    ])
                    ->all(),
            ];
        }

        return $schemas;
    }

    /**
     * @param  array<int, array<string, mixed>>  $products
     * @return array<string, mixed>|null
     */
    private function buildProductItemList(array $products, string $canonical): ?array
    {
        if ($products === []) {
            return null;
        }

        $limit = (int) config('seo.max_products_in_schema');

        $elements = collect($products)
            ->take($limit)
            ->values()
            ->map(function (array $product, int $index) use ($canonical) {
                $variant = collect($product['variants'] ?? [])->first();

                if (! $variant) {
                    return null;
                }

                $offer = [
                    '@type' => 'Offer',
                    'price' => (string) $variant['price'],
                    'priceCurrency' => $variant['currency_code'] ?? 'PEN',
                    'availability' => 'https://schema.org/InStock',
                    'url' => $canonical.'#catalogo',
                ];

                $item = array_filter([
                    '@type' => 'Product',
                    'name' => $product['name'],
                    'description' => filled($product['description'] ?? null)
                        ? Str::limit(strip_tags((string) $product['description']), 300)
                        : null,
                    'sku' => $variant['sku'] ?? null,
                    'category' => $product['category_name'] ?? null,
                    'brand' => filled($product['brand_name'] ?? null)
                        ? [
                            '@type' => 'Brand',
                            'name' => $product['brand_name'],
                        ]
                        : null,
                    'offers' => $offer,
                ], fn ($value) => $value !== null && $value !== []);

                return [
                    '@type' => 'ListItem',
                    'position' => $index + 1,
                    'item' => $item,
                ];
            })
            ->filter()
            ->values()
            ->all();

        if ($elements === []) {
            return null;
        }

        return [
            '@context' => 'https://schema.org',
            '@type' => 'ItemList',
            'name' => 'Catálogo de productos',
            'numberOfItems' => count($elements),
            'itemListElement' => $elements,
        ];
    }

    private function formatTelephone(?string $number): ?string
    {
        if (blank($number)) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $number) ?? '';

        return $digits !== '' ? '+'.$digits : null;
    }

    private function absoluteUrl(string $path): string
    {
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        return url($path);
    }
}
