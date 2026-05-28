<?php

use App\Models\StoreCoverSlide;
use App\Models\User;
use App\Support\StoreCoverStorage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
    Storage::fake(StoreCoverStorage::DISK);
});

function coversAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole('admin');

    return $user;
}

test('guests cannot access store covers index', function () {
    $this->get(route('admin.configuracion.portada.index'))
        ->assertRedirect(route('login'));
});

test('admin can view store covers index', function () {
    $this->actingAs(coversAdmin())
        ->get(route('admin.configuracion.portada.index'))
        ->assertOk();
});

test('store cover slide can be created with image', function () {
    $file = UploadedFile::fake()->image('portada.jpg', 1920, 900);

    $this->actingAs(coversAdmin())
        ->post(route('admin.configuracion.portada.store'), [
            'title' => 'Promo verano',
            'subtitle' => 'Nuevos snacks',
            'is_active' => true,
            'image' => $file,
        ])
        ->assertRedirect(route('admin.configuracion.portada.index'));

    $slide = StoreCoverSlide::query()->first();

    expect($slide)->not->toBeNull();
    expect($slide->title)->toBe('Promo verano');
    expect($slide->sort_order)->toBe(0);
    Storage::disk(StoreCoverStorage::DISK)->assertExists($slide->image_path);
});

test('store cover slide can be deleted', function () {
    Storage::disk(StoreCoverStorage::DISK)->put('covers/test.jpg', 'image-data');

    $slide = StoreCoverSlide::factory()->create([
        'image_path' => 'covers/test.jpg',
    ]);

    $this->actingAs(coversAdmin())
        ->delete(route('admin.configuracion.portada.destroy', $slide))
        ->assertRedirect(route('admin.configuracion.portada.index'));

    expect(StoreCoverSlide::query()->find($slide->id))->toBeNull();
    Storage::disk(StoreCoverStorage::DISK)->assertMissing('covers/test.jpg');
});
