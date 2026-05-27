<?php

use App\Support\Datetime\PeruDateTime;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * @var list<array{0: string, 1: string}>
     */
    private array $columns = [
        ['purchase_orders', 'order_date'],
        ['goods_receipts', 'received_date'],
        ['purchase_documents', 'issue_date'],
    ];

    public function up(): void
    {
        foreach ($this->columns as [$table, $column]) {
            $this->backfillDateTimeFromCreatedAt($table, $column);
        }

        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }

        foreach ($this->columns as [$table, $column]) {
            Schema::table($table, function (Blueprint $blueprint) use ($column) {
                $blueprint->dateTime($column)->change();
            });
        }
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }

        foreach ($this->columns as [$table, $column]) {
            Schema::table($table, function (Blueprint $blueprint) use ($column) {
                $blueprint->date($column)->change();
            });
        }
    }

    private function backfillDateTimeFromCreatedAt(string $table, string $column): void
    {
        if (! Schema::hasTable($table)) {
            return;
        }

        DB::table($table)->orderBy('id')->each(function (object $row) use ($table, $column) {
            $dateValue = $row->{$column} ?? null;

            if ($dateValue === null) {
                return;
            }

            $dateOnly = PeruDateTime::parse($dateValue)->startOfDay();
            $created = PeruDateTime::parse($row->created_at ?? now());
            $combined = $dateOnly->setTime(
                $created->hour,
                $created->minute,
                $created->second,
            );

            DB::table($table)->where('id', $row->id)->update([
                $column => $combined->format('Y-m-d H:i:s'),
            ]);
        });
    }
};
