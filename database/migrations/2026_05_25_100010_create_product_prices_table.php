<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_prices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('product_variant_id')->constrained('product_variants')->cascadeOnDelete();
            $table->foreignUuid('price_list_id')->constrained('price_lists')->cascadeOnDelete();
            $table->decimal('amount', 18, 4);
            $table->date('valid_from')->nullable();
            $table->date('valid_to')->nullable();
            $table->string('source', 20)->default('manual');
            $table->timestamps();

            $table->unique(['product_variant_id', 'price_list_id']);
            $table->index('price_list_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_prices');
    }
};
