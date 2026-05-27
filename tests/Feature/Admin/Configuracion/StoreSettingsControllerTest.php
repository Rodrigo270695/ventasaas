<?php

use App\Models\CfgStoreSetting;
use App\Models\User;
use App\Support\StoreCertificateStorage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
    Storage::fake(StoreCertificateStorage::DISK);
});

function adminUser(): User
{
    $user = User::factory()->create();
    $user->assignRole('admin');

    return $user;
}

test('guests cannot access store settings index', function () {
    $this->get(route('admin.configuracion.tienda.index'))
        ->assertRedirect(route('login'));
});

test('admin can view store settings index', function () {
    $this->actingAs(adminUser())
        ->get(route('admin.configuracion.tienda.index'))
        ->assertOk();
});

test('users without settings.view cannot access index', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('dashboard.view');

    $this->actingAs($user)
        ->get(route('admin.configuracion.tienda.index'))
        ->assertForbidden();
});

test('store settings can be created once', function () {
    $this->actingAs(adminUser())
        ->post(route('admin.configuracion.tienda.store'), [
            'ruc' => '20123456789',
            'razon_social' => 'Mi Tienda SAC',
            'ubigeo' => '150101',
            'direccion' => 'Av. Principal 123',
            'tax_regime' => 'general',
            'billing_channel' => 'direct_sunat',
            'sunat_environment' => 'beta',
            'default_igv_rate' => 18,
        ])
        ->assertRedirect(route('admin.configuracion.tienda.index'));

    expect(CfgStoreSetting::count())->toBe(1);
    expect(CfgStoreSetting::first()->ruc)->toBe('20123456789');
});

test('second store attempt is rejected', function () {
    CfgStoreSetting::factory()->create();

    $this->actingAs(adminUser())
        ->post(route('admin.configuracion.tienda.store'), [
            'ruc' => '20987654321',
            'razon_social' => 'Otra Tienda',
            'ubigeo' => '040101',
            'tax_regime' => 'general',
            'billing_channel' => 'direct_sunat',
            'sunat_environment' => 'beta',
            'default_igv_rate' => 18,
        ])
        ->assertRedirect(route('admin.configuracion.tienda.index'));

    expect(CfgStoreSetting::count())->toBe(1);
});

test('store settings can be updated', function () {
    $settings = CfgStoreSetting::factory()->create([
        'razon_social' => 'Antes SAC',
    ]);

    $this->actingAs(adminUser())
        ->put(route('admin.configuracion.tienda.update', $settings), [
            'ruc' => $settings->ruc,
            'razon_social' => 'Después SAC',
            'ubigeo' => $settings->ubigeo,
            'tax_regime' => 'general',
            'billing_channel' => 'direct_sunat',
            'sunat_environment' => 'production',
            'default_igv_rate' => 18,
        ])
        ->assertRedirect(route('admin.configuracion.tienda.index'));

    expect($settings->fresh()->razon_social)->toBe('Después SAC');
    expect($settings->fresh()->sunat_environment)->toBe('production');
});

test('certificate file can be uploaded on create', function () {
    $file = UploadedFile::fake()->create('mi-certificado.pem', 100);

    $response = $this->actingAs(adminUser())
        ->post(route('admin.configuracion.tienda.store'), [
            'ruc' => '20123456789',
            'razon_social' => 'Tienda Cert SAC',
            'ubigeo' => '150101',
            'tax_regime' => 'general',
            'billing_channel' => 'direct_sunat',
            'sunat_environment' => 'beta',
            'default_igv_rate' => 18,
            'certificate' => $file,
        ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect(route('admin.configuracion.tienda.index'));

    $settings = CfgStoreSetting::first();

    expect($settings)->not->toBeNull();

    expect($settings->cdt_path_enc)->not->toBeNull();
    Storage::disk(StoreCertificateStorage::DISK)->assertExists($settings->cdt_path_enc);
});

test('certificate file can be uploaded on update via post method spoofing', function () {
    $settings = CfgStoreSetting::factory()->create();
    $file = UploadedFile::fake()->create('certificado.p12', 100);

    $this->actingAs(adminUser())
        ->post(route('admin.configuracion.tienda.update', $settings), [
            '_method' => 'PUT',
            'ruc' => $settings->ruc,
            'razon_social' => $settings->razon_social,
            'ubigeo' => $settings->ubigeo,
            'tax_regime' => 'general',
            'billing_channel' => 'direct_sunat',
            'sunat_environment' => 'beta',
            'default_igv_rate' => 18,
            'certificate' => $file,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.configuracion.tienda.index'));

    $settings->refresh();

    expect($settings->cdt_path_enc)->not->toBeNull();
    Storage::disk(StoreCertificateStorage::DISK)->assertExists($settings->cdt_path_enc);
});

test('certificate can be removed on update', function () {
    Storage::disk(StoreCertificateStorage::DISK)->put('store/old.pem', 'cert-data');

    $settings = CfgStoreSetting::factory()->create([
        'cdt_path_enc' => 'store/old.pem',
    ]);

    $this->actingAs(adminUser())
        ->put(route('admin.configuracion.tienda.update', $settings), [
            'ruc' => $settings->ruc,
            'razon_social' => $settings->razon_social,
            'ubigeo' => $settings->ubigeo,
            'tax_regime' => 'general',
            'billing_channel' => 'direct_sunat',
            'sunat_environment' => 'beta',
            'default_igv_rate' => 18,
            'remove_certificate' => true,
        ])
        ->assertRedirect(route('admin.configuracion.tienda.index'));

    expect($settings->fresh()->cdt_path_enc)->toBeNull();
    Storage::disk(StoreCertificateStorage::DISK)->assertMissing('store/old.pem');
});
