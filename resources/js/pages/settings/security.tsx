import { Form, Head } from '@inertiajs/react';
import { useRef } from 'react';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import { chokoInputClass, chokoLabelClass } from '@/components/form/field-styles';
import { settingsPrimaryButtonClass, settingsSectionDescriptionClass, settingsSectionTitleClass } from '@/components/settings/settings-button-styles';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';
import InputError from '@/components/input-error';
import type { Props as ManagePasskeysProps } from '@/components/manage-passkeys';
import ManagePasskeys from '@/components/manage-passkeys';
import type { Props as ManageTwoFactorProps } from '@/components/manage-two-factor';
import ManageTwoFactor from '@/components/manage-two-factor';
import PasswordInput from '@/components/password-input';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { edit } from '@/routes/security';

type Props = {
    passwordRules: string;
} & ManagePasskeysProps &
    ManageTwoFactorProps;

export default function Security(props: Props) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    return (
        <>
            <Head title="Configuración de seguridad" />

            <h1 className="sr-only">Configuración de seguridad</h1>

            <div className="space-y-6">
                <SettingsSectionCard>
                    <header className="mb-6">
                        <h2 className={settingsSectionTitleClass}>
                            Actualizar contraseña
                        </h2>
                        <p className={settingsSectionDescriptionClass}>
                            Usa una contraseña larga y segura para proteger tu
                            cuenta.
                        </p>
                    </header>

                <Form
                    {...SecurityController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    resetOnError={[
                        'password',
                        'password_confirmation',
                        'current_password',
                    ]}
                    resetOnSuccess
                    onError={(errors) => {
                        if (errors.password) {
                            passwordInput.current?.focus();
                        }

                        if (errors.current_password) {
                            currentPasswordInput.current?.focus();
                        }
                    }}
                    className="space-y-5"
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="space-y-2">
                                <label
                                    htmlFor="current_password"
                                    className={cn('text-sm', chokoLabelClass)}
                                >
                                    Contraseña actual
                                </label>

                                <PasswordInput
                                    id="current_password"
                                    ref={currentPasswordInput}
                                    name="current_password"
                                    className={chokoInputClass}
                                    autoComplete="current-password"
                                    placeholder="Contraseña actual"
                                />

                                <InputError message={errors.current_password} />
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="password"
                                    className={cn('text-sm', chokoLabelClass)}
                                >
                                    Nueva contraseña
                                </label>

                                <PasswordInput
                                    id="password"
                                    ref={passwordInput}
                                    name="password"
                                    className={chokoInputClass}
                                    autoComplete="new-password"
                                    placeholder="Nueva contraseña"
                                    passwordrules={props.passwordRules}
                                />

                                <InputError message={errors.password} />
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="password_confirmation"
                                    className={cn('text-sm', chokoLabelClass)}
                                >
                                    Confirmar contraseña
                                </label>

                                <PasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    className={chokoInputClass}
                                    autoComplete="new-password"
                                    placeholder="Confirmar contraseña"
                                    passwordrules={props.passwordRules}
                                />

                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    data-test="update-password-button"
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

                <ManageTwoFactor
                    canManageTwoFactor={props.canManageTwoFactor}
                    requiresConfirmation={props.requiresConfirmation}
                    twoFactorEnabled={props.twoFactorEnabled}
                />

                <ManagePasskeys
                    canManagePasskeys={props.canManagePasskeys}
                    passkeys={props.passkeys}
                />
            </div>
        </>
    );
}

Security.layout = {
    breadcrumbs: [
        {
            title: 'Configuración de seguridad',
            href: edit(),
        },
    ],
};
