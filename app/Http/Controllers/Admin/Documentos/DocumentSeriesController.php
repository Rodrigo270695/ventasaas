<?php

namespace App\Http\Controllers\Admin\Documentos;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Documentos\DocumentSeriesRequest;
use App\Models\DocumentSeries;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DocumentSeriesController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('document_series.view'), 403);

        if ($request->boolean('_reset')) {
            $request->session()->forget(['documentSeriesModal', 'documentSeriesModalId', 'errors']);
        }

        $series = DocumentSeries::query()
            ->orderBy('sunat_document_type_code')
            ->orderBy('series')
            ->get([
                'id',
                'sunat_document_type_code',
                'series',
                'name',
                'is_electronic',
                'next_number',
                'is_active',
            ]);

        $payload = $series->map(fn (DocumentSeries $row) => $this->mapRow($row));

        $activeCount = $series->where('is_active', true)->count();
        $electronicCount = $series->where('is_electronic', true)->count();

        return Inertia::render('admin/documentos/series/index', [
            'documentSeries' => $payload,
            'stats' => [
                ['key' => 'total', 'label' => 'Total', 'value' => $series->count(), 'tone' => 'violet'],
                ['key' => 'active', 'label' => 'Activas', 'value' => $activeCount, 'tone' => 'green'],
                ['key' => 'inactive', 'label' => 'Inactivas', 'value' => $series->count() - $activeCount, 'tone' => 'amber'],
                ['key' => 'electronic', 'label' => 'Electrónicas', 'value' => $electronicCount, 'tone' => 'cyan'],
            ],
            'documentSeriesModal' => session()->pull('documentSeriesModal'),
            'documentSeriesModalId' => session()->pull('documentSeriesModalId'),
            'oldForm' => $this->oldFormDefaults(),
        ]);
    }

    public function store(DocumentSeriesRequest $request): RedirectResponse
    {
        DocumentSeries::create($request->validated());

        Toast::success('Serie registrada correctamente.');

        return to_route('admin.documentos.series.index');
    }

    public function update(DocumentSeriesRequest $request, DocumentSeries $serie): RedirectResponse
    {
        $serie->update($request->validated());

        Toast::success('Serie actualizada.');

        return to_route('admin.documentos.series.index');
    }

    public function destroy(Request $request, DocumentSeries $serie): RedirectResponse
    {
        abort_unless($request->user()?->can('document_series.delete'), 403);

        $serie->delete();

        Toast::success('Serie eliminada.');

        return to_route('admin.documentos.series.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function mapRow(DocumentSeries $row): array
    {
        return [
            'id' => $row->id,
            'sunat_document_type_code' => $row->sunat_document_type_code,
            'document_type_label' => $row->documentTypeLabel(),
            'series' => $row->series,
            'name' => $row->name,
            'is_electronic' => $row->is_electronic,
            'next_number' => $row->next_number,
            'next_number_preview' => $row->previewNumber(),
            'is_active' => $row->is_active,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function oldFormDefaults(): array
    {
        return [
            'sunat_document_type_code' => old('sunat_document_type_code', DocumentSeries::DOC_INVOICE),
            'series' => old('series', ''),
            'name' => old('name', ''),
            'is_electronic' => filter_var(old('is_electronic', true), FILTER_VALIDATE_BOOLEAN),
            'next_number' => (int) old('next_number', 1),
            'is_active' => filter_var(old('is_active', true), FILTER_VALIDATE_BOOLEAN),
        ];
    }
}
