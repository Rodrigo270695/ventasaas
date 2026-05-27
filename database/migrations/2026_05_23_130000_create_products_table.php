<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('sku', 50);
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->string('type', 20)->default('good');
            $table->foreignUuid('category_id')
                ->nullable()
                ->constrained('product_categories')
                ->nullOnDelete();
            $table->foreignUuid('brand_id')
                ->nullable()
                ->constrained('brands')
                ->nullOnDelete();
            $table->foreignUuid('base_unit_id')
                ->constrained('units')
                ->restrictOnDelete();
            $table->boolean('track_stock')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->unique('sku');
            $table->index(['is_active', 'name']);
            $table->index('type');
            $table->index('category_id');
            $table->index('brand_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
