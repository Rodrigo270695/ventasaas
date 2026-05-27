<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('treasury_payment_methods', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 30)->unique();
            $table->string('name', 80);
            $table->string('type', 30)->default('cash');
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('treasury_payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('direction', 20)->default('collection');
            $table->uuid('party_id')->nullable();
            $table->foreignUuid('payment_method_id')->constrained('treasury_payment_methods')->restrictOnDelete();
            $table->date('payment_date');
            $table->char('currency_code', 3)->default('PEN');
            $table->decimal('exchange_rate', 18, 6)->default(1);
            $table->decimal('amount', 18, 4);
            $table->string('reference', 80)->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['payment_date']);
            $table->index(['party_id', 'payment_date']);
            $table->index(['direction']);
        });

        Schema::create('treasury_payment_allocations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('treasury_payment_id')->constrained('treasury_payments')->cascadeOnDelete();
            $table->uuid('sales_document_id');
            $table->decimal('amount', 18, 4);
            $table->timestamps();

            $table->unique(['treasury_payment_id', 'sales_document_id']);
            $table->index(['sales_document_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('treasury_payment_allocations');
        Schema::dropIfExists('treasury_payments');
        Schema::dropIfExists('treasury_payment_methods');
    }
};
