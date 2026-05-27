<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('warehouses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 20);
            $table->string('name', 100);
            $table->boolean('is_default')->default(false);
            $table->boolean('is_saleable')->default(true);
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->unique('code');
            $table->index(['is_active', 'sort_order', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('warehouses');
    }
};
