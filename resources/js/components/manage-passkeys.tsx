import { router } from '@inertiajs/react';
import { KeyRound } from 'lucide-react';
import { destroy } from '@/actions/Laravel/Passkeys/Http/Controllers/PasskeyRegistrationController';
import {
    settingsInnerPanelClass,
    settingsSectionDescriptionClass,
    settingsSectionTitleClass,
} from '@/components/settings/settings-button-styles';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';
import PasskeyItem from '@/components/passkey-item';
import PasskeyRegistration from '@/components/passkey-register';
import type { Passkey } from '@/types/auth';

export type Props = {
    canManagePasskeys?: boolean;
    passkeys?: Passkey[];
};

function EmptyState() {
    return (
        <div className="px-6 py-10 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-linear-to-br from-[#fce7f3] to-[#f3e8ff] text-[#7c3aed] ring-2 ring-violet-100">
                <KeyRound className="size-7" />
            </div>
            <p className="font-bold text-[#4c1d95]">
                Aún no tienes llaves de acceso
            </p>
            <p className="mt-1 text-sm text-[#7c6f8a]">
                Agrega una para iniciar sesión sin contraseña.
            </p>
        </div>
    );
}

export default function ManagePasskeys(props: Props) {
    const passkeys = props.passkeys ?? [];

    const handleDelete = (id: number, onError: () => void) => {
        router.delete(destroy.url(id), {
            preserveScroll: true,
            onError,
        });
    };

    const handleRegisterSuccess = () => {
        router.reload();
    };

    if (!(props.canManagePasskeys ?? false)) {
        return null;
    }

    return (
        <SettingsSectionCard>
            <header className="mb-5">
                <h2 className={settingsSectionTitleClass}>Llaves de acceso</h2>
                <p className={settingsSectionDescriptionClass}>
                    Inicia sesión con huella, rostro o PIN del dispositivo.
                </p>
            </header>

            <div className={settingsInnerPanelClass}>
                {passkeys.length > 0 ? (
                    passkeys.map((passkey) => (
                        <PasskeyItem
                            key={passkey.id}
                            passkey={passkey}
                            onDelete={handleDelete}
                        />
                    ))
                ) : (
                    <EmptyState />
                )}
            </div>

            <div className="mt-5">
                <PasskeyRegistration onSuccess={handleRegisterSuccess} />
            </div>
        </SettingsSectionCard>
    );
}
