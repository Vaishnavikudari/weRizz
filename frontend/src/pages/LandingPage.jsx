import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import NeuralNetworkHero from '../components/NeuralNetworkHero';
import { 
    MessageCircle, Pill, CalendarPlus, ScanLine, 
    Users, MapPin, Navigation, BellRing, ArrowRight 
} from 'lucide-react';

const FEATURES = [
    {
        title: "Assistant",
        icon: MessageCircle,
        line: "Talks and answers, in a calm voice."
    },
    {
        title: "Medicine reminder",
        icon: Pill,
        line: "One-tap confirm for every dose."
    },
    {
        title: "Add medicines",
        icon: CalendarPlus,
        line: "Times, dose and a photo of the pill."
    },
    {
        title: "Scan",
        icon: ScanLine,
        line: "Point the camera at a face or object. Get a name and notes."
    },
    {
        title: "People & items",
        icon: Users,
        line: "Photos and notes for the people and things that matter."
    },
    {
        title: "Live location",
        icon: MapPin,
        line: "Map view with a safe zone for family."
    },
    {
        title: "Take me home",
        icon: Navigation,
        line: "Simple directions back home when lost."
    },
    {
        title: "Alerts & log",
        icon: BellRing,
        line: "Missed doses and SOS events, recorded."
    }
];

const STEPS = [
    {
        num: "01",
        title: "Set up",
        desc: "Caregiver adds medicines, people, objects, safe zone."
    },
    {
        num: "02",
        title: "Daily use",
        desc: "Patient talks, scans, confirms doses."
    },
    {
        num: "03",
        title: "Peace of mind",
        desc: "Family sees location, missed doses, SOS."
    }
];

const LandingPage = ({ onGetStarted, onLaunchPatient, onLaunchFamily }) => {
    const currentYear = new Date().getFullYear();
    const [scrollPercent, setScrollPercent] = useState(0);

    const [featuresVisible, setFeaturesVisible] = useState(false);
    const [stepsVisible, setStepsVisible] = useState(false);
    const [audiencesVisible, setAudiencesVisible] = useState(false);

    const featuresRef = useRef(null);
    const stepsRef = useRef(null);
    const audiencesRef = useRef(null);

    useEffect(() => {
        const updateScroll = () => {
            const mainEl = document.querySelector('main');
            const scrollTop = mainEl ? mainEl.scrollTop : window.scrollY;
            const scrollHeight = mainEl ? mainEl.scrollHeight : document.documentElement.scrollHeight;
            const clientHeight = mainEl ? mainEl.clientHeight : window.innerHeight;
            const total = scrollHeight - clientHeight;
            if (total > 0) {
                const pct = Math.min(100, Math.max(0, (scrollTop / total) * 100));
                setScrollPercent(pct);
            }

            const winH = window.innerHeight;
            const threshold = winH * 0.90;

            if (featuresRef.current) {
                const r = featuresRef.current.getBoundingClientRect();
                if (r.top <= threshold) setFeaturesVisible(true);
            }
            if (stepsRef.current) {
                const r = stepsRef.current.getBoundingClientRect();
                if (r.top <= threshold) setStepsVisible(true);
            }
            if (audiencesRef.current) {
                const r = audiencesRef.current.getBoundingClientRect();
                if (r.top <= threshold) setAudiencesVisible(true);
            }
        };

        const mainEl = document.querySelector('main');
        if (mainEl) {
            mainEl.addEventListener('scroll', updateScroll, { passive: true });
        }
        window.addEventListener('scroll', updateScroll, { passive: true });
        updateScroll();

        return () => {
            if (mainEl) mainEl.removeEventListener('scroll', updateScroll);
            window.removeEventListener('scroll', updateScroll);
        };
    }, []);

    return (
        <div className="w-full text-white min-h-screen selection:bg-blue-400/30 selection:text-white relative bg-[#070D1E]">
            {/* Dark Royal Blue Background with Flowing Ethereal White Clouds */}
            <div className="royal-cloud-background" aria-hidden="true">
                <div className="continuous-cloud-stream">
                    <div className="continuous-cloud cloud-loop-1" />
                    <div className="continuous-cloud cloud-loop-2" />
                    <div className="continuous-cloud cloud-loop-3" />
                </div>
            </div>

            {/* Non-interactive vertical ribbed-glass stripe overlay */}
            <div className="ribbed-glass-overlay" aria-hidden="true" />
            
            {/* 1. HERO SECTION (id="home") - Neural Network Connectivity Interface */}
            <section 
                id="home"
                className="w-full max-w-[1440px] xl:max-w-[1520px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12 pt-8 pb-12 sm:pt-10 sm:pb-16 lg:pt-12 lg:pb-20 overflow-hidden relative z-10"
            >
                <NeuralNetworkHero 
                    onGetStarted={onGetStarted} 
                    onLaunchFamily={onLaunchFamily} 
                />
            </section>

            {/* 2. FEATURES SECTION (id="features") */}
            <section 
                id="features" 
                ref={featuresRef}
                className="w-full max-w-[1440px] xl:max-w-[1520px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12 py-16 sm:py-24 lg:py-28 border-t border-white/10 relative z-10"
            >
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={featuresVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-2xl mb-12 sm:mb-16"
                >
                    <span className="font-mono text-xs sm:text-sm uppercase tracking-wider text-[#60A5FA] mb-3 block font-semibold">
                        What it does
                    </span>
                    <h2 
                        className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-[-0.02em] leading-[1.15] text-white"
                        style={{ fontFamily: 'Georgia, "Instrument Serif", serif' }}
                    >
                        Eight small tools, one simple routine.
                    </h2>
                </motion.div>

                {/* Big Attached Unified Box (4-column ruled grid) with Pop-Up Animation */}
                <motion.div 
                    initial={{ opacity: 0, y: 55, scale: 0.93 }}
                    animate={featuresVisible ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 55, scale: 0.93 }}
                    transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-white/15 rounded-2xl lg:rounded-3xl overflow-hidden bg-[#0A1538]/75 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.45)]"
                >
                    {FEATURES.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                            <div 
                                key={idx} 
                                className="p-8 sm:p-9 lg:p-10 border-r border-b border-white/15 flex flex-col justify-between min-h-[220px] sm:min-h-[240px] lg:min-h-[260px] bg-[#0A1538]/60 backdrop-blur-md hover:bg-[#0E1F4D]/90 transition-colors duration-200 group"
                            >
                                <div>
                                    <Icon size={24} className="text-[#60A5FA] mb-5 stroke-[1.6] group-hover:scale-110 group-hover:text-blue-300 transition-all duration-200" />
                                    <h3 className="text-white text-lg sm:text-xl font-medium mb-2.5 tracking-tight group-hover:text-blue-200 transition-colors">
                                        {item.title}
                                    </h3>
                                </div>
                                <p className="text-white/75 text-sm sm:text-base leading-relaxed">
                                    {item.line}
                                </p>
                            </div>
                        );
                    })}
                </motion.div>
            </section>

            {/* 3. HOW IT WORKS SECTION (id="how-it-works") */}
            <section 
                id="how-it-works" 
                ref={stepsRef}
                className="w-full max-w-[1440px] xl:max-w-[1520px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12 py-16 sm:py-24 lg:py-28 border-t border-white/10 relative z-10"
            >
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={stepsVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-2xl mb-12 sm:mb-16"
                >
                    <span className="font-mono text-xs sm:text-sm uppercase tracking-wider text-[#60A5FA] mb-3 block font-semibold">
                        How it works
                    </span>
                    <h2 
                        className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-[-0.02em] leading-[1.15] text-white"
                        style={{ fontFamily: 'Georgia, "Instrument Serif", serif' }}
                    >
                        Designed for daily clarity.
                    </h2>
                </motion.div>

                {/* Big Attached Unified Box (3-column ruled grid) with Pop-Up Animation */}
                <motion.div 
                    initial={{ opacity: 0, y: 55, scale: 0.93 }}
                    animate={stepsVisible ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 55, scale: 0.93 }}
                    transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
                    className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-white/15 rounded-2xl lg:rounded-3xl overflow-hidden bg-[#0A1538]/75 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.45)]"
                >
                    {STEPS.map((step, idx) => (
                        <div 
                            key={idx} 
                            className="p-8 sm:p-10 lg:p-14 border-r border-b border-white/15 flex flex-col justify-between min-h-[260px] sm:min-h-[300px] bg-[#0A1538]/60 backdrop-blur-md hover:bg-[#0E1F4D]/90 transition-colors duration-200 group"
                        >
                            <span className="font-mono text-sm sm:text-base text-[#60A5FA] font-bold mb-8 block tracking-wider">
                                {step.num}
                            </span>
                            <div>
                                <h3 
                                    className="text-white text-2xl sm:text-3xl font-medium mb-3 tracking-tight group-hover:text-blue-200 transition-colors"
                                    style={{ fontFamily: 'Georgia, "Instrument Serif", serif' }}
                                >
                                    {step.title}
                                </h3>
                                <p className="text-white/75 text-base sm:text-lg leading-relaxed">
                                    {step.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </section>

            {/* 4. TWO AUDIENCES SECTION (id="get-started") */}
            <section 
                id="get-started" 
                ref={audiencesRef}
                className="w-full max-w-[1440px] xl:max-w-[1520px] mx-auto px-4 sm:px-6 md:px-10 lg:px-12 py-16 sm:py-24 lg:py-28 border-t border-white/10 relative z-10"
            >
                {/* Big Attached Unified Box (2-column split card) with Pop-Up Animation */}
                <motion.div 
                    initial={{ opacity: 0, y: 55, scale: 0.93 }}
                    animate={audiencesVisible ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 55, scale: 0.93 }}
                    transition={{ duration: 0.85, ease: [0.34, 1.56, 0.64, 1] }}
                    className="border border-white/15 rounded-2xl lg:rounded-3xl grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/15 overflow-hidden bg-[#0A1538]/75 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.45)]"
                >
                    {/* Left Panel: For the patient */}
                    <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-between min-h-[340px] sm:min-h-[380px] bg-[#0A1538]/60 backdrop-blur-md hover:bg-[#0E1F4D]/40 transition-colors duration-200">
                        <div className="mb-8">
                            <span className="font-mono text-xs sm:text-sm uppercase tracking-wider text-white/70 mb-4 block">
                                For the patient
                            </span>
                            <h3 
                                className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-[-0.02em] leading-[1.15] text-white mb-4"
                                style={{ fontFamily: 'Georgia, "Instrument Serif", serif' }}
                            >
                                Simple, calm, hands-free.
                            </h3>
                            <p className="text-white/75 text-base sm:text-lg leading-relaxed max-w-lg">
                                Voice-first companion designed to comfort, guide and reassure without technical friction.
                            </p>
                        </div>
                        <div>
                            <button
                                onClick={onLaunchPatient}
                                className="inline-flex items-center gap-3 text-base sm:text-lg text-white hover:text-[#60A5FA] transition-colors duration-150 underline underline-offset-4 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#60A5FA] cursor-pointer"
                            >
                                <span>Open patient app</span>
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Right Panel: For family */}
                    <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-between min-h-[340px] sm:min-h-[380px] bg-[#0A1538]/60 backdrop-blur-md hover:bg-[#0E1F4D]/40 transition-colors duration-200">
                        <div className="mb-8">
                            <span className="font-mono text-xs sm:text-sm uppercase tracking-wider text-white/70 mb-4 block">
                                For family
                            </span>
                            <h3 
                                className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-[-0.02em] leading-[1.15] text-white mb-4"
                                style={{ fontFamily: 'Georgia, "Instrument Serif", serif' }}
                            >
                                Know they're safe.
                            </h3>
                            <p className="text-white/75 text-base sm:text-lg leading-relaxed max-w-lg">
                                Full caregiver control for medication scheduling, geo-fence monitoring, and real-time logs.
                            </p>
                        </div>
                        <div>
                            <button
                                onClick={onLaunchFamily}
                                className="inline-flex items-center gap-3 text-base sm:text-lg text-white hover:text-[#60A5FA] transition-colors duration-150 underline underline-offset-4 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#60A5FA] cursor-pointer"
                            >
                                <span>Open caregiver portal</span>
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* 5. FOOTER */}
            <footer className="w-full border-t border-white/10 py-10 px-4 sm:px-6 md:px-10 lg:px-12 relative z-10">
                <div className="max-w-[1440px] xl:max-w-[1520px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-white/70">
                    <p>© {currentYear} Mavora</p>
                    <p>Mavora is a support tool and not a medical device.</p>
                </div>
            </footer>

            {/* Small Scroll-To-End Bar at bottom of screen (empty at top, fills to end) */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none select-none flex flex-col items-center">
                <div className="w-48 sm:w-60 h-2 bg-[#0B1736]/90 border border-white/20 rounded-full overflow-hidden backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.6)] p-[1.5px]">
                    <div 
                        className="h-full rounded-full bg-gradient-to-r from-blue-400 via-white to-[#FF6B5B] shadow-[0_0_10px_rgba(255,107,91,0.85)] transition-all duration-100 ease-out"
                        style={{ width: `${scrollPercent}%` }}
                    />
                </div>
            </div>

        </div>
    );
};

export default LandingPage;
