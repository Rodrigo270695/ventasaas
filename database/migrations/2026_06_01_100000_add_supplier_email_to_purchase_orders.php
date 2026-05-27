<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->timestamp('supplier_email_sent_at')->nullable()->after('approved_at');
            $table->string('supplier_email_to', 255)->nullable()->after('supplier_email_sent_at');
            $table->json('supplier_email_cc')->nullable()->after('supplier_email_to');
            $table->string('supplier_confirmation_token', 64)->nullable()->unique()->after('supplier_email_cc');
            $table->timestamp('supplier_confirmation_expires_at')->nullable()->after('supplier_confirmation_token');
            $table->timestamp('supplier_confirmed_at')->nullable()->after('supplier_confirmation_expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropColumn([
                'supplier_email_sent_at',
                'supplier_email_to',
                'supplier_email_cc',
                'supplier_confirmation_token',
                'supplier_confirmation_expires_at',
                'supplier_confirmed_at',
            ]);
        });
    }
};
