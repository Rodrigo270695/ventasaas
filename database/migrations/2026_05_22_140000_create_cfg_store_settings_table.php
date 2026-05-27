<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cfg_store_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('branch_id')->nullable();
            $table->string('ruc', 11);
            $table->string('razon_social');
            $table->char('ubigeo', 6);
            $table->text('direccion')->nullable();
            $table->string('tax_regime', 50)->default('general');
            $table->string('billing_channel', 30)->default('direct_sunat');
            $table->string('sunat_environment', 20)->default('beta');
            $table->text('cdt_path_enc')->nullable();
            $table->text('cdt_password_enc')->nullable();
            $table->text('apisunat_token_enc')->nullable();
            $table->decimal('default_igv_rate', 8, 4)->default(18);
            $table->json('settings')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cfg_store_settings');
    }
};
