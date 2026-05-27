import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    getPaginationPages,
    PAGE_SIZE_OPTIONS,
    type PageSizeOption,
} from '@/hooks/use-pagination';
import { cn } from '@/lib/utils';

type Props = {
    page: number;
    pageSize: PageSizeOption;
    totalItems: number;
    totalPages: number;
    rangeStart: number;
    rangeEnd: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: PageSizeOption) => void;
    className?: string;
};

export function DataTablePagination({
    page,
    pageSize,
    totalItems,
    totalPages,
    rangeStart,
    rangeEnd,
    onPageChange,
    onPageSizeChange,
    className,
}: Props) {
    if (totalItems === 0) {
        return null;
    }

    const pages = getPaginationPages(page, totalPages);
    const showPagination = totalItems > pageSize || totalPages > 1;

    return (
        <div
            className={cn(
                'relative z-10 flex flex-col gap-3 overflow-visible border-t border-violet-100/80 bg-violet-50/25 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4',
                className,
            )}
        >
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
                <p className="text-xs font-medium text-[#7c6f8a]">
                    Mostrando{' '}
                    <span className="font-bold text-[#4c1d95]">
                        {rangeStart}-{rangeEnd}
                    </span>{' '}
                    de{' '}
                    <span className="font-bold text-[#4c1d95]">
                        {totalItems}
                    </span>
                </p>

                <div className="flex shrink-0 items-center gap-2">
                    <span className="shrink-0 text-xs font-semibold text-[#9d8fb0]">
                        Por página
                    </span>
                    <Select
                        value={String(pageSize)}
                        onValueChange={(value) =>
                            onPageSizeChange(Number(value) as PageSizeOption)
                        }
                    >
                        <SelectTrigger
                            size="sm"
                            className="h-8 w-18 cursor-pointer rounded-lg border-violet-200/90 bg-white text-xs font-semibold text-[#5b21b6] shadow-sm hover:bg-violet-50/50 focus-visible:border-[#ec4899] focus-visible:ring-2 focus-visible:ring-[#ec4899]/20"
                            aria-label="Registros por página"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent
                            position="popper"
                            side="top"
                            align="start"
                            sideOffset={8}
                            collisionPadding={16}
                            className="z-200 rounded-xl border-violet-200/90 bg-white p-1 shadow-lg shadow-violet-200/50"
                        >
                            {PAGE_SIZE_OPTIONS.map((size) => (
                                <SelectItem
                                    key={size}
                                    value={String(size)}
                                    className="cursor-pointer rounded-lg text-sm font-medium text-[#4c1d95] focus:bg-violet-50 focus:text-[#5b21b6]"
                                >
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {showPagination && (
                <nav
                    className="flex min-w-0 flex-wrap items-center justify-center gap-1 overflow-visible sm:justify-end"
                    aria-label="Paginación"
                >
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8 cursor-pointer rounded-lg border-violet-200/90 bg-white text-[#7c3aed] hover:bg-violet-50 hover:text-[#5b21b6] disabled:opacity-40"
                        onClick={() => onPageChange(page - 1)}
                        disabled={page <= 1}
                        aria-label="Página anterior"
                    >
                        <ChevronLeft className="size-4" />
                    </Button>

                    <div className="flex items-center gap-0.5">
                        {pages.map((pageNumber, index) =>
                            pageNumber === 'ellipsis' ? (
                                <span
                                    key={`ellipsis-${index}`}
                                    className="px-1.5 text-xs text-[#9d8fb0]"
                                >
                                    …
                                </span>
                            ) : (
                                <Button
                                    key={pageNumber}
                                    type="button"
                                    variant={
                                        pageNumber === page
                                            ? 'default'
                                            : 'outline'
                                    }
                                    size="icon"
                                    className={cn(
                                        'size-8 min-w-8 cursor-pointer rounded-lg text-xs font-bold',
                                        pageNumber === page
                                            ? 'border-transparent bg-linear-to-r from-[#7c3aed] to-[#a855f7] text-white shadow-md shadow-violet-300/30 hover:opacity-95'
                                            : 'border-violet-200/90 bg-white text-[#6d28d9] hover:bg-violet-50',
                                    )}
                                    onClick={() => onPageChange(pageNumber)}
                                    aria-label={`Página ${pageNumber}`}
                                    aria-current={
                                        pageNumber === page
                                            ? 'page'
                                            : undefined
                                    }
                                >
                                    {pageNumber}
                                </Button>
                            ),
                        )}
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8 cursor-pointer rounded-lg border-violet-200/90 bg-white text-[#7c3aed] hover:bg-violet-50 hover:text-[#5b21b6] disabled:opacity-40"
                        onClick={() => onPageChange(page + 1)}
                        disabled={page >= totalPages}
                        aria-label="Página siguiente"
                    >
                        <ChevronRight className="size-4" />
                    </Button>
                </nav>
            )}
        </div>
    );
}
