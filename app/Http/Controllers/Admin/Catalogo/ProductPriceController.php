<?php

namespace App\Http\Controllers\Admin\Catalogo;

use App\Http\Controllers\Admin\Catalogo\Concerns\RedirectsToProductCatalog;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Catalogo\ProductPriceRequest;
use App\Models\Product;
use App\Models\ProductPrice;
use App\Models\ProductVariant;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;

class ProductPriceController extends Controller
{
    use RedirectsToProductCatalog;

    public function store(ProductPriceRequest $request, Product $producto): RedirectResponse
    {
        abort_unless($producto->exists, 404);

        $data = $request->validated();

        ProductPrice::query()->updateOrCreate(
            [
                'product_variant_id' => $data['product_variant_id'],
                'price_list_id' => $data['price_list_id'],
            ],
            [
                'amount' => $data['amount'],
                'source' => ProductPrice::SOURCE_MANUAL,
            ],
        );

        Toast::success('Precio registrado.');

        return $this->redirectToProduct($producto);
    }

    public function update(
        ProductPriceRequest $request,
        Product $producto,
        ProductPrice $precio,
    ): RedirectResponse {
        abort_unless($precio->variant?->product_id === $producto->id, 404);

        $precio->update([
            'amount' => $request->validated('amount'),
            'source' => ProductPrice::SOURCE_MANUAL,
        ]);

        Toast::success('Precio actualizado.');

        return $this->redirectToProduct($producto);
    }

    public function destroy(Product $producto, ProductPrice $precio): RedirectResponse
    {
        abort_unless($precio->variant?->product_id === $producto->id, 404);

        $precio->delete();

        Toast::success('Precio eliminado.');

        return $this->redirectToProduct($producto);
    }

    private function redirectToProduct(Product $product): RedirectResponse
    {
        return $this->redirectToProductShow($product, 'precios');
    }
}
