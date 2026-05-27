<?php

namespace App\Services\ElectronicBilling;

use App\Models\DocumentSeries;
use App\Models\ElectronicDocument;
use App\Models\ElectronicDocumentEvent;
use App\Models\SalesDocument;
use App\Jobs\EmitElectronicDocumentJob;
use Illuminate\Support\Facades\DB;

class ElectronicDocumentService
{
    public function __construct(
        private readonly ElectronicBillingGatewayResolver $gatewayResolver,
    ) {}

    public function queueForSalesDocument(SalesDocument $document): ?ElectronicDocument
    {
        $document->loadMissing(['documentSeries', 'electronicDocument']);

        $series = $document->documentSeries;

        if ($document->isInternal() || ! $series?->is_electronic) {
            return null;
        }

        if ($document->electronicDocument) {
            return $document->electronicDocument;
        }

        $gateway = $this->gatewayResolver->resolveForStore();

        return DB::transaction(function () use ($document, $gateway) {
            $electronic = ElectronicDocument::query()->create([
                'sales_document_id' => $document->id,
                'gateway' => $gateway->gatewayKey(),
                'ubl_version' => (string) config('electronic_billing.ubl_version', '2.1'),
                'status' => ElectronicDocument::STATUS_PENDING,
            ]);

            $this->recordEvent($electronic, ElectronicDocumentEvent::EVENT_QUEUED, [
                'sales_document_id' => $document->id,
                'full_number' => $document->full_number,
            ]);

            EmitElectronicDocumentJob::dispatch($electronic->id);

            return $electronic;
        });
    }

    /**
     * @param  array<string, mixed>|null  $payload
     */
    public function recordEvent(
        ElectronicDocument $electronic,
        string $event,
        ?array $payload = null,
    ): ElectronicDocumentEvent {
        return ElectronicDocumentEvent::query()->create([
            'electronic_document_id' => $electronic->id,
            'event' => $event,
            'payload' => $payload,
        ]);
    }

    public function requiresElectronicEmission(DocumentSeries $series): bool
    {
        return $series->is_electronic;
    }

    public function retryEmission(ElectronicDocument $electronic): ElectronicDocument
    {
        if ($electronic->status === ElectronicDocument::STATUS_BUILDING) {
            throw new \InvalidArgumentException('El comprobante se está procesando. Espera unos segundos.');
        }

        if ($electronic->status === ElectronicDocument::STATUS_ACCEPTED) {
            throw new \InvalidArgumentException('Este comprobante ya fue aceptado por SUNAT.');
        }

        $electronic->update([
            'status' => ElectronicDocument::STATUS_PENDING,
            'sunat_response_code' => null,
            'sunat_description' => null,
        ]);

        $this->recordEvent($electronic, ElectronicDocumentEvent::EVENT_QUEUED, [
            'retry' => true,
            'retry_count' => $electronic->retry_count,
        ]);

        EmitElectronicDocumentJob::dispatch($electronic->id);

        return $electronic->fresh();
    }
}
