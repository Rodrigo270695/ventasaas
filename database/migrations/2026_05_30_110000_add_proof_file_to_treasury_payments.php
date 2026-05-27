<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('treasury_payments', function (Blueprint $table) {
            $table->string('proof_file_path', 500)->nullable()->after('notes');
            $table->string('proof_file_name', 255)->nullable()->after('proof_file_path');
        });
    }

    public function down(): void
    {
        Schema::table('treasury_payments', function (Blueprint $table) {
            $table->dropColumn(['proof_file_path', 'proof_file_name']);
        });
    }
};
