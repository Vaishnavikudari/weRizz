import React, { useRef, useState } from 'react';

/**
 * GlowingBrainVideo Component
 * Displays the rotating glowing brain video with the black background removed
 * via CSS mix-blend-mode: screen, with seamless transparent WebP fallback.
 */
const GlowingBrainVideo = ({ className = "" }) => {
    const videoRef = useRef(null);
    const [videoFailed, setVideoFailed] = useState(false);

    return (
        <div className={`relative flex items-center justify-center select-none ${className}`}>
            {/* Soft Ambient Neural Backlight Aura - Deep Ethereal Glow */}
            <div 
                className="absolute w-full max-w-xl h-56 sm:h-72 rounded-[100%] bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(141,165,203,0.18)_0%,rgba(141,165,203,0.04)_45%,transparent_70%)] blur-2xl pointer-events-none animate-pulse"
                style={{ animationDuration: '4.5s' }}
            />

            {/* 16:9 Video / Animation Container (Feathered Radial Mask for Flawless Black Blend) */}
            <div 
                className="relative w-full max-w-[340px] sm:max-w-[480px] lg:max-w-[580px] aspect-video flex items-center justify-center"
                style={{
                    WebkitMaskImage: 'radial-gradient(ellipse 68% 68% at 50% 50%, black 48%, transparent 82%)',
                    maskImage: 'radial-gradient(ellipse 68% 68% at 50% 50%, black 48%, transparent 82%)'
                }}
            >
                {!videoFailed ? (
                    <video
                        ref={videoRef}
                        src="/assets/glowing_brain.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                        onError={() => setVideoFailed(true)}
                        className="w-full h-full object-contain pointer-events-none select-none drop-shadow-[0_0_35px_rgba(184,209,248,0.45)] transition-transform duration-700 ease-out hover:scale-105"
                        style={{
                            mixBlendMode: 'screen',
                            filter: 'contrast(1.22) brightness(1.05)'
                        }}
                    />
                ) : (
                    /* Fallback to True Transparent Animated WebP if video fails to decode */
                    <img
                        src="/assets/glowing_brain_transparent.webp"
                        alt="Mavora Glowing Neural Brain"
                        className="w-full h-full object-contain pointer-events-none select-none drop-shadow-[0_0_35px_rgba(184,209,248,0.45)] transition-transform duration-700 ease-out hover:scale-105"
                    />
                )}
            </div>
        </div>
    );
};

export default GlowingBrainVideo;
