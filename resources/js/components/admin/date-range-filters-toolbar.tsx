import { chokoInputClass } from '@/components/form/field-styles';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type Props = {
    idPrefix: string;
    from: string;
    to: string;
    onFromChange: (value: string) => void;
    onToChange: (value: string) => void;
    onRangeCommit: () => void;
    className?: string;
};

export function DateRangeFiltersToolbar({
    idPrefix,
    from,
    to,
    onFromChange,
    onToChange,
    onRangeCommit,
    className,
}: Props) {
    return (
        <div
            className={cn(
                'flex shrink-0 flex-nowrap items-center gap-3',
                className,
            )}
        >
            <div className="flex items-center gap-2">
                <Label
                    htmlFor={`${idPrefix}-from`}
                    className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[#6b5b7a]"
                >
                    Desde
                </Label>
                <Input
                    id={`${idPrefix}-from`}
                    type="date"
                    value={from}
                    onChange={(e) => onFromChange(e.target.value)}
                    onBlur={onRangeCommit}
                    className={cn(chokoInputClass, 'w-[9.25rem] shrink-0')}
                />
            </div>
            <div className="flex items-center gap-2">
                <Label
                    htmlFor={`${idPrefix}-to`}
                    className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[#6b5b7a]"
                >
                    Hasta
                </Label>
                <Input
                    id={`${idPrefix}-to`}
                    type="date"
                    value={to}
                    onChange={(e) => onToChange(e.target.value)}
                    onBlur={onRangeCommit}
                    className={cn(chokoInputClass, 'w-[9.25rem] shrink-0')}
                />
            </div>
        </div>
    );
}
