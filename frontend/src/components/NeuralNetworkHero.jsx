import React, { useState } from 'react';
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

    return (
        <div className="w-full relative bg-black">
            {/* DESKTOP NEURAL NETWORK INTERFACE (lg and above) */}
            <div className="hidden lg:block relative w-full max-w-[1360px] mx-auto min-h-[720px] select-none">
                
                {/* Center Core: Rotating 16:9 Glowing Brain (Clean unobstructed center) */}
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <div className="pointer-events-auto">
                        <GlowingBrainVideo />
                    </div>
                </div>

                {/* SVG Neural Connections Canvas (Warm Brown / Bronze luxury theme, clear of the brain) */}
                <svg 
                    className="absolute inset-0 w-full h-full pointer-events-none z-20"
                    viewBox="0 0 1200 700"
                    preserveAspectRatio="xMidYMid meet"
                >
                    <defs>
                        {/* Pure Warm Brown / Bronze Axon Gradients */}
                        <linearGradient id="brownAxonLeft" x1="100%" y1="0%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor="#c9b8a0" stopOpacity="0.85" />
                            <stop offset="50%" stopColor="#a78b71" stopOpacity="0.65" />
                            <stop offset="100%" stopColor="#785e43" stopOpacity="0.4" />
                        </linearGradient>

                        <linearGradient id="brownAxonRight" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#c9b8a0" stopOpacity="0.85" />
                            <stop offset="50%" stopColor="#a78b71" stopOpacity="0.65" />
                            <stop offset="100%" stopColor="#785e43" stopOpacity="0.4" />
                        </linearGradient>

                        {/* Warm Bronze/Gold Traveling Electrical Pulse */}
                        <linearGradient id="brownPulse" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#f7f2ea" stopOpacity="1" />
                            <stop offset="50%" stopColor="#e8d5b7" stopOpacity="0.95" />
                            <stop offset="100%" stopColor="#a78b71" stopOpacity="0.5" />
                        </linearGradient>

                        {/* Warm Bronze Synapse Glow Filter */}
                        <filter id="brownGlow" x="-30%" y="-30%" width="160%" height="160%">
                            <feGaussianBlur stdDeviation="2.5" result="blur1" />
                            <feGaussianBlur stdDeviation="5.5" result="blur2" />
                            <feMerge>
                                <feMergeNode in="blur2" />
                                <feMergeNode in="blur1" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Left Neural Paths (Start safely outside the brain perimeter) */}
                    {LEFT_NODES.map((node) => {
                        const isHovered = hoveredNode === node.id;
                        const midX = (node.startX + node.cx) / 2;
                        const pathD = `M ${node.startX} ${node.startY} C ${midX + 15} ${node.startY}, ${midX - 15} ${node.cy}, ${node.cx} ${node.cy}`;
                        return (
                            <g key={node.id} className="transition-all duration-300">
                                {/* Ambient Warm Brown Axon Line */}
                                <path
                                    d={pathD}
                                    fill="none"
                                    stroke="url(#brownAxonLeft)"
                                    strokeWidth={isHovered ? 3.0 : 1.8}
                                    strokeOpacity={isHovered ? 1 : 0.65}
                                    filter={isHovered ? "url(#brownGlow)" : undefined}
                                />

                                {/* Traveling Electrical Bronze Pulse */}
                                <path
                                    d={pathD}
                                    fill="none"
                                    stroke="url(#brownPulse)"
                                    strokeWidth={isHovered ? 3.5 : 2.4}
                                    strokeDasharray="8 28"
                                    className="animate-neural-flow-reverse"
                                    strokeOpacity={isHovered ? 1 : 0.85}
                                    filter="url(#brownGlow)"
                                />

                                {/* Origin Synapse Node (Positioned safely outside the brain) */}
                                <circle
                                    cx={node.startX}
                                    cy={node.startY}
                                    r={isHovered ? 6.5 : 4.5}
                                    fill="none"
                                    stroke="#a78b71"
                                    strokeWidth="1.5"
                                    className="animate-ping"
                                    style={{ transformOrigin: `${node.startX}px ${node.startY}px`, animationDuration: '3.2s' }}
                                />
                                <circle
                                    cx={node.startX}
                                    cy={node.startY}
                                    r={isHovered ? 4.5 : 3.2}
                                    fill="#c9b8a0"
                                    filter="url(#brownGlow)"
                                />

                                {/* Card Input Synapse Node */}
                                <circle
                                    cx={node.cx}
                                    cy={node.cy}
                                    r={isHovered ? 5.5 : 3.8}
                                    fill="#e8d5b7"
                                    filter="url(#brownGlow)"
                                />
                            </g>
                        );
                    })}

                    {/* Right Neural Paths (Start safely outside the brain perimeter) */}
                    {RIGHT_NODES.map((node) => {
                        const isHovered = hoveredNode === node.id;
                        const midX = (node.startX + node.cx) / 2;
                        const pathD = `M ${node.startX} ${node.startY} C ${midX - 15} ${node.startY}, ${midX + 15} ${node.cy}, ${node.cx} ${node.cy}`;
                        return (
                            <g key={node.id} className="transition-all duration-300">
                                {/* Ambient Warm Brown Axon Line */}
                                <path
                                    d={pathD}
                                    fill="none"
                                    stroke="url(#brownAxonRight)"
                                    strokeWidth={isHovered ? 3.0 : 1.8}
                                    strokeOpacity={isHovered ? 1 : 0.65}
                                    filter={isHovered ? "url(#brownGlow)" : undefined}
                                />

                                {/* Traveling Electrical Bronze Pulse */}
                                <path
                                    d={pathD}
                                    fill="none"
                                    stroke="url(#brownPulse)"
                                    strokeWidth={isHovered ? 3.5 : 2.4}
                                    strokeDasharray="8 28"
                                    className="animate-neural-flow"
                                    strokeOpacity={isHovered ? 1 : 0.85}
                                    filter="url(#brownGlow)"
                                />

                                {/* Origin Synapse Node (Positioned safely outside the brain) */}
                                <circle
                                    cx={node.startX}
                                    cy={node.startY}
                                    r={isHovered ? 6.5 : 4.5}
                                    fill="none"
                                    stroke="#a78b71"
                                    strokeWidth="1.5"
                                    className="animate-ping"
                                    style={{ transformOrigin: `${node.startX}px ${node.startY}px`, animationDuration: '3.2s' }}
                                />
                                <circle
                                    cx={node.startX}
                                    cy={node.startY}
                                    r={isHovered ? 4.5 : 3.2}
                                    fill="#c9b8a0"
                                    filter="url(#brownGlow)"
                                />

                                {/* Card Input Synapse Node */}
                                <circle
                                    cx={node.cx}
                                    cy={node.cy}
                                    r={isHovered ? 5.5 : 3.8}
                                    fill="#e8d5b7"
                                    filter="url(#brownGlow)"
                                />
                            </g>
                        );
                    })}
                </svg>

                {/* Left Floating Satellite Feature Cards (z-30) */}
                <div className="absolute left-2 xl:left-6 top-0 bottom-0 w-[265px] xl:w-[285px] flex flex-col justify-between py-6 z-30">
                    {LEFT_NODES.map((node) => {
                        const Icon = node.icon;
                        const isHovered = hoveredNode === node.id;
                        return (
                            <div
                                key={node.id}
                                onMouseEnter={() => setHoveredNode(node.id)}
                                onMouseLeave={() => setHoveredNode(null)}
                                className={`group relative p-4 rounded-2xl transition-all duration-300 cursor-pointer ${
                                    isHovered 
                                        ? 'bg-[#141210]/95 border-[#a78b71]/50 shadow-[0_0_30px_rgba(167,139,113,0.3)] scale-[1.03]'
                                        : 'bg-[#0f0e0c]/85 border-white/10 hover:border-[#a78b71]/30 hover:bg-[#141210]/90'
                                } backdrop-blur-xl border`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${
                                        isHovered ? 'bg-[#a78b71]/25 text-[#f7f2ea] scale-110' : 'bg-white/5 text-[#c9b8a0]'
                                    } border border-white/10`}>
                                        <Icon size={17} />
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <h4 className="text-white text-sm font-semibold tracking-tight mb-0.5">
                                            {node.title}
                                        </h4>
                                        <p className="text-[#a1a1aa] text-xs leading-relaxed line-clamp-2">
                                            {node.line}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Right Floating Satellite Feature Cards (z-30) */}
                <div className="absolute right-2 xl:right-6 top-0 bottom-0 w-[265px] xl:w-[285px] flex flex-col justify-between py-6 z-30">
                    {RIGHT_NODES.map((node) => {
                        const Icon = node.icon;
                        const isHovered = hoveredNode === node.id;
                        return (
                            <div
                                key={node.id}
                                onMouseEnter={() => setHoveredNode(node.id)}
                                onMouseLeave={() => setHoveredNode(null)}
                                className={`group relative p-4 rounded-2xl transition-all duration-300 cursor-pointer ${
                                    isHovered 
                                        ? 'bg-[#141210]/95 border-[#a78b71]/50 shadow-[0_0_30px_rgba(167,139,113,0.3)] scale-[1.03]'
                                        : 'bg-[#0f0e0c]/85 border-white/10 hover:border-[#a78b71]/30 hover:bg-[#141210]/90'
                                } backdrop-blur-xl border`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${
                                        isHovered ? 'bg-[#a78b71]/25 text-[#f7f2ea] scale-110' : 'bg-white/5 text-[#c9b8a0]'
                                    } border border-white/10`}>
                                        <Icon size={17} />
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <h4 className="text-white text-sm font-semibold tracking-tight mb-0.5">
                                            {node.title}
                                        </h4>
                                        <p className="text-[#a1a1aa] text-xs leading-relaxed line-clamp-2">
                                            {node.line}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* MOBILE & TABLET FALLBACK LAYOUT (below lg) */}
            <div className="block lg:hidden w-full px-4 sm:px-6">
                {/* Central Brain */}
                <div className="flex items-center justify-center mb-6">
                    <GlowingBrainVideo />
                </div>

                {/* 2-column or 1-column grid of neural feature boxes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto mb-8">
                    {ALL_NODES.map((node) => {
                        const Icon = node.icon;
                        return (
                            <div
                                key={node.id}
                                className="p-3.5 rounded-2xl bg-[#0f0e0c] border border-white/10 backdrop-blur-md flex items-start gap-3 text-left"
                            >
                                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#c9b8a0] flex-shrink-0">
                                    <Icon size={15} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-white text-xs sm:text-sm font-semibold mb-0.5">
                                        {node.title}
                                    </h4>
                                    <p className="text-[#a1a1aa] text-[11px] leading-relaxed">
                                        {node.line}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Headline, Subtitle, and Call to Actions (below the neural network) */}
            <div className="w-full max-w-[1160px] mx-auto px-6 sm:px-8 text-center pt-8 sm:pt-10 pb-8">
                {/* Editorial Eyebrow */}
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#8d8d92] mb-4 block">
                    Memory care companion
                </span>

                {/* Headline with The Seasons + Instrument Serif Cursive Pairing */}
                <h1 className="font-seasons text-4xl sm:text-5xl lg:text-[62px] tracking-[-0.025em] leading-[1.08] text-[#f4f4f2] mb-6 max-w-3xl mx-auto">
                    Your intelligent <span className="font-editorial italic font-normal text-[#9b8afb] text-[1.12em]">second memory</span>
                </h1>

                {/* Subtitle */}
                <p className="text-[#a1a1aa] text-base sm:text-lg leading-[1.65] max-w-xl mb-9 mx-auto">
                    Mavora helps people living with dementia remember faces, objects and medicines, and gives their families real-time reassurance.
                </p>

                {/* Centered CTA Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3.5">
                    <button
                        onClick={onGetStarted}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#f4f4f2] hover:bg-[#e2e2e0] text-[#0b0b0c] text-sm font-semibold rounded-xl transition-all duration-150 whitespace-nowrap shadow-lg shadow-white/5 active:scale-95 cursor-pointer"
                    >
                        <span>Get started</span>
                        <ArrowRight size={15} />
                    </button>

                    <button
                        onClick={onLaunchFamily}
                        className="inline-flex items-center px-6 py-3 border border-[rgba(244,244,242,0.18)] hover:border-white/30 text-[#f4f4f2] hover:bg-[rgba(244,244,242,0.06)] text-sm font-semibold rounded-xl transition-all duration-150 whitespace-nowrap active:scale-95 cursor-pointer"
                    >
                        I'm a caregiver
                    </button>
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
