<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_transfers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('from_warehouse_id')->constrained('warehouses')->restrictOnDelete();
            $table->foreignUuid('to_warehouse_id')->constrained('warehouses')->restrictOnDelete();
            $table->foreignUuid('product_variant_id')->constrained('product_variants')->restrictOnDelete();
            $table->decimal('quantity', 18, 4);
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_transfers');
    }
};
