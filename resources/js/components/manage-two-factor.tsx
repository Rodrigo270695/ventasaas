import { Form } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
    settingsDangerButtonClass,
    settingsMutedTextClass,
    settingsPrimaryButtonClass,
    settingsSectionDescriptionClass,
    settingsSectionTitleClass,
} from '@/components/settings/settings-button-styles';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';
import TwoFactorRecoveryCodes from '@/components/two-factor-recovery-codes';
import TwoFactorSetupModal from '@/components/two-factor-setup-modal';
import { Spinner } from '@/components/ui/spinner';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import { disable, enable } from '@/routes/two-factor';

export type Props = {
    canManageTwoFactor?: boolean;
    requiresConfirmation?: boolean;
    twoFactorEnabled?: boolean;
};

export default function ManageTwoFactor(props: Props) {
    const requiresConfirmation = props.requiresConfirmation ?? false;
    const twoFactorEnabled = props.twoFactorEnabled ?? false;

    const {
        qrCodeSvg,
        hasSetupData,
        manualSetupKey,
        clearSetupData,
        clearTwoFactorAuthData,
        fetchSetupData,
        recoveryCodesList,
        fetchRecoveryCodes,
        errors,
    } = useTwoFactorAuth();
    const [showSetupModal, setShowSetupModal] = useState<boolean>(false);
    const prevTwoFactorEnabled = useRef(twoFactorEnabled);

    useEffect(() => {
        if (prevTwoFactorEnabled.current && !twoFactorEnabled) {
            clearTwoFactorAuthData();
        }

        prevTwoFactorEnabled.current = twoFactorEnabled;
    }, [twoFactorEnabled, clearTwoFactorAuthData]);

    if (!(props.canManageTwoFactor ?? false)) {
        return null;
    }

    return (
        <SettingsSectionCard>
            <header className="mb-5">
                <h2 className={settingsSectionTitleClass}>
                    Autenticación en dos pasos
                </h2>
                <p className={settingsSectionDescriptionClass}>
                    Protege tu cuenta con un código adicional al iniciar sesión.
                </p>
            </header>

            {twoFactorEnabled ? (
                <div className="space-y-5">
                    <p className={settingsMutedTextClass}>
                        Al iniciar sesión se te pedirá un código de tu app
                        autenticadora (TOTP), como Google Authenticator o
                        similar.
                    </p>

                    <Form {...disable.form()}>
                        {({ processing }) => (
                            <button
                                type="submit"
                                disabled={processing}
                                className={settingsDangerButtonClass}
                            >
                                {processing && <Spinner />}
                                Desactivar 2FA
                            </button>
                        )}
                    </Form>

                    <TwoFactorRecoveryCodes
                        recoveryCodesList={recoveryCodesList}
                        fetchRecoveryCodes={fetchRecoveryCodes}
                        errors={errors}
                    />
                </div>
            ) : (
                <div className="space-y-5">
                    <p className={settingsMutedTextClass}>
                        Al activar la autenticación en dos pasos, necesitarás un
                        código de tu app autenticadora cada vez que inicies
                        sesión.
                    </p>

                    {hasSetupData ? (
                        <button
                            type="button"
                            onClick={() => setShowSetupModal(true)}
                            className={settingsPrimaryButtonClass}
                        >
                            <span className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/5 via-white/10 to-white/25" />
                            <span className="relative flex items-center gap-2">
                                <ShieldCheck className="size-4" />
                                Continuar configuración
                            </span>
                        </button>
                    ) : (
                        <Form
                            {...enable.form()}
                            onSuccess={() => setShowSetupModal(true)}
                        >
                            {({ processing }) => (
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className={settingsPrimaryButtonClass}
                                >
                                    <span className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/5 via-white/10 to-white/25" />
                                    <span className="relative flex items-center gap-2">
                                        {processing ? (
                                            <Spinner className="text-white" />
                                        ) : (
                                            <ShieldCheck className="size-4" />
                                        )}
                                        Activar 2FA
                                    </span>
                                </button>
                            )}
                        </Form>
                    )}
                </div>
            )}

            <TwoFactorSetupModal
                isOpen={showSetupModal}
                onClose={() => setShowSetupModal(false)}
                requiresConfirmation={requiresConfirmation}
                twoFactorEnabled={twoFactorEnabled}
                qrCodeSvg={qrCodeSvg}
                manualSetupKey={manualSetupKey}
                clearSetupData={clearSetupData}
                fetchSetupData={fetchSetupData}
                errors={errors}
            />
        </SettingsSectionCard>
    );
}
