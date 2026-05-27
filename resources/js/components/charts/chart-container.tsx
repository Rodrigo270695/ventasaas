import { useEffect, useRef, useState, type ReactElement } from 'react';
import { ResponsiveContainer } from 'recharts';

type Props = {
    height: number;
    children: ReactElement;
    className?: string;
};

/**
 * Evita el warning de Recharts cuando el contenedor aún no tiene tamaño (p. ej. en grids flex).
 */
export function ChartContainer({ height, children, className = '' }: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const el = ref.current;
        if (!el) {
            return;
        }

        const update = () => {
            const { width, height: measuredHeight } = el.getBoundingClientRect();
            setSize({
                width: Math.floor(width),
                height: Math.floor(measuredHeight),
            });
        };

        update();
        const observer = new ResizeObserver(update);
        observer.observe(el);

        return () => observer.disconnect();
    }, []);

    const canRender = size.width > 0 && size.height > 0;

    return (
        <div
            ref={ref}
            className={`w-full min-w-0 ${className}`}
            style={{ height }}
        >
            {canRender ? (
                <ResponsiveContainer width={size.width} height={size.height} minWidth={0}>
                    {children}
                </ResponsiveContainer>
            ) : null}
        </div>
    );
}
