import React from 'react';
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

    return (
        <div className="w-full bg-[#000000] text-[#f4f4f2] min-h-screen selection:bg-[#9b8afb]/20 selection:text-[#f4f4f2]">
            
            {/* 1. HERO SECTION (id="home") - Neural Network Connectivity Interface */}
            <section 
                id="home" 
                className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 sm:pt-10 sm:pb-16 lg:pt-12 lg:pb-20 overflow-hidden"
            >
                <NeuralNetworkHero 
                    onGetStarted={onGetStarted} 
                    onLaunchFamily={onLaunchFamily} 
                />
            </section>

            {/* 2. FEATURES SECTION (id="features") */}
            <section 
                id="features" 
                className="w-full max-w-[1160px] mx-auto px-6 sm:px-8 lg:px-12 py-16 sm:py-24 lg:py-28 border-t border-[rgba(244,244,242,0.10)]"
            >
                <div className="max-w-xl mb-12">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[#8d8d92] mb-3 block">
                        What it does
                    </span>
                    <h2 
                        className="font-serif text-2xl sm:text-3xl lg:text-4xl tracking-[-0.02em] leading-[1.1] text-[#f4f4f2]"
                        style={{ fontFamily: 'Georgia, "Instrument Serif", serif' }}
                    >
                        Eight small tools, one simple routine.
                    </h2>
                </div>

                {/* 4-column ruled grid (2 on tablet, 1 on mobile) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-[rgba(244,244,242,0.10)] rounded-lg overflow-hidden">
                    {FEATURES.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                            <div 
                                key={idx} 
                                className="p-6 border-r border-b border-[rgba(244,244,242,0.10)] flex flex-col justify-between min-h-[160px] bg-[#0b0b0c] hover:bg-[#141415] transition-colors duration-150"
                            >
                                <div>
                                    <Icon size={20} className="text-[#9b8afb] mb-4 stroke-[1.5]" />
                                    <h3 className="text-[#f4f4f2] text-sm font-medium mb-1.5">
                                        {item.title}
                                    </h3>
                                </div>
                                <p className="text-[#8d8d92] text-xs sm:text-sm leading-relaxed">
                                    {item.line}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* 3. HOW IT WORKS SECTION (id="how-it-works") */}
            <section 
                id="how-it-works" 
                className="w-full max-w-[1160px] mx-auto px-6 sm:px-8 lg:px-12 py-16 sm:py-24 lg:py-28 border-t border-[rgba(244,244,242,0.10)]"
            >
                <div className="max-w-xl mb-12">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[#8d8d92] mb-3 block">
                        How it works
                    </span>
                    <h2 
                        className="font-serif text-2xl sm:text-3xl lg:text-4xl tracking-[-0.02em] leading-[1.1] text-[#f4f4f2]"
                        style={{ fontFamily: 'Georgia, "Instrument Serif", serif' }}
                    >
                        Designed for daily clarity.
                    </h2>
                </div>

                {/* 3-column ruled grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-[rgba(244,244,242,0.10)] rounded-lg overflow-hidden">
                    {STEPS.map((step, idx) => (
                        <div 
                            key={idx} 
                            className="p-8 border-r border-b border-[rgba(244,244,242,0.10)] flex flex-col justify-between min-h-[180px] bg-[#0b0b0c] hover:bg-[#141415] transition-colors duration-150"
                        >
                            <span className="font-mono text-xs text-[#8d8d92]/70 mb-6 block">
                                {step.num}
                            </span>
                            <div>
                                <h3 className="text-[#f4f4f2] text-base font-medium mb-2">
                                    {step.title}
                                </h3>
                                <p className="text-[#8d8d92] text-sm leading-relaxed">
                                    {step.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 4. TWO AUDIENCES SECTION (id="get-started") */}
            <section 
                id="get-started" 
                className="w-full max-w-[1160px] mx-auto px-6 sm:px-8 lg:px-12 py-16 sm:py-24 lg:py-28 border-t border-[rgba(244,244,242,0.10)]"
            >
                <div className="border border-[rgba(244,244,242,0.10)] rounded-lg grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[rgba(244,244,242,0.10)] overflow-hidden">
                    
                    {/* Left Panel: For the patient */}
                    <div className="p-8 sm:p-12 flex flex-col justify-between bg-[#0b0b0c]">
                        <div className="mb-8">
                            <span className="font-mono text-[11px] uppercase tracking-wider text-[#8d8d92] mb-3 block">
                                For the patient
                            </span>
                            <h3 
                                className="font-serif text-2xl sm:text-3xl tracking-[-0.02em] leading-[1.1] text-[#f4f4f2] mb-3"
                                style={{ fontFamily: 'Georgia, "Instrument Serif", serif' }}
                            >
                                Simple, calm, hands-free.
                            </h3>
                            <p className="text-[#8d8d92] text-sm leading-relaxed max-w-sm">
                                Voice-first companion designed to comfort, guide and reassure without technical friction.
                            </p>
                        </div>
                        <div>
                            <button
                                onClick={onLaunchPatient}
                                className="inline-flex items-center gap-2 text-sm text-[#f4f4f2] hover:text-[#9b8afb] transition-colors duration-150 underline underline-offset-4 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#f4f4f2] cursor-pointer"
                            >
                                <span>Open patient app</span>
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Right Panel: For family */}
                    <div className="p-8 sm:p-12 flex flex-col justify-between bg-[#0b0b0c]">
                        <div className="mb-8">
                            <span className="font-mono text-[11px] uppercase tracking-wider text-[#8d8d92] mb-3 block">
                                For family
                            </span>
                            <h3 
                                className="font-serif text-2xl sm:text-3xl tracking-[-0.02em] leading-[1.1] text-[#f4f4f2] mb-3"
                                style={{ fontFamily: 'Georgia, "Instrument Serif", serif' }}
                            >
                                Know they're safe.
                            </h3>
                            <p className="text-[#8d8d92] text-sm leading-relaxed max-w-sm">
                                Full caregiver control for medication scheduling, geo-fence monitoring, and real-time logs.
                            </p>
                        </div>
                        <div>
                            <button
                                onClick={onLaunchFamily}
                                className="inline-flex items-center gap-2 text-sm text-[#f4f4f2] hover:text-[#9b8afb] transition-colors duration-150 underline underline-offset-4 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#f4f4f2] cursor-pointer"
                            >
                                <span>Open caregiver portal</span>
                                <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>

                </div>
            </section>

            {/* 5. FOOTER */}
            <footer className="w-full border-t border-[rgba(244,244,242,0.10)] py-8 px-6 sm:px-8 lg:px-12">
                <div className="max-w-[1160px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8d8d92]">
                    <p>© {currentYear} Mavora</p>
                    <p>Mavora is a support tool and not a medical device.</p>
                </div>
            </footer>

        </div>
    );
};

export default LandingPage;
