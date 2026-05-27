<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('electronic_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('sales_document_id')
                ->unique()
                ->constrained('sales_documents')
                ->cascadeOnDelete();
            $table->string('gateway', 30);
            $table->string('ubl_version', 10)->default('2.1');
            $table->char('xml_hash', 64)->nullable();
            $table->text('xml_path')->nullable();
            $table->text('cdr_path')->nullable();
            $table->string('sunat_ticket', 50)->nullable();
            $table->string('sunat_response_code', 10)->nullable();
            $table->text('sunat_description')->nullable();
            $table->string('status', 30)->default('pending');
            $table->timestampTz('sent_at')->nullable();
            $table->timestampTz('accepted_at')->nullable();
            $table->unsignedSmallInteger('retry_count')->default(0);
            $table->timestamps();

            $table->index('status');
            $table->index('sent_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('electronic_documents');
    }
};
