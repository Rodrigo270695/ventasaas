import { Head } from '@inertiajs/react';
import type { SeoMeta } from '@/types/seo';

type Props = {
    seo: SeoMeta;
};

export function SeoHead({ seo }: Props) {
    return (
        <Head title={seo.title}>
            <meta
                head-key="description"
                name="description"
                content={seo.description}
            />
            {seo.keywords ? (
                <meta
                    head-key="keywords"
                    name="keywords"
                    content={seo.keywords}
                />
            ) : null}
            <meta head-key="robots" name="robots" content={seo.robots} />
            <link head-key="canonical" rel="canonical" href={seo.canonical} />

            <meta
                head-key="og:title"
                property="og:title"
                content={seo.og.title}
            />
            <meta
                head-key="og:description"
                property="og:description"
                content={seo.og.description}
            />
            <meta head-key="og:url" property="og:url" content={seo.og.url} />
            <meta
                head-key="og:type"
                property="og:type"
                content={seo.og.type}
            />
            <meta
                head-key="og:site_name"
                property="og:site_name"
                content={seo.og.site_name}
            />
            <meta
                head-key="og:locale"
                property="og:locale"
                content={seo.og.locale}
            />
            {seo.og.image ? (
                <meta
                    head-key="og:image"
                    property="og:image"
                    content={seo.og.image}
                />
            ) : null}

            <meta
                head-key="twitter:card"
                name="twitter:card"
                content={seo.twitter.card}
            />
            <meta
                head-key="twitter:title"
                name="twitter:title"
                content={seo.twitter.title}
            />
            <meta
                head-key="twitter:description"
                name="twitter:description"
                content={seo.twitter.description}
            />
            {seo.twitter.image ? (
                <meta
                    head-key="twitter:image"
                    name="twitter:image"
                    content={seo.twitter.image}
                />
            ) : null}

            {seo.json_ld.map((schema, index) => (
                <script
                    key={`json-ld-${index}`}
                    head-key={`json-ld-${index}`}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(schema),
                    }}
                />
            ))}
        </Head>
    );
}
