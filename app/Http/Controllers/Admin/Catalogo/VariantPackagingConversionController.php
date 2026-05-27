<?php

namespace App\Http\Controllers\Admin\Catalogo;

use App\Http\Controllers\Admin\Catalogo\Concerns\RedirectsToProductCatalog;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Catalogo\VariantPackagingConversionRequest;
use App\Models\Product;
use App\Models\VariantPackagingConversion;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class VariantPackagingConversionController extends Controller
{
    use RedirectsToProductCatalog;

    public function store(
        VariantPackagingConversionRequest $request,
        Product $producto,
    ): RedirectResponse {
        abort_unless($producto->exists, 404);

        $data = $request->validated();

        VariantPackagingConversion::query()->updateOrCreate(
            [
                'from_variant_id' => $data['from_variant_id'],
                'to_variant_id' => $data['to_variant_id'],
            ],
            [
                'product_id' => $producto->id,
                'factor' => $data['factor'],
                'label' => $data['label'] ?? null,
                'is_active' => true,
            ],
        );

        Toast::success('Conversión de empaque guardada.');

        return $this->redirectToProductShow($producto, 'empaque');
    }

    public function destroy(
        Request $request,
        Product $producto,
        VariantPackagingConversion $conversion,
    ): RedirectResponse {
        abort_unless($request->user()?->can('products.update'), 403);
        abort_unless($conversion->product_id === $producto->id, 404);

        $conversion->delete();

        Toast::success('Conversión eliminada.');

        return $this->redirectToProductShow($producto, 'empaque');
    }
}
