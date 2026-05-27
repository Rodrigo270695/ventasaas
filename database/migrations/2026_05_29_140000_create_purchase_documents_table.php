<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('supplier_party_id')->constrained('parties')->restrictOnDelete();
            $table->string('internal_number', 24)->unique();
            $table->string('supplier_document_number', 40)->nullable();
            $table->date('issue_date');
            $table->date('due_date')->nullable();
            $table->char('currency_code', 3)->default('PEN');
            $table->decimal('exchange_rate', 18, 6)->default(1);
            $table->decimal('subtotal', 18, 4)->default(0);
            $table->decimal('tax_amount', 18, 4)->default(0);
            $table->decimal('total', 18, 4);
            $table->string('status', 30)->default('confirmed');
            $table->string('payment_status', 20)->default('unpaid');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['supplier_party_id', 'issue_date']);
            $table->index(['status', 'payment_status']);
            $table->index(['due_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_documents');
    }
};
