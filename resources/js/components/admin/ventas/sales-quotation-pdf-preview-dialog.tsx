import { Download, Printer, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    quotationNumber: string;
    pdfUrl: string;
};

export function SalesQuotationPdfPreviewDialog({
    open,
    onOpenChange,
    quotationNumber,
    pdfUrl,
}: Props) {
    const downloadUrl = `${pdfUrl}${pdfUrl.includes('?') ? '&' : '?'}download=1`;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[92vh] max-h-[92vh] w-[min(96vw,920px)] max-w-[min(96vw,920px)] flex-col gap-0 overflow-hidden rounded-2xl border-violet-200/80 p-0">
                <DialogHeader className="border-b border-violet-100 px-4 py-3">
                    <DialogTitle className="text-[#3b2d4a]">
                        Vista previa — {quotationNumber}
                    </DialogTitle>
                    <DialogDescription className="text-[#7c6f8a]">
                        Revisa el PDF antes de imprimir o enviar por correo.
                    </DialogDescription>
                </DialogHeader>

                <div className="min-h-0 flex-1 bg-slate-100 p-2">
                    {open ? (
                        <iframe
                            title={`PDF cotización ${quotationNumber}`}
                            src={pdfUrl}
                            className="h-full w-full rounded-lg border border-violet-200 bg-white"
                        />
                    ) : null}
                </div>

                <DialogFooter className="gap-2 border-t border-violet-100 px-4 py-3 sm:justify-between">
                    <Button
                        type="button"
                        variant="outline"
                        className="cursor-pointer border-violet-200 text-[#5b21b6]"
                        onClick={() => onOpenChange(false)}
                    >
                        <X className="size-4" />
                        Cerrar
                    </Button>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="cursor-pointer border-violet-200 text-[#5b21b6]"
                            asChild
                        >
                            <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="size-4" />
                                Descargar
                            </a>
                        </Button>
                        <Button
                            type="button"
                            className="cursor-pointer gap-2 bg-linear-to-r from-[#ec4899] to-[#7c3aed] text-white hover:opacity-95"
                            asChild
                        >
                            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                                <Printer className="size-4" />
                                Imprimir
                            </a>
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
