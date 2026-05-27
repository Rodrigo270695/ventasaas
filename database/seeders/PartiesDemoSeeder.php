<?php

namespace Database\Seeders;

use App\Models\Party;
use Illuminate\Database\Seeder;

class PartiesDemoSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->customers() as $row) {
            $this->upsertParty($row);
        }

        foreach ($this->suppliers() as $row) {
            $this->upsertParty($row);
        }
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function upsertParty(array $row): void
    {
        Party::query()->updateOrCreate(
            [
                'document_type' => $row['document_type'],
                'document_number' => $row['document_number'],
            ],
            [
                'type' => $row['type'],
                'legal_name' => $row['legal_name'],
                'trade_name' => $row['trade_name'] ?? null,
                'address' => $row['address'] ?? null,
                'sunat_estado' => $row['sunat_estado'] ?? null,
                'sunat_condicion' => $row['sunat_condicion'] ?? null,
                'email' => $row['email'] ?? null,
                'phone' => $row['phone'] ?? null,
                'credit_limit' => $row['credit_limit'] ?? 0,
                'payment_term_days' => $row['payment_term_days'] ?? 0,
                'is_active' => true,
            ],
        );
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function customers(): array
    {
        return [
            [
                'type' => Party::TYPE_CUSTOMER,
                'document_type' => Party::DOC_DNI,
                'document_number' => '45678912',
                'legal_name' => 'Pérez García, Juan Carlos',
                'email' => 'juan.perez@ejemplo.com',
                'phone' => '987654321',
                'credit_limit' => 500,
                'payment_term_days' => 0,
            ],
            [
                'type' => Party::TYPE_CUSTOMER,
                'document_type' => Party::DOC_DNI,
                'document_number' => '72345678',
                'legal_name' => 'López Torres, María Elena',
                'email' => 'maria.lopez@ejemplo.com',
                'phone' => '912345678',
                'credit_limit' => 0,
                'payment_term_days' => 0,
            ],
            [
                'type' => Party::TYPE_CUSTOMER,
                'document_type' => Party::DOC_RUC,
                'document_number' => '20123456789',
                'legal_name' => 'Comercial Los Andes S.A.C.',
                'trade_name' => 'Los Andes Market',
                'address' => 'Av. Primavera 1234, Santiago de Surco, Lima',
                'sunat_estado' => 'ACTIVO',
                'sunat_condicion' => 'HABIDO',
                'email' => 'compras@losandesmarket.pe',
                'phone' => '014567890',
                'credit_limit' => 15000,
                'payment_term_days' => 30,
            ],
            [
                'type' => Party::TYPE_CUSTOMER,
                'document_type' => Party::DOC_RUC,
                'document_number' => '10456789012',
                'legal_name' => 'Tienda Don Pedro E.I.R.L.',
                'trade_name' => 'Don Pedro',
                'address' => 'Jr. Cusco 456, Cercado, Arequipa',
                'sunat_estado' => 'ACTIVO',
                'sunat_condicion' => 'HABIDO',
                'email' => 'pedro@donpedrotienda.pe',
                'phone' => '954321098',
                'credit_limit' => 3000,
                'payment_term_days' => 15,
            ],
            [
                'type' => Party::TYPE_CUSTOMER,
                'document_type' => Party::DOC_CE,
                'document_number' => '001234567',
                'legal_name' => 'Smith Johnson, Robert',
                'email' => 'r.smith@ejemplo.com',
                'phone' => '998877665',
                'credit_limit' => 0,
                'payment_term_days' => 0,
            ],
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function suppliers(): array
    {
        return [
            [
                'type' => Party::TYPE_SUPPLIER,
                'document_type' => Party::DOC_RUC,
                'document_number' => '20512345678',
                'legal_name' => 'Distribuidora Lima Norte S.A.C.',
                'trade_name' => 'Lima Norte Distribuciones',
                'address' => 'Av. Industrial 890, Los Olivos, Lima',
                'sunat_estado' => 'ACTIVO',
                'sunat_condicion' => 'HABIDO',
                'email' => 'ventas@limanorte.pe',
                'phone' => '017890123',
                'credit_limit' => 0,
                'payment_term_days' => 30,
            ],
            [
                'type' => Party::TYPE_SUPPLIER,
                'document_type' => Party::DOC_RUC,
                'document_number' => '20698765432',
                'legal_name' => 'Alimentos del Sur S.A.',
                'trade_name' => 'Alisur',
                'address' => 'Panamericana Sur Km 12, Villa El Salvador, Lima',
                'sunat_estado' => 'ACTIVO',
                'sunat_condicion' => 'HABIDO',
                'email' => 'logistica@alisur.pe',
                'phone' => '016543210',
                'credit_limit' => 0,
                'payment_term_days' => 45,
            ],
            [
                'type' => Party::TYPE_SUPPLIER,
                'document_type' => Party::DOC_RUC,
                'document_number' => '20100070970',
                'legal_name' => 'Gloria S.A.',
                'trade_name' => 'Gloria',
                'address' => 'Av. Paseo de la República 3693, San Isidro, Lima',
                'sunat_estado' => 'ACTIVO',
                'sunat_condicion' => 'HABIDO',
                'email' => 'proveedores@gloria.com.pe',
                'phone' => '012110200',
                'credit_limit' => 0,
                'payment_term_days' => 30,
            ],
            [
                'type' => Party::TYPE_SUPPLIER,
                'document_type' => Party::DOC_RUC,
                'document_number' => '20547896321',
                'legal_name' => 'Embotelladora Andina del Perú S.A.',
                'trade_name' => 'Coca-Cola Andina',
                'address' => 'Carretera Central Km 9.5, Ate, Lima',
                'sunat_estado' => 'ACTIVO',
                'sunat_condicion' => 'HABIDO',
                'email' => 'clientes@koandina.com',
                'phone' => '013789456',
                'credit_limit' => 0,
                'payment_term_days' => 15,
            ],
            [
                'type' => Party::TYPE_BOTH,
                'document_type' => Party::DOC_RUC,
                'document_number' => '20432109876',
                'legal_name' => 'Multiservicios Pacífico S.A.C.',
                'trade_name' => 'Pacífico MS',
                'address' => 'Calle Las Begonias 475, San Isidro, Lima',
                'sunat_estado' => 'ACTIVO',
                'sunat_condicion' => 'HABIDO',
                'email' => 'contacto@pacificoms.pe',
                'phone' => '012345987',
                'credit_limit' => 5000,
                'payment_term_days' => 30,
            ],
        ];
    }
}
