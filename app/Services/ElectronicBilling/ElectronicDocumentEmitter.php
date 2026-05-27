<?php

namespace App\Services\ElectronicBilling;

use App\Models\ElectronicDocument;
use App\Models\ElectronicDocumentEvent;
use Illuminate\Support\Facades\DB;

class ElectronicDocumentEmitter
{
    public function __construct(
        private readonly ElectronicBillingGatewayResolver $gatewayResolver,
    ) {}

    public function emit(ElectronicDocument $electronic): ElectronicDocument
    {
        return DB::transaction(function () use ($electronic) {
            $electronic->update([
                'status' => ElectronicDocument::STATUS_BUILDING,
                'retry_count' => $electronic->retry_count + 1,
            ]);

            $this->recordEvent($electronic, ElectronicDocumentEvent::EVENT_BUILDING);

            $gateway = $this->gatewayResolver->resolveByKey($electronic->gateway);

            try {
                $result = $gateway->emit($electronic->fresh(['salesDocument']));
            } catch (\Throwable $exception) {
                $result = new ElectronicBillingResult(
                    status: ElectronicDocument::STATUS_REJECTED,
                    sunatResponseCode: 'EXC',
                    sunatDescription: $exception->getMessage(),
                );
            }

            $attributes = [
                'status' => $result->status,
                'sunat_response_code' => $result->sunatResponseCode,
                'sunat_description' => $result->sunatDescription,
                'xml_hash' => $result->xmlHash,
                'xml_path' => $result->xmlPath,
                'cdr_path' => $result->cdrPath,
                'sunat_ticket' => $result->sunatTicket,
            ];

            if ($result->status === ElectronicDocument::STATUS_SENT) {
                $attributes['sent_at'] = now();
            }

            if (in_array($result->status, [
                ElectronicDocument::STATUS_ACCEPTED,
                ElectronicDocument::STATUS_OBSERVED,
            ], true)) {
                $attributes['sent_at'] = $electronic->sent_at ?? now();
                $attributes['accepted_at'] = now();
            }

            $electronic->update($attributes);

            $eventName = match ($result->status) {
                ElectronicDocument::STATUS_ACCEPTED => ElectronicDocumentEvent::EVENT_ACCEPTED,
                ElectronicDocument::STATUS_OBSERVED => ElectronicDocumentEvent::EVENT_ACCEPTED,
                ElectronicDocument::STATUS_REJECTED => ElectronicDocumentEvent::EVENT_REJECTED,
                ElectronicDocument::STATUS_SENT => ElectronicDocumentEvent::EVENT_SENT,
                default => ElectronicDocumentEvent::EVENT_QUEUED,
            };

            $this->recordEvent($electronic, $eventName, [
                'sunat_response_code' => $result->sunatResponseCode,
                'sunat_description' => $result->sunatDescription,
            ]);

            return $electronic->fresh();
        });
    }

    /**
     * @param  array<string, mixed>|null  $payload
     */
    private function recordEvent(
        ElectronicDocument $electronic,
        string $event,
        ?array $payload = null,
    ): void {
        ElectronicDocumentEvent::query()->create([
            'electronic_document_id' => $electronic->id,
            'event' => $event,
            'payload' => $payload,
        ]);
    }
}
