import React, { useState, useEffect } from 'react';

const WeRizzIntro = ({ onComplete }) => {
    const [isFadingOut, setIsFadingOut] = useState(false);

    useEffect(() => {
        // Start smooth fade-out at 2.4s so it completes by 3.0s
        const fadeTimer = setTimeout(() => {
            setIsFadingOut(true);
        }, 2400);

        // Completely unmount at 3.0s
        const finishTimer = setTimeout(() => {
            if (onComplete) onComplete();
        }, 3000);

        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(finishTimer);
        };
    }, []);

    const handleSkip = () => {
        setIsFadingOut(true);
        setTimeout(() => {
            if (onComplete) onComplete();
        }, 200);
    };

    return (
        <div 
            className={`fixed inset-0 z-[99999] bg-[#000000] flex flex-col items-center justify-center select-none overflow-hidden transition-opacity duration-500 ${
                isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
            }`}
        >
            {/* Atmospheric ambient deep radial glow behind the text */}
            <div 
                className="absolute w-[600px] sm:w-[850px] h-[350px] sm:h-[450px] rounded-full pointer-events-none blur-[90px] opacity-80"
                style={{
                    background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.40) 0%, rgba(37, 99, 235, 0.28) 45%, rgba(0, 0, 0, 0) 75%)'
                }}
            />

            {/* Subtle ribbed glass fine scanline texture */}
            <div className="absolute inset-0 pointer-events-none opacity-40 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.015)_2px,rgba(255,255,255,0.015)_4px)]" />

            {/* Central WeRizz Glowing Presentation */}
            <div className="relative z-10 flex flex-col items-center text-center px-6">
                {/* Glowing "WeRizz" Wordmark with High Contrast & Color */}
                <h1 
                    className="font-serif text-7xl sm:text-8xl md:text-9xl lg:text-[130px] font-extrabold tracking-[-0.03em] select-none leading-none text-white text-center"
                    style={{
                        fontFamily: '"The Seasons", "Instrument Serif", Georgia, serif',
                        textShadow: '0 0 25px rgba(255, 255, 255, 0.95), 0 0 50px rgba(255, 107, 91, 0.9), 0 0 90px rgba(255, 107, 91, 0.6)',
                        color: '#FFFFFF'
                    }}
                >
                    We<span style={{ color: '#FF6B5B' }}>Rizz</span>
                </h1>

                {/* Subtle Glowing Subline */}
                <div className="mt-6 flex items-center gap-3">
                    <span className="w-8 sm:w-14 h-px bg-gradient-to-r from-transparent to-[#FF6B5B]/80" />
                    <span className="font-mono text-xs sm:text-sm tracking-[0.32em] uppercase text-white/85 font-medium">
                        Memory Care Companion
                    </span>
                    <span className="w-8 sm:w-14 h-px bg-gradient-to-l from-transparent to-[#FF6B5B]/80" />
                </div>

                {/* 3-Second Glowing Progress Indicator Line */}
                <div className="mt-8 w-48 sm:w-64 h-[3px] bg-white/15 rounded-full overflow-hidden relative">
                    <div 
                        className="h-full bg-gradient-to-r from-blue-400 via-white to-[#FF6B5B] shadow-[0_0_12px_rgba(255,107,91,0.95)] animate-progress-line"
                    />
                </div>
            </div>

            {/* Discrete Skip button in bottom-right */}
            <button
                onClick={handleSkip}
                className="absolute bottom-6 right-6 text-white/50 hover:text-white font-mono text-xs uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/15 hover:border-white/30 transition-all cursor-pointer z-20"
            >
                Skip ↗
            </button>

            <style>{`
                @keyframes progressAnim {
                    0% { width: 0%; }
                    100% { width: 100%; }
                }
                .animate-progress-line {
                    animation: progressAnim 2.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default WeRizzIntro;
