<?php

use App\Models\User;
use Illuminate\Support\Facades\Http;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
});

function documentLookupAdmin(): User
{
    $user = User::factory()->create();
    $user->assignRole('admin');

    return $user;
}

test('guests cannot lookup party document', function () {
    $this->getJson(route('admin.socios.consulta-documento', [
        'document_type' => '6',
        'document_number' => '20100070970',
    ]))->assertUnauthorized();
});

test('ruc lookup returns legal name from apiperu', function () {
    config([
        'services.apiperu.base_url' => 'https://apiperu.dev/api',
        'services.apiperu.token' => 'test-token',
    ]);

    Http::fake([
        'https://apiperu.dev/api/ruc' => Http::response([
            'success' => true,
            'data' => [
                'nombre_o_razon_social' => 'EMPRESA DEMO SAC',
                'nombre_comercial' => 'DEMO',
                'direccion_completa' => 'AV. DEMO 123, LIMA',
                'estado' => 'ACTIVO',
                'condicion' => 'HABIDO',
            ],
        ]),
    ]);

    $this->actingAs(documentLookupAdmin())
        ->getJson(route('admin.socios.consulta-documento', [
            'document_type' => '6',
            'document_number' => '20100070970',
        ]))
        ->assertOk()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.document_number', '20100070970')
        ->assertJsonPath('data.legal_name', 'EMPRESA DEMO SAC')
        ->assertJsonPath('data.trade_name', 'DEMO')
        ->assertJsonPath('data.address', 'AV. DEMO 123, LIMA')
        ->assertJsonPath('data.sunat_estado', 'ACTIVO')
        ->assertJsonPath('data.sunat_condicion', 'HABIDO');
});

test('dni lookup returns legal name from apiperu', function () {
    config([
        'services.apiperu.base_url' => 'https://apiperu.dev/api',
        'services.apiperu.token' => 'test-token',
    ]);

    Http::fake([
        'https://apiperu.dev/api/dni' => Http::response([
            'success' => true,
            'data' => [
                'nombre_completo' => 'PEREZ GARCIA, JUAN',
            ],
        ]),
    ]);

    $this->actingAs(documentLookupAdmin())
        ->getJson(route('admin.socios.consulta-documento', [
            'document_type' => '1',
            'document_number' => '12345678',
        ]))
        ->assertOk()
        ->assertJsonPath('data.legal_name', 'PEREZ GARCIA, JUAN');
});

test('unsupported document type is rejected', function () {
    $this->actingAs(documentLookupAdmin())
        ->getJson(route('admin.socios.consulta-documento', [
            'document_type' => '4',
            'document_number' => 'ABC123',
        ]))
        ->assertStatus(422)
        ->assertJsonPath('success', false);
});
