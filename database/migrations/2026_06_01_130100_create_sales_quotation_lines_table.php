<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_quotation_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('sales_quotation_id')->constrained('sales_quotations')->cascadeOnDelete();
            $table->foreignUuid('product_variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            $table->string('manual_sku', 120)->nullable();
            $table->text('description');
            $table->decimal('quantity', 14, 6);
            $table->decimal('unit_price', 14, 4);
            $table->decimal('discount', 14, 4)->default(0);
            $table->string('tax_affectation_code', 4)->default('10');
            $table->decimal('igv_rate', 8, 4)->default(0.1800);
            $table->decimal('line_subtotal', 14, 4);
            $table->decimal('igv_amount', 14, 4)->default(0);
            $table->decimal('line_total', 14, 4);
            $table->unsignedInteger('line_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_quotation_lines');
    }
};

