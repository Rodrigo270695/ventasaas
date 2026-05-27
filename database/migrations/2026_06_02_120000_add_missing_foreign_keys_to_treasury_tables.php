<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (
            Schema::hasTable('treasury_payments')
            && Schema::hasTable('parties')
            && ! $this->constraintExists('treasury_payments_party_id_foreign')
        ) {
            Schema::table('treasury_payments', function (Blueprint $table) {
                $table
                    ->foreign('party_id')
                    ->references('id')
                    ->on('parties')
                    ->nullOnDelete();
            });
        }

        if (
            Schema::hasTable('treasury_payment_allocations')
            && Schema::hasTable('sales_documents')
            && ! $this->constraintExists('treasury_payment_allocations_sales_document_id_foreign')
        ) {
            Schema::table('treasury_payment_allocations', function (Blueprint $table) {
                $table
                    ->foreign('sales_document_id')
                    ->references('id')
                    ->on('sales_documents')
                    ->restrictOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (
            Schema::hasTable('treasury_payment_allocations')
            && $this->constraintExists('treasury_payment_allocations_sales_document_id_foreign')
        ) {
            Schema::table('treasury_payment_allocations', function (Blueprint $table) {
                $table->dropForeign('treasury_payment_allocations_sales_document_id_foreign');
            });
        }

        if (
            Schema::hasTable('treasury_payments')
            && $this->constraintExists('treasury_payments_party_id_foreign')
        ) {
            Schema::table('treasury_payments', function (Blueprint $table) {
                $table->dropForeign('treasury_payments_party_id_foreign');
            });
        }
    }

    private function constraintExists(string $constraintName): bool
    {
        $result = DB::selectOne(
            'SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = ? LIMIT 1',
            [$constraintName],
        );

        return $result !== null;
    }
};

