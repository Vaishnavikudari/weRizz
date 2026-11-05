import React, { useState, useEffect } from 'react';
import { Volume2, Calendar, Clock, Heart, MessageSquare, Pill, Camera, Compass, Sparkles, Smile, Sun, Moon, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const GreetingPage = ({ onStartChat, onOpenSchedule, onStartScan, onOpenLost, onSpeakText }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedMood, setSelectedMood] = useState(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const hours = currentTime.getHours();
    let timeOfDay = "Morning";
    let greetingText = "Good morning! Wishing you a peaceful, sunny, and wonderful day.";
    let TimeIcon = Sun;

    if (hours >= 12 && hours < 17) {
        timeOfDay = "Afternoon";
        greetingText = "Good afternoon! Hope you are having a pleasant, calm, and restful day.";
        TimeIcon = Sun;
    } else if (hours >= 17 && hours < 21) {
        timeOfDay = "Evening";
        greetingText = "Good evening! It is wonderful to relax at home with your loved ones.";
        TimeIcon = Moon;
    } else if (hours >= 21 || hours < 5) {
        timeOfDay = "Night";
        greetingText = "Good night! You are safe and comfortable in your own home.";
        TimeIcon = Moon;
    }

    const formattedDate = currentTime.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

    const formattedTime = currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });

    const fullSpokenGreeting = `Hello! ${greetingText} I am MAVORA, your personal companion. You are completely safe at home. How can I help you today?`;

    const handlePlayGreeting = () => {
        if (onSpeakText) onSpeakText(fullSpokenGreeting);
    };

    const handleMoodSelect = (mood, responseText) => {
        setSelectedMood(mood);
        if (onSpeakText) onSpeakText(responseText);
    };

    return (
        <div className="h-full w-full overflow-y-auto px-4 py-6 md:p-8 flex flex-col items-center select-none bg-transparent text-white">
            <div className="w-full max-w-4xl space-y-6">

                {/* Reality Orientation Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-purple-950/70 via-indigo-950/50 to-slate-900/80 border border-purple-500/30 backdrop-blur-xl shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-purple-300 text-xs font-bold uppercase tracking-widest">
                                <TimeIcon size={16} className="text-amber-400" />
                                <span>{timeOfDay} Reality Orientation</span>
                            </div>
                            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
                                Today is {formattedDate}
                            </h1>
                            <p className="text-slate-300 text-sm md:text-base flex items-center gap-2">
                                <Shield size={16} className="text-emerald-400 flex-shrink-0" />
                                You are safe at home. MAVORA is with you every step of the way.
                            </p>
                        </div>

                        {/* Clock & Audio Button */}
                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3">
                            <div className="px-5 py-3 rounded-2xl bg-black/40 border border-white/10 text-white font-mono text-2xl md:text-3xl font-bold tracking-wider shadow-inner">
                                {formattedTime}
                            </div>
                            <button
                                onClick={handlePlayGreeting}
                                className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-900/30 transition-all active:scale-95 cursor-pointer"
                            >
                                <Volume2 size={16} />
                                <span>Speak to Me</span>
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Mood Check-In */}
                <div className="p-4 md:p-5 rounded-2xl bg-slate-900/70 border border-white/5 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                        <Heart size={16} className="text-pink-400" />
                        How are you feeling right now?
                    </span>
                    <div className="flex flex-wrap gap-2 justify-center">
                        <MoodButton
                            label="😊 Peaceful"
                            selected={selectedMood === 'happy'}
                            onClick={() => handleMoodSelect('happy', "I am so happy you are feeling peaceful. Everything is wonderful today.")}
                        />
                        <MoodButton
                            label="😌 Calm"
                            selected={selectedMood === 'calm'}
                            onClick={() => handleMoodSelect('calm', "That is lovely. Take a deep breath and enjoy your relaxing day.")}
                        />
                        <MoodButton
                            label="🤔 A Bit Confused"
                            selected={selectedMood === 'confused'}
                            onClick={() => handleMoodSelect('confused', "Do not worry at all. You are in your safe home, and I am right here to help you remember anything you need.")}
                        />
                        <MoodButton
                            label="😴 Resting"
                            selected={selectedMood === 'tired'}
                            onClick={() => handleMoodSelect('tired', "Take all the rest you need. Your family loves you and everything is taken care of.")}
                        />
                    </div>
                </div>

                {/* Primary Action Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ActionCard
                        title="Talk with MAVORA"
                        subtitle="Voice assistant ready to answer who people are or where things are"
                        icon={<MessageSquare size={28} className="text-purple-400" />}
                        badge="Voice & Memory"
                        accentColor="hover:border-purple-500/60"
                        onClick={onStartChat}
                    />

                    <ActionCard
                        title="My Day & Medicine"
                        subtitle="View morning, afternoon, and night pills & scheduled daily routines"
                        icon={<Pill size={28} className="text-emerald-400" />}
                        badge="Care Routine"
                        accentColor="hover:border-emerald-500/60"
                        onClick={onOpenSchedule}
                    />

                    <ActionCard
                        title="Who or What is This?"
                        subtitle="Use camera to recognize family members, medicine, or personal items"
                        icon={<Camera size={28} className="text-blue-400" />}
                        badge="AI Vision"
                        accentColor="hover:border-blue-500/60"
                        onClick={onStartScan}
                    />

                    <ActionCard
                        title="I Feel Lost / Guide Me"
                        subtitle="Show home location, walking directions, and emergency contact"
                        icon={<Compass size={28} className="text-amber-400" />}
                        badge="Safety & GPS"
                        accentColor="hover:border-amber-500/60"
                        onClick={onOpenLost}
                    />
                </div>

                <div className="text-center pt-2">
                    <p className="text-[11px] text-slate-500">
                        MAVORA • AI Memory & Companion Assistant for Alzheimer's & Dementia Care
                    </p>
                </div>
            </div>
        </div>
    );
};

const MoodButton = ({ label, selected, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 cursor-pointer border ${
            selected
                ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-900/40'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
        }`}
    >
        {label}
    </button>
);

const ActionCard = ({ title, subtitle, icon, badge, accentColor, onClick }) => (
    <motion.div
        whileHover={{ y: -3, scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md cursor-pointer transition-all shadow-lg flex flex-col justify-between space-y-4 ${accentColor}`}
    >
        <div className="flex items-start justify-between">
            <div className="p-3 bg-slate-800/80 rounded-2xl border border-white/5">
                {icon}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-full border border-white/5">
                {badge}
            </span>
        </div>
        <div>
            <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{subtitle}</p>
        </div>
    </motion.div>
);

export default GreetingPage;

