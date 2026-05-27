import { Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { salesTicketUrl } from '@/lib/sales-ticket-url';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    documentId: string;
    fullNumber: string;
    internal?: boolean;
};

export function SalesPrintPromptDialog({
    open,
    onOpenChange,
    documentId,
    fullNumber,
    internal = false,
}: Props) {
    const [format, setFormat] = useState<'80mm' | '58mm' | 'a4'>('80mm');

    useEffect(() => {
        if (open) {
            setFormat('80mm');
        }
    }, [open]);

    const printUrl = salesTicketUrl(documentId, {
        format,
        auto: true,
        internal,
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-2xl border-violet-200/80">
                <DialogHeader>
                    <DialogTitle className="text-[#3b2d4a]">
                        {internal
                            ? '¿Imprimir ticket interno?'
                            : '¿Imprimir comprobante?'}
                    </DialogTitle>
                    <DialogDescription className="text-[#7c6f8a]">
                        {fullNumber} fue confirmado. Elige el formato de
                        impresión para tu ticketera o impresora.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-3 gap-2">
                    {(
                        [
                            { key: '80mm', label: '80 mm', hint: 'Recomendado' },
                            { key: '58mm', label: '58 mm', hint: 'Compacto' },
                            { key: 'a4', label: 'A4', hint: 'Oficina' },
                        ] as const
                    ).map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => setFormat(item.key)}
                            className={
                                format === item.key
                                    ? 'cursor-pointer rounded-xl border-2 border-[#7c3aed] bg-violet-50 px-2 py-3 text-center ring-2 ring-violet-200/60'
                                    : 'cursor-pointer rounded-xl border border-violet-200/80 bg-white px-2 py-3 text-center hover:bg-violet-50/50'
                            }
                        >
                            <span className="block text-sm font-bold text-[#5b21b6]">
                                {item.label}
                            </span>
                            <span className="mt-0.5 block text-[10px] text-[#9d8fb0]">
                                {item.hint}
                            </span>
                        </button>
                    ))}
                </div>

                <DialogFooter className="gap-2 sm:gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="cursor-pointer border-violet-200 text-[#5b21b6]"
                        onClick={() => onOpenChange(false)}
                    >
                        Ahora no
                    </Button>
                    <Button
                        type="button"
                        className="cursor-pointer gap-2 bg-linear-to-r from-[#ec4899] to-[#7c3aed] text-white hover:opacity-95"
                        asChild
                    >
                        <a
                            href={printUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => onOpenChange(false)}
                        >
                            <Printer className="size-4" />
                            Imprimir
                        </a>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
