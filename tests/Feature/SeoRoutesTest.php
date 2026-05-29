<?php

use Illuminate\Support\Facades\URL;

test('robots.txt blocks private areas and references sitemap', function () {
    URL::forceScheme('https');
    URL::forceRootUrl('https://choko.test');

    $this->get(route('robots'))
        ->assertOk()
        ->assertHeader('Content-Type', 'text/plain; charset=UTF-8')
        ->assertSee('Disallow: /admin')
        ->assertSee('Disallow: /login')
        ->assertSee('Sitemap: https://choko.test/sitemap.xml');
});

test('sitemap.xml exposes the public home page', function () {
    URL::forceScheme('https');
    URL::forceRootUrl('https://choko.test');

    $response = $this->get(route('sitemap'));

    $response
        ->assertOk()
        ->assertHeader('Content-Type', 'application/xml; charset=UTF-8');

    expect($response->getContent())
        ->toContain('<loc>https://choko.test</loc>')
        ->toContain('<changefreq>daily</changefreq>')
        ->toContain('<priority>1.0</priority>');
});
