import type { LucideIcon } from 'lucide-react';

type Props = {
    icon: LucideIcon;
    title: string;
    text: string;
};

export function WelcomeFeatureCard({ icon: Icon, title, text }: Props) {
    return (
        <article className="rounded-2xl border border-[#e5e7eb] bg-white p-5 sm:p-6">
            <div className="flex size-11 items-center justify-center rounded-xl bg-[#fff7ed] text-[#ea580c]">
                <Icon className="size-5" strokeWidth={2.25} />
            </div>
            <h3 className="mt-4 text-base font-bold text-[#1f2937]">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[#6b7280]">
                {text}
            </p>
        </article>
    );
}
