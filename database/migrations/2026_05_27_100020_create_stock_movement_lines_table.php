<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_movement_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('stock_movement_id')->constrained('stock_movements')->cascadeOnDelete();
            $table->foreignUuid('product_variant_id')->constrained('product_variants')->restrictOnDelete();
            $table->decimal('quantity', 18, 4);
            $table->decimal('unit_cost', 18, 6)->default(0);
            $table->decimal('total_cost', 18, 6)->default(0);
            $table->timestamps();

            $table->index('product_variant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movement_lines');
    }
};
