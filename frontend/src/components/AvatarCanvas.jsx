import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const KirbyAvatar = ({ isSpeaking, isProcessing }) => {
    const [mouse, setMouse] = useState({ x: 0, y: 0 });
    const [isBlinking, setIsBlinking] = useState(false);
    const [mouthFrame, setMouthFrame] = useState(0);
    const containerRef = useRef(null);
    const animRef = useRef({
        currX: 0,
        currY: 0,
        targetX: 0,
        targetY: 0
    });

    // Window mouse tracking with smooth lerp
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            // Normalized distance (-1 to 1) from Kirby's center
            const nx = Math.max(-1, Math.min(1, (e.clientX - centerX) / (window.innerWidth * 0.45)));
            const ny = Math.max(-1, Math.min(1, (e.clientY - centerY) / (window.innerHeight * 0.45)));

            animRef.current.targetX = nx;
            animRef.current.targetY = ny;
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: true });

        // Natural random blinking
        const blinkInterval = setInterval(() => {
            setIsBlinking(true);
            setTimeout(() => setIsBlinking(false), 160);
        }, 4200);

        // Smooth 60fps Lerp loop
        let rafId;
        const tick = () => {
            const anim = animRef.current;
            anim.currX += (anim.targetX - anim.currX) * 0.08;
            anim.currY += (anim.targetY - anim.currY) * 0.08;
            setMouse({ x: anim.currX, y: anim.currY });
            rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            clearInterval(blinkInterval);
            cancelAnimationFrame(rafId);
        };
    }, []);

    // Mouth animation while speaking
    useEffect(() => {
        if (!isSpeaking) {
            setMouthFrame(0);
            return;
        }
        const interval = setInterval(() => {
            setMouthFrame((prev) => (prev + 1) % 3);
        }, 140);
        return () => clearInterval(interval);
    }, [isSpeaking]);

    // 3D rotations & parallax offsets
    const bodyRotateY = mouse.x * 20; // -20deg to +20deg
    const bodyRotateX = -mouse.y * 18; // -18deg to +18deg
    const bodyTranslateX = mouse.x * 14;
    const bodyTranslateY = mouse.y * 12;

    // Face extra parallax on sphere surface
    const faceTranslateX = mouse.x * 22;
    const faceTranslateY = mouse.y * 18;

    // Pupil look offset
    const pupilX = mouse.x * 5;
    const pupilY = mouse.y * 7;

    return (
        <div 
            ref={containerRef}
            className="relative w-full h-full flex items-center justify-center select-none"
            style={{ perspective: '1000px' }}
        >
            {/* Ground Shadow */}
            <div 
                className="absolute w-52 h-10 rounded-[100%] bg-black/40 blur-md pointer-events-none transition-transform duration-100 ease-out"
                style={{
                    bottom: '22%',
                    transform: `translateX(${bodyTranslateX * 0.6}px) scaleX(${1 - Math.abs(mouse.y) * 0.1}) scaleY(${1 + Math.abs(mouse.y) * 0.08})`
                }}
            />

            {/* Whole Kirby Character Rig */}
            <div 
                className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center"
                style={{
                    transformStyle: 'preserve-3d',
                    transform: `translate3d(${bodyTranslateX}px, ${bodyTranslateY}px, 0px) rotateY(${bodyRotateY}deg) rotateX(${bodyRotateX}deg)`,
                    transition: 'transform 0.05s linear'
                }}
            >
                {/* FEET (Behind body in Z) */}
                {/* Left Foot */}
                <div 
                    className="absolute w-24 h-16 rounded-[45px] shadow-lg pointer-events-none"
                    style={{
                        bottom: '2px',
                        left: '6px',
                        background: 'radial-gradient(circle at 40% 35%, #fb7185 0%, #e11d48 40%, #be123c 85%, #881337 100%)',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                        transform: `rotate(-20deg) rotateY(${bodyRotateY * 0.5}deg) rotateX(${bodyRotateX * 0.5}deg) translateZ(-15px)`
                    }}
                />

                {/* Right Foot */}
                <div 
                    className="absolute w-24 h-16 rounded-[45px] shadow-lg pointer-events-none"
                    style={{
                        bottom: '2px',
                        right: '6px',
                        background: 'radial-gradient(circle at 40% 35%, #fb7185 0%, #e11d48 40%, #be123c 85%, #881337 100%)',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                        transform: `rotate(20deg) rotateY(${bodyRotateY * 0.5}deg) rotateX(${bodyRotateX * 0.5}deg) translateZ(-15px)`
                    }}
                />

                {/* ARMS (Sides of Body) */}
                {/* Left Arm / Hand */}
                <div 
                    className="absolute w-16 h-16 rounded-full pointer-events-none transition-transform duration-200"
                    style={{
                        left: '-14px',
                        top: '40%',
                        background: 'radial-gradient(circle at 35% 35%, #ffb6d9 0%, #ff80b4 45%, #e1558f 85%, #b5386f 100%)',
                        boxShadow: '-4px 4px 12px rgba(180, 50, 100, 0.25)',
                        transform: `rotate(${isSpeaking ? -35 : -15 + mouse.y * 15}deg) scale(${isSpeaking ? 1.08 : 1}) translateZ(5px)`
                    }}
                />

                {/* Right Arm / Hand (Waves when speaking or thinking!) */}
                <div 
                    className="absolute w-16 h-16 rounded-full pointer-events-none transition-transform duration-200"
                    style={{
                        right: '-14px',
                        top: '40%',
                        background: 'radial-gradient(circle at 35% 35%, #ffb6d9 0%, #ff80b4 45%, #e1558f 85%, #b5386f 100%)',
                        boxShadow: '4px 4px 12px rgba(180, 50, 100, 0.25)',
                        transform: `rotate(${isSpeaking ? 40 : 15 - mouse.y * 15}deg) scale(${isSpeaking ? 1.08 : 1}) translateZ(5px)`
                    }}
                />

                {/* MAIN BODY SPHERE */}
                <div 
                    className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full flex items-center justify-center overflow-hidden"
                    style={{
                        background: 'radial-gradient(circle at 35% 28%, #ffd1e6 0%, #ff9ec6 28%, #ff7cae 55%, #e6528d 82%, #b32a63 100%)',
                        boxShadow: 'inset -8px -8px 24px rgba(150, 20, 70, 0.45), inset 4px 4px 16px rgba(255, 255, 255, 0.6), 0 16px 32px rgba(0,0,0,0.25)',
                        transformStyle: 'preserve-3d'
                    }}
                >
                    {/* Soft Specular Gloss Highlight Top Left */}
                    <div 
                        className="absolute w-20 h-14 rounded-[100%] bg-white/40 blur-[4px] pointer-events-none"
                        style={{
                            top: '12%',
                            left: '20%',
                            transform: 'rotate(-32deg)'
                        }}
                    />

                    {/* KIRBY'S FACE LAYER (Slides in 3D across sphere) */}
                    <div 
                        className="relative w-40 h-36 flex flex-col items-center justify-center pointer-events-none"
                        style={{
                            transform: `translate3d(${faceTranslateX}px, ${faceTranslateY}px, 30px)`,
                            transition: 'transform 0.05s linear'
                        }}
                    >
                        {/* EYES ROW */}
                        <div className="flex items-center justify-between w-32 px-2">
                            {/* Left Eye */}
                            <div 
                                className="relative w-6 h-14 bg-[#0c1222] rounded-full overflow-hidden border border-black/20"
                                style={{
                                    transform: isBlinking 
                                        ? 'scaleY(0.08)' 
                                        : isProcessing 
                                            ? 'scale(1.05) translateY(-2px)' 
                                            : 'scaleY(1)',
                                    transition: 'transform 0.12s ease-out'
                                }}
                            >
                                {/* Iris Cyan Glow Bottom */}
                                <div 
                                    className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-[#0284c7] via-[#38bdf8] to-transparent rounded-full"
                                    style={{
                                        transform: `translate(${pupilX * 0.7}px, ${pupilY * 0.5}px)`
                                    }}
                                />
                                {/* Main White Specular Highlight */}
                                <div 
                                    className="absolute w-3.5 h-6 bg-white rounded-full"
                                    style={{
                                        top: '3px',
                                        left: '2px',
                                        transform: `translate(${pupilX}px, ${pupilY}px)`
                                    }}
                                />
                                {/* Secondary Tiny Specular Highlight */}
                                <div 
                                    className="absolute w-1.5 h-1.5 bg-white/90 rounded-full"
                                    style={{
                                        bottom: '4px',
                                        right: '2px',
                                        transform: `translate(${pupilX * 0.6}px, ${pupilY * 0.6}px)`
                                    }}
                                />
                            </div>

                            {/* Right Eye */}
                            <div 
                                className="relative w-6 h-14 bg-[#0c1222] rounded-full overflow-hidden border border-black/20"
                                style={{
                                    transform: isBlinking 
                                        ? 'scaleY(0.08)' 
                                        : isProcessing 
                                            ? 'scale(1.05) translateY(-2px)' 
                                            : 'scaleY(1)',
                                    transition: 'transform 0.12s ease-out'
                                }}
                            >
                                {/* Iris Cyan Glow Bottom */}
                                <div 
                                    className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-[#0284c7] via-[#38bdf8] to-transparent rounded-full"
                                    style={{
                                        transform: `translate(${pupilX * 0.7}px, ${pupilY * 0.5}px)`
                                    }}
                                />
                                {/* Main White Specular Highlight */}
                                <div 
                                    className="absolute w-3.5 h-6 bg-white rounded-full"
                                    style={{
                                        top: '3px',
                                        left: '2px',
                                        transform: `translate(${pupilX}px, ${pupilY}px)`
                                    }}
                                />
                                {/* Secondary Tiny Specular Highlight */}
                                <div 
                                    className="absolute w-1.5 h-1.5 bg-white/90 rounded-full"
                                    style={{
                                        bottom: '4px',
                                        right: '2px',
                                        transform: `translate(${pupilX * 0.6}px, ${pupilY * 0.6}px)`
                                    }}
                                />
                            </div>
                        </div>

                        {/* CHEEKS BLUSH & MOUTH ROW */}
                        <div className="relative w-full flex items-center justify-between px-1 mt-1.5">
                            {/* Left Rosy Cheek Blush */}
                            <div 
                                className="w-8 h-4 rounded-[100%] opacity-85 blur-[1px]"
                                style={{
                                    background: 'radial-gradient(circle, #f43f5e 20%, #e11d48 70%, transparent 100%)',
                                    transform: 'rotate(-10deg)'
                                }}
                            />

                            {/* MOUTH */}
                            <div className="flex items-center justify-center min-w-[28px]">
                                {isSpeaking ? (
                                    mouthFrame === 0 ? (
                                        // Open talking 'O' mouth
                                        <div className="w-5 h-6 rounded-full bg-[#7f1d1d] border-2 border-[#991b1b] flex flex-col justify-end items-center overflow-hidden shadow-inner">
                                            <div className="w-4 h-2.5 bg-[#f43f5e] rounded-t-full mb-0.5" />
                                        </div>
                                    ) : mouthFrame === 1 ? (
                                        // Wide smiling mouth
                                        <div className="w-6 h-5 rounded-b-full bg-[#7f1d1d] border-2 border-[#991b1b] flex flex-col justify-end items-center overflow-hidden shadow-inner">
                                            <div className="w-5 h-2 bg-[#f43f5e] rounded-t-full" />
                                        </div>
                                    ) : (
                                        // Small happy open mouth
                                        <div className="w-4 h-4 rounded-full bg-[#7f1d1d] border border-[#991b1b] flex flex-col justify-end items-center overflow-hidden">
                                            <div className="w-3 h-1.5 bg-[#f43f5e] rounded-t-full" />
                                        </div>
                                    )
                                ) : isProcessing ? (
                                    // Cute curious 'o' mouth
                                    <div className="w-3.5 h-3.5 rounded-full bg-[#7f1d1d] border border-[#991b1b]" />
                                ) : (
                                    // Classic gentle happy curved smile
                                    <svg width="20" height="10" viewBox="0 0 20 10" fill="none">
                                        <path 
                                            d="M 2 2 Q 10 9, 18 2" 
                                            stroke="#831843" 
                                            strokeWidth="2.5" 
                                            strokeLinecap="round" 
                                        />
                                    </svg>
                                )}
                            </div>

                            {/* Right Rosy Cheek Blush */}
                            <div 
                                className="w-8 h-4 rounded-[100%] opacity-85 blur-[1px]"
                                style={{
                                    background: 'radial-gradient(circle, #f43f5e 20%, #e11d48 70%, transparent 100%)',
                                    transform: 'rotate(10deg)'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AvatarCanvas = ({ isSpeaking, isProcessing, message, processingStatus }) => {
    return (
        <div className="flex flex-col justify-between items-center h-full w-full bg-transparent overflow-hidden relative border-r border-white/10 select-none">
            
            {/* Background subtle vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,107,91,0.12)_0%,transparent_70%)] pointer-events-none" />

            {/* Avatar Stage Container */}
            <div className="relative z-10 flex flex-col items-center justify-between h-full w-full py-6 px-4">
                
                {/* Kirby 3D Animated Avatar */}
                <div className="flex-1 w-full flex items-center justify-center min-h-0 overflow-visible p-2">
                    <KirbyAvatar isSpeaking={isSpeaking} isProcessing={isProcessing} />
                </div>

                {/* Dynamic Status / Caption Area */}
                <div className="mt-2 relative w-full flex flex-col items-center space-y-3 flex-shrink-0 min-h-[90px] justify-center">

                    {/* Status Badge */}
                    {isSpeaking ? (
                        <div className="px-3.5 py-1 bg-[#0B1736]/75 border border-emerald-500/40 backdrop-blur-md rounded-full flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                            <span className="text-emerald-300 text-[11px] font-mono tracking-wider uppercase">Speaking</span>
                        </div>
                    ) : isProcessing ? (
                        <div className="px-3.5 py-1 bg-[#0B1736]/75 border border-white/20 backdrop-blur-md rounded-full flex items-center gap-2">
                            <div className="flex gap-1">
                                <span className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-1 h-1 bg-white rounded-full animate-bounce" />
                            </div>
                            <span className="text-zinc-300 text-[11px] font-mono tracking-wider uppercase ml-1">
                                {processingStatus || "Thinking"}
                            </span>
                        </div>
                    ) : (
                        <div className="px-3.5 py-1 bg-[#0B1736]/75 border border-white/15 backdrop-blur-md rounded-full flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-[#8d8d92] rounded-full" />
                            <span className="text-[#8d8d92] text-[11px] font-mono tracking-wider uppercase">Listening</span>
                        </div>
                    )}

                    {/* Dynamic Caption (Tooltip style) */}
                    <AnimatePresence mode="wait">
                        {message && (
                            <motion.div
                                key={message}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="bg-[#0B1736]/80 text-[#f4f4f2] text-center px-4 py-2 rounded-xl border border-white/15 backdrop-blur-md max-w-sm"
                            >
                                <p className="text-xs font-normal leading-relaxed text-[#f4f4f2]/90">
                                    "{message}"
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default AvatarCanvas;
