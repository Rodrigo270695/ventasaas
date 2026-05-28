<?php

namespace App\Http\Controllers\Admin\Configuracion;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Configuracion\StoreCoverSlideRequest;
use App\Models\StoreCoverSlide;
use App\Support\StoreCoverStorage;
use App\Support\Toast;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StoreCoverSlideController extends Controller
{
    public function __construct(
        private readonly StoreCoverStorage $covers,
    ) {}

    public function index(Request $request): Response
    {
        abort_unless($request->user()?->can('store_covers.view'), 403);

        if ($request->boolean('_reset')) {
            $request->session()->forget([
                'coverModal',
                'coverModalSlideId',
                'errors',
            ]);
        }

        $slides = StoreCoverSlide::query()
            ->orderBy('sort_order')
            ->orderBy('created_at')
            ->get();

        $activeCount = $slides->where('is_active', true)->count();

        return Inertia::render('admin/configuracion/portada/index', [
            'slides' => $slides->map(fn (StoreCoverSlide $slide) => $this->mapSlide($slide))->values()->all(),
            'stats' => [
                ['key' => 'total', 'label' => 'Total', 'value' => $slides->count(), 'tone' => 'violet'],
                ['key' => 'active', 'label' => 'Activas', 'value' => $activeCount, 'tone' => 'green'],
                ['key' => 'inactive', 'label' => 'Inactivas', 'value' => $slides->count() - $activeCount, 'tone' => 'amber'],
            ],
            'coverModal' => session()->pull('coverModal'),
            'coverModalSlideId' => session()->pull('coverModalSlideId'),
            'oldForm' => $this->oldFormDefaults(),
        ]);
    }

    public function store(StoreCoverSlideRequest $request): RedirectResponse
    {
        $data = $request->safe()->except(['image']);
        $data['image_path'] = $this->covers->store($request->file('image'));
        $data['sort_order'] = (int) (StoreCoverSlide::query()->max('sort_order') ?? -1) + 1;
        $data['is_active'] = $data['is_active'] ?? true;

        StoreCoverSlide::create($data);

        Toast::success('Foto de portada agregada.');

        return to_route('admin.configuracion.portada.index');
    }

    public function update(
        StoreCoverSlideRequest $request,
        StoreCoverSlide $portada,
    ): RedirectResponse {
        $data = $request->safe()->except(['image']);

        if ($request->hasFile('image')) {
            $data['image_path'] = $this->covers->store(
                $request->file('image'),
                $portada->image_path,
            );
        }

        $data['is_active'] = $data['is_active'] ?? $portada->is_active;

        $portada->update($data);

        Toast::success('Foto de portada actualizada.');

        return to_route('admin.configuracion.portada.index');
    }

    public function destroy(Request $request, StoreCoverSlide $portada): RedirectResponse
    {
        abort_unless($request->user()?->can('store_covers.delete'), 403);

        $this->covers->delete($portada->image_path);
        $portada->delete();

        Toast::success('Foto de portada eliminada.');

        return to_route('admin.configuracion.portada.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function mapSlide(StoreCoverSlide $slide): array
    {
        return [
            'id' => $slide->id,
            'title' => $slide->title,
            'subtitle' => $slide->subtitle,
            'image_url' => $this->covers->url($slide->image_path),
            'sort_order' => $slide->sort_order,
            'is_active' => $slide->is_active,
            'updated_at' => $slide->updated_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function oldFormDefaults(): array
    {
        return [
            'title' => old('title', ''),
            'subtitle' => old('subtitle', ''),
            'is_active' => filter_var(old('is_active', true), FILTER_VALIDATE_BOOLEAN),
        ];
    }
}
