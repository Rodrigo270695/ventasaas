<?php

namespace Database\Factories;

use App\Models\ElectronicDocument;
use App\Models\SalesDocument;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ElectronicDocument>
 */
class ElectronicDocumentFactory extends Factory
{
    protected $model = ElectronicDocument::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'sales_document_id' => SalesDocument::factory(),
            'gateway' => ElectronicDocument::GATEWAY_SUNAT_SOAP,
            'ubl_version' => '2.1',
            'status' => ElectronicDocument::STATUS_PENDING,
            'retry_count' => 0,
        ];
    }

    public function accepted(): static
    {
        return $this->state(fn () => [
            'status' => ElectronicDocument::STATUS_ACCEPTED,
            'sunat_response_code' => '0',
            'sunat_description' => 'Aceptado',
            'sent_at' => now(),
            'accepted_at' => now(),
        ]);
    }
}
