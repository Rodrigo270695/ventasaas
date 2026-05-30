export function WelcomeBackgroundDecor() {
    return (
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute inset-0 bg-[#fffbf5]" />
            <div className="absolute -top-32 right-0 h-64 w-64 rounded-full bg-[#fed7aa]/50 blur-3xl" />
            <div className="absolute top-1/3 -left-24 h-72 w-72 rounded-full bg-[#bae6fd]/45 blur-3xl" />
            <div className="absolute bottom-1/4 right-0 h-56 w-56 rounded-full bg-[#bbf7d0]/35 blur-3xl" />
        </div>
    );
}
