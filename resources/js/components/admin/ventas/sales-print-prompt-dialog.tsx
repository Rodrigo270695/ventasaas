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
import {
    persistPreferredTicketFormat,
    readPreferredTicketFormat,
    SALES_TICKET_FORMAT_OPTIONS,
    type SalesTicketFormat,
} from '@/lib/sales-ticket-format';
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
    const [format, setFormat] = useState<SalesTicketFormat>('58mm');

    useEffect(() => {
        if (open) {
            setFormat(readPreferredTicketFormat());
        }
    }, [open]);

    const handleFormatChange = (next: SalesTicketFormat) => {
        setFormat(next);
        persistPreferredTicketFormat(next);
    };

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
                        {fullNumber} fue confirmado. Para ticketeras de 56 mm
                        usa el formato <strong>56 / 58 mm</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-3 gap-2">
                    {SALES_TICKET_FORMAT_OPTIONS.map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => handleFormatChange(item.key)}
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
