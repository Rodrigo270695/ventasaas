const bubbles = [
    { size: 28, top: '5%', left: '4%', color: '#ec4899' },
    { size: 20, top: '16%', left: '12%', color: '#22d3ee' },
    { size: 32, top: '3%', right: '6%', color: '#facc15' },
    { size: 18, top: '28%', right: '3%', color: '#a855f7' },
    { size: 24, bottom: '12%', left: '5%', color: '#f97316' },
    { size: 22, bottom: '20%', right: '8%', color: '#e879f9' },
    { size: 16, bottom: '6%', left: '35%', color: '#4ade80' },
    { size: 14, top: '40%', left: '2%', color: '#fb7185' },
    { size: 12, top: '55%', right: '18%', color: '#38bdf8' },
    { size: 26, bottom: '32%', left: '78%', color: '#fde047' },
];

const sparkles = [
    { top: '10%', left: '25%' },
    { top: '20%', right: '22%' },
    { top: '65%', left: '15%' },
    { bottom: '25%', right: '28%' },
    { top: '45%', left: '88%' },
    { bottom: '15%', left: '55%' },
];

export default function ChokoAuthBackground() {
    return (
        <div className="choko-bg-root pointer-events-none absolute inset-0 overflow-hidden">
            <div className="choko-bg-base absolute inset-0" />
            <div className="choko-bg-spectrum absolute inset-0" />

            <div className="choko-bg-mesh choko-bg-mesh--a absolute inset-0" />
            <div className="choko-bg-mesh choko-bg-mesh--b absolute inset-0" />
            <div className="choko-bg-mesh choko-bg-mesh--c absolute inset-0" />

            {/* Rayos de luz */}
            <div className="choko-bg-rays absolute inset-0" />

            {/* Auroras intensas */}
            <div className="choko-aurora choko-aurora--pink absolute -top-[25%] -left-[18%] size-[min(95vw,560px)] rounded-full" />
            <div className="choko-aurora choko-aurora--cyan absolute -top-[15%] -right-[22%] size-[min(88vw,520px)] rounded-full" />
            <div className="choko-aurora choko-aurora--gold absolute -bottom-[30%] -left-[12%] size-[min(90vw,540px)] rounded-full" />
            <div className="choko-aurora choko-aurora--violet absolute -right-[8%] -bottom-[18%] size-[min(75vw,460px)] rounded-full" />
            <div className="choko-aurora choko-aurora--lime absolute top-[40%] -left-[25%] size-[min(50vw,320px)] rounded-full" />

            {/* Formas tipo logo (swirls decorativos) */}
            <div className="choko-deco-swirl choko-deco-swirl--1 absolute -top-8 right-[8%] size-40 opacity-80 sm:size-52" />
            <div className="choko-deco-swirl choko-deco-swirl--2 absolute bottom-[12%] left-[6%] size-32 opacity-70 sm:size-44" />

            {/* Anillos con color */}
            <div className="choko-bg-ring choko-bg-ring--pink absolute top-[10%] left-[6%] size-36 sm:size-48" />
            <div className="choko-bg-ring choko-bg-ring--cyan absolute right-[8%] bottom-[18%] size-28 sm:size-40" />
            <div className="choko-bg-ring choko-bg-ring--gold absolute top-[55%] right-[5%] size-20 sm:size-28" />

            {/* Burbujas / confites */}
            <div className="absolute inset-0">
                {bubbles.map((b, i) => (
                    <span
                        key={i}
                        className="choko-bubble absolute rounded-full"
                        style={{
                            width: b.size,
                            height: b.size,
                            top: b.top,
                            left: b.left,
                            right: b.right,
                            bottom: b.bottom,
                            animationDelay: `${i * 0.55}s`,
                            ['--bubble-color' as string]: b.color,
                        }}
                    />
                ))}
            </div>

            {/* Destellos */}
            {sparkles.map((s, i) => (
                <span
                    key={i}
                    className="choko-sparkle absolute size-2"
                    style={{
                        top: s.top,
                        left: s.left,
                        right: s.right,
                        bottom: s.bottom,
                        animationDelay: `${i * 0.4}s`,
                    }}
                />
            ))}

            <div className="choko-bg-vignette absolute inset-0" />
            <div className="choko-bg-spotlight absolute inset-0" />
        </div>
    );
}
