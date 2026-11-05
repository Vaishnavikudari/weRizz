import React, { useRef, useEffect } from 'react';

/**
 * GlowingBrainVideo Component
 * Displays the rotating glowing 16:9 brain with true alpha transparency,
 * balanced radiant light rays (moderate count & elegant spacing), and a blinking rhythmic black glow directly behind the brain
 * for dynamic contrast.
 */
const GlowingBrainVideo = ({ className = "" }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.play().catch(() => {});
        }
    }, []);

    return (
        <div className={`relative flex items-center justify-center select-none ${className}`}>
            
            {/* 1. BALANCED RADIANT LIGHT RAYS (10 Elegant, Evenly-Spaced Rays) */}
            <div 
                className="absolute w-[580px] sm:w-[740px] lg:w-[880px] aspect-square rounded-full pointer-events-none z-0 mix-blend-screen opacity-55 animate-spin-rays"
                style={{
                    background: `conic-gradient(
                        from 0deg at 50% 50%,
                        rgba(255, 255, 255, 0.44) 0deg,
                        rgba(219, 234, 254, 0.22) 7deg,
                        transparent 16deg,
                        transparent 28deg,
                        rgba(255, 255, 255, 0.40) 36deg,
                        rgba(191, 219, 254, 0.18) 43deg,
                        transparent 52deg,
                        transparent 64deg,
                        rgba(255, 255, 255, 0.42) 72deg,
                        rgba(219, 234, 254, 0.20) 79deg,
                        transparent 88deg,
                        transparent 100deg,
                        rgba(255, 255, 255, 0.44) 108deg,
                        rgba(191, 219, 254, 0.22) 115deg,
                        transparent 124deg,
                        transparent 136deg,
                        rgba(255, 255, 255, 0.40) 144deg,
                        rgba(219, 234, 254, 0.18) 151deg,
                        transparent 160deg,
                        transparent 172deg,
                        rgba(255, 255, 255, 0.44) 180deg,
                        rgba(191, 219, 254, 0.22) 187deg,
                        transparent 196deg,
                        transparent 208deg,
                        rgba(255, 255, 255, 0.40) 216deg,
                        rgba(219, 234, 254, 0.18) 223deg,
                        transparent 232deg,
                        transparent 244deg,
                        rgba(255, 255, 255, 0.42) 252deg,
                        rgba(191, 219, 254, 0.20) 259deg,
                        transparent 268deg,
                        transparent 280deg,
                        rgba(255, 255, 255, 0.44) 288deg,
                        rgba(219, 234, 254, 0.22) 295deg,
                        transparent 304deg,
                        transparent 316deg,
                        rgba(255, 255, 255, 0.40) 324deg,
                        rgba(191, 219, 254, 0.18) 331deg,
                        transparent 340deg,
                        transparent 352deg
                    )`,
                    maskImage: 'radial-gradient(circle at 50% 50%, black 14%, rgba(0,0,0,0.65) 44%, transparent 72%)',
                    WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 14%, rgba(0,0,0,0.65) 44%, transparent 72%)',
                    filter: 'blur(2.5px)'
                }}
            />

            {/* 2. SOFT AMBIENT CORAL & ROYAL BACKLIGHT AURA */}
            <div 
                className="absolute w-full max-w-xl h-56 sm:h-72 rounded-[100%] bg-[radial-gradient(ellipse_65%_65%_at_50%_50%,rgba(255,255,255,0.32)_0%,rgba(59,130,246,0.20)_35%,rgba(37,99,235,0.11)_62%,transparent_75%)] blur-3xl pointer-events-none z-0 animate-pulse"
                style={{ animationDuration: '4.5s' }}
            />

            {/* 3. VISIBLE BALANCED BLINKING BLACK GLOW (Directly behind the brain for contrast) */}
            <div className="absolute flex items-center justify-center pointer-events-none z-0 animate-black-blink">
                {/* Outer Visible Black Glow */}
                <div 
                    className="w-44 sm:w-56 h-34 sm:h-44 rounded-full bg-black/80 blur-2xl shadow-[0_0_46px_25px_rgba(0,0,0,0.85)]"
                />
                {/* Inner Deep Core Glow */}
                <div 
                    className="absolute w-28 sm:w-36 h-22 sm:h-28 rounded-full bg-black/90 blur-lg shadow-[0_0_30px_16px_rgba(0,0,0,0.90)]"
                />
            </div>

            {/* 4. ROTATING 16:9 GLOWING NEURAL BRAIN (Front Layer z-10) */}
            <div className="relative z-10 w-full max-w-[340px] sm:max-w-[480px] lg:max-w-[580px] aspect-video flex items-center justify-center">
                <img
                    src="/assets/glowing_brain_transparent.webp"
                    alt="Mavora Glowing Neural Brain"
                    className="w-full h-full object-contain pointer-events-none select-none drop-shadow-[0_0_45px_rgba(255,255,255,0.45)] transition-transform duration-700 ease-out hover:scale-105"
                    style={{
                        filter: 'contrast(1.15) brightness(1.1)'
                    }}
                />
            </div>

            <style>{`
                @keyframes spinRays {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }

                @keyframes blackBlink {
                    0%, 100% {
                        opacity: 0.85;
                        transform: scale(1);
                    }
                    38% {
                        opacity: 0.90;
                        transform: scale(1.03);
                    }
                    50% {
                        opacity: 0.22;
                        transform: scale(0.82);
                    }
                    62% {
                        opacity: 0.82;
                        transform: scale(0.97);
                    }
                    76% {
                        opacity: 0.28;
                        transform: scale(0.86);
                    }
                    86% {
                        opacity: 0.88;
                        transform: scale(1.02);
                    }
                }

                .animate-spin-rays {
                    animation: spinRays 42s linear infinite;
                }

                .animate-black-blink {
                    animation: blackBlink 3.4s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default GlowingBrainVideo;
