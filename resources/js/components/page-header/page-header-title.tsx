import { cn } from '@/lib/utils';

type Props = {
    title: string;
    description?: string;
    className?: string;
};

export function PageHeaderTitle({ title, description, className }: Props) {
    return (
        <div className={cn('min-w-0 space-y-1', className)}>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#2d2438]">
                {title}
            </h1>
            <div className="h-0.5 w-12 rounded-full bg-linear-to-r from-[#ec4899] to-[#7c3aed]" />
            {description && (
                <p className="max-w-2xl pt-1 text-sm text-[#7c6f8a]">
                    {description}
                </p>
            )}
        </div>
    );
}
