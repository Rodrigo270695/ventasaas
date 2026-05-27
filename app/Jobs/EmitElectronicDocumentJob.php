<?php

namespace App\Jobs;

use App\Services\ElectronicBilling\ElectronicDocumentEmitter;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class EmitElectronicDocumentJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    /**
     * @var list<int>
     */
    public array $backoff = [30, 120, 300];

    public function __construct(
        public readonly string $electronicDocumentId,
    ) {}

    public function handle(ElectronicDocumentEmitter $emitter): void
    {
        $emitter->emit(
            \App\Models\ElectronicDocument::query()->findOrFail($this->electronicDocumentId),
        );
    }

    public function failed(?Throwable $exception): void
    {
        Log::error('EmitElectronicDocumentJob failed', [
            'electronic_document_id' => $this->electronicDocumentId,
            'message' => $exception?->getMessage(),
        ]);
    }
}
