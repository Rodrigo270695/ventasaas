<?php

namespace App\Http\Controllers\Admin\Catalogo;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Catalogo\ProductCategoryRequest;
use App\Models\ProductCategory;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductCategoryController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('categories.view'), 403);

        if ($request->boolean('_reset')) {
            $request->session()->forget(['categoryModal', 'categoryModalCategoryId', 'errors']);
        }

        $categories = ProductCategory::query()
            ->with('parent:id,name')
            ->withCount('children')
            ->orderBy('name')
            ->get(['id', 'parent_id', 'code', 'name', 'is_active']);

        $categoriesPayload = $categories->map(fn (ProductCategory $category) => [
            'id' => $category->id,
            'parent_id' => $category->parent_id,
            'parent_name' => $category->parent?->name,
            'code' => $category->code,
            'name' => $category->name,
            'is_active' => $category->is_active,
            'children_count' => $category->children_count,
        ]);

        $activeCount = $categories->where('is_active', true)->count();
        $withParent = $categories->whereNotNull('parent_id')->count();

        $parentOptions = ProductCategory::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (ProductCategory $category) => [
                'value' => $category->id,
                'label' => $category->name,
            ])
            ->values()
            ->all();

        return Inertia::render('admin/catalogo/categorias/index', [
            'categories' => $categoriesPayload,
            'parentOptions' => $parentOptions,
            'stats' => [
                ['key' => 'total', 'label' => 'Total', 'value' => $categories->count(), 'tone' => 'violet'],
                ['key' => 'active', 'label' => 'Activas', 'value' => $activeCount, 'tone' => 'green'],
                ['key' => 'inactive', 'label' => 'Inactivas', 'value' => $categories->count() - $activeCount, 'tone' => 'amber'],
                ['key' => 'with_parent', 'label' => 'Subcategorías', 'value' => $withParent, 'tone' => 'cyan'],
            ],
            'categoryModal' => session()->pull('categoryModal'),
            'categoryModalCategoryId' => session()->pull('categoryModalCategoryId'),
            'oldForm' => $this->oldFormDefaults(),
        ]);
    }

    public function store(ProductCategoryRequest $request): RedirectResponse
    {
        ProductCategory::create($request->validated());

        Toast::success('Categoría creada correctamente.');

        return to_route('admin.catalogo.categorias.index');
    }

    public function update(ProductCategoryRequest $request, ProductCategory $categoria): RedirectResponse
    {
        $categoria->update($request->validated());

        Toast::success('Categoría actualizada.');

        return to_route('admin.catalogo.categorias.index');
    }

    public function destroy(Request $request, ProductCategory $categoria): RedirectResponse
    {
        abort_unless($request->user()?->can('categories.delete'), 403);

        if ($categoria->children()->exists()) {
            Toast::error('No puedes eliminar una categoría que tiene subcategorías.');

            return to_route('admin.catalogo.categorias.index');
        }

        $categoria->delete();

        Toast::success('Categoría eliminada.');

        return to_route('admin.catalogo.categorias.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function oldFormDefaults(): array
    {
        return [
            'parent_id' => old('parent_id', ''),
            'code' => old('code', ''),
            'name' => old('name', ''),
            'is_active' => filter_var(old('is_active', true), FILTER_VALIDATE_BOOLEAN),
        ];
    }
}
