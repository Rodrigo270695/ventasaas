<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('treasury_payment_allocations', function (Blueprint $table) {
            $table->dropUnique(['treasury_payment_id', 'sales_document_id']);
            $table->dropForeign(['sales_document_id']);
        });

        Schema::table('treasury_payment_allocations', function (Blueprint $table) {
            $table->uuid('sales_document_id')->nullable()->change();
            $table->foreignUuid('purchase_document_id')
                ->nullable()
                ->after('sales_document_id')
                ->constrained('purchase_documents')
                ->restrictOnDelete();

            $table->foreign('sales_document_id')
                ->references('id')
                ->on('sales_documents')
                ->restrictOnDelete();

            $table->index(['purchase_document_id']);
        });
    }

    public function down(): void
    {
        Schema::table('treasury_payment_allocations', function (Blueprint $table) {
            $table->dropForeign(['purchase_document_id']);
            $table->dropIndex(['purchase_document_id']);
            $table->dropColumn('purchase_document_id');
        });

        Schema::table('treasury_payment_allocations', function (Blueprint $table) {
            $table->dropForeign(['sales_document_id']);
        });

        Schema::table('treasury_payment_allocations', function (Blueprint $table) {
            $table->uuid('sales_document_id')->nullable(false)->change();
            $table->foreign('sales_document_id')
                ->references('id')
                ->on('sales_documents')
                ->restrictOnDelete();
        });
    }
};
