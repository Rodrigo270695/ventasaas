import { ChevronDown } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { DataTableColumn } from '@/components/data-table/types';
import { cn } from '@/lib/utils';

type Props<T> = {
    rows: T[];
    primaryColumn: DataTableColumn<T>;
    detailColumns: DataTableColumn<T>[];
    getRowKey: (row: T) => string | number;
    renderActions?: (row: T) => ReactNode;
};

export function DataTableMobileList<T>({
    rows,
    primaryColumn,
    detailColumns,
    getRowKey,
    renderActions,
}: Props<T>) {
    const [expandedKey, setExpandedKey] = useState<string | number | null>(
        null,
    );

    const hasDetails = detailColumns.length > 0;

    return (
        <ul className="divide-y divide-violet-50/80 pb-4 md:hidden">
            {rows.map((row) => {
                const rowKey = getRowKey(row);
                const isExpanded = expandedKey === rowKey;

                return (
                    <li key={rowKey}>
                        <div className="flex items-center gap-1 px-2 py-2">
                            {hasDetails ? (
                                <div className="flex min-w-0 flex-1 items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setExpandedKey(
                                                isExpanded ? null : rowKey,
                                            )
                                        }
                                        className="flex shrink-0 cursor-pointer items-center justify-center rounded-lg p-1.5 text-[#9d8fb0] transition-colors hover:bg-violet-50/60 hover:text-[#6d28d9]"
                                        aria-expanded={isExpanded}
                                        aria-label={
                                            isExpanded
                                                ? 'Ocultar detalle'
                                                : 'Ver detalle'
                                        }
                                    >
                                        <ChevronDown
                                            className={cn(
                                                'size-4 transition-transform duration-200',
                                                isExpanded && 'rotate-180',
                                            )}
                                            aria-hidden
                                        />
                                    </button>
                                    <div
                                        className={cn(
                                            'min-w-0 flex-1 truncate text-[15px] font-semibold text-[#3b2d4a]',
                                            primaryColumn.cellClassName,
                                        )}
                                    >
                                        {primaryColumn.cell(row)}
                                    </div>
                                    {!isExpanded && (
                                        <span className="shrink-0 pr-1 text-[10px] font-semibold text-[#9d8fb0]">
                                            +{detailColumns.length}
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <div className="min-w-0 flex-1 px-2 py-1.5">
                                    <p
                                        className={cn(
                                            'truncate text-[15px] font-semibold text-[#3b2d4a]',
                                            primaryColumn.cellClassName,
                                        )}
                                    >
                                        {primaryColumn.cell(row)}
                                    </p>
                                </div>
                            )}

                            {renderActions && (
                                <div
                                    className="flex shrink-0 gap-0.5"
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyDown={(e) => e.stopPropagation()}
                                >
                                    {renderActions(row)}
                                </div>
                            )}
                        </div>

                        {hasDetails && isExpanded && (
                            <dl className="grid grid-cols-1 gap-2 border-t border-violet-50/80 bg-violet-50/25 px-3 py-3 sm:grid-cols-2">
                                {detailColumns.map((col) => (
                                    <div
                                        key={col.id}
                                        className="min-w-0 rounded-lg border border-violet-100/80 bg-white/90 px-3 py-2"
                                    >
                                        <dt className="text-[10px] font-bold tracking-wide text-[#9d8fb0] uppercase">
                                            {col.mobileLabel ?? col.header}
                                        </dt>
                                        <dd
                                            className={cn(
                                                'mt-1 break-words text-sm font-semibold text-[#4c1d95]',
                                                col.cellClassName,
                                            )}
                                        >
                                            {col.cell(row)}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}
