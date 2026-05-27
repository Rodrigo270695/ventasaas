<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tax_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 20);
            $table->string('name', 100);
            $table->string('sunat_affectation_code', 2);
            $table->decimal('igv_rate', 8, 4)->default(0);
            $table->decimal('isc_rate', 8, 4)->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->unique('code');
            $table->foreign('sunat_affectation_code')
                ->references('code')
                ->on('sunat_tax_affectations');
            $table->index(['is_active', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tax_profiles');
    }
};
