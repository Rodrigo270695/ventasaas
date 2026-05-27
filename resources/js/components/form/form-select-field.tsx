import { FormField } from '@/components/form/form-field';
import {
    chokoSelectContentClass,
    chokoSelectItemClass,
    chokoSelectTriggerClass,
} from '@/components/form/field-styles';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type FormSelectOption = {
    value: string;
    label: string;
};

/** Valor interno del Select cuando el formulario envía cadena vacía (Radix no permite value=""). */
export const FORM_SELECT_EMPTY_VALUE = '__none__';

type Props = {
    id: string;
    name: string;
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    options: readonly FormSelectOption[];
    placeholder?: string;
    /** Opción “vacía” (p. ej. sin padre). El valor del formulario sigue siendo "". */
    emptyOptionLabel?: string;
    required?: boolean;
    error?: string;
    disabled?: boolean;
    fieldClassName?: string;
};

export function FormSelectField({
    id,
    name,
    label,
    value,
    onValueChange,
    options,
    placeholder = 'Seleccionar…',
    emptyOptionLabel,
    required,
    error,
    disabled,
    fieldClassName,
}: Props) {
    const safeValue = value ?? '';

    const selectOptions = emptyOptionLabel
        ? [
              { value: FORM_SELECT_EMPTY_VALUE, label: emptyOptionLabel },
              ...options,
          ]
        : [...options];

    const selectValue =
        safeValue === '' && emptyOptionLabel
            ? FORM_SELECT_EMPTY_VALUE
            : safeValue;

    const handleValueChange = (next: string) => {
        onValueChange(
            emptyOptionLabel && next === FORM_SELECT_EMPTY_VALUE ? '' : next,
        );
    };

    return (
        <FormField
            id={id}
            label={label}
            required={required}
            error={error}
            className={fieldClassName}
        >
            <input type="hidden" name={name} value={safeValue} />
            <Select
                value={selectValue}
                onValueChange={handleValueChange}
                disabled={disabled}
            >
                <SelectTrigger
                    id={id}
                    aria-invalid={!!error}
                    className={cn(chokoSelectTriggerClass, error && 'border-red-400')}
                >
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent
                    className={chokoSelectContentClass}
                    position="popper"
                    sideOffset={4}
                >
                    {selectOptions.map((option) => (
                        <SelectItem
                            key={option.value}
                            value={option.value}
                            className={chokoSelectItemClass}
                        >
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </FormField>
    );
}
