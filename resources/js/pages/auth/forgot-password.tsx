import { Form, Head, Link } from '@inertiajs/react';
import { ArrowRight, Mail } from 'lucide-react';
import { ChokoEmailInput } from '@/components/auth/choko-field';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { login } from '@/routes';
import { email } from '@/routes/password';

const submitButtonClass = cn(
    'choko-btn-shimmer group relative mt-6 flex h-[52px] w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl',
    'bg-linear-to-r from-[#ec4899] via-[#d946ef] to-[#7c3aed]',
    'text-[15px] font-extrabold tracking-wide text-white',
    'shadow-[0_12px_28px_-8px_rgba(217,70,239,0.55)]',
    'transition-all duration-300 ease-out',
    'hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-8px_rgba(217,70,239,0.65)]',
    'active:translate-y-0 active:scale-[0.99]',
    'disabled:pointer-events-none disabled:opacity-60',
);

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <>
            <Head title="Recuperar contraseña" />

            {status && (
                <div className="mb-5 rounded-2xl border border-emerald-200/90 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-800">
                    {status}
                </div>
            )}

            <Form {...email.form()} className="flex flex-col">
                {({ processing, errors }) => (
                    <>
                        <ChokoEmailInput
                            id="email"
                            name="email"
                            required
                            autoFocus
                            autoComplete="email"
                            placeholder="tu@correo.com"
                            error={errors.email}
                        />

                        <button
                            type="submit"
                            disabled={processing}
                            data-test="email-password-reset-link-button"
                            className={submitButtonClass}
                        >
                            <span className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/5 via-white/10 to-white/25" />
                            <span className="relative flex items-center gap-2">
                                {processing ? (
                                    <Spinner className="text-white" />
                                ) : (
                                    <>
                                        <Mail className="size-[18px]" />
                                        Enviar enlace de recuperación
                                        <ArrowRight className="size-[18px] transition-transform group-hover:translate-x-0.5" />
                                    </>
                                )}
                            </span>
                        </button>

                        <p className="mt-5 text-center text-sm text-[#7c6f8a]">
                            ¿Recordaste tu contraseña?{' '}
                            <Link
                                href={login()}
                                className="font-bold text-[#7c3aed] transition-colors hover:text-[#ec4899]"
                            >
                                Iniciar sesión
                            </Link>
                        </p>
                    </>
                )}
            </Form>
        </>
    );
}

ForgotPassword.layout = {
    title: 'Recuperar acceso',
    description: 'Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña',
};
