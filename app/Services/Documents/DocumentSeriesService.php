<?php

namespace App\Services\Documents;

use App\Models\DocumentSeries;
use Illuminate\Support\Facades\DB;

class DocumentSeriesService
{
    /**
     * Reserva el siguiente correlativo (transacción con bloqueo de fila).
     */
    public function reserveNext(DocumentSeries $series): int
    {
        return DB::transaction(function () use ($series): int {
            /** @var DocumentSeries $locked */
            $locked = DocumentSeries::query()
                ->whereKey($series->id)
                ->lockForUpdate()
                ->firstOrFail();

            $number = (int) $locked->next_number;
            $locked->next_number = $number + 1;
            $locked->save();

            return $number;
        });
    }
}
