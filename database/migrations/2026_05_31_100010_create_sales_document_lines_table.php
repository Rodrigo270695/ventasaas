<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_document_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('sales_document_id')->constrained('sales_documents')->cascadeOnDelete();
            $table->foreignUuid('product_variant_id')->constrained('product_variants')->restrictOnDelete();
            $table->string('description', 500)->nullable();
            $table->decimal('quantity', 18, 6);
            $table->decimal('unit_price', 18, 4);
            $table->decimal('discount', 18, 4)->default(0);
            $table->string('tax_affectation_code', 2)->default('10');
            $table->decimal('igv_rate', 18, 4)->default(0);
            $table->decimal('line_subtotal', 18, 4)->default(0);
            $table->decimal('igv_amount', 18, 4)->default(0);
            $table->decimal('line_total', 18, 4)->default(0);
            $table->unsignedSmallInteger('line_order')->default(0);
            $table->timestamps();

            $table->index('sales_document_id');
            $table->index('product_variant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_document_lines');
    }
};
