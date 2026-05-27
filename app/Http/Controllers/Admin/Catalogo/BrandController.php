<?php

namespace App\Http\Controllers\Admin\Catalogo;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Catalogo\BrandRequest;
use App\Models\Brand;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BrandController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('brands.view'), 403);

        if ($request->boolean('_reset')) {
            $request->session()->forget(['brandModal', 'brandModalBrandId', 'errors']);
        }

        $brands = Brand::query()
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'is_active']);

        $brandsPayload = $brands->map(fn (Brand $brand) => [
            'id' => $brand->id,
            'code' => $brand->code,
            'name' => $brand->name,
            'is_active' => $brand->is_active,
        ]);

        $activeCount = $brands->where('is_active', true)->count();

        return Inertia::render('admin/catalogo/marcas/index', [
            'brands' => $brandsPayload,
            'stats' => [
                ['key' => 'total', 'label' => 'Total', 'value' => $brands->count(), 'tone' => 'violet'],
                ['key' => 'active', 'label' => 'Activas', 'value' => $activeCount, 'tone' => 'green'],
                ['key' => 'inactive', 'label' => 'Inactivas', 'value' => $brands->count() - $activeCount, 'tone' => 'amber'],
            ],
            'brandModal' => session()->pull('brandModal'),
            'brandModalBrandId' => session()->pull('brandModalBrandId'),
            'oldForm' => $this->oldFormDefaults(),
        ]);
    }

    public function store(BrandRequest $request): RedirectResponse
    {
        Brand::create($request->validated());

        Toast::success('Marca creada correctamente.');

        return to_route('admin.catalogo.marcas.index');
    }

    public function update(BrandRequest $request, Brand $marca): RedirectResponse
    {
        $marca->update($request->validated());

        Toast::success('Marca actualizada.');

        return to_route('admin.catalogo.marcas.index');
    }

    public function destroy(Request $request, Brand $marca): RedirectResponse
    {
        abort_unless($request->user()?->can('brands.delete'), 403);

        $marca->delete();

        Toast::success('Marca eliminada.');

        return to_route('admin.catalogo.marcas.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function oldFormDefaults(): array
    {
        return [
            'code' => old('code', ''),
            'name' => old('name', ''),
            'is_active' => filter_var(old('is_active', true), FILTER_VALIDATE_BOOLEAN),
        ];
    }
}
