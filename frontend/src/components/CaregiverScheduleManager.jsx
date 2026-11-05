import React, { useState, useEffect } from 'react';
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
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStoredSchedule, saveStoredSchedule } from '../services/scheduleStore';

const CaregiverScheduleManager = () => {
    const [schedule, setSchedule] = useState(getStoredSchedule());
    const [showAddModal, setShowAddModal] = useState(false);

    // New schedule form state
    const [newTitle, setNewTitle] = useState('');
    const [newTime, setNewTime] = useState('09:00 AM');
    const [newSlot, setNewSlot] = useState('morning');
    const [newCategory, setNewCategory] = useState('medicine');
    const [newNotes, setNewNotes] = useState('');

    useEffect(() => {
        const handleUpdate = () => setSchedule(getStoredSchedule());
        window.addEventListener('storage_schedule_updated', handleUpdate);
        window.addEventListener('storage', handleUpdate);
        return () => {
            window.removeEventListener('storage_schedule_updated', handleUpdate);
            window.removeEventListener('storage', handleUpdate);
        };
    }, []);

    // Caregiver toggles taken / untaken
    const handleToggleGiven = (id) => {
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
        saveStoredSchedule(updated);
        setSchedule(updated);
    };

    // Caregiver deletes an item
    const handleDelete = (id) => {
        const updated = schedule.filter(s => s.id !== id);
        saveStoredSchedule(updated);
        setSchedule(updated);
    };

    // Add new routine or medicine
    const handleAddItem = (e) => {
        e.preventDefault();
        if (!newTitle.trim()) return;

        const newItem = {
            id: `sch-${Date.now()}`,
            time: newTime,
            slot: newSlot,
            title: newTitle,
            category: newCategory,
            notes: newNotes || "Follow usual care instructions.",
            completed: false,
            takenAt: null,
            takenBy: null
        };

        const updated = [...schedule, newItem];
        saveStoredSchedule(updated);
        setSchedule(updated);
        setNewTitle('');
        setNewNotes('');
        setShowAddModal(false);
    };

    return (
        <div className="w-full bg-[#0B1736]/75 border border-white/15 backdrop-blur-xl rounded-3xl p-6 shadow-2xl mt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 text-zinc-300">
                        <Pill size={20} />
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[#8d8d92] block mb-1">Caregiver routines</span>
                        <h2 className="font-serif text-2xl sm:text-3xl text-[#f4f4f2] tracking-[-0.025em] leading-tight" style={{ fontFamily: '"The Seasons", "Instrument Serif", Georgia, serif' }}>
                            Medication & daily <span className="italic text-[#9b8afb]">routines</span>
                        </h2>
                    </div>
                    <p className="text-[#8d8d92] text-xs sm:text-sm mt-0.5">
                        Carefully scheduled reminders synchronize with their screen in real time.
                    </p>
                </div>

                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2.5 bg-[#FF6B5B] hover:bg-[#ff5543] text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-[#FF6B5B]/30 transition-all active:scale-95 cursor-pointer"
                >
                    <Plus size={15} /> 
                    <span>Add Schedule / Pill</span>
                </button>
            </div>

            {/* Modal for adding new routine */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0B1736]/95 border border-white/20 p-6 rounded-3xl max-w-lg w-full shadow-2xl backdrop-blur-2xl"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-bold text-white">Add Daily Schedule or Medication</h3>
                                <button 
                                    onClick={() => setShowAddModal(false)}
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
                                            <option value="morning">Morning (🌅)</option>
                                            <option value="afternoon">Afternoon (☀️)</option>
                                            <option value="night">Night (🌙)</option>
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
                                        <option value="medicine">💊 Prescription Medicine</option>
                                        <option value="routine">⏰ Routine Activity / Habit</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-zinc-300">Instructions / Notes</label>
                                    <textarea
                                        rows="2"
                                        placeholder="e.g. Take 1 tablet with warm milk after dinner"
                                        value={newNotes}
                                        onChange={(e) => setNewNotes(e.target.value)}
                                        className="w-full mt-1 p-2.5 bg-black border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/30"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="px-4 py-2 bg-zinc-900 text-zinc-300 text-xs font-semibold rounded-xl hover:bg-zinc-800"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2 bg-[#FF6B5B] hover:bg-[#ff5543] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#FF6B5B]/30"
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
                                {item.category === 'medicine' ? <Pill size={18} /> : <Clock size={18} />}
                            </div>

                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-bold text-zinc-300 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded">
                                        {item.time}
                                    </span>
                                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                                        {item.slot} • {item.category}
                                    </span>
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
                        <div className="flex items-center gap-3 self-end md:self-center">
                            {item.completed ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-emerald-400 font-semibold font-mono flex items-center gap-1.5 bg-zinc-950 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                                        <CheckCircle2 size={15} />
                                        Given at {item.takenAt} ({item.takenBy === 'family' ? 'Caregiver' : 'Patient'})
                                    </span>
                                    <button
                                        onClick={() => handleToggleGiven(item.id)}
                                        title="Mark as un-taken (undo)"
                                        className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
                                    >
                                        <Undo2 size={15} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleToggleGiven(item.id)}
                                    className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold rounded-xl active:scale-95 transition-all cursor-pointer"
                                >
                                    Mark as Given by Family
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
