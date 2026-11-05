import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
    Users, 
    Search, 
    RefreshCw, 
    Trash2, 
    Volume2, 
    UserX, 
    UserPlus, 
    ArrowLeft, 
    Clock, 
    Check, 
    AlertTriangle, 
    X,
    Sparkles
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

const normalizeImageSrc = (img) => {
    if (!img || typeof img !== 'string') return null;
    const trimmed = img.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
        return trimmed;
    }
    return `data:image/jpeg;base64,${trimmed}`;
};

const EnrolledMemoryBankView = ({ onBack, onEnrollNew, onSpeakText }) => {
    const [people, setPeople] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteModalPerson, setDeleteModalPerson] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [playingPersonId, setPlayingPersonId] = useState(null);
    const [actionMessage, setActionMessage] = useState(null);
    const currentAudioRef = useRef(null);

    const fetchPeople = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/people`);
            if (res.data && res.data.people) {
                setPeople(res.data.people);
            } else {
                setPeople([]);
            }
        } catch (e) {
            console.error("Error fetching enrolled people:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPeople();
    }, []);

    const stopAudio = () => {
        if (currentAudioRef.current) {
            try {
                currentAudioRef.current.pause();
            } catch (e) {}
            currentAudioRef.current = null;
        }
        setPlayingPersonId(null);
    };

    const playVoiceSample = (person) => {
        const identifier = person.id || person.name;
        if (playingPersonId === identifier) {
            stopAudio();
            return;
        }
        stopAudio();

        if (!person.audio_base64) return;

        try {
            const binaryString = window.atob(person.audio_base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            currentAudioRef.current = audio;

            audio.onended = () => {
                setPlayingPersonId(null);
                URL.revokeObjectURL(url);
                currentAudioRef.current = null;
            };

            audio.onerror = () => {
                setPlayingPersonId(null);
                currentAudioRef.current = null;
            };

            audio.play();
            setPlayingPersonId(identifier);
        } catch (e) {
            console.error("Failed to play audio sample:", e);
            setPlayingPersonId(null);
        }
    };

    const confirmDelete = async () => {
        if (!deleteModalPerson) return;
        const target = deleteModalPerson;
        setDeletingId(target.id || target.name);
        try {
            const identifier = target.id || target.name;
            const res = await axios.delete(`${API_BASE}/person/${encodeURIComponent(identifier)}`);
            if (res.data && res.data.status === 'success') {
                setPeople(prev => prev.filter(p => (p.id || p.name) !== (target.id || target.name)));
                setActionMessage({
                    type: 'success',
                    text: `Removed "${target.name}" from enrolled memory bank.`
                });
            } else {
                throw new Error("Failed to delete");
            }
        } catch (e) {
            console.error("Failed to delete person:", e);
            setActionMessage({
                type: 'error',
                text: `Could not remove "${target.name}". Please try again.`
            });
        } finally {
            setDeletingId(null);
            setDeleteModalPerson(null);
            setTimeout(() => setActionMessage(null), 4000);
        }
    };

    const filteredPeople = people.filter(p => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            (p.name && p.name.toLowerCase().includes(q)) ||
            (p.relation && p.relation.toLowerCase().includes(q)) ||
            (p.notes && p.notes.toLowerCase().includes(q))
        );
    });

    return (
        <div className="flex flex-col h-full w-full bg-transparent backdrop-blur-xl border-l border-white/10 relative overflow-y-auto">
            {/* Header */}
            <div className="p-3.5 px-6 border-b border-white/5 flex items-center justify-between bg-[#0B1736]/75 backdrop-blur-xl border-b border-white/10 sticky top-0 z-10 flex-shrink-0">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Return to Assistant"
                        >
                            <ArrowLeft size={16} />
                        </button>
                    )}
                    <div className="flex items-center gap-2">
                        <Users className="text-[#9b8afb]" size={18} />
                        <div className="flex flex-col"><span className="font-mono text-[10px] uppercase tracking-wider text-[#8d8d92]">Biometric archive</span><h2 className="font-serif text-base text-[#f4f4f2] tracking-[-0.02em]" style={{ fontFamily: '"The Seasons", "Instrument Serif", Georgia, serif' }}>Enrolled <span className="italic text-[#9b8afb]">memory bank</span></h2></div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-[#8d8d92] bg-[#0b0b0c] border border-white/10 font-mono px-2.5 py-0.5 rounded-full">
                        {people.length} {people.length === 1 ? 'Person' : 'People'}
                    </span>
                    {onEnrollNew && (
                        <button
                            onClick={onEnrollNew}
                            className="px-3 py-1.5 bg-[#FF6B5B] hover:bg-[#ff5543] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-[#FF6B5B]/30 transition-all active:scale-95 cursor-pointer"
                        >
                            <UserPlus size={14} />
                            <span>Enroll New</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Notification Banner */}
            {actionMessage && (
                <div className={`p-3 mx-6 mt-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                    actionMessage.type === 'success' 
                        ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300' 
                        : 'bg-rose-950/80 border border-rose-500/40 text-rose-300'
                }`}>
                    {actionMessage.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
                    <span>{actionMessage.text}</span>
                </div>
            )}

            {/* Content Body */}
            <div className="p-4 md:p-6 space-y-4">
                {/* Search Bar & Refresh */}
                <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/70 p-2 rounded-2xl shadow-sm">
                    <Search size={16} className="text-slate-400 ml-2" />
                    <input
                        type="text"
                        placeholder="Search enrolled people by name, relation, or memory notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none py-1"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="text-xs text-slate-400 hover:text-white px-2 py-0.5 rounded-lg"
                        >
                            Clear
                        </button>
                    )}
                    <button
                        onClick={fetchPeople}
                        disabled={loading}
                        className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                        title="Refresh List"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-500 text-xs gap-3">
                        <RefreshCw size={24} className="animate-spin text-purple-400" />
                        <span>Accessing biometric vectors & enrolled memories...</span>
                    </div>
                ) : filteredPeople.length === 0 ? (
                    <div className="bg-slate-800/50 border border-white/5 rounded-3xl p-10 text-center space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-400">
                            <UserX size={26} />
                        </div>
                        <h3 className="text-sm font-bold text-white">
                            {searchQuery ? 'No matching people found' : 'No One Currently Enrolled'}
                        </h3>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                            {searchQuery
                                ? `No enrolled people match "${searchQuery}".`
                                : 'Enroll family members, caregivers, or doctors so Mavora can recognize their face, voice, and relationship instantly.'
                            }
                        </p>
                        {onEnrollNew && !searchQuery && (
                            <button
                                onClick={onEnrollNew}
                                className="px-4 py-2 bg-[#f4f4f2] hover:bg-[#e2e2e0] text-[#0b0b0c] font-semibold rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer mt-2"
                            >
                                <UserPlus size={14} />
                                <span>Enroll First Person</span>
                            </button>
                        )}
                    </div>
                ) : (
                    /* Enrolled People Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {filteredPeople.map((person) => {
                            const imageSrc = normalizeImageSrc(person.image_base64 || person.avatar_url);
                            const isPlaying = playingPersonId === (person.id || person.name);

                            return (
                                <div
                                    key={person.id || person.name}
                                    className="bg-slate-800/80 border border-slate-700/70 hover:border-purple-500/40 rounded-2xl p-4 flex flex-col justify-between transition-all shadow-md group relative"
                                >
                                    <div>
                                        <div className="flex items-start gap-3.5 mb-3">
                                            {imageSrc ? (
                                                <img
                                                    src={imageSrc}
                                                    alt={person.name}
                                                    className="w-14 h-14 rounded-2xl object-cover border border-purple-500/30 shadow-md flex-shrink-0 bg-slate-900"
                                                />
                                            ) : (
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600/30 to-indigo-600/30 border border-purple-500/40 flex items-center justify-center font-bold text-purple-300 text-lg flex-shrink-0">
                                                    {person.name ? person.name.charAt(0).toUpperCase() : '?'}
                                                </div>
                                            )}

                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold text-white truncate" title={person.name}>
                                                    {person.name}
                                                </h4>
                                                
                                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                                        {person.relation || 'Family Contact'}
                                                    </span>
                                                    {person.age && (
                                                        <span className="text-[10px] text-slate-400">
                                                            {person.age} yrs
                                                        </span>
                                                    )}
                                                </div>

                                                {person.has_audio && (
                                                    <div className="flex items-center justify-between gap-1 text-[10px] text-emerald-400 mt-1.5 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                                                        <div className="flex items-center gap-1">
                                                            <Volume2 size={12} />
                                                            <span>Voice sample active</span>
                                                        </div>
                                                        {person.audio_base64 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => playVoiceSample(person)}
                                                                className="text-[10px] text-emerald-300 hover:text-emerald-100 font-bold ml-1 flex items-center gap-0.5 cursor-pointer"
                                                            >
                                                                {isPlaying ? "■ Stop" : "▶ Play"}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {person.notes && (
                                            <div className="p-2.5 bg-[#0b0b0c] rounded-xl border border-white/5 mb-3">
                                                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                                                    "{person.notes}"
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Footer with Timestamp and Delete Button */}
                                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Clock size={11} />
                                            {person.timestamp || 'Enrolled in memory'}
                                        </span>

                                        <button
                                            onClick={() => setDeleteModalPerson(person)}
                                            className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-1 border border-rose-500/30 transition-colors cursor-pointer"
                                            title={`Remove ${person.name} from memory`}
                                        >
                                            <Trash2 size={12} />
                                            <span>Remove</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Confirm Delete Modal */}
            {deleteModalPerson && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white">Remove from Memory?</h3>
                                <p className="text-xs text-slate-400">This action will delete biometric vectors.</p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                            Are you sure you want to remove <strong className="text-white">{deleteModalPerson.name}</strong> from Mavora's memory bank?
                        </p>

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => setDeleteModalPerson(null)}
                                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={deletingId !== null}
                                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                <Trash2 size={13} />
                                <span>{deletingId ? 'Removing...' : 'Confirm Remove'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnrolledMemoryBankView;

