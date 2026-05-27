<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('branch_id')->nullable();
            $table->foreignUuid('document_series_id')->constrained('document_series')->restrictOnDelete();
            $table->char('sunat_document_type_code', 2);
            $table->string('series', 4);
            $table->unsignedBigInteger('number')->nullable();
            $table->string('full_number', 20)->nullable();
            $table->foreignUuid('customer_party_id')->constrained('parties')->restrictOnDelete();
            $table->foreignUuid('warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->date('issue_date');
            $table->date('due_date')->nullable();
            $table->char('currency_code', 3)->default('PEN');
            $table->decimal('exchange_rate', 18, 6)->default(1);
            $table->decimal('subtotal', 18, 4)->default(0);
            $table->decimal('tax_amount', 18, 4)->default(0);
            $table->decimal('total', 18, 4)->default(0);
            $table->decimal('global_discount', 18, 4)->default(0);
            $table->string('status', 30)->default('draft');
            $table->string('payment_status', 20)->default('unpaid');
            $table->string('source', 20)->default('erp');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['sunat_document_type_code', 'series', 'number']);
            $table->index(['issue_date']);
            $table->index(['customer_party_id', 'issue_date']);
            $table->index(['status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_documents');
    }
};
