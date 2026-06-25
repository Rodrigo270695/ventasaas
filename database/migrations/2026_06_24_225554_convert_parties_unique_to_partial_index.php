<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Convierte el unique constraint de parties en un índice único parcial
 * que excluye registros con soft-delete (deleted_at IS NOT NULL).
 *
 * De esta forma, un socio eliminado no bloquea la creación/restauración
 * de otro con el mismo tipo y número de documento.
 *
 * Soportado en PostgreSQL (producción). SQLite (tests) mantiene el
 * constraint original para compatibilidad.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement(
            'ALTER TABLE parties DROP CONSTRAINT IF EXISTS parties_document_type_document_number_unique',
        );

        DB::statement(
            'CREATE UNIQUE INDEX IF NOT EXISTS parties_document_active_unique
             ON parties (document_type, document_number)
             WHERE deleted_at IS NULL',
        );
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement(
            'DROP INDEX IF EXISTS parties_document_active_unique',
        );

        DB::statement(
            'ALTER TABLE parties
             ADD CONSTRAINT parties_document_type_document_number_unique
             UNIQUE (document_type, document_number)',
        );
    }
};
