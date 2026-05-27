<?php

namespace Database\Seeders;

use App\Models\DocumentSeries;
use Illuminate\Database\Seeder;

class DocumentSeriesSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            [
                'sunat_document_type_code' => DocumentSeries::DOC_INVOICE,
                'series' => 'F001',
                'name' => 'Factura electrónica principal',
                'is_electronic' => true,
            ],
            [
                'sunat_document_type_code' => DocumentSeries::DOC_TICKET,
                'series' => 'B001',
                'name' => 'Boleta electrónica principal',
                'is_electronic' => true,
            ],
            [
                'sunat_document_type_code' => DocumentSeries::DOC_INTERNAL,
                'series' => 'TI01',
                'name' => 'Ticket interno (venta rápida)',
                'is_electronic' => false,
                'is_internal' => true,
            ],
        ];

        foreach ($defaults as $row) {
            DocumentSeries::query()->firstOrCreate(
                [
                    'sunat_document_type_code' => $row['sunat_document_type_code'],
                    'series' => $row['series'],
                ],
                [
                    ...$row,
                    'next_number' => 1,
                    'is_active' => true,
                ],
            );
        }
    }
}
