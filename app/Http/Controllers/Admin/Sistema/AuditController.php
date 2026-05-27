<?php

namespace App\Http\Controllers\Admin\Sistema;

use Carbon\CarbonInterface;
use App\Http\Controllers\Controller;
use App\Models\Party;
use App\Models\Product;
use App\Models\SalesDocument;
use App\Models\SalesQuotation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class AuditController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('audit.view'), 403);

        $events = collect()
            ->concat($this->collectUserEvents())
            ->concat($this->collectProductEvents())
            ->concat($this->collectPartyEvents())
            ->concat($this->collectSalesDocumentEvents())
            ->concat($this->collectSalesQuotationEvents())
            ->sortByDesc('at')
            ->values()
            ->take(300)
            ->map(fn (array $event) => [
                ...$event,
                'at' => Carbon::parse($event['at'])->toDateTimeString(),
            ])
            ->values();

        return Inertia::render('admin/sistema/auditoria/index', [
            'events' => $events,
            'stats' => [
                ['key' => 'total', 'label' => 'Eventos', 'value' => $events->count(), 'tone' => 'violet'],
                ['key' => 'created', 'label' => 'Creaciones', 'value' => $events->where('action', 'created')->count(), 'tone' => 'green'],
                ['key' => 'updated', 'label' => 'Actualizaciones', 'value' => $events->where('action', 'updated')->count(), 'tone' => 'cyan'],
                ['key' => 'deleted', 'label' => 'Eliminaciones', 'value' => $events->where('action', 'deleted')->count(), 'tone' => 'amber'],
            ],
        ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function collectUserEvents(): Collection
    {
        return User::query()
            ->latest('updated_at')
            ->limit(20)
            ->get(['id', 'name', 'email', 'created_at', 'updated_at'])
            ->map(fn (User $user) => [
                'module' => 'Sistema',
                'entity' => 'Usuario',
                'reference' => $user->name.' ('.$user->email.')',
                'action' => $this->resolveAction($user->created_at, $user->updated_at, null),
                'at' => ($user->updated_at ?? $user->created_at)?->toDateTimeString(),
            ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function collectProductEvents(): Collection
    {
        return Product::query()
            ->withTrashed()
            ->latest('updated_at')
            ->limit(20)
            ->get(['id', 'name', 'created_at', 'updated_at', 'deleted_at'])
            ->map(fn (Product $product) => [
                'module' => 'Catálogo',
                'entity' => 'Producto',
                'reference' => $product->name,
                'action' => $this->resolveAction($product->created_at, $product->updated_at, $product->deleted_at),
                'at' => ($product->deleted_at ?? $product->updated_at ?? $product->created_at)?->toDateTimeString(),
            ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function collectPartyEvents(): Collection
    {
        return Party::query()
            ->withTrashed()
            ->latest('updated_at')
            ->limit(20)
            ->get(['id', 'legal_name', 'document_number', 'created_at', 'updated_at', 'deleted_at'])
            ->map(fn (Party $party) => [
                'module' => 'Socios',
                'entity' => 'Cliente/Proveedor',
                'reference' => trim(($party->legal_name ?? 'Sin nombre').' · '.$party->document_number),
                'action' => $this->resolveAction($party->created_at, $party->updated_at, $party->deleted_at),
                'at' => ($party->deleted_at ?? $party->updated_at ?? $party->created_at)?->toDateTimeString(),
            ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function collectSalesDocumentEvents(): Collection
    {
        return SalesDocument::query()
            ->withTrashed()
            ->latest('updated_at')
            ->limit(20)
            ->get(['id', 'full_number', 'created_at', 'updated_at', 'deleted_at'])
            ->map(fn (SalesDocument $document) => [
                'module' => 'Ventas',
                'entity' => 'Comprobante',
                'reference' => $document->full_number ?: 'Sin numeración',
                'action' => $this->resolveAction($document->created_at, $document->updated_at, $document->deleted_at),
                'at' => ($document->deleted_at ?? $document->updated_at ?? $document->created_at)?->toDateTimeString(),
            ]);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function collectSalesQuotationEvents(): Collection
    {
        return SalesQuotation::query()
            ->withTrashed()
            ->latest('updated_at')
            ->limit(20)
            ->get(['id', 'internal_number', 'created_at', 'updated_at', 'deleted_at'])
            ->map(fn (SalesQuotation $quotation) => [
                'module' => 'Ventas',
                'entity' => 'Cotización',
                'reference' => $quotation->internal_number ?: 'Sin número',
                'action' => $this->resolveAction($quotation->created_at, $quotation->updated_at, $quotation->deleted_at),
                'at' => ($quotation->deleted_at ?? $quotation->updated_at ?? $quotation->created_at)?->toDateTimeString(),
            ]);
    }

    private function resolveAction(
        ?CarbonInterface $createdAt,
        ?CarbonInterface $updatedAt,
        ?CarbonInterface $deletedAt,
    ): string {
        if ($deletedAt) {
            return 'deleted';
        }

        if ($createdAt && $updatedAt && $createdAt->equalTo($updatedAt)) {
            return 'created';
        }

        return 'updated';
    }
}

