import { cn } from '@/lib/utils';

/** Estilos Choko compartidos para campos de formulario admin. */
export const chokoLabelClass = 'font-semibold text-[#5b21b6]';

/** Altura estándar de inputs, selects y buscador de tablas en toolbar. */
export const chokoControlHeightClass = 'h-10';

export const chokoInputClass = cn(
    chokoControlHeightClass,
    'w-full rounded-xl border-violet-200 bg-white shadow-xs',
    'focus-visible:border-[#ec4899] focus-visible:ring-[#ec4899]/20',
    'aria-invalid:border-red-400 aria-invalid:ring-red-200/50',
);

export const chokoSelectTriggerClass = cn(
    chokoControlHeightClass,
    '!w-full min-w-0 rounded-xl border-violet-200 bg-white px-3 text-sm text-[#3b2d4a] shadow-xs',
    'focus-visible:border-[#ec4899] focus-visible:ring-[#ec4899]/25',
    'data-[placeholder]:text-[#9d8fb0]',
    'disabled:cursor-not-allowed disabled:opacity-50',
    '[&_svg]:text-violet-500',
);

export const chokoSelectContentClass = cn(
    'rounded-xl border-violet-200/90 bg-white shadow-lg shadow-violet-200/30',
    'z-[100]',
);

export const chokoSelectItemClass = cn(
    'cursor-pointer rounded-lg py-2 pr-8 pl-2.5 text-sm text-[#3b2d4a]',
    'focus:bg-violet-50 focus:text-[#4c1d95]',
    'data-[state=checked]:bg-violet-50 data-[state=checked]:font-medium data-[state=checked]:text-[#6d28d9]',
);

/** Panel desplegable del combobox buscable (mismo look que Select). */
export const chokoComboboxDropdownClass = cn(
    chokoSelectContentClass,
    'z-[100] shadow-lg shadow-violet-200/30',
);

/** Ítem del listado del combobox. */
export const chokoComboboxItemClass = cn(
    'cursor-pointer rounded-lg py-2 pr-2 pl-2.5 text-sm text-[#3b2d4a]',
    'hover:bg-violet-50 hover:text-[#4c1d95]',
    'focus-visible:bg-violet-50 focus-visible:text-[#4c1d95] focus-visible:outline-none',
);

export const chokoSectionTitleClass =
    'text-xs font-bold tracking-wide text-[#7c3aed] uppercase';

export const chokoCheckboxRowClass = cn(
    'flex w-full min-w-0 items-center gap-2.5 rounded-xl border border-violet-100/90',
    'bg-violet-50/40 px-3 py-2.5',
);

export const chokoCheckboxClass = cn(
    'border-violet-300 data-[state=checked]:border-[#7c3aed]',
    'data-[state=checked]:bg-[#7c3aed]',
);
