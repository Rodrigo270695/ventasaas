import type { LucideIcon } from 'lucide-react';

type Props = {
    icon: LucideIcon;
    title: string;
    text: string;
};

export function WelcomeFeatureCard({ icon: Icon, title, text }: Props) {
    return (
        <article className="rounded-[1.75rem] border-[3px] border-[#fbcfe8] bg-white p-6 shadow-[0_16px_40px_-28px_rgba(236,72,153,0.35)]">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-[#fce7f3] to-[#fdf2f8] text-[#db2777] ring-2 ring-[#fbcfe8]">
                <Icon className="size-5" strokeWidth={2.25} />
            </div>
            <h3 className="mt-5 text-lg font-black text-[#831843]">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#be185d]/80">
                {text}
            </p>
        </article>
    );
}
