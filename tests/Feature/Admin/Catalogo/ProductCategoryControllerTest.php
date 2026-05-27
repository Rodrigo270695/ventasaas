<?php

use App\Models\ProductCategory;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
});

function categoriesAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole('admin');

    return $user;
}

test('admin can view categories index', function () {
    $this->actingAs(categoriesAdmin())
        ->get(route('admin.catalogo.categorias.index'))
        ->assertOk();
});

test('category can be created with parent', function () {
    $parent = ProductCategory::factory()->create();

    $this->actingAs(categoriesAdmin())
        ->post(route('admin.catalogo.categorias.store'), [
            'parent_id' => $parent->id,
            'code' => 'CEL',
            'name' => 'Celulares',
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.catalogo.categorias.index'));

    $child = ProductCategory::query()->where('code', 'CEL')->first();

    expect($child)->not->toBeNull();
    expect($child->parent_id)->toBe($parent->id);
});

test('category with children cannot be deleted', function () {
    $parent = ProductCategory::factory()->create();
    ProductCategory::factory()->create(['parent_id' => $parent->id]);

    $this->actingAs(categoriesAdmin())
        ->delete(route('admin.catalogo.categorias.destroy', $parent))
        ->assertRedirect(route('admin.catalogo.categorias.index'));

    expect(ProductCategory::query()->find($parent->id))->not->toBeNull();
});

test('category without children can be deleted', function () {
    $category = ProductCategory::factory()->create();

    $this->actingAs(categoriesAdmin())
        ->delete(route('admin.catalogo.categorias.destroy', $category))
        ->assertRedirect(route('admin.catalogo.categorias.index'));

    expect(ProductCategory::query()->find($category->id))->toBeNull();
});
