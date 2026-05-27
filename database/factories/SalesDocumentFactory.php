<?php

namespace Database\Factories;

use App\Models\DocumentSeries;
use App\Models\Party;
use App\Models\SalesDocument;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SalesDocument>
 */
class SalesDocumentFactory extends Factory
{
    protected $model = SalesDocument::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'document_series_id' => DocumentSeries::factory(),
            'sunat_document_type_code' => DocumentSeries::DOC_INVOICE,
            'series' => fn (array $attributes) => DocumentSeries::query()
                ->find($attributes['document_series_id'])?->series ?? 'F001',
            'customer_party_id' => Party::factory()->customer(),
            'issue_date' => now()->toDateString(),
            'currency_code' => 'PEN',
            'exchange_rate' => 1,
            'subtotal' => 0,
            'tax_amount' => 0,
            'total' => 0,
            'global_discount' => 0,
            'status' => SalesDocument::STATUS_DRAFT,
            'payment_status' => SalesDocument::PAYMENT_UNPAID,
            'source' => SalesDocument::SOURCE_ERP,
        ];
    }

    public function configure(): static
    {
        return $this->afterMaking(function (SalesDocument $document) {
            if (! $document->sunat_document_type_code || $document->sunat_document_type_code === DocumentSeries::DOC_INVOICE) {
                $series = DocumentSeries::query()->find($document->document_series_id);

                if ($series) {
                    $document->sunat_document_type_code = $series->sunat_document_type_code;
                    $document->series = $series->series;
                }
            }
        });
    }

    public function confirmed(): static
    {
        return $this->state(fn () => [
            'status' => SalesDocument::STATUS_CONFIRMED,
            'number' => fake()->numberBetween(1, 9999),
            'full_number' => 'F001-'.str_pad((string) fake()->numberBetween(1, 9999), 8, '0', STR_PAD_LEFT),
        ]);
    }

    public function internal(): static
    {
        return $this->state(fn () => [
            'is_internal' => true,
            'customer_party_id' => null,
            'sunat_document_type_code' => DocumentSeries::DOC_INTERNAL,
            'series' => 'TI01',
        ]);
    }
}
