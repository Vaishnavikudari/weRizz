import React, { useState, useEffect } from 'react';
import { 
    Clock, 
    Pill, 
    CheckCircle2, 
    Sun, 
    SunMedium, 
    Moon, 
    Heart, 
    Calendar,
    X,
    Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStoredSchedule, saveStoredSchedule, fetchScheduleFromBackend } from '../services/scheduleStore';

const PatientScheduleView = () => {
    const [schedule, setSchedule] = useState(getStoredSchedule());
    const [activeFilter, setActiveFilter] = useState('all');
    const [reassuranceMessage, setReassuranceMessage] = useState(null);
    const [isKioskMode, setIsKioskMode] = useState(false);

    // Real-time two-way synchronization with Caregiver mode
    useEffect(() => {
        fetchScheduleFromBackend().then(items => { if (items) setSchedule(items); });

        const handleUpdate = () => setSchedule(getStoredSchedule());
        window.addEventListener('storage_schedule_updated', handleUpdate);
        window.addEventListener('storage', handleUpdate);

        const pollSchedule = async () => {
            try {
                const fresh = await fetchScheduleFromBackend();
                if (fresh) setSchedule(fresh);
            } catch (e) {}
        };
        const timer = setInterval(pollSchedule, 2500);

        return () => {
            window.removeEventListener('storage_schedule_updated', handleUpdate);
            window.removeEventListener('storage', handleUpdate);
            clearInterval(timer);
        };
    }, []);

    const handleMarkTaken = (item) => {
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const updated = schedule.map(s => {
            if (s.id === item.id) {
                return {
                    ...s,
                    completed: true,
                    takenAt: now,
                    takenBy: 'patient'
                };
            }
            return s;
        });

        saveStoredSchedule(updated);
        setSchedule(updated);
        setReassuranceMessage(null);
    };

    const handleAlreadyTakenClick = (item) => {
        const msg = `You already took your ${item.title} at ${item.takenAt || 'earlier today'}. You do not need to take it again. You are safe!`;
        setReassuranceMessage(msg);

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(msg);
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        }

        setTimeout(() => {
            setReassuranceMessage(null);
        }, 7000);
    };

    const filteredItems = activeFilter === 'all' 
        ? schedule 
        : schedule.filter(s => s.slot === activeFilter);

    const todayStr = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
    });

    if (isKioskMode) {
        return (
            <div className="fixed inset-0 z-[2000] bg-[#070D1E] text-white flex flex-col items-center justify-center p-8 select-none">
                <button
                    onClick={() => setIsKioskMode(false)}
                    className="absolute top-6 right-6 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/15 text-zinc-300 hover:text-white rounded-xl text-xs font-mono"
                >
                    ✕ Exit Bedside Clock
                </button>

                <div className="text-center max-w-2xl space-y-6">
                    <span className="font-mono text-xs uppercase tracking-widest text-[#FF6B5B] px-4 py-1.5 rounded-full bg-[#FF6B5B]/10 border border-[#FF6B5B]/20 inline-block">
                        Ambient Reality Care Terminal
                    </span>

                    <h1 className="text-7xl sm:text-9xl font-mono font-extrabold text-white tracking-tight">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </h1>

                    <h2 
                        className="text-2xl sm:text-4xl font-serif text-[#F4EDE0]"
                        style={{ fontFamily: '"The Seasons", "Instrument Serif", Georgia, serif' }}
                    >
                        Today is <span className="italic text-emerald-300">{todayStr}</span>
                    </h2>

                    <p className="font-handwritten text-3xl text-zinc-300 leading-relaxed pt-4">
                        “Dad, you are in your safe home in Bangalore. Sneha and Rahul are with you.”
                    </p>


                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-full bg-transparent text-white px-4 pt-6 pb-20 md:px-8 md:pt-8 md:pb-24">
            {/* Reality Orientation Banner - The Seasons & Instrument Serif Typography */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="max-w-4xl w-full mx-auto mb-8 bg-[#0B1736]/85 border border-white/15 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 flex-shrink-0"
            >
                <div className="relative z-10 flex-1 min-w-0">
                    <span className="font-mono text-xs uppercase tracking-wider text-[#F4EDE0]/85 mb-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10">
                        <Calendar size={13} className="text-[#FF6B5B]" /> Memory care companion • Reality orientation
                    </span>
                    <h1 
                        className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#F4EDE0] tracking-tight leading-snug sm:leading-normal mb-3 pt-1"
                        style={{ fontFamily: '"The Seasons", "Instrument Serif", Georgia, serif' }}
                    >
                        Today is <span className="italic text-[#FF6B5B]">{todayStr}</span>
                    </h1>
                    <p className="text-[#F4EDE0]/80 text-sm sm:text-base leading-relaxed max-w-xl">
                        Mavora is keeping track of your daily routine. You are safe at home with your loved ones.
                    </p>
                </div>

                <div className="flex flex-col items-center sm:items-end gap-3 flex-shrink-0 relative z-10 w-full sm:w-auto">
                    <div className="bg-[#070D1E]/80 border border-white/15 backdrop-blur-md px-6 py-3.5 rounded-2xl text-center shadow-md w-full sm:w-auto min-w-[170px]">
                        <p className="font-mono text-[11px] uppercase tracking-wider text-[#F4EDE0]/70">Current Time</p>
                        <p className="text-2xl sm:text-3xl font-mono font-medium text-[#F4EDE0] mt-1 tracking-tight">
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                    <button
                        onClick={() => setIsKioskMode(true)}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
                        title="Turn screen into Bedside Ambient Clock for dementia care"
                    >
                        <span>🌙 Bedside Clock Mode</span>
                    </button>
                </div>
            </motion.div>

            {/* Reassurance Popup Notification */}
            <AnimatePresence>
                {reassuranceMessage && (
                    <motion.div 
                        initial={{ opacity: 0, y: -15, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="max-w-4xl w-full mx-auto mb-6 bg-[#16161a] border border-[#FF6B5B]/40 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-2xl"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-[#9b8afb]/10 rounded-xl text-[#FF6B5B]">
                                <Volume2 size={20} />
                            </div>
                            <div>
                                <p className="font-mono text-[10px] uppercase tracking-wider text-[#FF6B5B]">
                                    Already Recorded
                                </p>
                                <p 
                                    className="font-serif text-lg text-[#F4EDE0] mt-0.5"
                                    style={{ fontFamily: '"The Seasons", "Instrument Serif", Georgia, serif' }}
                                >
                                    <span className="italic text-[#FF6B5B]">“{reassuranceMessage}”</span>
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setReassuranceMessage(null)}
                            className="text-[#F4EDE0]/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Slot Filter Buttons */}
            <div className="max-w-4xl w-full mx-auto mb-6 flex flex-wrap items-center gap-2">
                {[
                    { id: 'all', label: `All Events (${schedule.length})`, icon: Clock },
                    { id: 'morning', label: 'Morning', icon: Sun },
                    { id: 'afternoon', label: 'Afternoon', icon: SunMedium },
                    { id: 'night', label: 'Night', icon: Moon }
                ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeFilter === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveFilter(tab.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
                                isActive 
                                    ? 'bg-[#FF6B5B] text-white font-bold shadow-lg shadow-[#FF6B5B]/30' 
                                    : 'bg-[#0B1736]/60 border border-white/15 text-white/80 hover:text-white backdrop-blur-md'
                            }`}
                        >
                            <Icon size={13} className={isActive ? 'text-white' : 'text-white/80'} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* List of Schedule Cards */}
            <div className="max-w-4xl w-full mx-auto space-y-3 pb-12">
                {filteredItems.map((item, index) => (
                    <motion.div 
                        key={item.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.04 }}
                        className={`p-5 rounded-2xl border transition-all ${
                            item.completed 
                                ? 'bg-[#0B1736]/40 border-white/10 opacity-80 backdrop-blur-md' 
                                : 'bg-[#0B1736]/75 border border-white/15 backdrop-blur-xl hover:border-white/30 shadow-lg'
                        }`}
                    >
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex items-start gap-3.5">
                                <div className="p-3 rounded-xl bg-white/5 border border-[#F4EDE0]/15 text-[#F4EDE0] flex-shrink-0 mt-0.5">
                                    {item.category === 'medicine' ? <Pill size={20} /> : <Clock size={20} />}
                                </div>

                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-[#070D1E]/60 border border-white/15 text-white/80">
                                            {item.time}
                                        </span>
                                        <span className="font-mono text-[10px] uppercase tracking-wider text-[#F4EDE0]/70">
                                            {item.slot} • {item.category}
                                        </span>
                                    </div>
                                    <h2 
                                        className="font-serif text-xl font-normal text-[#F4EDE0] mt-1"
                                        style={{ fontFamily: '"The Seasons", "Instrument Serif", Georgia, serif' }}
                                    >
                                        {item.title}
                                    </h2>
                                    <p 
                                        className="font-serif text-base text-[#FF6B5B] mt-0.5 italic"
                                        style={{ fontFamily: '"The Seasons", "Instrument Serif", Georgia, serif' }}
                                    >
                                        “{item.notes}”
                                    </p>
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="w-full md:w-auto flex flex-col items-end gap-1 flex-shrink-0">
                                {item.completed ? (
                                    <button
                                        onClick={() => handleAlreadyTakenClick(item)}
                                        className="w-full md:w-auto px-4 py-2 bg-[#FF6B5B]/15 hover:bg-[#FF6B5B]/25 border border-[#FF6B5B]/40 rounded-xl flex items-center justify-center gap-2 text-[#FF6B5B] font-medium text-xs transition-all active:scale-95 cursor-pointer shadow-sm"
                                    >
                                        <CheckCircle2 size={15} />
                                        <span>Taken at {item.takenAt || 'Earlier'}</span>
                                    </button>
                                ) : item.category === 'medicine' ? (
                                    <button
                                        onClick={() => handleMarkTaken(item)}
                                        className="w-full md:w-auto px-5 py-2.5 bg-[#FF6B5B] hover:bg-[#ff5543] text-white font-bold text-xs rounded-xl shadow-lg shadow-[#FF6B5B]/30 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                                    >
                                        <CheckCircle2 size={15} />
                                        <span>Mark as Taken</span>
                                    </button>
                                ) : (
                                    <span className="font-mono text-[10px] text-[#F4EDE0]/70 px-3 py-1.5 bg-[#070D1E]/60 border border-white/12 rounded-lg text-white/80">
                                        Scheduled Routine
                                    </span>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default PatientScheduleView;
