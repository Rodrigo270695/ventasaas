<?php

namespace App\Http\Controllers\Admin\Catalogo;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Catalogo\PriceListRequest;
use App\Models\PriceList;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PriceListController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('price_lists.view'), 403);

        if ($request->boolean('_reset')) {
            $request->session()->forget(['priceListModal', 'priceListModalId', 'errors']);
        }

        $priceLists = PriceList::query()
            ->withCount('productPrices')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $payload = $priceLists->map(fn (PriceList $list) => [
            'id' => $list->id,
            'code' => $list->code,
            'name' => $list->name,
            'currency_code' => $list->currency_code,
            'is_default' => $list->is_default,
            'is_active' => $list->is_active,
            'sort_order' => $list->sort_order,
            'prices_count' => $list->product_prices_count,
        ]);

        $activeCount = $priceLists->where('is_active', true)->count();

        return Inertia::render('admin/catalogo/listas-precios/index', [
            'priceLists' => $payload,
            'stats' => [
                ['key' => 'total', 'label' => 'Total', 'value' => $priceLists->count(), 'tone' => 'violet'],
                ['key' => 'active', 'label' => 'Activas', 'value' => $activeCount, 'tone' => 'green'],
                ['key' => 'prices', 'label' => 'Precios cargados', 'value' => $priceLists->sum('product_prices_count'), 'tone' => 'cyan'],
            ],
            'priceListModal' => session()->pull('priceListModal'),
            'priceListModalId' => session()->pull('priceListModalId'),
            'oldForm' => $this->oldFormDefaults(),
        ]);
    }

    public function store(PriceListRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data): void {
            $list = PriceList::create($data);

            if ($list->is_default) {
                $this->clearOtherDefaults($list->id);
            }
        });

        Toast::success('Lista de precios creada correctamente.');

        return to_route('admin.catalogo.listas-precios.index');
    }

    public function update(PriceListRequest $request, PriceList $listasPrecio): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($listasPrecio, $data): void {
            $listasPrecio->update($data);

            if ($listasPrecio->is_default) {
                $this->clearOtherDefaults($listasPrecio->id);
            }
        });

        Toast::success('Lista de precios actualizada.');

        return to_route('admin.catalogo.listas-precios.index');
    }

    public function destroy(Request $request, PriceList $listasPrecio): RedirectResponse
    {
        abort_unless($request->user()?->can('price_lists.delete'), 403);

        if ($listasPrecio->is_default) {
            Toast::error('No puedes eliminar la lista por defecto.');

            return to_route('admin.catalogo.listas-precios.index');
        }

        if ($listasPrecio->productPrices()->exists()) {
            Toast::error('La lista tiene precios asignados. Elimínalos o desactívala.');

            return to_route('admin.catalogo.listas-precios.index');
        }

        $listasPrecio->delete();

        Toast::success('Lista de precios eliminada.');

        return to_route('admin.catalogo.listas-precios.index');
    }

    private function clearOtherDefaults(string $exceptId): void
    {
        PriceList::query()
            ->where('id', '!=', $exceptId)
            ->update(['is_default' => false]);
    }

    /**
     * @return array<string, mixed>
     */
    private function oldFormDefaults(): array
    {
        return [
            'code' => old('code', ''),
            'name' => old('name', ''),
            'currency_code' => old('currency_code', 'PEN'),
            'is_default' => filter_var(old('is_default', false), FILTER_VALIDATE_BOOLEAN),
            'is_active' => filter_var(old('is_active', true), FILTER_VALIDATE_BOOLEAN),
            'sort_order' => (int) old('sort_order', 0),
        ];
    }
}
