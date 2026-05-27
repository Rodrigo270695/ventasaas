<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('supplier_party_id')->constrained('parties')->restrictOnDelete();
            $table->string('internal_number', 24)->unique();
            $table->date('order_date');
            $table->date('expected_date')->nullable();
            $table->char('currency_code', 3)->default('PEN');
            $table->decimal('exchange_rate', 18, 6)->default(1);
            $table->decimal('subtotal', 18, 4)->default(0);
            $table->decimal('tax_amount', 18, 4)->default(0);
            $table->decimal('total', 18, 4)->default(0);
            $table->string('status', 30)->default('draft');
            $table->text('notes')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['supplier_party_id', 'order_date']);
            $table->index('status');
        });

        Schema::create('purchase_order_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('purchase_order_id')->constrained('purchase_orders')->cascadeOnDelete();
            $table->foreignUuid('product_variant_id')->constrained('product_variants')->restrictOnDelete();
            $table->string('description')->nullable();
            $table->decimal('quantity_ordered', 18, 4);
            $table->decimal('quantity_received', 18, 4)->default(0);
            $table->decimal('unit_cost', 18, 6);
            $table->string('tax_affectation_code', 4)->nullable();
            $table->decimal('igv_rate', 8, 4)->default(0);
            $table->decimal('line_subtotal', 18, 4)->default(0);
            $table->decimal('igv_amount', 18, 4)->default(0);
            $table->decimal('line_total', 18, 4)->default(0);
            $table->unsignedSmallInteger('line_order')->default(0);
            $table->timestamps();

            $table->index('purchase_order_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_order_lines');
        Schema::dropIfExists('purchase_orders');
    }
};
