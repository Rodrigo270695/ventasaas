<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('document_series', 'is_internal')) {
            Schema::table('document_series', function (Blueprint $table) {
                $table->boolean('is_internal')->default(false)->after('is_electronic');
            });
        }

        if (! Schema::hasColumn('sales_documents', 'is_internal')) {
            Schema::table('sales_documents', function (Blueprint $table) {
                $table->boolean('is_internal')->default(false)->after('source');
            });
        }

        if ($this->isColumnNullable('sales_documents', 'customer_party_id')) {
            return;
        }

        $this->dropCustomerForeignIfExists();

        Schema::table('sales_documents', function (Blueprint $table) {
            $table->uuid('customer_party_id')->nullable()->change();
        });

        Schema::table('sales_documents', function (Blueprint $table) {
            $table->foreign('customer_party_id')->references('id')->on('parties')->nullOnDelete();
        });
    }

    public function down(): void
    {
        if ($this->foreignKeyExists('sales_documents', 'sales_documents_customer_party_id_foreign')) {
            Schema::table('sales_documents', function (Blueprint $table) {
                $table->dropForeign(['customer_party_id']);
            });
        }

        if ($this->isColumnNullable('sales_documents', 'customer_party_id')) {
            Schema::table('sales_documents', function (Blueprint $table) {
                $table->uuid('customer_party_id')->nullable(false)->change();
                $table->foreign('customer_party_id')->references('id')->on('parties')->restrictOnDelete();
            });
        }

        if (Schema::hasColumn('sales_documents', 'is_internal')) {
            Schema::table('sales_documents', function (Blueprint $table) {
                $table->dropColumn('is_internal');
            });
        }

        if (Schema::hasColumn('document_series', 'is_internal')) {
            Schema::table('document_series', function (Blueprint $table) {
                $table->dropColumn('is_internal');
            });
        }
    }

    private function isColumnNullable(string $table, string $column): bool
    {
        if (! Schema::hasColumn($table, $column)) {
            return false;
        }

        foreach (Schema::getColumns($table) as $definition) {
            if (($definition['name'] ?? null) === $column) {
                return (bool) ($definition['nullable'] ?? false);
            }
        }

        return false;
    }

    private function dropCustomerForeignIfExists(): void
    {
        foreach ([
            'sales_documents_customer_party_id_foreign',
            'sales_documents_customer_party_id_fkey',
        ] as $constraint) {
            if ($this->foreignKeyExists('sales_documents', $constraint)) {
                Schema::table('sales_documents', function (Blueprint $table) {
                    $table->dropForeign(['customer_party_id']);
                });

                return;
            }
        }

        try {
            Schema::table('sales_documents', function (Blueprint $table) {
                $table->dropForeign(['customer_party_id']);
            });
        } catch (\Throwable) {
            //
        }
    }

    private function foreignKeyExists(string $table, string $constraint): bool
    {
        $connection = Schema::getConnection();
        $driver = $connection->getDriverName();

        if ($driver === 'pgsql') {
            $row = $connection->selectOne(
                'select 1 from information_schema.table_constraints where table_schema = current_schema() and table_name = ? and constraint_name = ? and constraint_type = ? limit 1',
                [$table, $constraint, 'FOREIGN KEY'],
            );

            return $row !== null;
        }

        if ($driver === 'sqlite') {
            $rows = $connection->select("pragma foreign_key_list({$table})");

            foreach ($rows as $row) {
                if (($row->from ?? null) === 'customer_party_id') {
                    return true;
                }
            }
        }

        return false;
    }
};
