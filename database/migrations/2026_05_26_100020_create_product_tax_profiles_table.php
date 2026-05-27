<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_tax_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('product_variant_id')->constrained('product_variants')->cascadeOnDelete();
            $table->foreignUuid('tax_profile_id')->nullable()->constrained('tax_profiles')->nullOnDelete();
            $table->string('sunat_affectation_code', 2);
            $table->decimal('igv_rate', 8, 4)->default(0);
            $table->decimal('isc_rate', 8, 4)->nullable();
            $table->timestamps();

            $table->unique('product_variant_id');
            $table->foreign('sunat_affectation_code')
                ->references('code')
                ->on('sunat_tax_affectations');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_tax_profiles');
    }
};
