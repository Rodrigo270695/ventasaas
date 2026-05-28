import { usePasskeyRegister } from '@laravel/passkeys/react';
import { KeyRound } from 'lucide-react';
import { useState } from 'react';
import { chokoInputClass, chokoLabelClass } from '@/components/form/field-styles';
import {
    settingsOutlineButtonClass,
    settingsPrimaryButtonClass,
} from '@/components/settings/settings-button-styles';
import InputError from '@/components/input-error';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

type Props = {
    onSuccess: () => void;
};

export default function PasskeyRegistration({ onSuccess }: Props) {
    const [name, setName] = useState(() => {
        const ua = navigator.userAgent;

        const browser = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera'].find(
            (browser) => new RegExp(browser).test(ua),
        );

        const os = ['iPhone', 'iPad', 'Android', 'Mac', 'Windows'].find((os) =>
            new RegExp(os).test(ua),
        );

        return [browser, os].filter(Boolean).join(' en ') || '';
    });

    const [showForm, setShowForm] = useState(false);
    const { register, isLoading, error, isSupported } = usePasskeyRegister({
        onSuccess: () => {
            setName('');
            setShowForm(false);
            onSuccess();
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            return;
        }

        await register(name);
    };

    const handleCancel = () => {
        setShowForm(false);
        setName('');
    };

    if (!isSupported) {
        return (
            <p className="text-sm text-[#7c6f8a]">
                Tu navegador no admite llaves de acceso.
            </p>
        );
    }

    if (!showForm) {
        return (
            <button
                type="button"
                onClick={() => setShowForm(true)}
                className={settingsOutlineButtonClass}
            >
                <KeyRound className="size-4" />
                Agregar llave de acceso
            </button>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl border border-violet-100 bg-[#faf5ff]/70 p-5"
        >
            <div className="space-y-2">
                <label
                    htmlFor="passkey-name"
                    className={cn('text-sm', chokoLabelClass)}
                >
                    Nombre de la llave
                </label>
                <input
                    id="passkey-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. MacBook Pro, iPhone"
                    className={chokoInputClass}
                    autoFocus
                />
                <p className="text-xs text-[#9d8fb0]">
                    Un nombre te ayuda a identificarla después.
                </p>
            </div>

            {error ? <InputError message={error} /> : null}

            <div className="flex flex-wrap gap-2">
                <button
                    type="submit"
                    disabled={isLoading || !name.trim()}
                    className={settingsPrimaryButtonClass}
                >
                    <span className="relative flex items-center gap-2">
                        {isLoading ? (
                            <Spinner className="text-white" />
                        ) : (
                            <KeyRound className="size-4" />
                        )}
                        {isLoading ? 'Registrando…' : 'Registrar llave'}
                    </span>
                </button>
                <button
                    type="button"
                    onClick={handleCancel}
                    className={settingsOutlineButtonClass}
                >
                    Cancelar
                </button>
            </div>
        </form>
    );
}
