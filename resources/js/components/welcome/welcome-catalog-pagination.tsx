import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPaginationPages } from '@/hooks/use-pagination';
import { cn } from '@/lib/utils';

export const WELCOME_CATALOG_PAGE_SIZE = 30;

type Props = {
    page: number;
    totalItems: number;
    totalPages: number;
    rangeStart: number;
    rangeEnd: number;
    onPageChange: (page: number) => void;
};

export function WelcomeCatalogPagination({
    page,
    totalItems,
    totalPages,
    rangeStart,
    rangeEnd,
    onPageChange,
}: Props) {
    if (totalItems <= WELCOME_CATALOG_PAGE_SIZE) {
        return null;
    }

    const pages = getPaginationPages(page, totalPages);

    return (
        <div className="mt-8 overflow-hidden rounded-2xl border border-[#fed7aa]/60 bg-white shadow-sm">
            <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[#6b7280]">
                    Mostrando{' '}
                    <span className="font-bold text-[#9a3412]">
                        {rangeStart}–{rangeEnd}
                    </span>{' '}
                    de{' '}
                    <span className="font-bold text-[#9a3412]">
                        {totalItems}
                    </span>{' '}
                    productos
                </p>

                <nav
                    className="flex items-center justify-center gap-1"
                    aria-label="Paginación del catálogo"
                >
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-9 cursor-pointer rounded-xl border-[#fed7aa] bg-white text-[#ea580c] hover:bg-[#fff7ed] disabled:opacity-40"
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
                                    className="px-1.5 text-xs text-[#9ca3af]"
                                >
                                    …
                                </span>
                            ) : (
                                <Button
                                    key={pageNumber}
                                    type="button"
                                    variant={
                                        pageNumber === page ? 'default' : 'outline'
                                    }
                                    size="icon"
                                    className={cn(
                                        'size-9 min-w-9 cursor-pointer rounded-xl text-xs font-bold',
                                        pageNumber === page
                                            ? 'border-transparent bg-[#f97316] text-white shadow-sm hover:bg-[#ea580c]'
                                            : 'border-[#fed7aa] bg-white text-[#ea580c] hover:bg-[#fff7ed]',
                                    )}
                                    onClick={() => onPageChange(pageNumber)}
                                    aria-label={`Página ${pageNumber}`}
                                    aria-current={
                                        pageNumber === page ? 'page' : undefined
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
                        className="size-9 cursor-pointer rounded-xl border-[#fed7aa] bg-white text-[#ea580c] hover:bg-[#fff7ed] disabled:opacity-40"
                        onClick={() => onPageChange(page + 1)}
                        disabled={page >= totalPages}
                        aria-label="Página siguiente"
                    >
                        <ChevronRight className="size-4" />
                    </Button>
                </nav>
            </div>
        </div>
    );
}
