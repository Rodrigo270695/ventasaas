import {
    chokoSelectContentClass,
    chokoSelectItemClass,
    chokoSelectTriggerClass,
} from '@/components/form/field-styles';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export const ALL_LIST_STATUS = '__all_status__';

export type AdminListStatusOption = {
    value: string;
    label: string;
};

type Props = {
    id: string;
    value: string | null | undefined;
    options: AdminListStatusOption[];
    onValueChange: (value: string) => void;
    placeholder?: string;
    'aria-label'?: string;
    className?: string;
};

/**
 * Select de estado para toolbars de listados con filtro en servidor (estilo Choko).
 */
export function AdminListStatusFilter({
    id,
    value,
    options,
    onValueChange,
    placeholder = 'Estado…',
    'aria-label': ariaLabel = 'Filtrar por estado',
    className,
}: Props) {
    const selectValue = value && value !== '' ? value : ALL_LIST_STATUS;

    return (
        <Select
            value={selectValue}
            onValueChange={(next) =>
                onValueChange(next === ALL_LIST_STATUS ? '' : next)
            }
        >
            <SelectTrigger
                id={id}
                aria-label={ariaLabel}
                className={cn(chokoSelectTriggerClass, className)}
            >
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent
                className={chokoSelectContentClass}
                position="popper"
                sideOffset={4}
            >
                {options.map((option) => (
                    <SelectItem
                        key={option.value || ALL_LIST_STATUS}
                        value={option.value || ALL_LIST_STATUS}
                        className={chokoSelectItemClass}
                    >
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
