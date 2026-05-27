<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('parent_id')->nullable();
            $table->string('code', 20);
            $table->string('name', 100);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->unique('code');
            $table->index(['parent_id', 'is_active']);
        });

        Schema::table('product_categories', function (Blueprint $table) {
            $table->foreign('parent_id')
                ->references('id')
                ->on('product_categories')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_categories');
    }
};
