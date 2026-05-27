import { Badge } from '@/components/ui/badge';
import { isSunatHabido } from '@/lib/party-sunat';
import { cn } from '@/lib/utils';

type Props = {
    sunatEstado?: string | null;
    sunatCondicion?: string | null;
    className?: string;
};

export function PartySunatBadges({
    sunatEstado,
    sunatCondicion,
    className,
}: Props) {
    const habido = isSunatHabido(sunatCondicion);
    const estado = sunatEstado?.trim();
    const condicion = sunatCondicion?.trim();

    if (!estado && habido === null && !condicion) {
        return null;
    }

    return (
        <div className={cn('flex flex-wrap gap-2', className)}>
            {estado ? (
                <Badge
                    variant="outline"
                    className="rounded-full border-violet-200 bg-violet-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-800"
                >
                    Estado: {estado}
                </Badge>
            ) : null}
            {habido !== null ? (
                <Badge
                    className={cn(
                        'rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                        habido
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border-amber-200 bg-amber-50 text-amber-900',
                    )}
                >
                    {habido ? 'Habido' : 'No habido'}
                </Badge>
            ) : condicion ? (
                <Badge
                    variant="outline"
                    className="rounded-full border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700"
                >
                    {condicion}
                </Badge>
            ) : null}
        </div>
    );
}
