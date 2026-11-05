import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";
import { 
    Clock, 
    Pill, 
    CheckCircle2, 
    Plus, 
    Trash2, 
    Sun, 
    SunMedium, 
    Moon, 
    Calendar,
    Undo2,
    X,
    Mic,
    Square,
    Play,
    Volume2,
    Sparkles,
    Bell,
    Phone,
    AlertCircle,
    ShieldAlert,
    Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStoredSchedule, saveStoredSchedule, fetchScheduleFromBackend } from '../services/scheduleStore';

const CaregiverScheduleManager = () => {
    const handleSimulateGeofenceBreach = async () => {
        try {
            await axios.post(`${API_BASE}/patient/simulate_geofence_breach`, {
                distance_meters: 850,
                radius_meters: 500
            });
            setTriggerFeedback("🚨 Simulated Wandering Breach Triggered! (Patient 850m outside home)");
            setTimeout(() => setTriggerFeedback(null), 5000);
        } catch (e) {
            alert("Failed to simulate breach: " + e.message);
        }
    };

    const [schedule, setSchedule] = useState(getStoredSchedule());
    const [escalationAlert, setEscalationAlert] = useState(null);
    const [triggerFeedback, setTriggerFeedback] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [activeRecordItem, setActiveRecordItem] = useState(null); // If recording for an existing item

    // New schedule form state
    const [newTitle, setNewTitle] = useState('');
    const [newTime, setNewTime] = useState('08:30 AM');
    const [newSlot, setNewSlot] = useState('morning');
    const [newCategory, setNewCategory] = useState('medicine');
    const [newNotes, setNewNotes] = useState('');
    const [newVoiceSender, setNewVoiceSender] = useState('Rahul (Son)');
    const [newVoicePrompt, setNewVoicePrompt] = useState('Dad, please take your morning tablet with a glass of water. Love you.');
    const [audioBase64, setAudioBase64] = useState(null);

    // Recording state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerIntervalRef = useRef(null);

    useEffect(() => {
        fetchScheduleFromBackend().then(items => {
            if (items) setSchedule(items);
        });

        const handleUpdate = () => setSchedule(getStoredSchedule());
        window.addEventListener('storage_schedule_updated', handleUpdate);
        window.addEventListener('storage', handleUpdate);

        // Real-time two-way synchronization: auto-syncs when Patient clicks "I Took My Medicine" on Laptop A!
        const syncFreshSchedule = async () => {
            try {
                const fresh = await fetchScheduleFromBackend();
                if (fresh) setSchedule(fresh);
            } catch (e) {}
        };
        const schedTimer = setInterval(syncFreshSchedule, 2000);

        // Cross-laptop escalation watcher: displays emergency alert if patient ignores medication
        const pollEscalation = async () => {
            try {
                const res = await axios.get(`${API_BASE}/schedule/escalation_alert`);
                if (res.data?.active) {
                    setEscalationAlert(res.data);
                } else {
                    setEscalationAlert(null);
                }
            } catch (e) {}
        };
        const escTimer = setInterval(pollEscalation, 2000);

        return () => {
            window.removeEventListener('storage_schedule_updated', handleUpdate);
            window.removeEventListener('storage', handleUpdate);
            clearInterval(schedTimer);
            clearInterval(escTimer);
        };
    }, []);

    // Start recording from microphone
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioChunksRef.current = [];
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            recorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    setAudioBase64(reader.result);
                };
                // Stop tracks
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            alert("Microphone access denied or not available. You can still use the personalized voice text prompt!");
            console.error("Mic error:", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        }
    };

    const playPreview = (data) => {
        const url = data || audioBase64;
        if (!url) return;
        const audio = new Audio(url);
        audio.play().catch(e => console.log("Preview error:", e));
    };

    // Caregiver toggles taken / untaken
    const handleToggleGiven = async (id) => {
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const updated = schedule.map(s => {
            if (s.id === id) {
                const nextState = !s.completed;
                return {
                    ...s,
                    completed: nextState,
                    takenAt: nextState ? now : null,
                    takenBy: nextState ? 'family' : null
                };
            }
            return s;
        });
        await saveStoredSchedule(updated);
        setSchedule(updated);
    };

    // Caregiver deletes an item
    const handleDelete = async (id) => {
        const updated = schedule.filter(s => s.id !== id);
        await saveStoredSchedule(updated);
        setSchedule(updated);
    };

    // Trigger cross-laptop remote alarm to sound ONLY on patient's device (Laptop A)!
    const handleTriggerTestAlarm = async (item) => {
        const target = item || schedule.find(s => s.category === 'medicine') || schedule[1];
        try {
            await axios.post(`${API_BASE}/schedule/trigger_alarm`, {
                item: target,
                triggered_by: "Caregiver Portal"
            });
            setTriggerFeedback(`✓ Remote Alarm Signal Dispatched! Ringing on Dad's terminal for ${target.title}...`);
            setTimeout(() => setTriggerFeedback(null), 5000);
        } catch (e) {
            console.warn("Remote alarm error:", e.message);
            alert("Could not reach backend to trigger remote alarm: " + e.message);
        }
    };

    // Save newly recorded voice for an existing item
    const handleSaveVoiceForExisting = async () => {
        if (!activeRecordItem || !audioBase64) return;
        const updated = schedule.map(s => {
            if (s.id === activeRecordItem.id) {
                return {
                    ...s,
                    audioData: audioBase64,
                    voice_sender: newVoiceSender,
                    voice_prompt: newVoicePrompt
                };
            }
            return s;
        });
        await saveStoredSchedule(updated);
        setSchedule(updated);
        setActiveRecordItem(null);
        setAudioBase64(null);
        alert("Family voice note successfully attached to this medication!");
    };

    // Add new routine or medicine
    const handleAddItem = async (e) => {
        e.preventDefault();
        if (!newTitle.trim()) return;

        const newItem = {
            id: `sch-${Date.now()}`,
            time: newTime,
            slot: newSlot,
            title: newTitle,
            category: newCategory,
            notes: newNotes || "Follow usual care instructions.",
            voice_prompt: newVoicePrompt || "Please remember to take your medication.",
            voice_sender: newVoiceSender || "Family Member",
            audioData: audioBase64,
            completed: false,
            takenAt: null,
            takenBy: null
        };

        const updated = [...schedule, newItem];
        await saveStoredSchedule(updated);
        setSchedule(updated);
        setNewTitle('');
        setNewNotes('');
        setAudioBase64(null);
        setShowAddModal(false);
    };

    return (
        <div className="w-full bg-[#0B1736]/75 border border-white/15 backdrop-blur-xl rounded-3xl p-6 shadow-2xl mt-6">
            {/* Remote Trigger Toast Feedback */}
            {/* Remote Trigger Toast Feedback */}
            {triggerFeedback && (
                <div className="mb-4 p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-lg">
                    <span>{triggerFeedback}</span>
                    <button onClick={() => setTriggerFeedback(null)} className="text-emerald-400 hover:text-white font-mono text-xs">✕</button>
                </div>
            )}

            {/* Live Cross-Device Safety Escalation Banner */}
            {escalationAlert && (
                <div className="mb-6 p-4 rounded-2xl bg-red-950/90 border-2 border-red-500/80 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[0_10px_40px_rgba(239,68,68,0.35)] animate-pulse">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-600 rounded-xl text-white">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-red-300 font-bold block">
                                URGENT SAFETY ESCALATION • {escalationAlert.time || 'Just now'}
                            </span>
                            <h4 className="text-sm sm:text-base font-bold text-white">
                                Patient Did Not Acknowledge: {escalationAlert.item?.title || "Medication"}
                            </h4>
                            <p className="text-xs text-red-200">
                                Voice reminder repeated on patient device with no response. Please verify in person or call Dad.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                        <a
                            href="tel:+919876543210"
                            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
                        >
                            <Phone size={14} /> Call Dad (+91 98765 43210)
                        </a>
                        <button
                            onClick={async () => {
                                try {
                                    await axios.post(`${API_BASE}/schedule/dismiss_alarm`);
                                } catch (e) {}
                                setEscalationAlert(null);
                            }}
                            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white text-xs font-semibold rounded-xl cursor-pointer"
                        >
                            Dismiss Alert
                        </button>
                    </div>
                </div>
            )}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 text-zinc-300">
                        <Pill size={20} className="text-emerald-400" />
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[#8d8d92] block mb-1">Caregiver routines</span>
                    </div>
                    <h2 className="font-serif text-2xl sm:text-3xl text-[#f4f4f2] tracking-[-0.025em] leading-tight" style={{ fontFamily: '"The Seasons", "Instrument Serif", Georgia, serif' }}>
                        Medication & Family <span className="italic text-emerald-400">Voice Reminders</span>
                    </h2>
                    <p className="text-[#8d8d92] text-xs sm:text-sm mt-0.5">
                        Pre-record your voice so when it's time for medicine, Dad hears <span className="text-white font-semibold">your familiar voice</span> calling him softly.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSimulateGeofenceBreach}
                        className="px-3.5 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                        title="Simulate patient wandering 850m outside safe boundary"
                    >
                        <ShieldAlert size={14} />
                        <span>Simulate Geofence Alert</span>
                    </button>

                    <button
                        onClick={() => handleTriggerTestAlarm(schedule.find(s => s.category === 'medicine'))}
                        className="px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs rounded-xl flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-sm"
                        title="Simulate scheduled alarm right now"
                    >
                        <Bell size={15} />
                        <span>Trigger Alarm on Patient Device</span>
                    </button>

                    <button
                        onClick={() => {
                            setAudioBase64(null);
                            setShowAddModal(true);
                        }}
                        className="px-4 py-2.5 bg-[#FF6B5B] hover:bg-[#ff5543] text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-[#FF6B5B]/30 transition-all active:scale-95 cursor-pointer"
                    >
                        <Plus size={15} /> 
                        <span>Add Schedule / Pill</span>
                    </button>
                </div>
            </div>

            {/* Modal for recording voice on existing item */}
            <AnimatePresence>
                {activeRecordItem && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0B1736] border border-white/20 p-6 rounded-3xl max-w-md w-full shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Mic size={18} className="text-emerald-400" />
                                    <span>Record Familiar Voice for {activeRecordItem.title}</span>
                                </h3>
                                <button 
                                    onClick={() => {
                                        stopRecording();
                                        setActiveRecordItem(null);
                                    }}
                                    className="p-1 rounded-lg text-zinc-400 hover:text-white"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <p className="text-xs text-zinc-300 mb-4">
                                Speak naturally as their daughter/son. E.g., <em>"Dad, it's Sneha. Please take your blue pill with some water."</em>
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-zinc-300">Your Name / Relation</label>
                                    <input
                                        type="text"
                                        value={newVoiceSender}
                                        onChange={(e) => setNewVoiceSender(e.target.value)}
                                        className="w-full mt-1 p-2 bg-black border border-white/10 rounded-xl text-sm text-white"
                                    />
                                </div>

                                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center justify-center space-y-3">
                                    {isRecording ? (
                                        <div className="flex flex-col items-center space-y-2">
                                            <div className="w-12 h-12 rounded-full bg-red-600 animate-ping flex items-center justify-center" />
                                            <span className="text-xs font-mono font-bold text-red-400">
                                                Recording... 0:0{recordingTime}s
                                            </span>
                                            <button
                                                type="button"
                                                onClick={stopRecording}
                                                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                                            >
                                                <Square size={14} /> Stop Recording
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center space-y-2">
                                            <button
                                                type="button"
                                                onClick={startRecording}
                                                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30"
                                            >
                                                <Mic size={16} /> Tap to Record Your Voice
                                            </button>
                                            {audioBase64 && (
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-xs text-emerald-400 font-semibold font-mono">✓ Voice Captured!</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => playPreview()}
                                                        className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer"
                                                    >
                                                        <Play size={12} /> Play
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setActiveRecordItem(null)}
                                        className="px-4 py-2 text-zinc-400 text-xs font-semibold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        disabled={!audioBase64}
                                        onClick={handleSaveVoiceForExisting}
                                        className="px-5 py-2 bg-emerald-500 disabled:opacity-40 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl shadow-md cursor-pointer"
                                    >
                                        Save Voice Note
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal for adding new routine */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0B1736]/95 border border-white/20 p-6 rounded-3xl max-w-lg w-full shadow-2xl backdrop-blur-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-bold text-white">Add Daily Schedule or Medication</h3>
                                <button 
                                    onClick={() => {
                                        stopRecording();
                                        setShowAddModal(false);
                                    }}
                                    className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <form onSubmit={handleAddItem} className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-zinc-300">Title / Medicine Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Donepezil 10mg or Afternoon Walk"
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        className="w-full mt-1 p-2.5 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/30"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-semibold text-zinc-300">Time</label>
                                        <input
                                            type="text"
                                            placeholder="08:30 AM"
                                            value={newTime}
                                            onChange={(e) => setNewTime(e.target.value)}
                                            className="w-full mt-1 p-2.5 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/30 font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-zinc-300">Slot</label>
                                        <select
                                            value={newSlot}
                                            onChange={(e) => setNewSlot(e.target.value)}
                                            className="w-full mt-1 p-2.5 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/30"
                                        >
                                            <option value="morning">Morning</option>
                                            <option value="afternoon">Afternoon</option>
                                            <option value="night">Night</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-zinc-300">Category</label>
                                    <select
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        className="w-full mt-1 p-2.5 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/30"
                                    >
                                        <option value="medicine">Medicine / Pill</option>
                                        <option value="routine">General Care Routine</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-zinc-300">Care Instructions / Notes</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Take 1 tablet with warm water after eating"
                                        value={newNotes}
                                        onChange={(e) => setNewNotes(e.target.value)}
                                        className="w-full mt-1 p-2.5 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/30"
                                    />
                                </div>

                                {/* Voice Section */}
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                                            <Mic size={14} /> Familiar Family Voice Message
                                        </span>
                                        <span className="text-[10px] text-zinc-400 font-mono">Dementia Comfort</span>
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-semibold text-zinc-300">Your Relation / Name</label>
                                        <input
                                            type="text"
                                            value={newVoiceSender}
                                            onChange={(e) => setNewVoiceSender(e.target.value)}
                                            placeholder="e.g. Sneha (Daughter)"
                                            className="w-full mt-1 p-2 bg-black border border-white/10 rounded-xl text-xs text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-semibold text-zinc-300">Spoken Message Text</label>
                                        <input
                                            type="text"
                                            value={newVoicePrompt}
                                            onChange={(e) => setNewVoicePrompt(e.target.value)}
                                            placeholder="Dad, it's Sneha. Time to take your medicine."
                                            className="w-full mt-1 p-2 bg-black border border-white/10 rounded-xl text-xs text-white"
                                        />
                                    </div>

                                    {/* Record Button */}
                                    <div className="pt-1 flex items-center gap-3">
                                        {isRecording ? (
                                            <button
                                                type="button"
                                                onClick={stopRecording}
                                                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer animate-pulse"
                                            >
                                                <Square size={13} /> Stop (0:0{recordingTime}s)
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={startRecording}
                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                                            >
                                                <Mic size={13} /> Record Real Voice (Microphone)
                                            </button>
                                        )}

                                        {audioBase64 && (
                                            <button
                                                type="button"
                                                onClick={() => playPreview()}
                                                className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                            >
                                                <Play size={12} /> Test Play
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="px-4 py-2 text-zinc-400 hover:text-white text-xs font-semibold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2.5 bg-[#FF6B5B] hover:bg-[#ff5543] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#FF6B5B]/30 cursor-pointer"
                                    >
                                        Save to Schedule
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Caregiver Schedule Table */}
            <div className="space-y-3">
                {schedule.map((item) => (
                    <div 
                        key={item.id}
                        className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                            item.completed 
                                ? 'bg-[#0B1736]/40 border-white/10 opacity-80 backdrop-blur-md' 
                                : 'bg-[#070D1E]/60 border border-white/12 backdrop-blur-md hover:border-white/25'
                        }`}
                    >
                        <div className="flex items-center gap-3.5">
                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-300">
                                {item.category === 'medicine' ? <Pill size={18} className="text-emerald-400" /> : <Clock size={18} />}
                            </div>

                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-bold text-zinc-300 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded">
                                        {item.time}
                                    </span>
                                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                                        {item.slot} • {item.category}
                                    </span>
                                    {item.category === 'medicine' && (
                                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                            item.audioData 
                                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                        }`}>
                                            <Volume2 size={11} />
                                            {item.audioData ? "Family Recording Active" : "AI Voice Active"}
                                        </span>
                                    )}
                                </div>
                                <h4 className="text-sm font-bold text-white mt-1">
                                    {item.title}
                                </h4>
                                <p className="font-handwritten text-lg text-zinc-400">
                                    “{item.notes}”
                                </p>
                            </div>
                        </div>

                        {/* Status & Overrides */}
                        <div className="flex flex-wrap items-center gap-2.5 self-end md:self-center">
                            {/* Voice button */}
                            {item.category === 'medicine' && (
                                <>
                                    <button
                                        onClick={() => {
                                            setActiveRecordItem(item);
                                            setAudioBase64(item.audioData || null);
                                            setNewVoicePrompt(item.voice_prompt || '');
                                            setNewVoiceSender(item.voice_sender || 'Family Member');
                                        }}
                                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/15 text-zinc-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                                        title="Record daughter/son voice for this pill"
                                    >
                                        <Mic size={13} className="text-emerald-400" />
                                        <span>{item.audioData ? "Change Voice" : "Add Family Voice"}</span>
                                    </button>

                                    <button
                                        onClick={() => handleTriggerTestAlarm(item)}
                                        className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                                        title="Play alarm immediately on patient laptop"
                                    >
                                        <Bell size={13} />
                                        <span>Trigger on Patient Screen</span>
                                    </button>
                                </>
                            )}

                            {item.completed ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-emerald-400 font-semibold font-mono flex items-center gap-1.5 bg-zinc-950 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                                        <CheckCircle2 size={15} />
                                        Taken at {item.takenAt} ({item.takenBy === 'family' ? 'Caregiver' : 'Patient'})
                                    </span>

                                    <button
                                        onClick={() => handleToggleGiven(item.id)}
                                        title="Mark as un-taken (undo)"
                                        className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 cursor-pointer"
                                    >
                                        <Undo2 size={15} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleToggleGiven(item.id)}
                                    className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold rounded-xl active:scale-95 transition-all cursor-pointer"
                                >
                                    Mark as Given
                                </button>
                            )}

                            <button
                                onClick={() => handleDelete(item.id)}
                                className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800 cursor-pointer"
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>


        </div>
    );
};

export default CaregiverScheduleManager;
