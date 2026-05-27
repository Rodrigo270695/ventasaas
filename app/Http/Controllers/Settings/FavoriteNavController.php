<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FavoriteNavController extends Controller
{
    /**
     * @return array<string, string>
     */
    private function favoritePermissionMap(): array
    {
        return [
            '/admin/catalogo/productos' => 'products.view',
            '/admin/catalogo/categorias' => 'categories.view',
            '/admin/ventas/comprobantes' => 'sales.view',
            '/admin/ventas/cotizaciones' => 'sales.quotations.view',
            '/admin/compras/facturas' => 'purchases.view',
            '/admin/inventario/saldos' => 'stock_balances.view',
            '/admin/inventario/movimientos' => 'stock_movements.view',
            '/admin/tesoreria/cuentas-por-cobrar' => 'treasury.collections.view',
            '/admin/tesoreria/cuentas-por-pagar' => 'treasury.disbursements.view',
            '/admin/tesoreria/cobros' => 'treasury.collections.view',
            '/admin/tesoreria/pagos-proveedor' => 'treasury.disbursements.view',
            '/admin/documentos/comprobantes-electronicos' => 'electronic_documents.view',
            '/admin/documentos/series' => 'document_series.view',
            '/admin/sistema/usuarios' => 'users.view',
            '/admin/sistema/roles' => 'roles.view',
            '/admin/sistema/auditoria' => 'audit.view',
        ];
    }

    public function update(Request $request): RedirectResponse
    {
        $allowedHrefs = array_keys($this->favoritePermissionMap());

        $validated = $request->validate([
            'favorites' => ['nullable', 'array', 'max:4'],
            'favorites.*' => ['string', Rule::in($allowedHrefs)],
        ]);

        $favorites = collect($validated['favorites'] ?? [])
            ->filter(function (string $href) use ($request): bool {
                $permission = $this->favoritePermissionMap()[$href] ?? null;
                if (! $permission) {
                    return false;
                }

                return (bool) $request->user()?->can($permission);
            })
            ->values()
            ->all();

        $request->user()?->update([
            'favorite_nav_items' => $favorites,
        ]);

        return back();
    }
}

