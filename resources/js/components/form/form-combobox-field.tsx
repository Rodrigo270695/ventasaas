import { Check, ChevronsUpDown, X } from 'lucide-react';
import {
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';
import { FormField } from '@/components/form/form-field';
import { useComboboxPortalTarget } from '@/components/modal/combobox-portal-context';
import {
    chokoComboboxDropdownClass,
    chokoComboboxItemClass,
    chokoInputClass,
} from '@/components/form/field-styles';
import type { FormSelectOption } from '@/components/form/form-select-field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type FormComboboxOption = FormSelectOption & {
    /** Texto extra para filtrar (SKU, código, etc.). */
    searchText?: string;
    sublabel?: string;
};

type MenuPosition = {
    top: number;
    left: number;
    width: number;
};

type Props = {
    id: string;
    name: string;
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    options: readonly FormComboboxOption[];
    placeholder?: string;
    emptyMessage?: string;
    required?: boolean;
    error?: string;
    disabled?: boolean;
    fieldClassName?: string;
    /** Valores que no rellenan el input (solo placeholder); útil para "Todos". */
    blankValues?: readonly string[];
    /**
     * `portal`: lista flotante en body (tablas, overflow hidden).
     * `inline`: debajo del input (por defecto).
     */
    menuPlacement?: 'inline' | 'portal';
    /** Ancho mínimo de la lista al usar portal. */
    menuMinWidth?: number;
    /** Muestra una «×» dentro del campo para limpiar la selección (por defecto: sí). */
    clearable?: boolean;
    /** Coincidencia exacta al pulsar Enter (p. ej. código de barras escaneado). */
    resolveOptionOnEnter?: (query: string) => FormComboboxOption | null;
    /** Acción cuando no hay resultados (p. ej. registrar cliente). */
    emptyAction?: {
        label: string;
        onClick: () => void;
    };
};

const PORTAL_MIN_WIDTH = 300;

export function FormComboboxField({
    id,
    name,
    label,
    value,
    onValueChange,
    options,
    placeholder = 'Buscar…',
    emptyMessage = 'Sin resultados.',
    required,
    error,
    disabled,
    fieldClassName,
    blankValues = [],
    menuPlacement = 'inline',
    menuMinWidth = PORTAL_MIN_WIDTH,
    clearable = true,
    resolveOptionOnEnter,
    emptyAction,
}: Props) {
    const safeValue = value ?? '';

    const listId = useId();
    const rootRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLUListElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const openOnFocusRef = useRef(false);

    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);

    const usePortal = menuPlacement === 'portal';
    const modalPortalTarget = useComboboxPortalTarget();
    const portalContainer =
        usePortal && modalPortalTarget ? modalPortalTarget : document.body;

    const selected = useMemo(
        () => options.find((option) => option.value === safeValue) ?? null,
        [options, safeValue],
    );

    const isBlankValue = useCallback(
        (optionValue: string) => blankValues.includes(optionValue),
        [blankValues],
    );

    const isBlankSelection = isBlankValue(safeValue);

    const showClearButton =
        clearable &&
        !disabled &&
        ((!isBlankSelection && safeValue !== '') ||
            (open && query.trim() !== ''));

    const inputDisplayWhenClosed = isBlankSelection
        ? ''
        : (selected?.label ?? '');

    const filtered = useMemo(() => {
        const normalized = query.trim().toLowerCase();

        if (!normalized) {
            return [...options];
        }

        return options.filter((option) => {
            const haystack = (option.searchText ?? option.label).toLowerCase();

            return haystack.includes(normalized);
        });
    }, [options, query]);

    const closeList = useCallback(() => {
        setOpen(false);
        setQuery(inputDisplayWhenClosed);
        setMenuPosition(null);
    }, [inputDisplayWhenClosed]);

    const openList = useCallback(() => {
        if (disabled) {
            return;
        }

        setQuery(isBlankSelection ? '' : (selected?.label ?? ''));
        setOpen(true);
    }, [disabled, isBlankSelection, selected]);

    const updateMenuPosition = useCallback(() => {
        const anchor = inputRef.current;

        if (!anchor) {
            return;
        }

        const rect = anchor.getBoundingClientRect();

        setMenuPosition({
            top: rect.bottom + 4,
            left: rect.left,
            width: Math.max(rect.width, menuMinWidth),
        });
    }, [menuMinWidth]);

    useEffect(() => {
        if (!open) {
            setQuery(inputDisplayWhenClosed);
        }
    }, [inputDisplayWhenClosed, open]);

    useLayoutEffect(() => {
        if (!open || !usePortal) {
            return;
        }

        updateMenuPosition();

        const handleReposition = () => updateMenuPosition();

        window.addEventListener('resize', handleReposition);
        window.addEventListener('scroll', handleReposition, true);

        return () => {
            window.removeEventListener('resize', handleReposition);
            window.removeEventListener('scroll', handleReposition, true);
        };
    }, [open, usePortal, updateMenuPosition, query]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target as Node;

            if (
                rootRef.current?.contains(target) ||
                menuRef.current?.contains(target)
            ) {
                return;
            }

            closeList();
        };

        document.addEventListener('pointerdown', handlePointerDown);

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
        };
    }, [open, closeList]);

    const handleSelect = (option: FormComboboxOption) => {
        onValueChange(option.value);
        setQuery(isBlankValue(option.value) ? '' : option.label);
        setOpen(false);
        setMenuPosition(null);
        inputRef.current?.blur();
    };

    const handleClear = () => {
        onValueChange(blankValues[0] ?? '');
        setQuery('');
        setOpen(false);
        setMenuPosition(null);
        inputRef.current?.focus();
    };

    const markUserIntentToOpen = () => {
        openOnFocusRef.current = true;
    };

    const handleInputChange = (next: string) => {
        setQuery(next);
        setOpen(true);

        if (next === '') {
            onValueChange(blankValues[0] ?? '');

            return;
        }

        if (
            selected &&
            !isBlankValue(selected.value) &&
            next !== selected.label
        ) {
            onValueChange(blankValues[0] ?? '');
        }
    };

    const listbox = (
        <ul
            ref={menuRef}
            id={listId}
            role="listbox"
            data-combobox-listbox
            style={
                usePortal && menuPosition
                    ? {
                          position: 'fixed',
                          top: menuPosition.top,
                          left: menuPosition.left,
                          width: menuPosition.width,
                          zIndex: 200,
                      }
                    : undefined
            }
            className={cn(
                chokoComboboxDropdownClass,
                'pointer-events-auto max-h-60 overflow-auto p-1 shadow-lg shadow-violet-300/25',
                usePortal
                    ? 'rounded-xl border border-violet-200/90'
                    : 'absolute top-full right-0 left-0 z-[80] mt-1',
            )}
        >
            {filtered.length === 0 ? (
                <li className="px-2 py-2">
                    <p className="px-1 text-sm text-[#7c6f8a]">{emptyMessage}</p>
                    {emptyAction ? (
                        <button
                            type="button"
                            className="mt-2 w-full cursor-pointer rounded-lg border border-violet-200/90 bg-violet-50/80 px-3 py-2 text-left text-xs font-semibold text-[#5b21b6] hover:bg-violet-100"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                                emptyAction.onClick();
                                closeList();
                            }}
                        >
                            {emptyAction.label}
                        </button>
                    ) : null}
                </li>
            ) : (
                filtered.map((option) => {
                    const isSelected = option.value === safeValue;

                    return (
                        <li key={option.value} role="presentation">
                            <button
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                className={cn(
                                    chokoComboboxItemClass,
                                    'flex w-full items-start justify-between gap-2 text-left',
                                    isSelected && 'bg-violet-50',
                                )}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => handleSelect(option)}
                            >
                                <span className="min-w-0 flex-1">
                                    <span className="block leading-snug wrap-break-word whitespace-normal">
                                        {option.label}
                                    </span>
                                    {option.sublabel ? (
                                        <span className="mt-0.5 block font-mono text-[11px] text-[#7c6f8a]">
                                            SKU {option.sublabel}
                                        </span>
                                    ) : null}
                                </span>
                                {isSelected ? (
                                    <Check className="mt-0.5 size-4 shrink-0 text-[#7c3aed]" />
                                ) : null}
                            </button>
                        </li>
                    );
                })
            )}
        </ul>
    );

    return (
        <FormField
            id={id}
            label={label}
            required={required}
            error={error}
            className={fieldClassName}
        >
            <input type="hidden" name={name} value={safeValue} />

            <div ref={rootRef} className="relative">
                <Input
                    ref={inputRef}
                    id={id}
                    type="text"
                    role="combobox"
                    aria-expanded={open}
                    aria-controls={listId}
                    aria-autocomplete="list"
                    aria-invalid={!!error}
                    disabled={disabled}
                    value={open ? query : inputDisplayWhenClosed}
                    placeholder={placeholder}
                    autoComplete="off"
                    className={cn(
                        chokoInputClass,
                        showClearButton ? 'pr-18' : 'pr-10',
                        error && 'border-red-400',
                    )}
                    onPointerDown={markUserIntentToOpen}
                    onFocus={() => {
                        if (disabled || !openOnFocusRef.current) {
                            return;
                        }

                        openOnFocusRef.current = false;
                        openList();
                    }}
                    onClick={() => {
                        if (!disabled && !open) {
                            openList();
                        }
                    }}
                    onChange={(event) => handleInputChange(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                            event.preventDefault();
                            closeList();
                        }

                        if (
                            (event.key === 'ArrowDown' ||
                                event.key === 'ArrowUp') &&
                            !open
                        ) {
                            event.preventDefault();
                            openList();
                        }

                        if (event.key === 'Enter') {
                            const trimmed = query.trim();

                            if (trimmed && resolveOptionOnEnter) {
                                const resolved =
                                    resolveOptionOnEnter(trimmed);

                                if (resolved) {
                                    event.preventDefault();
                                    handleSelect(resolved);

                                    return;
                                }
                            }

                            if (open && filtered.length === 1) {
                                event.preventDefault();
                                handleSelect(filtered[0]);
                            }
                        }
                    }}
                />

                {showClearButton ? (
                    <button
                        type="button"
                        tabIndex={-1}
                        aria-label="Limpiar selección"
                        className={cn(
                            'absolute inset-y-0 right-10 flex w-8 items-center justify-center',
                            'rounded-md text-[#9d8fb0] transition-colors',
                            'hover:bg-violet-50 hover:text-[#7c3aed]',
                        )}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                            event.stopPropagation();
                            handleClear();
                        }}
                    >
                        <X className="size-3.5 shrink-0" strokeWidth={2.25} />
                    </button>
                ) : null}

                <button
                    type="button"
                    tabIndex={-1}
                    disabled={disabled}
                    aria-label="Mostrar opciones"
                    className={cn(
                        'absolute inset-y-0 right-0 flex w-10 items-center justify-center',
                        'rounded-r-xl text-violet-500 transition-colors',
                        'hover:text-[#7c3aed] disabled:pointer-events-none disabled:opacity-50',
                    )}
                    onMouseDown={(event) => {
                        event.preventDefault();
                        markUserIntentToOpen();
                    }}
                    onClick={() => {
                        if (open) {
                            closeList();
                            inputRef.current?.blur();
                        } else {
                            openList();
                            inputRef.current?.focus();
                        }
                    }}
                >
                    <ChevronsUpDown className="size-4 shrink-0 opacity-70" />
                </button>

                {open && !usePortal && listbox}
            </div>

            {open &&
                usePortal &&
                menuPosition &&
                typeof document !== 'undefined' &&
                createPortal(listbox, portalContainer)}
        </FormField>
    );
}
