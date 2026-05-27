<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_quotations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('internal_number', 40)->unique();
            $table->foreignUuid('customer_party_id')->constrained('parties');
            $table->dateTime('issue_date');
            $table->date('valid_until')->nullable();
            $table->string('currency_code', 3)->default('PEN');
            $table->decimal('exchange_rate', 12, 6)->default(1);
            $table->decimal('subtotal', 14, 4)->default(0);
            $table->decimal('tax_amount', 14, 4)->default(0);
            $table->decimal('total', 14, 4)->default(0);
            $table->decimal('global_discount', 14, 4)->default(0);
            $table->string('status', 20)->default('draft');
            $table->text('notes')->nullable();
            $table->string('customer_email_to')->nullable();
            $table->json('customer_email_cc')->nullable();
            $table->dateTime('customer_email_sent_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['customer_party_id', 'status']);
            $table->index('issue_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_quotations');
    }
};

