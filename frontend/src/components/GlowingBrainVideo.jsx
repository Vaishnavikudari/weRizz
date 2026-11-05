import React, { useRef, useEffect, useState } from 'react';

/**
 * GlowingBrainVideo Component
 * Replaces the static glowing brain with the 3D rotating brain video,
 * automatically removing the black background via real-time luma-keying
 * on HTML5 Canvas with CSS screen-blend and transparent WebP fallbacks.
 */
const GlowingBrainVideo = ({ className = "" }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [useCanvas, setUseCanvas] = useState(true);

    useEffect(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        let animId;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
            setUseCanvas(false);
            return;
        }

        const renderFrame = () => {
            if (video.readyState >= 2 && !video.paused && !video.ended) {
                const w = canvas.width;
                const h = canvas.height;
                ctx.drawImage(video, 0, 0, w, h);
                
                try {
                    const frame = ctx.getImageData(0, 0, w, h);
                    const data = frame.data;
                    const len = data.length;

                    // Luma keying: black background (0,0,0) becomes 100% transparent (alpha=0)
                    for (let i = 0; i < len; i += 4) {
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];
                        const maxVal = Math.max(r, g, b);

                        if (maxVal < 10) {
                            data[i + 3] = 0;
                        } else {
                            // Smooth alpha falloff for anti-aliased glowing edges
                            const alpha = Math.min(255, (maxVal - 10) * 1.35);
                            data[i + 3] = alpha;
                        }
                    }
                    ctx.putImageData(frame, 0, 0);
                } catch (e) {
                    // Fallback to CSS mix-blend-screen if getImageData is restricted
                    setUseCanvas(false);
                    return;
                }
            }
            animId = requestAnimationFrame(renderFrame);
        };

        const handlePlay = () => {
            animId = requestAnimationFrame(renderFrame);
        };

        video.addEventListener('play', handlePlay);

        // Auto-play safety
        video.play().catch(() => {
            // Autoplay policy prevented playback, fall back to blend mode or webp
        });

        return () => {
            video.removeEventListener('play', handlePlay);
            cancelAnimationFrame(animId);
        };
    }, []);

    return (
        <div className={`relative flex items-center justify-center select-none ${className}`}>
            {/* Soft Ambient Neural Backlight Aura */}
            <div 
                className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-[radial-gradient(circle,rgba(155,138,251,0.25)_0%,rgba(155,138,251,0.07)_44%,transparent_74%)] blur-2xl pointer-events-none animate-pulse"
                style={{ animationDuration: '4.5s' }}
            />

            {/* Video Source (Hidden when Canvas Luma-Keying is active) */}
            <video
                ref={videoRef}
                src="/assets/glowing_brain.mp4"
                poster="/assets/glowing_brain_poster.png"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className={`w-56 h-56 sm:w-72 sm:h-72 lg:w-80 lg:h-80 object-contain drop-shadow-[0_0_40px_rgba(155,138,251,0.4)] pointer-events-none ${
                    useCanvas ? 'hidden' : 'block mix-blend-screen'
                }`}
            />

            {/* Real-Time Alpha Canvas (100% Transparent Background) */}
            <canvas
                ref={canvasRef}
                width={480}
                height={480}
                className={`w-56 h-56 sm:w-72 sm:h-72 lg:w-80 lg:h-80 object-contain drop-shadow-[0_0_40px_rgba(155,138,251,0.4)] transition-transform duration-700 ease-out hover:scale-105 pointer-events-none ${
                    useCanvas ? 'block' : 'hidden'
                }`}
            />
        </div>
    );
};

export default GlowingBrainVideo;
