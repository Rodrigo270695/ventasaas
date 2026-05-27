<?php

use App\Models\TaxProfile;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
    $this->seed(\Database\Seeders\SunatTaxAffectationSeeder::class);
    $this->seed(\Database\Seeders\TaxProfileSeeder::class);
});

function taxProfilesAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole('admin');

    return $user;
}

test('guests cannot access tax profiles index', function () {
    $this->get(route('admin.catalogo.perfiles-tributarios.index'))
        ->assertRedirect(route('login'));
});

test('admin can view tax profiles index', function () {
    $this->actingAs(taxProfilesAdmin())
        ->get(route('admin.catalogo.perfiles-tributarios.index'))
        ->assertOk();
});

test('tax profile can be created', function () {
    $this->actingAs(taxProfilesAdmin())
        ->post(route('admin.catalogo.perfiles-tributarios.store'), [
            'code' => 'GRATUITO',
            'name' => 'Transferencia gratuita',
            'sunat_affectation_code' => '30',
            'igv_rate' => 0,
            'isc_rate' => null,
            'is_default' => false,
            'is_active' => true,
            'sort_order' => 50,
        ])
        ->assertRedirect(route('admin.catalogo.perfiles-tributarios.index'));

    expect(TaxProfile::query()->where('code', 'GRATUITO')->exists())->toBeTrue();
});

test('tax profile can be updated without code unique conflict', function () {
    $profile = TaxProfile::query()->where('code', 'WEB')->first()
        ?? TaxProfile::query()->where('code', 'GRAVADO-18')->first();

    $this->actingAs(taxProfilesAdmin())
        ->put(route('admin.catalogo.perfiles-tributarios.update', $profile), [
            'code' => $profile->code,
            'name' => $profile->name,
            'sunat_affectation_code' => $profile->sunat_affectation_code,
            'igv_rate' => $profile->igv_rate,
            'isc_rate' => $profile->isc_rate,
            'is_default' => $profile->is_default,
            'is_active' => true,
            'sort_order' => $profile->sort_order,
        ])
        ->assertRedirect(route('admin.catalogo.perfiles-tributarios.index'))
        ->assertSessionHasNoErrors();
});

test('default tax profile cannot be deleted', function () {
    $profile = TaxProfile::query()->where('is_default', true)->first();

    $this->actingAs(taxProfilesAdmin())
        ->delete(route('admin.catalogo.perfiles-tributarios.destroy', $profile))
        ->assertRedirect(route('admin.catalogo.perfiles-tributarios.index'));

    expect($profile?->fresh())->not->toBeNull();
});
