import { Minus, Plus } from 'lucide-react';
import { FormField } from '@/components/form/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Props = {
    id: string;
    name: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    disabled?: boolean;
    error?: string;
    fieldClassName?: string;
    step?: number;
    min?: number;
};

export function SalesQuantityField({
    id,
    name,
    label,
    value,
    onChange,
    onBlur,
    disabled = false,
    error,
    fieldClassName,
    step = 1,
    min = 0.01,
}: Props) {
    const adjust = (delta: number) => {
        const current = parseFloat(value) || 0;
        const next = Math.max(min, current + delta);

        onChange(next.toFixed(2));
    };

    return (
        <FormField
            id={id}
            label={label}
            error={error}
            className={fieldClassName}
        >
            <div className="flex items-center gap-0.5">
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8 shrink-0 cursor-pointer rounded-lg border-violet-200 text-[#5b21b6] hover:bg-violet-50"
                    disabled={disabled}
                    onClick={() => adjust(-step)}
                    aria-label="Disminuir cantidad"
                >
                    <Minus className="size-3.5" />
                </Button>
                <Input
                    id={id}
                    name={name}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={value}
                    disabled={disabled}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={onBlur}
                    aria-invalid={!!error}
                    className="h-8 min-w-0 flex-1 rounded-lg border-violet-200 px-1 text-center text-[13px] font-semibold tabular-nums"
                />
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8 shrink-0 cursor-pointer rounded-lg border-violet-200 text-[#5b21b6] hover:bg-violet-50"
                    disabled={disabled}
                    onClick={() => adjust(step)}
                    aria-label="Aumentar cantidad"
                >
                    <Plus className="size-3.5" />
                </Button>
            </div>
        </FormField>
    );
}
