<?php

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Product::query()
            ->whereNotNull('barcode')
            ->each(function (Product $product): void {
                $variant = ProductVariant::query()
                    ->where('product_id', $product->id)
                    ->where('is_default', true)
                    ->first()
                    ?? ProductVariant::query()
                        ->where('product_id', $product->id)
                        ->orderBy('created_at')
                        ->first();

                if ($variant && $variant->barcode === null) {
                    $variant->update(['barcode' => $product->barcode]);
                }
            });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('barcode');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('barcode', 50)->nullable()->after('description');
        });

        Product::query()->each(function (Product $product): void {
            $variant = ProductVariant::query()
                ->where('product_id', $product->id)
                ->where('is_default', true)
                ->first()
                ?? ProductVariant::query()
                    ->where('product_id', $product->id)
                    ->first();

            if ($variant?->barcode) {
                $product->update(['barcode' => $variant->barcode]);
            }
        });
    }
};
