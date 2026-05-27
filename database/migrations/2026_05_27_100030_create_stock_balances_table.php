<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_balances', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('warehouse_id')->constrained('warehouses')->restrictOnDelete();
            $table->foreignUuid('product_variant_id')->constrained('product_variants')->restrictOnDelete();
            $table->decimal('quantity_on_hand', 18, 4)->default(0);
            $table->decimal('quantity_reserved', 18, 4)->default(0);
            $table->decimal('avg_cost', 18, 6)->default(0);
            $table->timestamps();

            $table->unique(['warehouse_id', 'product_variant_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_balances');
    }
};
