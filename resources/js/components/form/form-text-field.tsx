import type { ComponentProps } from 'react';
import { FormField } from '@/components/form/form-field';
import { chokoInputClass } from '@/components/form/field-styles';
import PasswordInput from '@/components/password-input';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Props = {
    id: string;
    name: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    error?: string;
    hint?: string;
    className?: string;
    fieldClassName?: string;
} & Omit<
    ComponentProps<typeof Input>,
    'id' | 'name' | 'value' | 'onChange' | 'className'
>;

export function FormTextField({
    id,
    name,
    label,
    value,
    onChange,
    required,
    error,
    hint,
    className,
    fieldClassName,
    type,
    ...inputProps
}: Props) {
    const inputClassName = cn(chokoInputClass, className);
    const isPassword = type === 'password';
    const safeValue = value ?? '';

    return (
        <FormField
            id={id}
            label={label}
            required={required}
            error={error}
            hint={hint}
            className={fieldClassName}
        >
            {isPassword ? (
                <PasswordInput
                    id={id}
                    name={name}
                    value={safeValue}
                    onChange={(e) => onChange(e.target.value)}
                    aria-invalid={!!error}
                    className={inputClassName}
                    {...inputProps}
                />
            ) : (
                <Input
                    id={id}
                    name={name}
                    type={type}
                    value={safeValue}
                    onChange={(e) => onChange(e.target.value)}
                    aria-invalid={!!error}
                    className={inputClassName}
                    {...inputProps}
                />
            )}
        </FormField>
    );
}
