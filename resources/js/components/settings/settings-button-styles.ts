import { cn } from '@/lib/utils';

export const settingsPrimaryButtonClass = cn(
    'choko-btn-shimmer group relative inline-flex h-10 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl px-5',
    'bg-linear-to-r from-[#ec4899] via-[#d946ef] to-[#7c3aed]',
    'text-sm font-bold text-white',
    'shadow-[0_10px_24px_-12px_rgba(124,58,237,0.75)]',
    'transition-all duration-300 hover:opacity-95',
    'disabled:pointer-events-none disabled:opacity-60',
);

export const settingsOutlineButtonClass = cn(
    'inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-4',
    'text-sm font-semibold text-[#6d28d9] transition hover:border-violet-300 hover:bg-violet-50',
    'disabled:pointer-events-none disabled:opacity-60',
);

export const settingsDangerButtonClass = cn(
    'inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4',
    'text-sm font-bold text-red-700 transition hover:border-red-300 hover:bg-red-100',
    'disabled:pointer-events-none disabled:opacity-60',
);

export const settingsSectionTitleClass = 'text-lg font-black text-[#4c1d95]';

export const settingsSectionDescriptionClass = 'mt-1 text-sm text-[#7c6f8a]';

export const settingsMutedTextClass = 'text-sm leading-relaxed text-[#7c6f8a]';

export const settingsInnerPanelClass = cn(
    'overflow-hidden rounded-2xl border border-violet-100 bg-[#faf5ff]/60',
);
