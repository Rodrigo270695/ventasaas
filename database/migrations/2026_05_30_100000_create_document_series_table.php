<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_series', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('branch_id')->nullable();
            $table->char('sunat_document_type_code', 2);
            $table->string('series', 4);
            $table->string('name', 120)->nullable();
            $table->boolean('is_electronic')->default(true);
            $table->unsignedBigInteger('next_number')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['sunat_document_type_code', 'series']);
            $table->index(['sunat_document_type_code', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_series');
    }
};
