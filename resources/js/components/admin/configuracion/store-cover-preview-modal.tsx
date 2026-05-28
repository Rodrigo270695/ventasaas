import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import type { StoreCoverSlideRow } from '@/types/admin/store-covers';

type Props = {
    slide: StoreCoverSlideRow | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export function StoreCoverPreviewModal({ slide, open, onOpenChange }: Props) {
    const title = slide?.title?.trim() || 'Foto de portada';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[min(96vw,72rem)] gap-0 overflow-hidden border-none bg-[#12061f]/95 p-2 shadow-2xl sm:p-3">
                <DialogTitle className="sr-only">{title}</DialogTitle>
                <DialogDescription className="sr-only">
                    Vista ampliada de la foto de portada.
                </DialogDescription>

                {slide?.image_url ? (
                    <img
                        src={slide.image_url}
                        alt={title}
                        className="max-h-[min(88vh,52rem)] w-full rounded-2xl object-contain"
                    />
                ) : null}

                {(slide?.title || slide?.subtitle) && (
                    <div className="px-2 pb-1 pt-3 text-center sm:px-3">
                        {slide.title ? (
                            <p className="text-base font-bold text-white sm:text-lg">
                                {slide.title}
                            </p>
                        ) : null}
                        {slide.subtitle ? (
                            <p className="mt-1 text-sm text-violet-100/85">
                                {slide.subtitle}
                            </p>
                        ) : null}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
