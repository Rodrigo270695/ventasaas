<?php

namespace App\Http\Controllers\Seo;

use App\Http\Controllers\Controller;
use App\Support\SeoMetaBuilder;
use Illuminate\Http\Response;

class RobotsController extends Controller
{
    public function __invoke(SeoMetaBuilder $seo): Response
    {
        return response($seo->robotsTxt(), 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
        ]);
    }
}
