<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('electronic_document_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('electronic_document_id')
                ->constrained('electronic_documents')
                ->cascadeOnDelete();
            $table->string('event', 50);
            $table->json('payload')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->index(['electronic_document_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('electronic_document_events');
    }
};
