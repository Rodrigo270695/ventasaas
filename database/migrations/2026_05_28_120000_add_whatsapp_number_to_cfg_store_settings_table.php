<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cfg_store_settings', function (Blueprint $table) {
            if (! Schema::hasColumn('cfg_store_settings', 'whatsapp_number')) {
                $table->string('whatsapp_number', 20)->nullable()->after('direccion');
            }
        });
    }

    public function down(): void
    {
        Schema::table('cfg_store_settings', function (Blueprint $table) {
            if (Schema::hasColumn('cfg_store_settings', 'whatsapp_number')) {
                $table->dropColumn('whatsapp_number');
            }
        });
    }
};
