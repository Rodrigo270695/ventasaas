import { Store } from 'lucide-react';

type Props = {
    hasProducts: boolean;
};

export function WelcomeCatalogEmptyState({ hasProducts }: Props) {
    return (
        <div className="mt-8 rounded-[1.75rem] border-[3px] border-dashed border-[#fbcfe8] bg-white/90 px-6 py-20 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[#fce7f3] text-[#f472b6]">
                <Store className="size-8" />
            </div>
            <p className="mt-5 text-xl font-black text-[#831843]">
                No hay productos para mostrar
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#be185d]/80">
                {hasProducts
                    ? 'Prueba otra categoría o limpia la búsqueda.'
                    : 'Activa productos con precio en el panel de administración.'}
            </p>
        </div>
    );
}
