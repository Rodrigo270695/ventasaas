<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            $table->date('expires_at')->nullable()->after('minimum_stock');
            $table->unsignedSmallInteger('expiry_alert_days')->nullable()->after('expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropColumn(['expires_at', 'expiry_alert_days']);
        });
    }
};
