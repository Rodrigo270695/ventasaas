<?php

return [

    /*
    |--------------------------------------------------------------------------
    | SEO — vitrina pública y metadatos globales
    |--------------------------------------------------------------------------
    */

    'locale' => env('SEO_LOCALE', 'es_PE'),

    'country' => env('SEO_COUNTRY', 'PE'),

    'twitter_card' => env('SEO_TWITTER_CARD', 'summary_large_image'),

    'og_type' => 'website',

    'robots_public' => 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',

    'robots_private' => 'noindex, nofollow',

    'max_products_in_schema' => 24,

    'default_description' => env(
        'SEO_DESCRIPTION',
        'Catálogo online con los mejores productos. Consulta precios y pide por WhatsApp.',
    ),

    'title_suffix' => env('SEO_TITLE_SUFFIX'),

    'keywords' => env('SEO_KEYWORDS'),

];
