<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('variant_packaging_conversions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignUuid('from_variant_id')->constrained('product_variants')->restrictOnDelete();
            $table->foreignUuid('to_variant_id')->constrained('product_variants')->restrictOnDelete();
            $table->decimal('factor', 18, 4);
            $table->string('label', 120)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['from_variant_id', 'to_variant_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('variant_packaging_conversions');
    }
};
