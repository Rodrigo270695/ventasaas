import { Store } from 'lucide-react';

type Props = {
    hasProducts: boolean;
};

export function WelcomeCatalogEmptyState({ hasProducts }: Props) {
    return (
        <div className="rounded-2xl border border-dashed border-[#e5e7eb] bg-white px-6 py-16 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#fff7ed] text-[#f97316]">
                <Store className="size-7" />
            </div>
            <p className="mt-4 text-lg font-bold text-[#1f2937]">
                No hay productos para mostrar
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#6b7280]">
                {hasProducts
                    ? 'Prueba otra categoría o limpia la búsqueda.'
                    : 'Activa productos con precio en el panel de administración.'}
            </p>
        </div>
    );
}
