import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    MessageCircle, Pill, CalendarPlus, ScanLine, 
    Users, MapPin, Navigation, BellRing, ArrowRight 
} from 'lucide-react';
import GlowingBrainVideo from './GlowingBrainVideo';

// Long, sweeping neural paths with ample clearance from the brain
const LEFT_NODES = [
    {
        id: 'assistant',
        title: "Assistant",
        line: "Talks and answers, in a calm voice.",
        icon: MessageCircle,
        cx: 225, cy: 90,
        startX: 450, startY: 215
    },
    {
        id: 'reminder',
        title: "Medicine reminder",
        line: "One-tap confirm for every dose.",
        icon: Pill,
        cx: 205, cy: 245,
        startX: 430, startY: 290
    },
    {
        id: 'add-meds',
        title: "Add medicines",
        line: "Times, dose and a photo of the pill.",
        icon: CalendarPlus,
        cx: 205, cy: 425,
        startX: 430, startY: 410
    },
    {
        id: 'scan',
        title: "Scan",
        line: "Point the camera at a face or object. Get a name and notes.",
        icon: ScanLine,
        cx: 225, cy: 590,
        startX: 450, startY: 485
    }
];

const RIGHT_NODES = [
    {
        id: 'people',
        title: "People & items",
        line: "Photos and notes for the people and things that matter.",
        icon: Users,
        cx: 975, cy: 90,
        startX: 750, startY: 215
    },
    {
        id: 'location',
        title: "Live location",
        line: "Map view with a safe zone for family.",
        icon: MapPin,
        cx: 995, cy: 245,
        startX: 770, startY: 290
    },
    {
        id: 'home',
        title: "Take me home",
        line: "Simple directions back home when lost.",
        icon: Navigation,
        cx: 995, cy: 425,
        startX: 770, startY: 410
    },
    {
        id: 'alerts',
        title: "Alerts & log",
        line: "Missed doses and SOS events, recorded.",
        icon: BellRing,
        cx: 975, cy: 590,
        startX: 750, startY: 485
    }
];

const ALL_NODES = [...LEFT_NODES, ...RIGHT_NODES];

const NeuralNetworkHero = ({ onGetStarted, onLaunchFamily }) => {
    const [hoveredNode, setHoveredNode] = useState(null);
    const [nodesPopped, setNodesPopped] = useState(false);
    const neuralStageRef = React.useRef(null);
    const mobileStageRef = React.useRef(null);

    React.useEffect(() => {
        const checkScroll = () => {
            const el = neuralStageRef.current || mobileStageRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            // When user scrolls down and neural network section comes into view
            if (rect.top <= window.innerHeight * 0.85) {
                setNodesPopped(true);
            }
        };

        const mainEl = document.querySelector('main');
        if (mainEl) {
            mainEl.addEventListener('scroll', checkScroll, { passive: true });
        }
        window.addEventListener('scroll', checkScroll, { passive: true });
        
        // Initial check in case already scrolled into view
        checkScroll();

        return () => {
            if (mainEl) mainEl.removeEventListener('scroll', checkScroll);
            window.removeEventListener('scroll', checkScroll);
        };
    }, []);

    return (
        <div className="w-full relative bg-transparent">
            {/* Frosted Glass Hero Card with Atmospheric Aura */}
            <motion.div 
                initial={{ opacity: 0, y: 55, scale: 0.90 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
                className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 mb-16 sm:mb-20 lg:mb-24"
            >
                <div className="relative overflow-hidden rounded-3xl bg-[#0B1736]/75 border border-white/18 backdrop-blur-2xl p-8 sm:p-12 md:p-14 text-center shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_40px_rgba(37,99,235,0.15)]">
                    {/* Subtle internal atmospheric cloud & coral aura */}
                    <div 
                        className="absolute -top-24 left-1/2 -translate-x-1/2 w-[550px] h-[220px] rounded-full pointer-events-none blur-3xl opacity-60"
                        style={{
                            background: 'radial-gradient(circle, rgba(37,99,235,0.25) 0%, rgba(255,255,255,0.18) 40%, transparent 75%)'
                        }}
                    />

                    {/* Editorial Eyebrow */}
                    <span className="relative z-10 font-mono text-[11px] uppercase tracking-wider text-white/70 mb-4 block">
                        Memory care companion
                    </span>

                    {/* Headline with The Seasons + Instrument Serif Cursive Pairing */}
                    <h1 className="relative z-10 font-seasons text-4xl sm:text-5xl lg:text-[62px] tracking-[-0.025em] leading-[1.08] text-white mb-6 max-w-3xl mx-auto">
                        Your intelligent <span className="font-editorial italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-white via-[#FF9E93] to-[#FF6B5B] text-[1.12em]">second memory</span>
                    </h1>

                    {/* Subtitle */}
                    <p className="relative z-10 text-white/80 text-base sm:text-lg leading-[1.65] max-w-2xl mb-9 mx-auto">
                        Mavora helps people living with dementia remember faces, objects and medicines, and gives their families real-time reassurance.
                    </p>

                    {/* Centered CTA Buttons */}
                    <div className="relative z-10 flex flex-wrap items-center justify-center gap-4">
                        <button
                            onClick={onGetStarted}
                            className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#FF6B5B] hover:bg-[#ff5543] text-white text-sm font-bold rounded-xl transition-all duration-150 whitespace-nowrap shadow-[0_0_28px_rgba(255,107,91,0.45)] active:scale-95 cursor-pointer"
                        >
                            <span>Get started</span>
                            <ArrowRight size={16} />
                        </button>

                        <button
                            onClick={onLaunchFamily}
                            className="inline-flex items-center px-7 py-3.5 border border-white/30 hover:border-white/60 text-white hover:bg-white/10 text-sm font-semibold rounded-xl transition-all duration-150 whitespace-nowrap active:scale-95 cursor-pointer backdrop-blur-md"
                        >
                            I'm a caregiver
                        </button>
                    </div>
                </div>
            </motion.div>
            {/* DESKTOP NEURAL NETWORK INTERFACE (lg and above) */}
            <div ref={neuralStageRef} className="hidden lg:block relative w-full max-w-[1360px] mx-auto min-h-[720px] select-none">
                
                {/* Center Core: Stationary Rotating Brain */}
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <div className="pointer-events-auto">
                        <GlowingBrainVideo />
                    </div>
                </div>

                {/* SVG Neural Connections Canvas (Tidewell Coral / Cream warm glowing paths, clear of the brain) */}
                <svg 
                    className="absolute inset-0 w-full h-full pointer-events-none z-20"
                    viewBox="0 0 1200 700"
                    preserveAspectRatio="xMidYMid meet"
                >
                    <defs>
                        {/* Ethereal Cloudy White to Royal Blue Axon Gradients */}
                        <linearGradient id="cloudAxonLeft" x1="100%" y1="0%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                            <stop offset="45%" stopColor="#93C5FD" stopOpacity="0.75" />
                            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.45" />
                        </linearGradient>

                        <linearGradient id="cloudAxonRight" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                            <stop offset="45%" stopColor="#93C5FD" stopOpacity="0.75" />
                            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.45" />
                        </linearGradient>

                        {/* Flowing Pure Cloud White & Sapphire Electrical Pulse */}
                        <linearGradient id="cloudPulse" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                            <stop offset="50%" stopColor="#BFDBFE" stopOpacity="0.95" />
                            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.45" />
                        </linearGradient>

                        {/* Ethereal Cloud Synapse Glow Filter */}
                        <filter id="cloudGlow" x="-40%" y="-40%" width="180%" height="180%">
                            <feGaussianBlur stdDeviation="2.5" result="blur1" />
                            <feGaussianBlur stdDeviation="6.5" result="blur2" />
                            <feMerge>
                                <feMergeNode in="blur2" />
                                <feMergeNode in="blur1" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Left Neural Paths (Start safely outside the brain perimeter) */}
                    {LEFT_NODES.map((node, idx) => {
                        const isHovered = hoveredNode === node.id;
                        const midX = (node.startX + node.cx) / 2;
                        const pathD = `M ${node.startX} ${node.startY} C ${midX + 15} ${node.startY}, ${midX - 15} ${node.cy}, ${node.cx} ${node.cy}`;
                        return (
                            <motion.g key={node.id} initial={{ opacity: 0 }} animate={nodesPopped ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 0.5, delay: idx * 0.12 }} className="transition-all duration-300">
                                {/* Ambient Warm Coral Axon Line */}
                                <path
                                    d={pathD}
                                    fill="none"
                                    stroke="url(#cloudAxonLeft)"
                                    strokeWidth={isHovered ? 3.0 : 1.8}
                                    strokeOpacity={isHovered ? 1 : 0.65}
                                    filter={isHovered ? "url(#cloudGlow)" : undefined}
                                />

                                {/* Traveling Electrical Coral Pulse */}
                                <path
                                    d={pathD}
                                    fill="none"
                                    stroke="url(#cloudPulse)"
                                    strokeWidth={isHovered ? 3.5 : 2.4}
                                    strokeDasharray="8 28"
                                    className="animate-neural-flow-reverse"
                                    strokeOpacity={isHovered ? 1 : 0.85}
                                    filter="url(#cloudGlow)"
                                />

                                {/* Origin Synapse Node (Positioned safely outside the brain) */}
                                <circle
                                    cx={node.startX}
                                    cy={node.startY}
                                    r={isHovered ? 6.5 : 4.5}
                                    fill="none"
                                    stroke="#93C5FD"
                                    strokeWidth="1.5"
                                    strokeOpacity={isHovered ? 0.7 : 0.35}
                                    style={{ transformOrigin: `${node.startX}px ${node.startY}px`, animationDuration: '3.2s' }}
                                />
                                <circle
                                    cx={node.startX}
                                    cy={node.startY}
                                    r={isHovered ? 4.5 : 3.2}
                                    fill="#FFFFFF"
                                    filter="url(#cloudGlow)"
                                />

                                {/* Card Input Synapse Node */}
                                <circle
                                    cx={node.cx}
                                    cy={node.cy}
                                    r={isHovered ? 5.5 : 3.8}
                                    fill="#FFFFFF"
                                    filter="url(#cloudGlow)"
                                />
                            </motion.g>
                        );
                    })}

                    {/* Right Neural Paths (Start safely outside the brain perimeter) */}
                    {RIGHT_NODES.map((node, idx) => {
                        const isHovered = hoveredNode === node.id;
                        const midX = (node.startX + node.cx) / 2;
                        const pathD = `M ${node.startX} ${node.startY} C ${midX - 15} ${node.startY}, ${midX + 15} ${node.cy}, ${node.cx} ${node.cy}`;
                        return (
                            <motion.g key={node.id} initial={{ opacity: 0 }} animate={nodesPopped ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 0.5, delay: idx * 0.12 }} className="transition-all duration-300">
                                {/* Ambient Warm Coral Axon Line */}
                                <path
                                    d={pathD}
                                    fill="none"
                                    stroke="url(#cloudAxonRight)"
                                    strokeWidth={isHovered ? 3.0 : 1.8}
                                    strokeOpacity={isHovered ? 1 : 0.65}
                                    filter={isHovered ? "url(#cloudGlow)" : undefined}
                                />

                                {/* Traveling Electrical Coral Pulse */}
                                <path
                                    d={pathD}
                                    fill="none"
                                    stroke="url(#cloudPulse)"
                                    strokeWidth={isHovered ? 3.5 : 2.4}
                                    strokeDasharray="8 28"
                                    className="animate-neural-flow"
                                    strokeOpacity={isHovered ? 1 : 0.85}
                                    filter="url(#cloudGlow)"
                                />

                                {/* Origin Synapse Node (Positioned safely outside the brain) */}
                                <circle
                                    cx={node.startX}
                                    cy={node.startY}
                                    r={isHovered ? 6.5 : 4.5}
                                    fill="none"
                                    stroke="#93C5FD"
                                    strokeWidth="1.5"
                                    strokeOpacity={isHovered ? 0.7 : 0.35}
                                    style={{ transformOrigin: `${node.startX}px ${node.startY}px`, animationDuration: '3.2s' }}
                                />
                                <circle
                                    cx={node.startX}
                                    cy={node.startY}
                                    r={isHovered ? 4.5 : 3.2}
                                    fill="#FFFFFF"
                                    filter="url(#cloudGlow)"
                                />

                                {/* Card Input Synapse Node */}
                                <circle
                                    cx={node.cx}
                                    cy={node.cy}
                                    r={isHovered ? 5.5 : 3.8}
                                    fill="#FFFFFF"
                                    filter="url(#cloudGlow)"
                                />
                            </motion.g>
                        );
                    })}
                </svg>

                {/* Left Floating Satellite Feature Cards (z-30) */}
                <div className="absolute left-2 xl:left-6 top-0 bottom-0 w-[265px] xl:w-[285px] flex flex-col justify-between py-6 z-30">
                    {LEFT_NODES.map((node, idx) => {
                        const Icon = node.icon;
                        const isHovered = hoveredNode === node.id;
                        return (
                            <motion.div
                                key={node.id}
                                initial={{ opacity: 0, scale: 0.45, x: -50 }}
                                animate={nodesPopped ? { opacity: 1, scale: 1, x: 0 } : { opacity: 0, scale: 0.45, x: -50 }}
                                transition={{ 
                                    duration: 0.65, 
                                    delay: 0.05 + idx * 0.12, 
                                    ease: [0.34, 1.56, 0.64, 1] 
                                }}
                                onMouseEnter={() => setHoveredNode(node.id)}
                                onMouseLeave={() => setHoveredNode(null)}
                                className={`group relative p-4 rounded-2xl transition-all duration-300 cursor-pointer ${
                                    isHovered 
                                        ? 'bg-[#102554]/95 border-white/50 shadow-[0_0_35px_rgba(255,255,255,0.22)] scale-[1.03]'
                                        : 'bg-[#0B1736]/75 border-white/15 hover:border-white/40 hover:bg-[#102554]/90'
                                } backdrop-blur-xl border`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${
                                        isHovered ? 'bg-[#2563EB]/35 text-white scale-110 border-[#93C5FD]/60' : 'bg-white/10 text-white border-white/20'
                                    } border`}>
                                        <Icon size={17} />
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <h4 className="text-white text-sm font-semibold tracking-tight mb-0.5">
                                            {node.title}
                                        </h4>
                                        <p className="text-white/70 text-xs leading-relaxed line-clamp-2">
                                            {node.line}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Right Floating Satellite Feature Cards (z-30) */}
                <div className="absolute right-2 xl:right-6 top-0 bottom-0 w-[265px] xl:w-[285px] flex flex-col justify-between py-6 z-30">
                    {RIGHT_NODES.map((node, idx) => {
                        const Icon = node.icon;
                        const isHovered = hoveredNode === node.id;
                        return (
                            <motion.div
                                key={node.id}
                                initial={{ opacity: 0, scale: 0.45, x: 50 }}
                                animate={nodesPopped ? { opacity: 1, scale: 1, x: 0 } : { opacity: 0, scale: 0.45, x: 50 }}
                                transition={{ 
                                    duration: 0.65, 
                                    delay: 0.12 + idx * 0.12, 
                                    ease: [0.34, 1.56, 0.64, 1] 
                                }}
                                onMouseEnter={() => setHoveredNode(node.id)}
                                onMouseLeave={() => setHoveredNode(null)}
                                className={`group relative p-4 rounded-2xl transition-all duration-300 cursor-pointer ${
                                    isHovered 
                                        ? 'bg-[#102554]/95 border-white/50 shadow-[0_0_35px_rgba(255,255,255,0.22)] scale-[1.03]'
                                        : 'bg-[#0B1736]/75 border-white/15 hover:border-white/40 hover:bg-[#102554]/90'
                                } backdrop-blur-xl border`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${
                                        isHovered ? 'bg-[#2563EB]/35 text-white scale-110 border-[#93C5FD]/60' : 'bg-white/10 text-white border-white/20'
                                    } border`}>
                                        <Icon size={17} />
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <h4 className="text-white text-sm font-semibold tracking-tight mb-0.5">
                                            {node.title}
                                        </h4>
                                        <p className="text-white/70 text-xs leading-relaxed line-clamp-2">
                                            {node.line}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* MOBILE & TABLET FALLBACK LAYOUT (below lg) */}
            <div ref={mobileStageRef} className="block lg:hidden w-full px-4 sm:px-6">
                {/* Central Brain */}
                <div className="flex items-center justify-center mb-6">
                    <GlowingBrainVideo />
                </div>

                {/* 2-column or 1-column grid of neural feature boxes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto mb-8">
                    {ALL_NODES.map((node, idx) => {
                        const Icon = node.icon;
                        return (
                            <motion.div
                                key={node.id}
                                initial={{ opacity: 0, scale: 0.75, y: 15 }}
                                animate={nodesPopped ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.75, y: 15 }}
                                transition={{ duration: 0.45, delay: idx * 0.08, ease: [0.34, 1.56, 0.64, 1] }}
                                className="p-3.5 rounded-2xl bg-[#0B1736]/85 border border-white/15 backdrop-blur-md flex items-start gap-3 text-left"
                            >
                                <div className="w-8 h-8 rounded-xl bg-[#F4EDE0]/10 border border-[#F4EDE0]/15 flex items-center justify-center text-[#60A5FA] flex-shrink-0">
                                    <Icon size={15} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-white text-xs sm:text-sm font-semibold mb-0.5">
                                        {node.title}
                                    </h4>
                                    <p className="text-white/70 text-[11px] leading-relaxed">
                                        {node.line}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>



            <style>{`
                @keyframes neuralFlow {
                    0% {
                        stroke-dashoffset: 0;
                    }
                    100% {
                        stroke-dashoffset: -72;
                    }
                }

                @keyframes neuralFlowReverse {
                    0% {
                        stroke-dashoffset: 0;
                    }
                    100% {
                        stroke-dashoffset: 72;
                    }
                }

                .animate-neural-flow {
                    animation: neuralFlow 2.4s linear infinite;
                }

                .animate-neural-flow-reverse {
                    animation: neuralFlowReverse 2.4s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default NeuralNetworkHero;
