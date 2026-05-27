<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parties', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type', 20);
            $table->string('document_type', 2);
            $table->string('document_number', 15);
            $table->string('legal_name', 255);
            $table->string('trade_name', 255)->nullable();
            $table->string('email', 255)->nullable();
            $table->string('phone', 30)->nullable();
            $table->decimal('credit_limit', 18, 4)->default(0);
            $table->unsignedSmallInteger('payment_term_days')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['document_type', 'document_number']);
            $table->index(['type', 'is_active']);
            $table->index('legal_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parties');
    }
};
