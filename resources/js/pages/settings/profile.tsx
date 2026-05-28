import { Form, Head, Link, usePage } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import { chokoInputClass, chokoLabelClass } from '@/components/form/field-styles';
import { settingsPrimaryButtonClass, settingsSectionDescriptionClass, settingsSectionTitleClass } from '@/components/settings/settings-button-styles';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';
import InputError from '@/components/input-error';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
};

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<PageProps>().props;

    return (
        <>
            <Head title="Configuración de perfil" />

            <h1 className="sr-only">Configuración de perfil</h1>

            <SettingsSectionCard>
                <header className="mb-6">
                    <h2 className={settingsSectionTitleClass}>Perfil</h2>
                    <p className={settingsSectionDescriptionClass}>
                        Actualiza tu nombre y correo electrónico.
                    </p>
                </header>

                <Form
                    {...ProfileController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-5"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="space-y-2">
                                <label
                                    htmlFor="name"
                                    className={cn('text-sm', chokoLabelClass)}
                                >
                                    Nombre
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    required
                                    autoComplete="name"
                                    defaultValue={auth.user.name}
                                    placeholder="Nombre completo"
                                    className={chokoInputClass}
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="email"
                                    className={cn('text-sm', chokoLabelClass)}
                                >
                                    Correo electrónico
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    autoComplete="username"
                                    defaultValue={auth.user.email}
                                    placeholder="Correo electrónico"
                                    className={chokoInputClass}
                                />
                                <InputError message={errors.email} />
                            </div>

                            {mustVerifyEmail &&
                                auth.user.email_verified_at === null && (
                                    <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3">
                                        <p className="text-sm text-[#92400e]">
                                            Tu correo electrónico no está
                                            verificado.{' '}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="cursor-pointer font-semibold text-[#7c3aed] underline-offset-2 hover:underline"
                                            >
                                                Reenviar correo de verificación
                                            </Link>
                                        </p>

                                        {status === 'verification-link-sent' && (
                                            <p className="mt-2 text-sm font-semibold text-emerald-700">
                                                Se envió un nuevo enlace de
                                                verificación a tu correo.
                                            </p>
                                        )}
                                    </div>
                                )}

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    data-test="update-profile-button"
                                    className={settingsPrimaryButtonClass}
                                >
                                    {processing && <Spinner />}
                                    Guardar cambios
                                </button>
                            </div>
                        </>
                    )}
                </Form>
            </SettingsSectionCard>
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Configuración de perfil',
            href: edit(),
        },
    ],
};
