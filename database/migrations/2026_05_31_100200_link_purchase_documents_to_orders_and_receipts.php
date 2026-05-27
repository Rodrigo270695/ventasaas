<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_documents', function (Blueprint $table) {
            $table->foreignUuid('purchase_order_id')
                ->nullable()
                ->after('supplier_party_id')
                ->constrained('purchase_orders')
                ->nullOnDelete();
            $table->foreignUuid('goods_receipt_id')
                ->nullable()
                ->after('purchase_order_id')
                ->constrained('goods_receipts')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('purchase_documents', function (Blueprint $table) {
            $table->dropConstrainedForeignId('goods_receipt_id');
            $table->dropConstrainedForeignId('purchase_order_id');
        });
    }
};
