<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE treasury_payment_allocations DROP CONSTRAINT IF EXISTS treasury_payment_allocations_treasury_payment_id_sales_document_id_unique');
        DB::statement('ALTER TABLE treasury_payment_allocations DROP CONSTRAINT IF EXISTS treasury_payment_allocations_sales_document_id_foreign');

        Schema::table('treasury_payment_allocations', function (Blueprint $table) {
            $table->uuid('sales_document_id')->nullable()->change();
            $table->foreignUuid('purchase_document_id')
                ->nullable()
                ->after('sales_document_id')
                ->constrained('purchase_documents')
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

        DB::statement('ALTER TABLE treasury_payment_allocations DROP CONSTRAINT IF EXISTS treasury_payment_allocations_sales_document_id_foreign');

        Schema::table('treasury_payment_allocations', function (Blueprint $table) {
            $table->uuid('sales_document_id')->nullable(false)->change();
        });

        if (Schema::hasTable('sales_documents')) {
            Schema::table('treasury_payment_allocations', function (Blueprint $table) {
                $table->foreign('sales_document_id')
                    ->references('id')
                    ->on('sales_documents')
                    ->restrictOnDelete();
            });
        }
    }
};
