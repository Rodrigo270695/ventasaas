<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_documents', function (Blueprint $table) {
            $table->foreignUuid('warehouse_id')
                ->nullable()
                ->after('supplier_party_id')
                ->constrained('warehouses')
                ->nullOnDelete();
            $table->string('invoice_file_path', 500)->nullable()->after('notes');
            $table->string('invoice_file_name', 255)->nullable()->after('invoice_file_path');
            $table->foreignUuid('stock_movement_id')
                ->nullable()
                ->after('invoice_file_name')
                ->constrained('stock_movements')
                ->nullOnDelete();
        });

        Schema::create('purchase_document_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('purchase_document_id')
                ->constrained('purchase_documents')
                ->cascadeOnDelete();
            $table->foreignUuid('product_variant_id')
                ->constrained('product_variants')
                ->restrictOnDelete();
            $table->string('description', 500)->nullable();
            $table->decimal('quantity', 18, 6);
            $table->decimal('unit_cost', 18, 4);
            $table->string('tax_affectation_code', 2)->default('10');
            $table->decimal('igv_rate', 18, 4)->default(0);
            $table->decimal('line_subtotal', 18, 4)->default(0);
            $table->decimal('igv_amount', 18, 4)->default(0);
            $table->decimal('line_total', 18, 4)->default(0);
            $table->unsignedSmallInteger('line_order')->default(0);
            $table->timestamps();

            $table->index('purchase_document_id');
            $table->index('product_variant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_document_lines');

        Schema::table('purchase_documents', function (Blueprint $table) {
            $table->dropForeign(['warehouse_id']);
            $table->dropForeign(['stock_movement_id']);
            $table->dropColumn([
                'warehouse_id',
                'invoice_file_path',
                'invoice_file_name',
                'stock_movement_id',
            ]);
        });
    }
};
