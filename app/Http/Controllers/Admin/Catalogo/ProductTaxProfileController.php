<?php

namespace App\Http\Controllers\Admin\Catalogo;

use App\Http\Controllers\Admin\Catalogo\Concerns\RedirectsToProductCatalog;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Catalogo\ProductTaxProfileRequest;
use App\Models\Product;
use App\Models\ProductTaxProfile;
use App\Models\TaxProfile;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;

class ProductTaxProfileController extends Controller
{
    use RedirectsToProductCatalog;

    public function store(ProductTaxProfileRequest $request, Product $producto): RedirectResponse
    {
        abort_unless($producto->exists, 404);

        $data = $this->resolvePayload($request->validated());

        ProductTaxProfile::query()->updateOrCreate(
            ['product_variant_id' => $data['product_variant_id']],
            $data,
        );

        Toast::success('Perfil tributario asignado.');

        return $this->redirectToProduct($producto);
    }

    public function update(
        ProductTaxProfileRequest $request,
        Product $producto,
        ProductTaxProfile $perfil,
    ): RedirectResponse {
        abort_unless($perfil->variant?->product_id === $producto->id, 404);

        $data = $this->resolvePayload($request->validated(), false);

        $perfil->update($data);

        Toast::success('Perfil tributario actualizado.');

        return $this->redirectToProduct($producto);
    }

    public function destroy(Product $producto, ProductTaxProfile $perfil): RedirectResponse
    {
        abort_unless($perfil->variant?->product_id === $producto->id, 404);

        $perfil->delete();

        Toast::success('Perfil tributario quitado.');

        return $this->redirectToProduct($producto);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function resolvePayload(array $data, bool $includeVariant = true): array
    {
        if (! empty($data['tax_profile_id'])) {
            $template = TaxProfile::query()->find($data['tax_profile_id']);

            if ($template) {
                $data['sunat_affectation_code'] = $template->sunat_affectation_code;
                $data['igv_rate'] = $template->igv_rate;
                $data['isc_rate'] = $template->isc_rate;
            }
        }

        if (! $includeVariant) {
            unset($data['product_variant_id']);
        }

        return $data;
    }

    private function redirectToProduct(Product $product): RedirectResponse
    {
        return $this->redirectToProductShow($product, 'impuestos');
    }
}
