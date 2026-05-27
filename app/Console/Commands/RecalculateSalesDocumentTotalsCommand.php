<?php

namespace App\Console\Commands;

use App\Models\SalesDocument;
use App\Services\Sales\SalesDocumentService;
use Illuminate\Console\Command;
use InvalidArgumentException;

class RecalculateSalesDocumentTotalsCommand extends Command
{
    protected $signature = 'sales:recalculate-totals
                            {--id= : UUID de un comprobante específico}
                            {--status=* : Estados a incluir (draft, confirmed). Por defecto ambos}
                            {--only-affected : Solo comprobantes con igv_rate > 1 en alguna línea}
                            {--dry-run : Mostrar cambios sin guardar}';

    protected $description = 'Recalcula subtotal, IGV y total de comprobantes de venta según precios y tasas actuales';

    public function handle(SalesDocumentService $sales): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $onlyAffected = (bool) $this->option('only-affected');
        $documentId = $this->option('id');

        if ($documentId) {
            $document = SalesDocument::query()->find($documentId);

            if (! $document) {
                $this->error("No se encontró el comprobante {$documentId}.");

                return self::FAILURE;
            }

            return $this->processDocument($sales, $document, $dryRun)
                ? self::SUCCESS
                : self::SUCCESS;
        }

        $statuses = $this->option('status');

        if ($statuses === [] || $statuses === null) {
            $statuses = [
                SalesDocument::STATUS_DRAFT,
                SalesDocument::STATUS_CONFIRMED,
            ];
        }

        $query = SalesDocument::query()
            ->whereIn('status', $statuses)
            ->with(['lines.variant.product', 'lines.variant.taxProfile', 'electronicDocument'])
            ->orderBy('issue_date')
            ->orderBy('created_at');

        if ($onlyAffected) {
            $query->whereHas('lines', fn ($q) => $q->where('igv_rate', '>', 1));
        }

        $processed = 0;
        $updated = 0;
        $skipped = 0;
        $failed = 0;

        $query->chunkById(50, function ($documents) use ($sales, $dryRun, &$processed, &$updated, &$skipped, &$failed) {
            foreach ($documents as $document) {
                $processed++;

                try {
                    $result = $sales->recalculateTotals($document, persist: ! $dryRun);

                    if (! $result['changed']) {
                        $skipped++;

                        continue;
                    }

                    $updated++;
                    $label = $document->full_number ?: $document->id;
                    $suffix = $dryRun ? ' (simulación)' : '';
                    $this->line("✓ {$label}{$suffix}");

                    if ($document->electronicDocument && ! $dryRun) {
                        $this->warn(
                            "  → CPE {$document->electronicDocument->id}: revisa totales si ya fue emitido.",
                        );
                    }
                } catch (InvalidArgumentException $e) {
                    $failed++;
                    $label = $document->full_number ?: $document->id;
                    $this->error("✗ {$label}: {$e->getMessage()}");
                }
            }
        });

        $mode = $dryRun ? 'Simulación' : 'Ejecutado';
        $this->newLine();
        $this->info("{$mode}: {$processed} comprobante(s), {$updated} con cambios, {$skipped} sin cambios, {$failed} error(es).");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }

    private function processDocument(
        SalesDocumentService $sales,
        SalesDocument $document,
        bool $dryRun,
    ): int {
        $document->load(['lines.variant.product', 'lines.variant.taxProfile', 'electronicDocument']);

        if ($document->status === SalesDocument::STATUS_VOIDED) {
            $this->error('No se pueden recalcular comprobantes anulados.');

            return self::FAILURE;
        }

        $before = [
            'subtotal' => (string) $document->subtotal,
            'tax_amount' => (string) $document->tax_amount,
            'total' => (string) $document->total,
        ];

        try {
            $result = $sales->recalculateTotals($document, persist: ! $dryRun);
        } catch (InvalidArgumentException $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        if (! $result['changed']) {
            $this->info('Sin cambios: los totales ya son correctos.');

            return self::SUCCESS;
        }

        if (! $dryRun) {
            $document->refresh();
        }

        $after = $dryRun
            ? $result
            : [
                'subtotal' => (string) $document->subtotal,
                'tax_amount' => (string) $document->tax_amount,
                'total' => (string) $document->total,
            ];

        $label = $document->full_number ?: $document->id;
        $prefix = $dryRun ? '[simulación] ' : '';

        $this->info("{$prefix}{$label}");
        $this->table(
            ['', 'Antes', 'Después'],
            [
                ['Subtotal', $before['subtotal'], $after['subtotal']],
                ['IGV', $before['tax_amount'], $after['tax_amount']],
                ['Total', $before['total'], $after['total']],
            ],
        );

        if ($document->electronicDocument && ! $dryRun) {
            $this->warn('Este comprobante tiene CPE asociado; verifica el XML/PDF si ya fue enviado a SUNAT.');
        }

        return self::SUCCESS;
    }
}
