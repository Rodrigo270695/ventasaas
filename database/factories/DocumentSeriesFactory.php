<?php

namespace Database\Factories;

use App\Models\DocumentSeries;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DocumentSeries>
 */
class DocumentSeriesFactory extends Factory
{
    protected $model = DocumentSeries::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'sunat_document_type_code' => DocumentSeries::DOC_INVOICE,
            'series' => strtoupper(fake()->unique()->bothify('?###')),
            'name' => fake()->optional()->words(2, true),
            'is_electronic' => true,
            'next_number' => 1,
            'is_active' => true,
        ];
    }

    public function invoice(): static
    {
        return $this->state(fn () => [
            'sunat_document_type_code' => DocumentSeries::DOC_INVOICE,
            'series' => 'F001',
        ]);
    }

    public function ticket(): static
    {
        return $this->state(fn () => [
            'sunat_document_type_code' => DocumentSeries::DOC_TICKET,
            'series' => 'B001',
        ]);
    }
}
