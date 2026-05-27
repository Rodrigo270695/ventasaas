<?php

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Product::query()
            ->select(['id', 'sku', 'name'])
            ->orderBy('id')
            ->each(function (Product $product): void {
                ProductVariant::query()->create([
                    'product_id' => $product->id,
                    'sku' => $product->sku,
                    'label' => 'Estándar',
                    'is_default' => true,
                    'is_active' => true,
                ]);
            });

        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique(['sku']);
            $table->dropColumn('sku');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('sku', 50)->nullable()->after('id');
        });

        Product::query()->each(function (Product $product): void {
            $variant = ProductVariant::query()
                ->where('product_id', $product->id)
                ->where('is_default', true)
                ->first()
                ?? ProductVariant::query()
                    ->where('product_id', $product->id)
                    ->first();

            if ($variant) {
                DB::table('products')
                    ->where('id', $product->id)
                    ->update(['sku' => $variant->sku]);
            }
        });

        Schema::table('products', function (Blueprint $table) {
            $table->string('sku', 50)->nullable(false)->change();
            $table->unique('sku');
        });
    }
};
