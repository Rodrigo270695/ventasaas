import { createContext, useContext } from 'react';

/**
 * Contenedor dentro de AppModal para portales de FormComboboxField.
 * Evita que Radix Dialog bloquee clics en listas renderizadas fuera del Content.
 */
export const ComboboxPortalTargetContext = createContext<HTMLElement | null>(
    null,
);

export function useComboboxPortalTarget(): HTMLElement | null {
    return useContext(ComboboxPortalTargetContext);
}
