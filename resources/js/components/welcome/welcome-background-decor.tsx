export function WelcomeBackgroundDecor() {
    return (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-[#fff5f8]" />
            <div className="absolute -top-24 left-1/2 h-80 w-[50rem] -translate-x-1/2 rounded-full bg-[#fbcfe8]/45 blur-3xl" />
            <div className="absolute top-[28rem] -left-20 h-72 w-72 rounded-full bg-[#fde68a]/35 blur-3xl" />
            <div className="absolute top-[52rem] right-0 h-80 w-80 rounded-full bg-[#c4b5fd]/30 blur-3xl" />
            <div className="absolute right-[10%] bottom-0 h-64 w-64 rounded-full bg-[#fda4af]/25 blur-3xl" />
        </div>
    );
}
