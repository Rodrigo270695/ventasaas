<?php

namespace Database\Factories;

use App\Models\ProductVariant;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderLine;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PurchaseOrderLine>
 */
class PurchaseOrderLineFactory extends Factory
{
    protected $model = PurchaseOrderLine::class;

    public function definition(): array
    {
        return [
            'purchase_order_id' => PurchaseOrder::factory(),
            'product_variant_id' => ProductVariant::factory(),
            'description' => 'Línea de prueba',
            'quantity_ordered' => 10,
            'quantity_received' => 0,
            'unit_cost' => 10,
            'line_subtotal' => 100,
            'igv_amount' => 18,
            'line_total' => 118,
            'line_order' => 0,
        ];
    }
}
