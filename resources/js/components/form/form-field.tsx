import type { ReactNode } from 'react';
import InputError from '@/components/input-error';
import { RequiredLabel } from '@/components/modal';
import { Label } from '@/components/ui/label';
import { chokoLabelClass } from '@/components/form/field-styles';
import { cn } from '@/lib/utils';

type Props = {
    id: string;
    label: string;
    required?: boolean;
    error?: string;
    hint?: string;
    className?: string;
    children: ReactNode;
};

export function FormField({
    id,
    label,
    required = false,
    error,
    hint,
    className,
    children,
}: Props) {
    return (
        <div className={cn('space-y-1.5', className)}>
            {required ? (
                <RequiredLabel htmlFor={id} className={chokoLabelClass}>
                    {label}
                </RequiredLabel>
            ) : (
                <Label htmlFor={id} className={chokoLabelClass}>
                    {label}
                </Label>
            )}
            {children}
            {hint && !error && (
                <p className="text-[11px] leading-snug text-[#7c6f8a]">{hint}</p>
            )}
            <InputError message={error} />
        </div>
    );
}
