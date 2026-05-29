export type SeoOpenGraph = {
    title: string;
    description: string;
    url: string;
    type: string;
    image: string | null;
    site_name: string;
    locale: string;
};

export type SeoTwitter = {
    card: string;
    title: string;
    description: string;
    image: string | null;
};

export type SeoMeta = {
    title: string;
    description: string;
    keywords: string | null;
    canonical: string;
    robots: string;
    locale: string;
    og: SeoOpenGraph;
    twitter: SeoTwitter;
    json_ld: Record<string, unknown>[];
};
