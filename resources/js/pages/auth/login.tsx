import { Form, Head } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import {
    ChokoEmailInput,
    ChokoPasswordInput,
} from '@/components/auth/choko-field';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    return (
        <>
            <Head title="Iniciar sesión" />

            {status && (
                <div className="mb-5 rounded-2xl border border-emerald-200/90 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-800">
                    {status}
                </div>
            )}

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="space-y-5">
                            <ChokoEmailInput
                                id="email"
                                name="email"
                                required
                                autoFocus
                                tabIndex={1}
                                placeholder="tu@correo.com"
                                error={errors.email}
                            />

                            <ChokoPasswordInput
                                id="password"
                                name="password"
                                required
                                tabIndex={2}
                                placeholder="Tu contraseña"
                                error={errors.password}
                                forgotLink={
                                    canResetPassword ? (
                                        <a
                                            href={request.url()}
                                            className="text-[11px] font-semibold text-[#0891b2] no-underline transition-colors hover:text-[#ec4899]"
                                            tabIndex={5}
                                        >
                                            ¿Olvidaste?
                                        </a>
                                    ) : undefined
                                }
                            />

                            <label className="choko-remember flex cursor-pointer select-none items-center gap-3 rounded-xl px-1 py-0.5">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    id="remember"
                                    tabIndex={3}
                                    className="size-[18px] rounded-md border-2 border-violet-200"
                                />
                                <span className="text-[13px] font-semibold text-[#6b5b7a]">
                                    Mantener sesión iniciada
                                </span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            tabIndex={4}
                            disabled={processing}
                            data-test="login-button"
                            className={cn(
                                'choko-btn-shimmer group relative mt-7 flex h-[52px] w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl',
                                'bg-linear-to-r from-[#ec4899] via-[#d946ef] to-[#7c3aed]',
                                'text-[15px] font-extrabold tracking-wide text-white',
                                'shadow-[0_12px_28px_-8px_rgba(217,70,239,0.55)]',
                                'transition-all duration-300 ease-out',
                                'hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-8px_rgba(217,70,239,0.65)]',
                                'active:translate-y-0 active:scale-[0.99]',
                                'disabled:pointer-events-none disabled:opacity-60',
                            )}
                        >
                            <span className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/5 via-white/10 to-white/25" />
                            <span className="relative flex items-center gap-2">
                                {processing ? (
                                    <Spinner className="text-white" />
                                ) : (
                                    <>
                                        Entrar al panel
                                        <ArrowRight className="size-[18px] transition-transform group-hover:translate-x-0.5" />
                                    </>
                                )}
                            </span>
                        </button>
                    </>
                )}
            </Form>
        </>
    );
}

Login.layout = {
    title: 'Panel interno',
    description: 'Acceso exclusivo para el equipo de trabajo',
};
