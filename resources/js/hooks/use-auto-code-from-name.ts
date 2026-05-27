import { useCallback, useState } from 'react';
import {
    sanitizeCatalogCode,
    suggestCodeFromName,
} from '@/lib/catalog-code';

type Options = {
    maxLength?: number;
    suggestLength?: number;
    suggestFromName?: (name: string, length: number) => string;
    sanitize?: (value: string, maxLength: number) => string;
};

/**
 * Código sugerido desde el nombre hasta que el usuario lo edite a mano.
 */
export function useAutoCodeFromName(
    initialCode = '',
    startAsManual = false,
    options: Options = {},
) {
    const {
        maxLength = 20,
        suggestLength = 3,
        suggestFromName = suggestCodeFromName,
        sanitize = sanitizeCatalogCode,
    } = options;
    const [code, setCodeState] = useState(initialCode);
    const [codeManual, setCodeManual] = useState(startAsManual);

    const resetCodeState = useCallback(
        (nextCode: string, manual = false) => {
            setCodeState(nextCode);
            setCodeManual(manual);
        },
        [],
    );

    const applyNameToCode = useCallback(
        (name: string) => {
            if (!codeManual) {
                setCodeState(suggestFromName(name, suggestLength));
            }
        },
        [codeManual, suggestFromName, suggestLength],
    );

    const setCodeFromInput = useCallback(
        (value: string) => {
            setCodeState(sanitize(value, maxLength));
            setCodeManual(true);
        },
        [maxLength, sanitize],
    );

    return {
        code,
        codeManual,
        resetCodeState,
        applyNameToCode,
        setCodeFromInput,
    };
}
