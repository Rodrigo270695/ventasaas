<?php

namespace App\Http\Controllers\Admin\Catalogo;

use App\Http\Controllers\Admin\Catalogo\Concerns\RedirectsToProductCatalog;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Catalogo\ProductVariantRequest;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ProductVariantController extends Controller
{
    use RedirectsToProductCatalog;

    public function store(ProductVariantRequest $request, Product $producto): RedirectResponse
    {
        abort_unless($producto->exists, 404);

        $data = $request->validated();
        $isDefault = (bool) ($data['is_default'] ?? false);

        if ($producto->variants()->count() === 0) {
            $isDefault = true;
        }

        $variant = $producto->variants()->create([
            ...$data,
            'minimum_stock' => $data['minimum_stock'] ?? 0,
            'is_default' => $isDefault,
            'is_active' => $data['is_active'] ?? true,
        ]);

        if ($isDefault) {
            $this->clearOtherDefaults($producto, $variant->id);
        }

        Toast::success('Variante agregada.');

        return $this->redirectToProduct($producto);
    }

    public function update(
        ProductVariantRequest $request,
        Product $producto,
        ProductVariant $variante,
    ): RedirectResponse {
        abort_unless($variante->product_id === $producto->id, 404);

        $data = $request->validated();
        $isDefault = (bool) ($data['is_default'] ?? $variante->is_default);

        if ($producto->variants()->count() === 1) {
            $isDefault = true;
        }

        $variante->update([
            ...$data,
            'minimum_stock' => $data['minimum_stock'] ?? 0,
            'is_default' => $isDefault,
        ]);

        if ($isDefault) {
            $this->clearOtherDefaults($producto, $variante->id);
        }

        Toast::success('Variante actualizada.');

        return $this->redirectToProduct($producto);
    }

    public function destroy(
        Request $request,
        Product $producto,
        ProductVariant $variante,
    ): RedirectResponse {
        abort_unless($request->user()?->can('products.delete'), 403);
        abort_unless($variante->product_id === $producto->id, 404);

        if ($producto->variants()->count() <= 1) {
            Toast::error('El producto debe tener al menos una variante.');

            return $this->redirectToProduct($producto);
        }

        $wasDefault = $variante->is_default;
        $variante->delete();

        if ($wasDefault) {
            $next = $producto->variants()->orderBy('created_at')->first();
            $next?->update(['is_default' => true]);
        }

        Toast::success('Variante eliminada.');

        return $this->redirectToProduct($producto);
    }

    private function clearOtherDefaults(Product $product, string $exceptId): void
    {
        $product->variants()
            ->where('id', '!=', $exceptId)
            ->update(['is_default' => false]);
    }

    private function redirectToProduct(Product $product): RedirectResponse
    {
        return $this->redirectToProductShow($product, 'variantes');
    }
}
