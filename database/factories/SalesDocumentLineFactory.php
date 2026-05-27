<?php

namespace Database\Factories;

use App\Models\ProductVariant;
use App\Models\SalesDocument;
use App\Models\SalesDocumentLine;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SalesDocumentLine>
 */
class SalesDocumentLineFactory extends Factory
{
    protected $model = SalesDocumentLine::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $qty = '1.000000';
        $price = '10.0000';
        $subtotal = '10.0000';
        $igv = '1.8000';
        $total = '11.8000';

        return [
            'sales_document_id' => SalesDocument::factory(),
            'product_variant_id' => ProductVariant::factory(),
            'quantity' => $qty,
            'unit_price' => $price,
            'discount' => 0,
            'tax_affectation_code' => '10',
            'igv_rate' => '0.1800',
            'line_subtotal' => $subtotal,
            'igv_amount' => $igv,
            'line_total' => $total,
            'line_order' => 0,
        ];
    }
}
