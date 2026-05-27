import { Search, X } from 'lucide-react';
import { chokoInputClass } from '@/components/form/field-styles';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Props = {
    value: string;
    onChange: (value: string) => void;
    onCommit?: (value?: string) => void;
    placeholder?: string;
    className?: string;
    resultCount?: number;
    isSearching?: boolean;
};

export function DataTableSearch({
    value,
    onChange,
    onCommit,
    placeholder = 'Buscar…',
    className,
    resultCount,
    isSearching = false,
}: Props) {
    return (
        <div
            data-tour="page-search"
            className={cn(
                'w-full max-w-xs space-y-1.5 sm:max-w-sm',
                className,
            )}
        >
            <div className="relative">
                <Search
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#9d8fb0]"
                    aria-hidden
                />
                <Input
                    type="text"
                    role="searchbox"
                    inputMode="search"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            onCommit?.(e.currentTarget.value);
                        }
                    }}
                    placeholder={placeholder}
                    autoComplete="off"
                    spellCheck={false}
                    className={cn(
                        chokoInputClass,
                        'bg-white/90 pr-10 pl-10 text-sm',
                    )}
                    aria-label={placeholder}
                />
                {value.length > 0 && (
                    <button
                        type="button"
                        onClick={() => {
                            onChange('');
                            onCommit?.('');
                        }}
                        className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-md p-0.5 text-[#9d8fb0] transition-colors hover:bg-violet-50 hover:text-[#7c3aed]"
                        aria-label="Limpiar búsqueda"
                    >
                        <X className="size-4" />
                    </button>
                )}
            </div>
            {resultCount !== undefined && value.trim().length > 0 && (
                <p
                    className={cn(
                        'text-xs text-[#9d8fb0]',
                        isSearching && 'opacity-70',
                    )}
                >
                    {resultCount}{' '}
                    {resultCount === 1 ? 'resultado' : 'resultados'}
                </p>
            )}
        </div>
    );
}
