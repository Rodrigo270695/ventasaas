import { Pencil, Trash2, ZoomIn } from 'lucide-react';
import { useState } from 'react';
import { StoreCoverPreviewModal } from '@/components/admin/configuracion/store-cover-preview-modal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { StoreCoverSlideRow } from '@/types/admin/store-covers';

type Props = {
    slides: StoreCoverSlideRow[];
    canUpdate: boolean;
    canDelete: boolean;
    onEdit: (slide: StoreCoverSlideRow) => void;
    onDelete: (slide: StoreCoverSlideRow) => void;
};

export function StoreCoversGrid({
    slides,
    canUpdate,
    canDelete,
    onEdit,
    onDelete,
}: Props) {
    const [previewSlide, setPreviewSlide] = useState<StoreCoverSlideRow | null>(
        null,
    );

    if (slides.length === 0) {
        return (
            <div className="rounded-[1.75rem] border border-dashed border-violet-200 bg-white/70 px-6 py-16 text-center">
                <p className="text-lg font-semibold text-[#4c1d95]">
                    Aún no hay fotos de portada
                </p>
                <p className="mt-2 text-sm text-[#7c6f8a]">
                    Sube imágenes panorámicas para el carrusel del catálogo
                    público.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {slides.map((slide) => (
                    <article
                        key={slide.id}
                        className={cn(
                            'overflow-hidden rounded-[1.5rem] border bg-white shadow-[0_16px_40px_-28px_rgba(76,29,149,0.45)]',
                            slide.is_active
                                ? 'border-violet-100'
                                : 'border-amber-200/80 opacity-80',
                        )}
                    >
                        <div className="relative aspect-[21/9] overflow-hidden bg-violet-50">
                            {slide.image_url ? (
                                <button
                                    type="button"
                                    onClick={() => setPreviewSlide(slide)}
                                    className="group relative block h-full w-full cursor-pointer"
                                    aria-label={`Ver ${slide.title ?? 'portada'} en grande`}
                                >
                                    <img
                                        src={slide.image_url}
                                        alt={slide.title ?? 'Portada'}
                                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                                    />
                                    <span className="absolute inset-0 bg-[#12061f]/0 transition duration-300 group-hover:bg-[#12061f]/20" />
                                    <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white uppercase opacity-0 backdrop-blur-sm transition duration-300 group-hover:opacity-100">
                                        <ZoomIn className="size-3.5" />
                                        Ver grande
                                    </span>
                                </button>
                            ) : null}
                            <div className="pointer-events-none absolute top-3 left-3 flex gap-2">
                                <span className="rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white uppercase backdrop-blur-sm">
                                    Orden {slide.sort_order}
                                </span>
                                {!slide.is_active ? (
                                    <span className="rounded-full bg-amber-500/90 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white uppercase">
                                        Inactiva
                                    </span>
                                ) : null}
                            </div>
                        </div>

                        <div className="space-y-3 p-4">
                            <div>
                                <h3 className="font-bold text-[#2e1065]">
                                    {slide.title ?? 'Sin título'}
                                </h3>
                                {slide.subtitle ? (
                                    <p className="mt-1 line-clamp-2 text-sm text-[#7c6f8a]">
                                        {slide.subtitle}
                                    </p>
                                ) : (
                                    <p className="mt-1 text-sm text-[#9d8fb0]">
                                        Sin subtítulo
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end gap-2">
                                {canUpdate ? (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="size-9 cursor-pointer rounded-xl text-[#7c3aed] hover:bg-violet-50"
                                        onClick={() => onEdit(slide)}
                                        aria-label="Editar portada"
                                    >
                                        <Pencil className="size-4" />
                                    </Button>
                                ) : null}
                                {canDelete ? (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="size-9 cursor-pointer rounded-xl text-red-600 hover:bg-red-50"
                                        onClick={() => onDelete(slide)}
                                        aria-label="Eliminar portada"
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                ) : null}
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            <StoreCoverPreviewModal
                slide={previewSlide}
                open={previewSlide !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setPreviewSlide(null);
                    }
                }}
            />
        </>
    );
}
