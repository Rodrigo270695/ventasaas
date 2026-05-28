import { Form, Head } from '@inertiajs/react';
import { ArrowRight, Lock } from 'lucide-react';
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

const submitButtonClass = cn(
    'choko-btn-shimmer group relative mt-7 flex h-[52px] w-full cursor-pointer items-center justify-center gap-2.5 overflow-hidden rounded-2xl',
    'bg-linear-to-r from-[#ec4899] via-[#d946ef] to-[#7c3aed]',
    'text-[15px] font-extrabold tracking-wide text-white',
    'shadow-[0_12px_28px_-8px_rgba(217,70,239,0.55)]',
    'transition-all duration-300 ease-out',
    'hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-8px_rgba(217,70,239,0.65)]',
    'active:translate-y-0 active:scale-[0.99]',
    'disabled:pointer-events-none disabled:opacity-60',
);

export default function Login({ status, canResetPassword }: Props) {
    return (
        <>
            <Head title="Iniciar sesión" />

            <div className="mb-6 hidden lg:block">
                <div className="flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-linear-to-br from-[#ec4899] to-[#7c3aed] text-white shadow-[0_12px_28px_-14px_rgba(124,58,237,0.75)]">
                        <Lock className="size-5" />
                    </span>
                    <div>
                        <h2 className="text-xl font-extrabold text-[#2e1065]">
                            Iniciar sesión
                        </h2>
                        <p className="text-sm text-[#7c6f8a]">
                            Ingresa tus credenciales para continuar
                        </p>
                    </div>
                </div>
            </div>

            {status && (
                <div className="mb-5 rounded-2xl border border-emerald-200/90 bg-linear-to-r from-emerald-50 to-teal-50 px-4 py-3 text-center text-sm font-semibold text-emerald-800">
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
                                            className="cursor-pointer text-[11px] font-semibold text-[#7c3aed] no-underline transition-colors hover:text-[#ec4899]"
                                            tabIndex={5}
                                        >
                                            ¿Olvidaste?
                                        </a>
                                    ) : undefined
                                }
                            />

                            <label className="flex cursor-pointer select-none items-center gap-3 rounded-2xl border border-violet-100/90 bg-[#faf5ff]/70 px-3.5 py-3 transition hover:border-violet-200 hover:bg-[#f5f3ff]">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    id="remember"
                                    tabIndex={3}
                                    className="size-[18px] cursor-pointer rounded-md border-2 border-violet-300 accent-[#7c3aed]"
                                />
                                <span className="text-[13px] font-semibold text-[#5b21b6]">
                                    Mantener sesión iniciada
                                </span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            tabIndex={4}
                            disabled={processing}
                            data-test="login-button"
                            className={submitButtonClass}
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

                        <p className="mt-5 text-center text-xs leading-relaxed text-[#9d8fb0]">
                            Acceso restringido al equipo autorizado de la tienda.
                        </p>
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
