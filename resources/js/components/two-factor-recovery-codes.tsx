import { Form } from '@inertiajs/react';
import { Eye, EyeOff, LockKeyhole, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import AlertError from '@/components/alert-error';
import {
    settingsInnerPanelClass,
    settingsOutlineButtonClass,
    settingsPrimaryButtonClass,
} from '@/components/settings/settings-button-styles';
import { Spinner } from '@/components/ui/spinner';
import { regenerateRecoveryCodes } from '@/routes/two-factor';

type Props = {
    recoveryCodesList: string[];
    fetchRecoveryCodes: () => Promise<void>;
    errors: string[];
};

export default function TwoFactorRecoveryCodes({
    recoveryCodesList,
    fetchRecoveryCodes,
    errors,
}: Props) {
    const [codesAreVisible, setCodesAreVisible] = useState<boolean>(false);
    const codesSectionRef = useRef<HTMLDivElement | null>(null);
    const canRegenerateCodes = recoveryCodesList.length > 0 && codesAreVisible;

    const toggleCodesVisibility = useCallback(async () => {
        if (!codesAreVisible && !recoveryCodesList.length) {
            await fetchRecoveryCodes();
        }

        setCodesAreVisible(!codesAreVisible);

        if (!codesAreVisible) {
            setTimeout(() => {
                codesSectionRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                });
            });
        }
    }, [codesAreVisible, recoveryCodesList.length, fetchRecoveryCodes]);

    useEffect(() => {
        if (!recoveryCodesList.length) {
            fetchRecoveryCodes();
        }
    }, [recoveryCodesList.length, fetchRecoveryCodes]);

    const RecoveryCodeIconComponent = codesAreVisible ? EyeOff : Eye;

    return (
        <div className={settingsInnerPanelClass}>
            <div className="border-b border-violet-100 px-5 py-4">
                <div className="flex items-center gap-2.5">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-violet-100 text-[#7c3aed]">
                        <LockKeyhole className="size-4" aria-hidden="true" />
                    </span>
                    <div>
                        <h3 className="font-bold text-[#4c1d95]">
                            Códigos de recuperación
                        </h3>
                        <p className="text-sm text-[#7c6f8a]">
                            Guárdalos en un lugar seguro por si pierdes tu
                            dispositivo.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-4 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                        type="button"
                        onClick={toggleCodesVisibility}
                        className={settingsOutlineButtonClass}
                        aria-expanded={codesAreVisible}
                        aria-controls="recovery-codes-section"
                    >
                        <RecoveryCodeIconComponent
                            className="size-4"
                            aria-hidden="true"
                        />
                        {codesAreVisible
                            ? 'Ocultar códigos'
                            : 'Ver códigos de recuperación'}
                    </button>

                    {canRegenerateCodes && (
                        <Form
                            {...regenerateRecoveryCodes.form()}
                            options={{ preserveScroll: true }}
                            onSuccess={fetchRecoveryCodes}
                        >
                            {({ processing }) => (
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className={settingsPrimaryButtonClass}
                                    aria-describedby="regenerate-warning"
                                >
                                    <span className="relative flex items-center gap-2">
                                        {processing ? (
                                            <Spinner className="text-white" />
                                        ) : (
                                            <RefreshCw className="size-4" />
                                        )}
                                        Regenerar códigos
                                    </span>
                                </button>
                            )}
                        </Form>
                    )}
                </div>

                <div
                    id="recovery-codes-section"
                    className={`relative overflow-hidden transition-all duration-300 ${codesAreVisible ? 'h-auto opacity-100' : 'h-0 opacity-0'}`}
                    aria-hidden={!codesAreVisible}
                >
                    <div className="space-y-3">
                        {errors?.length ? (
                            <AlertError errors={errors} />
                        ) : (
                            <>
                                <div
                                    ref={codesSectionRef}
                                    className="grid gap-1 rounded-xl border border-violet-100 bg-white p-4 font-mono text-sm text-[#4c1d95]"
                                    role="list"
                                    aria-label="Códigos de recuperación"
                                >
                                    {recoveryCodesList.length ? (
                                        recoveryCodesList.map((code, index) => (
                                            <div
                                                key={index}
                                                role="listitem"
                                                className="select-text"
                                            >
                                                {code}
                                            </div>
                                        ))
                                    ) : (
                                        <div
                                            className="space-y-2"
                                            aria-label="Cargando códigos de recuperación"
                                        >
                                            {Array.from(
                                                { length: 8 },
                                                (_, index) => (
                                                    <div
                                                        key={index}
                                                        className="h-4 animate-pulse rounded bg-violet-100"
                                                        aria-hidden="true"
                                                    />
                                                ),
                                            )}
                                        </div>
                                    )}
                                </div>

                                <p
                                    id="regenerate-warning"
                                    className="text-xs leading-relaxed text-[#9d8fb0]"
                                >
                                    Cada código solo se puede usar una vez. Si
                                    necesitas más, pulsa{' '}
                                    <span className="font-bold text-[#7c3aed]">
                                        Regenerar códigos
                                    </span>
                                    .
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
