<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('cfg_store_settings')) {
            return;
        }

        Schema::table('cfg_store_settings', function (Blueprint $table) {
            if (! Schema::hasColumn('cfg_store_settings', 'sol_user')) {
                $table->string('sol_user', 20)->nullable()->after('cdt_password_enc');
            }

            if (! Schema::hasColumn('cfg_store_settings', 'sol_password_enc')) {
                $table->text('sol_password_enc')->nullable()->after('sol_user');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('cfg_store_settings')) {
            return;
        }

        Schema::table('cfg_store_settings', function (Blueprint $table) {
            $columns = [];

            if (Schema::hasColumn('cfg_store_settings', 'sol_user')) {
                $columns[] = 'sol_user';
            }

            if (Schema::hasColumn('cfg_store_settings', 'sol_password_enc')) {
                $columns[] = 'sol_password_enc';
            }

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
