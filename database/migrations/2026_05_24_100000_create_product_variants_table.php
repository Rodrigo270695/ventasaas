<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_variants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('product_id')
                ->constrained('products')
                ->cascadeOnDelete();
            $table->string('sku', 50);
            $table->string('label', 120)->nullable();
            $table->string('barcode', 50)->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->json('attributes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique('sku');
            $table->index(['product_id', 'is_active']);
            $table->index(['product_id', 'is_default']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_variants');
    }
};
