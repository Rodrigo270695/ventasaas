type Props = {
    storeName: string;
};

export function WelcomeAnnouncementBar({ storeName }: Props) {
    return (
        <div className="bg-linear-to-r from-[#0369a1] via-[#0284c7] to-[#0ea5e9] px-4 py-2 text-center text-xs font-semibold text-white sm:text-sm">
            <span className="inline-flex items-center justify-center gap-1.5">
                <span aria-hidden>🔥</span>
                Compra fácil en {storeName} — pedidos por WhatsApp
            </span>
        </div>
    );
}
