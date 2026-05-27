<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('parties', function (Blueprint $table) {
            $table->text('address')->nullable()->after('trade_name');
            $table->string('sunat_estado', 32)->nullable()->after('address');
            $table->string('sunat_condicion', 32)->nullable()->after('sunat_estado');
        });
    }

    public function down(): void
    {
        Schema::table('parties', function (Blueprint $table) {
            $table->dropColumn(['address', 'sunat_estado', 'sunat_condicion']);
        });
    }
};
