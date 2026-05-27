<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('goods_receipts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('purchase_order_id')->constrained('purchase_orders')->restrictOnDelete();
            $table->foreignUuid('warehouse_id')->constrained('warehouses')->restrictOnDelete();
            $table->string('internal_number', 24)->unique();
            $table->date('received_date');
            $table->string('status', 30)->default('confirmed');
            $table->text('notes')->nullable();
            $table->foreignUuid('stock_movement_id')->nullable()->constrained('stock_movements')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['purchase_order_id', 'received_date']);
        });

        Schema::create('goods_receipt_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('goods_receipt_id')->constrained('goods_receipts')->cascadeOnDelete();
            $table->foreignUuid('purchase_order_line_id')->constrained('purchase_order_lines')->restrictOnDelete();
            $table->foreignUuid('product_variant_id')->constrained('product_variants')->restrictOnDelete();
            $table->decimal('quantity', 18, 4);
            $table->decimal('unit_cost', 18, 6);
            $table->decimal('line_total', 18, 4)->default(0);
            $table->unsignedSmallInteger('line_order')->default(0);
            $table->timestamps();

            $table->index('goods_receipt_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('goods_receipt_lines');
        Schema::dropIfExists('goods_receipts');
    }
};
