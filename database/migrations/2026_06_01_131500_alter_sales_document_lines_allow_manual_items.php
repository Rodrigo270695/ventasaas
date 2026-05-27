<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_document_lines', function (Blueprint $table) {
            $table->foreignUuid('product_variant_id')->nullable()->change();
            $table->string('manual_sku', 120)->nullable()->after('product_variant_id');
        });
    }

    public function down(): void
    {
        Schema::table('sales_document_lines', function (Blueprint $table) {
            $table->dropColumn('manual_sku');
            $table->foreignUuid('product_variant_id')->nullable(false)->change();
        });
    }
};

