<?php

namespace App\Http\Controllers\Admin\Catalogo\Concerns;

use App\Models\Product;
use Illuminate\Http\RedirectResponse;

trait RedirectsToProductCatalog
{
    protected function redirectToProductShow(Product $product, string $tab = 'general'): RedirectResponse
    {
        return to_route('admin.catalogo.productos.show', [
            'producto' => $product,
            'tab' => $tab,
        ]);
    }
}
