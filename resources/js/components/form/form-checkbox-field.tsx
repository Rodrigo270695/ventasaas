import InputError from '@/components/input-error';
import { chokoCheckboxClass, chokoCheckboxRowClass } from '@/components/form/field-styles';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type Props = {
    id: string;
    name: string;
    label: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    hiddenValue?: string;
    error?: string;
    className?: string;
    disabled?: boolean;
};

/** Checkbox con etiqueta al lado (estilo fila Choko). */
export function FormCheckboxField({
    id,
    name,
    label,
    checked,
    onCheckedChange,
    hiddenValue,
    error,
    className,
    disabled,
}: Props) {
    return (
        <div className={cn('space-y-1.5', className)}>
            <div className={chokoCheckboxRowClass}>
                <Checkbox
                    id={id}
                    checked={checked}
                    disabled={disabled}
                    onCheckedChange={(value) => onCheckedChange(value === true)}
                    className={chokoCheckboxClass}
                />
                <input
                    type="hidden"
                    name={name}
                    value={hiddenValue ?? (checked ? '1' : '0')}
                />
                <Label
                    htmlFor={id}
                    className="cursor-pointer text-sm font-medium text-[#4c1d95]"
                >
                    {label}
                </Label>
            </div>
            <InputError message={error} />
        </div>
    );
}
