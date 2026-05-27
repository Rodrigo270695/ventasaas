<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('treasury_cash_registers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 20)->unique();
            $table->string('name', 100);
            $table->foreignUuid('warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('treasury_cash_register_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('cash_register_id')->constrained('treasury_cash_registers')->restrictOnDelete();
            $table->string('status', 20)->default('open');
            $table->timestamp('opened_at');
            $table->timestamp('closed_at')->nullable();
            $table->foreignId('opened_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('closed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('opening_float', 18, 4)->default(0);
            $table->decimal('expected_cash', 18, 4)->nullable();
            $table->decimal('closing_cash_counted', 18, 4)->nullable();
            $table->decimal('cash_difference', 18, 4)->nullable();
            $table->text('opening_notes')->nullable();
            $table->text('closing_notes')->nullable();
            $table->timestamps();

            $table->index(['cash_register_id', 'status']);
            $table->index(['opened_at']);
        });

        Schema::table('treasury_payments', function (Blueprint $table) {
            $table->foreignUuid('cash_register_session_id')
                ->nullable()
                ->after('payment_method_id')
                ->constrained('treasury_cash_register_sessions')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('treasury_payments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('cash_register_session_id');
        });

        Schema::dropIfExists('treasury_cash_register_sessions');
        Schema::dropIfExists('treasury_cash_registers');
    }
};
