import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { cn } from '@/lib/utils';

const fieldInputClass = cn(
    'choko-input h-12 w-full rounded-2xl border-0 bg-transparent py-0 pr-4 pl-11',
    'text-[15px] text-[#2d2438] placeholder:text-[#b8a8c8]',
    'focus:outline-none focus:ring-0',
);

type ChokoFieldProps = {
    id: string;
    label: string;
    error?: string;
    hint?: ReactNode;
    children: ReactNode;
};

export function ChokoField({
    id,
    label,
    error,
    hint,
    children,
}: ChokoFieldProps) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
                <label
                    htmlFor={id}
                    className="text-[13px] font-bold tracking-wide text-[#5b21b6] uppercase"
                >
                    {label}
                </label>
                {hint}
            </div>
            <div
                className={cn(
                    'choko-field-shell group relative rounded-2xl transition-all duration-300',
                    error && 'ring-2 ring-red-300/60',
                )}
            >
                {children}
            </div>
            <InputError message={error} />
        </div>
    );
}

export function ChokoEmailInput(
    props: ComponentProps<'input'> & { error?: string },
) {
    const { error, className, ...rest } = props;

    return (
        <ChokoField id={rest.id ?? 'email'} label="Correo" error={error}>
            <Mail
                className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-[#c084fc] transition-colors group-focus-within:text-[#ec4899]"
                strokeWidth={2.25}
            />
            <input
                type="email"
                autoComplete="email"
                className={cn(fieldInputClass, className)}
                {...rest}
            />
        </ChokoField>
    );
}

export function ChokoPasswordInput({
    error,
    forgotLink,
    ...props
}: Omit<ComponentProps<'input'>, 'type'> & {
    error?: string;
    forgotLink?: ReactNode;
}) {
    const [show, setShow] = useState(false);
    const id = props.id ?? 'password';

    return (
        <ChokoField
            id={id}
            label="Contraseña"
            error={error}
            hint={forgotLink}
        >
            <Lock
                className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-[#c084fc] transition-colors group-focus-within:text-[#ec4899]"
                strokeWidth={2.25}
            />
            <input
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                className={cn(fieldInputClass, 'pr-12', props.className)}
                {...props}
            />
            <button
                type="button"
                tabIndex={-1}
                onClick={() => setShow((v) => !v)}
                className="absolute top-1/2 right-3.5 -translate-y-1/2 rounded-lg p-1 text-[#a78bfa] transition-colors hover:bg-violet-100/80 hover:text-[#7c3aed]"
                aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
                {show ? (
                    <EyeOff className="size-[18px]" strokeWidth={2.25} />
                ) : (
                    <Eye className="size-[18px]" strokeWidth={2.25} />
                )}
            </button>
        </ChokoField>
    );
}
