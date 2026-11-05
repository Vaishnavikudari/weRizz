import React, { useState, useEffect, useRef } from 'react';
import { Pill, Volume2, CheckCircle2, Clock, Bell, X, VolumeX, AlertCircle, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStoredSchedule, saveStoredSchedule, fetchScheduleFromBackend } from '../services/scheduleStore';

// Web Audio API soft melodic chime
const playMelodicChime = () => {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        // Warm C-Major triad (C5 - E5 - G5 - C6)
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.18);
            gain.gain.setValueAtTime(0.18, now + idx * 0.18);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.18 + 0.9);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.18);
            osc.stop(now + idx * 0.18 + 0.9);
        });
    } catch (err) {
        console.warn("Chime note:", err);
    }
};

const speakVoice = (text) => {
    if ('speechSynthesis' in window) {
        try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.88;
            utterance.pitch = 1.05;
            window.speechSynthesis.speak(utterance);
        } catch (e) {}
    }
};

const MedicationAlarmModal = () => {
    const [activeAlarm, setActiveAlarm] = useState(null);
    const [schedule, setSchedule] = useState(getStoredSchedule());
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const audioRef = useRef(null);
    const loopIntervalRef = useRef(null);
    const lastTriggeredIdRef = useRef(null);

    // Initial backend fetch & update listener
    useEffect(() => {
        fetchScheduleFromBackend().then(items => {
            if (items) setSchedule(items);
        });

        const handleUpdate = () => {
            setSchedule(getStoredSchedule());
        };
        window.addEventListener('storage_schedule_updated', handleUpdate);
        window.addEventListener('storage', handleUpdate);

        // Listen for manual demo trigger from UI button
        const handleManualTrigger = (e) => {
            const currentSchedule = getStoredSchedule();
            const target = e.detail?.item || currentSchedule.find(s => s.category === 'medicine' && !s.completed) || currentSchedule[1];
            if (target) {
                triggerAlarm(target);
            }
        };
        window.addEventListener('trigger_medication_alarm', handleManualTrigger);

        return () => {
            window.removeEventListener('storage_schedule_updated', handleUpdate);
            window.removeEventListener('storage', handleUpdate);
            window.removeEventListener('trigger_medication_alarm', handleManualTrigger);
        };
    }, []);

    // Periodic time checker - runs every 2 seconds
    useEffect(() => {
        const checkClock = () => {
            const now = new Date();
            // Format to match "08:30 AM" or "8:30 AM"
            let hours = now.getHours();
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // hour '0' should be '12'
            const timeStr1 = `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
            const timeStr2 = `${hours}:${minutes} ${ampm}`;

            const currentSchedule = getStoredSchedule();
            const dueMedicine = currentSchedule.find(item => {
                if (item.category !== 'medicine' || item.completed) return false;
                const itemTime = item.time?.trim()?.toUpperCase();
                return (itemTime === timeStr1.toUpperCase() || itemTime === timeStr2.toUpperCase());
            });

            if (dueMedicine && lastTriggeredIdRef.current !== `${dueMedicine.id}-${timeStr1}`) {
                lastTriggeredIdRef.current = `${dueMedicine.id}-${timeStr1}`;
                triggerAlarm(dueMedicine);
            }
        };

        const timer = setInterval(checkClock, 2000);
        return () => clearInterval(timer);
    }, []);

    // Trigger alarm and start repeating voice loop
    const triggerAlarm = (medItem) => {
        setActiveAlarm(medItem);
        playAlarmAudio(medItem);

        // Continuous loop every 25 seconds until acknowledged
        if (loopIntervalRef.current) clearInterval(loopIntervalRef.current);
        loopIntervalRef.current = setInterval(() => {
            playAlarmAudio(medItem);
        }, 25000);
    };

    const playAlarmAudio = (medItem) => {
        playMelodicChime();
        setIsPlayingAudio(true);

        setTimeout(() => {
            if (medItem.audioData) {
                // Family recorded real voice note
                try {
                    if (audioRef.current) {
                        audioRef.current.pause();
                    }
                    audioRef.current = new Audio(medItem.audioData);
                    audioRef.current.onended = () => setIsPlayingAudio(false);
                    audioRef.current.play().catch(e => {
                        console.log("Autoplay note:", e);
                        // Fallback to speech synthesis if autoplay blocked
                        const text = medItem.voice_prompt || `Hello, it is time for your ${medItem.title}. Please take it with a glass of water.`;
                        speakVoice(text);
                    });
                } catch (e) {
                    const text = medItem.voice_prompt || `Hello, it is time for your ${medItem.title}. Please take it with a glass of water.`;
                    speakVoice(text);
                }
            } else {
                // Family reassuring TTS prompt
                const text = medItem.voice_prompt || `Hello, it is time for your ${medItem.title}. Please take 1 tablet with a glass of water. You are completely safe.`;
                speakVoice(text);
                setTimeout(() => setIsPlayingAudio(false), 5000);
            }
        }, 900);
    };

    const stopAlarmSound = () => {
        if (loopIntervalRef.current) {
            clearInterval(loopIntervalRef.current);
            loopIntervalRef.current = null;
        }
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        setIsPlayingAudio(false);
    };

    // Patient clicks "I Took My Medicine"
    const handleConfirmTaken = async () => {
        stopAlarmSound();
        if (!activeAlarm) return;

        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const currentSchedule = getStoredSchedule();
        const updated = currentSchedule.map(item => {
            if (item.id === activeAlarm.id) {
                return {
                    ...item,
                    completed: true,
                    takenAt: now,
                    takenBy: 'patient'
                };
            }
            return item;
        });

        await saveStoredSchedule(updated);
        setSchedule(updated);
        setActiveAlarm(null);

        // Friendly spoken acknowledgment
        speakVoice("Good job! Your family has been notified that you took your medicine.");
    };

    // Snooze 5 minutes
    const handleSnooze = () => {
        stopAlarmSound();
        setActiveAlarm(null);
        // Will trigger again in 5 minutes
        setTimeout(() => {
            const currentSchedule = getStoredSchedule();
            const fresh = currentSchedule.find(s => s.id === activeAlarm?.id);
            if (fresh && !fresh.completed) {
                triggerAlarm(fresh);
            }
        }, 5 * 60 * 1000);
    };

    if (!activeAlarm) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="max-w-xl w-full bg-[#0B1736] border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_20px_70px_rgba(16,185,129,0.25)] text-center relative overflow-hidden"
                >
                    {/* Glowing pulse ring */}
                    <div className="absolute -top-24 -left-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                    {/* Top alert pill */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                        <span>Scheduled Tablet Reminder</span>
                    </div>

                    {/* Pill Icon */}
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 mb-5 shadow-inner">
                        <Pill size={40} className="animate-pulse" />
                    </div>

                    {/* Title */}
                    <h2 
                        className="text-2xl sm:text-3xl font-serif text-white tracking-tight mb-2"
                        style={{ fontFamily: '"The Seasons", "Instrument Serif", Georgia, serif' }}
                    >
                        Time for your <span className="italic text-emerald-300">{activeAlarm.title}</span>
                    </h2>

                    {/* Instructions */}
                    <p className="text-zinc-300 text-sm sm:text-base max-w-md mx-auto mb-6 leading-relaxed">
                        {activeAlarm.notes || "Please take 1 tablet with a fresh glass of water."}
                    </p>

                    {/* Family Voice Card */}
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6 text-left flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${isPlayingAudio ? 'bg-emerald-500 text-black animate-bounce' : 'bg-white/10 text-emerald-400'}`}>
                            <Volume2 size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400/90 font-bold block">
                                {activeAlarm.voice_sender || "Family Pre-Recorded Voice Note"}
                            </span>
                            <p className="text-xs sm:text-sm text-zinc-200 italic truncate">
                                "{activeAlarm.voice_prompt || "Dad, please take your medicine. Love you."}"
                            </p>
                        </div>
                        <button
                            onClick={() => playAlarmAudio(activeAlarm)}
                            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                        >
                            <Volume2 size={13} />
                            <span>Replay</span>
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <button
                            onClick={handleConfirmTaken}
                            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-base rounded-2xl flex items-center justify-center gap-2.5 shadow-[0_10px_30px_rgba(16,185,129,0.35)] transition-all active:scale-95 cursor-pointer"
                        >
                            <CheckCircle2 size={22} />
                            <span>I Took My Medicine</span>
                        </button>

                        <button
                            onClick={handleSnooze}
                            className="w-full py-2.5 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-medium border border-white/10 flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                            <Clock size={14} />
                            <span>Remind me again in 5 minutes</span>
                        </button>
                    </div>

                    <div className="mt-4 text-[11px] text-zinc-400 flex items-center justify-center gap-1.5">
                        <Heart size={12} className="text-emerald-400" />
                        <span>Mavora Dementia Safety • Continuously gently notifying</span>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default MedicationAlarmModal;
