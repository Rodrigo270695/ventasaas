<?php

namespace App\Http\Controllers\Seo;

use App\Http\Controllers\Controller;
use App\Support\SeoMetaBuilder;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    public function __invoke(SeoMetaBuilder $seo): Response
    {
        $urls = $seo->sitemapUrls();

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'.PHP_EOL;
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'.PHP_EOL;

        foreach ($urls as $entry) {
            $xml .= '  <url>'.PHP_EOL;
            $xml .= '    <loc>'.e($entry['loc']).'</loc>'.PHP_EOL;
            $xml .= '    <lastmod>'.e($entry['lastmod']).'</lastmod>'.PHP_EOL;
            $xml .= '    <changefreq>'.e($entry['changefreq']).'</changefreq>'.PHP_EOL;
            $xml .= '    <priority>'.e($entry['priority']).'</priority>'.PHP_EOL;
            $xml .= '  </url>'.PHP_EOL;
        }

        $xml .= '</urlset>';

        return response($xml, 200, [
            'Content-Type' => 'application/xml; charset=UTF-8',
        ]);
    }
}
