<?php

namespace App\Services\Catalog;

use App\Models\PriceList;
use App\Models\ProductPrice;
use App\Models\ProductVariant;
use Illuminate\Support\Collection;
use InvalidArgumentException;

class ProductPriceFromCostService
{
    public const MARKUP_PERCENT = 'percent';

    public const MARKUP_FIXED = 'fixed';

    /**
     * @param  list<string>  $priceListIds
     * @return list<string> Códigos de listas actualizadas
     */
    public function syncFromCost(
        ProductVariant $variant,
        string $unitCost,
        array $priceListIds,
        string $markupType,
        string $markupValue,
    ): array {
        $cost = $this->normalizeDecimal($unitCost);

        if (bccomp($cost, '0', 6) !== 1) {
            throw new InvalidArgumentException('El costo unitario debe ser mayor a cero.');
        }

        if (! in_array($markupType, [self::MARKUP_PERCENT, self::MARKUP_FIXED], true)) {
            throw new InvalidArgumentException('Tipo de margen no válido.');
        }

        $markup = $this->normalizeDecimal($markupValue);

        $lists = PriceList::query()
            ->whereIn('id', $priceListIds)
            ->where('is_active', true)
            ->get(['id', 'code']);

        if ($lists->isEmpty()) {
            throw new InvalidArgumentException('Selecciona al menos una lista de precios activa.');
        }

        $amount = $this->calculateSellingPrice($cost, $markupType, $markup);

        $updatedCodes = [];

        foreach ($lists as $list) {
            ProductPrice::query()->updateOrCreate(
                [
                    'product_variant_id' => $variant->id,
                    'price_list_id' => $list->id,
                ],
                [
                    'amount' => $amount,
                    'source' => ProductPrice::SOURCE_MANUAL,
                ],
            );

            $updatedCodes[] = $list->code;
        }

        return $updatedCodes;
    }

    public function calculateSellingPrice(
        string $unitCost,
        string $markupType,
        string $markupValue,
    ): string {
        $cost = $this->normalizeDecimal($unitCost);
        $markup = $this->normalizeDecimal($markupValue);

        $raw = match ($markupType) {
            self::MARKUP_PERCENT => bcmul(
                $cost,
                bcadd('1', bcdiv($markup, '100', 6), 6),
                6,
            ),
            self::MARKUP_FIXED => bcadd($cost, $markup, 6),
            default => throw new InvalidArgumentException('Tipo de margen no válido.'),
        };

        return number_format((float) $raw, 2, '.', '');
    }

    /**
     * @param  Collection<int, PriceList>  $lists
     * @return list<array{value: string, label: string, code: string, currency_code: string, is_default: bool}>
     */
    public function priceListOptions(Collection $lists): array
    {
        return $lists->map(fn (PriceList $list) => [
            'value' => $list->id,
            'label' => trim($list->name.' ('.$list->code.')'),
            'code' => $list->code,
            'currency_code' => $list->currency_code,
            'is_default' => $list->is_default,
        ])->values()->all();
    }

    private function normalizeDecimal(string $value): string
    {
        $normalized = str_replace(',', '.', trim($value));

        if ($normalized === '' || ! is_numeric($normalized)) {
            return '0';
        }

        return $normalized;
    }
}
