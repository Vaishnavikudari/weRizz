import React, { useState, useEffect } from 'react';
import CaregiverScheduleManager from '../components/CaregiverScheduleManager';
import CaregiverAddressManager from '../components/CaregiverAddressManager';
import axios from 'axios';
import { 
    UserPlus, 
    Calendar, 
    ShieldCheck, 
    Sparkles, 
    UploadCloud, 
    Check, 
    Trash2, 
    Users, 
    RefreshCw, 
    Search, 
    Volume2, 
    AlertTriangle, 
    UserX,
    Clock,
    X,
    Edit2,
    Mic,
    Camera,
    Play,
    Pause,
    CheckCircle2,
    MapPin,
    Home
} from 'lucide-react';
import AudioRecorder from '../components/AudioRecorder';

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

const CaregiverPortal = () => {
    const [activeSection, setActiveSection] = useState('enroll'); // 'enroll' | 'enrolled' | 'schedule'
    
    // People list state
    const [people, setPeople] = useState([]);
    const [loadingPeople, setLoadingPeople] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteModalPerson, setDeleteModalPerson] = useState(null); // Person to delete
    const [deletingId, setDeletingId] = useState(null);
    const [actionMessage, setActionMessage] = useState(null); // { type: 'success'|'error', text: '' }
    const [showClearAllModal, setShowClearAllModal] = useState(false);
    const [clearingAll, setClearingAll] = useState(false);

    // Edit Person Modal state
    const [editModalPerson, setEditModalPerson] = useState(null);
    const [editFormData, setEditFormData] = useState({ name: '', relation: '', notes: '', age: '' });
    const [editFile, setEditFile] = useState(null);
    const [editFilePreview, setEditFilePreview] = useState(null);
    const [editAudioBlob, setEditAudioBlob] = useState(null);
    const [editError, setEditError] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [editUseCamera, setEditUseCamera] = useState(false);
    const editVideoRef = React.useRef(null);
    const [editCameraStream, setEditCameraStream] = useState(null);

    // Record Voice Modal state
    const [recordModalPerson, setRecordModalPerson] = useState(null);
    const [recordAudioBlob, setRecordAudioBlob] = useState(null);
    const [savingAudio, setSavingAudio] = useState(false);

    // Audio Playback state
    const audioRef = React.useRef(new Audio());
    const [playingPersonId, setPlayingPersonId] = useState(null);

    const playVoiceSample = (person) => {
        const pid = person.id || person.name;
        if (playingPersonId === pid) {
            audioRef.current.pause();
            setPlayingPersonId(null);
            return;
        }
        if (person.audio_base64) {
            const src = person.audio_base64.startsWith("data:") 
                ? person.audio_base64 
                : `data:audio/webm;base64,${person.audio_base64}`;
            audioRef.current.src = src;
            audioRef.current.play().then(() => {
                setPlayingPersonId(pid);
            }).catch(e => console.warn("Audio play error", e));
            audioRef.current.onended = () => setPlayingPersonId(null);
        }
    };

    const openEditModal = (person) => {
        setEditModalPerson(person);
        setEditFormData({
            name: person.name || '',
            relation: person.relation || '',
            notes: person.notes || '',
            age: person.age || ''
        });
        setEditFile(null);
        setEditFilePreview(person.image_base64 || person.avatar_url || null);
        setEditAudioBlob(null);
        setEditError(null);
        setEditUseCamera(false);
    };

    const openRecordModal = (person) => {
        setRecordModalPerson(person);
        setRecordAudioBlob(null);
    };

    const handleUpdatePerson = async (e) => {
        e?.preventDefault();
        if (!editModalPerson) return;
        setUpdating(true);
        setEditError(null);

        try {
            const identifier = editModalPerson.id || editModalPerson.name;
            const formPayload = new FormData();
            if (editFormData.name) formPayload.append("name", editFormData.name);
            if (editFormData.relation) formPayload.append("relation", editFormData.relation);
            if (editFormData.notes !== undefined) formPayload.append("notes", editFormData.notes);
            if (editFormData.age) formPayload.append("age", editFormData.age);
            if (editFile) formPayload.append("file", editFile);
            if (editAudioBlob) formPayload.append("audio_file", editAudioBlob, "voice.webm");

            const res = await axios.put(`${API_BASE}/person/${encodeURIComponent(identifier)}`, formPayload, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            if (res.data && res.data.status === "success") {
                setActionMessage({ type: 'success', text: `Updated ${editFormData.name || editModalPerson.name}'s memory bank record!` });
                setEditModalPerson(null);
                fetchPeople();
                setTimeout(() => setActionMessage(null), 4000);
            } else {
                setEditError(res.data?.message || "Failed to update person.");
            }
        } catch (err) {
            console.error("Error updating person:", err);
            setEditError(err.response?.data?.detail || err.message || "Failed to update person.");
        } finally {
            setUpdating(false);
        }
    };

    const handleSaveVoiceOnly = async () => {
        if (!recordModalPerson || !recordAudioBlob) return;
        setSavingAudio(true);
        try {
            const identifier = recordModalPerson.id || recordModalPerson.name;
            const formPayload = new FormData();
            formPayload.append("audio_file", recordAudioBlob, "voice.webm");

            await axios.put(`${API_BASE}/person/${encodeURIComponent(identifier)}`, formPayload, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            setActionMessage({ type: 'success', text: `Voice recording updated for ${recordModalPerson.name}!` });
            setRecordModalPerson(null);
            setRecordAudioBlob(null);
            fetchPeople();
            setTimeout(() => setActionMessage(null), 4000);
        } catch (err) {
            console.error("Error updating voice:", err);
            alert(err.response?.data?.detail || "Failed to update voice.");
        } finally {
            setSavingAudio(false);
        }
    };

    // Enrollment form state
    const [formData, setFormData] = useState({ name: '', relation: '', notes: '', age: '' });
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [audioBlob, setAudioBlob] = useState(null);
    const [status, setStatus] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);

    // Fetch enrolled people from backend
    const fetchPeople = async () => {
        setLoadingPeople(true);
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
            setLoadingPeople(false);
        }
    };

    useEffect(() => {
        fetchPeople();
    }, []);

    // Delete single person manually
    const confirmDelete = async () => {
        if (!deleteModalPerson) return;
        const target = deleteModalPerson;
        setDeletingId(target.id);
        try {
            const identifier = target.id || target.name;
            const res = await axios.delete(`${API_BASE}/person/${encodeURIComponent(identifier)}`);
            if (res.data && res.data.status === 'success') {
                setPeople(prev => prev.filter(p => p.id !== target.id && p.name !== target.name));
                setActionMessage({
                    type: 'success',
                    text: `Removed "${target.name}" from memory bank.`
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

    // Clear all memory manually
    const confirmClearAll = async () => {
        setClearingAll(true);
        try {
            const res = await axios.post(`${API_BASE}/memory/clear`);
            if (res.data && res.data.status === 'success') {
                setPeople([]);
                setActionMessage({
                    type: 'success',
                    text: "All biometric memory records and enrolled profiles have been completely freed."
                });
            }
        } catch (e) {
            console.error("Failed to clear all memory:", e);
            setActionMessage({
                type: 'error',
                text: "Failed to clear memory bank. Please try again."
            });
        } finally {
            setClearingAll(false);
            setShowClearAllModal(false);
            setTimeout(() => setActionMessage(null), 4000);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name) return alert("Please enter a name.");
        if (!file) return alert("Please upload a photo.");

        setStatus('submitting');
        const data = new FormData();
        data.append('name', formData.name);
        data.append('relation', formData.relation || 'Family');
        data.append('notes', formData.notes || '');
        if (formData.age) data.append('age', formData.age);
        data.append('file', file);
        if (audioBlob) data.append('audio_file', audioBlob, 'voice.webm');

        setErrorMessage(null);
        try {
            const res = await axios.post(`${API_BASE}/remember/person`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data && res.data.status === 'stored') {
                setStatus('success');
                await fetchPeople();
                setTimeout(() => {
                    setStatus(null);
                    setFormData({ name: '', relation: '', notes: '', age: '' });
                    setFile(null);
                    setFilePreview(null);
                    setAudioBlob(null);
                    setActiveSection('enrolled');
                }, 1200);
            } else {
                setStatus('error');
                setErrorMessage(res.data?.message || 'Could not enroll person. Please try again.');
            }
        } catch (e) {
            console.error(e);
            setStatus('error');
            const detail = e.response?.data?.detail || e.message || 'Server connection error';
            setErrorMessage(`Failed to save: ${detail}`);
        }
    };

    const filteredPeople = people.filter(p => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (p.name && p.name.toLowerCase().includes(q)) ||
            (p.relation && p.relation.toLowerCase().includes(q)) ||
            (p.notes && p.notes.toLowerCase().includes(q))
        );
    });

    return (
        <div className="w-full min-h-full bg-transparent text-white px-4 pt-6 pb-20 md:px-8 md:pt-8 md:pb-24">
            {/* Top Caregiver Header */}
            <div className="max-w-6xl w-full mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <div>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[#F4EDE0]/70 mb-2 block">
                        Caretaker & family control panel
                    </span>
                    <h1 
                        className="font-serif text-3xl sm:text-4xl text-[#F4EDE0] tracking-tight leading-snug mb-2"
                        style={{ fontFamily: '"The Seasons", "Instrument Serif", Georgia, serif' }}
                    >
                        Caregiver management <span className="italic text-[#FF6B5B]">portal</span>
                    </h1>
                    <p className="text-[#F4EDE0]/70 text-sm leading-[1.6]">
                        Manage enrolled loved ones, inspect biometric memory, and schedule medication routines.
                    </p>
                </div>

                {/* Sub-tab selection */}
                <div className="flex bg-[#0B1736]/75 border border-white/15 backdrop-blur-xl p-1.5 rounded-2xl gap-1">
                    <button
                        onClick={() => setActiveSection('enroll')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                            activeSection === 'enroll'
                                ? 'bg-[#FF6B5B] text-white shadow-lg shadow-[#FF6B5B]/30 font-bold'
                                : 'text-[#F4EDE0]/60 hover:text-white'
                        }`}
                    >
                        <UserPlus size={15} /> Enroll New Person
                    </button>
                    <button
                        onClick={() => { setActiveSection('enrolled'); fetchPeople(); }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                            activeSection === 'enrolled'
                                ? 'bg-[#FF6B5B] text-white shadow-lg shadow-[#FF6B5B]/30 font-bold'
                                : 'text-[#F4EDE0]/60 hover:text-white'
                        }`}
                    >
                        <Users size={15} /> 
                        <span>Enrolled Memory Bank</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                            activeSection === 'enrolled' ? 'bg-black/10 text-black font-semibold' : 'bg-white/10 text-[#F4EDE0]/60'
                        }`}>
                            {people.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveSection('schedule')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                            activeSection === 'schedule'
                                ? 'bg-[#FF6B5B] text-white shadow-lg shadow-[#FF6B5B]/30 font-bold'
                                : 'text-[#F4EDE0]/60 hover:text-white'
                        }`}
                    >
                        <Calendar size={15} /> Routines & Schedule
                    </button>
                    <button
                        onClick={() => setActiveSection('address')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                            activeSection === 'address'
                                ? 'bg-[#FF6B5B] text-white shadow-lg shadow-[#FF6B5B]/30 font-bold'
                                : 'text-[#F4EDE0]/60 hover:text-white'
                        }`}
                    >
                        <MapPin size={15} /> Safe Zone & Address
                    </button>
                </div>
            </div>

            {/* Notification Banner */}
            {actionMessage && (
                <div className="max-w-6xl w-full mx-auto mb-4">
                    <div className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold border ${
                        actionMessage.type === 'success' 
                            ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300' 
                            : 'bg-rose-950/70 border-rose-500/40 text-rose-300'
                    }`}>
                        <div className="flex items-center gap-2">
                            {actionMessage.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
                            <span>{actionMessage.text}</span>
                        </div>
                        <button onClick={() => setActionMessage(null)} className="opacity-70 hover:opacity-100">
                            <X size={14} />
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-6xl w-full mx-auto">
                {/* 1. ENROLLED MEMORY BANK VIEW */}
                {activeSection === 'enrolled' && (
                    <div className="space-y-6">
                        {/* Search & Actions Bar */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0B1736]/75 border border-white/15 backdrop-blur-xl p-4 rounded-2xl">
                            <div className="relative flex-1">
                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F4EDE0]/60" />
                                <input
                                    type="text"
                                    placeholder="Search enrolled people by name, relation, or memory notes..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-[#070D1E]/60 border border-white/15 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-white/50 focus:outline-none focus:border-[#FF6B5B]/60"
                                />
                                {searchQuery && (
                                    <button 
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F4EDE0]/50 hover:text-white text-xs"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={fetchPeople}
                                    disabled={loadingPeople}
                                    className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#F4EDE0]/80 text-xs font-semibold flex items-center gap-2 border border-[#F4EDE0]/15 transition-colors disabled:opacity-50"
                                    title="Refresh list"
                                >
                                    <RefreshCw size={14} className={loadingPeople ? 'animate-spin' : ''} />
                                    <span>Refresh</span>
                                </button>

                                {people.length > 0 && (
                                    <button
                                        onClick={() => setShowClearAllModal(true)}
                                        className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-1.5 border border-rose-500/30 transition-colors"
                                        title="Clear all enrolled individuals from memory"
                                    >
                                        <Trash2 size={14} />
                                        <span>Clear All Memory</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* List Content */}
                        {loadingPeople ? (
                            <div className="py-20 flex flex-col items-center justify-center text-[#F4EDE0]/50 text-xs gap-3">
                                <RefreshCw size={24} className="animate-spin text-zinc-300" />
                                <span>Scanning Qdrant biometric vectors & neural memories...</span>
                            </div>
                        ) : filteredPeople.length === 0 ? (
                            <div className="bg-[#0B1736]/75 border border-white/15 backdrop-blur-xl rounded-3xl p-10 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-4 text-zinc-300">
                                    <UserX size={26} />
                                </div>
                                <h3 className="text-base font-bold text-white mb-1">
                                    {searchQuery ? 'No matching people found' : 'No One Currently Enrolled'}
                                </h3>
                                <p className="text-xs text-[#F4EDE0]/60 max-w-md mx-auto mb-6">
                                    {searchQuery
                                        ? `No enrolled records match "${searchQuery}". Try a different keyword.`
                                        : 'The neural memory bank is completely free and empty. Enroll family members, relatives, or doctors so Mavora can instantly recognize their faces and voices.'
                                    }
                                </p>
                                {searchQuery ? (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl"
                                    >
                                        Clear Search
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setActiveSection('enroll')}
                                        className="px-5 py-2.5 bg-white hover:bg-zinc-200 text-black font-semibold text-xs font-bold rounded-xl shadow-sm inline-flex items-center gap-2"
                                    >
                                        <UserPlus size={15} /> Enroll First Loved One
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredPeople.map((person) => {
                                    const imageSrc = person.image_base64 || person.avatar_url;
                                    return (
                                        <div 
                                            key={person.id || person.name}
                                            className="bg-[#0B1736]/75 border border-white/15 backdrop-blur-xl hover:border-white/30 rounded-2xl p-5 flex flex-col justify-between transition-all group"
                                        >
                                            <div>
                                                {/* Header row with avatar and basic info */}
                                                <div className="flex items-start gap-3.5 mb-3.5">
                                                    {imageSrc ? (
                                                        <img 
                                                            src={imageSrc} 
                                                            alt={person.name} 
                                                            className="w-14 h-14 rounded-2xl object-cover border border-[#F4EDE0]/15 shadow-md flex-shrink-0 bg-slate-900" 
                                                        />
                                                    ) : (
                                                        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-[#F4EDE0]/15 flex items-center justify-center font-bold text-violet-300 text-lg flex-shrink-0">
                                                            {person.name ? person.name.charAt(0).toUpperCase() : '?'}
                                                        </div>
                                                    )}

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-1">
                                                            <h4 className="text-sm font-bold text-white truncate" title={person.name}>
                                                                {person.name}
                                                            </h4>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/15 text-violet-300 border border-[#F4EDE0]/15">
                                                                {person.relation || 'Family Contact'}
                                                            </span>
                                                            {person.age && (
                                                                <span className="text-[10px] text-[#F4EDE0]/60">
                                                                    {person.age} yrs
                                                                </span>
                                                            )}
                                                        </div>

                                                        {person.has_audio && (
                                                            <div className="flex items-center justify-between gap-1 text-[10px] text-emerald-400 mt-1 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                                                                <div className="flex items-center gap-1">
                                                                    <Volume2 size={12} />
                                                                    <span>Voice profile active</span>
                                                                </div>
                                                                {person.audio_base64 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            playVoiceSample(person);
                                                                        }}
                                                                        className="text-[10px] text-emerald-300 hover:text-emerald-100 font-bold ml-1 flex items-center gap-0.5"
                                                                    >
                                                                        {playingPersonId === (person.id || person.name) ? (
                                                                            <>
                                                                                <Pause size={10} className="fill-current" />
                                                                                <span>Stop</span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Play size={10} className="fill-current" />
                                                                                <span>Play</span>
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Memory / Notes snippet */}
                                                {person.notes ? (
                                                    <div className="bg-[#17171e] border border-[#F4EDE0]/10 rounded-xl p-2.5 text-[11px] text-[#F4EDE0]/80 line-clamp-3 leading-relaxed mb-3">
                                                        <span className="text-[#F4EDE0]/50 font-semibold uppercase text-[9px] block mb-0.5">Whisper Context:</span>
                                                        {person.notes}
                                                    </div>
                                                ) : (
                                                    <div className="bg-[#17171e]/50 border border-[#F4EDE0]/10 rounded-xl p-2 text-[10px] text-[#F4EDE0]/50 italic mb-3">
                                                        No extra memory notes saved.
                                                    </div>
                                                )}
                                            </div>

                                            {/* Bottom row actions */}
                                            <div className="pt-3 border-t border-[#F4EDE0]/10 flex items-center justify-between gap-2 flex-wrap">
                                                <span className="text-[9px] text-[#F4EDE0]/50 font-mono truncate max-w-[80px]">
                                                    ID: {person.id ? person.id.slice(0, 8) : 'biometric'}...
                                                </span>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <button
                                                        onClick={() => openRecordModal(person)}
                                                        className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all border ${
                                                            person.has_audio 
                                                                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                                                                : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                                                        }`}
                                                        title={person.has_audio ? `Re-record or update voice for ${person.name}` : `Record voice for ${person.name}`}
                                                    >
                                                        <Mic size={12} />
                                                        <span>{person.has_audio ? "Re-record" : "Record Voice"}</span>
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(person)}
                                                        className="px-2.5 py-1.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-all border border-[#F4EDE0]/15"
                                                        title={`Edit details for ${person.name}`}
                                                    >
                                                        <Edit2 size={12} />
                                                        <span>Edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteModalPerson(person)}
                                                        className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-all border border-rose-500/30 hover:border-rose-500"
                                                        title={`Remove ${person.name} from memory`}
                                                    >
                                                        <Trash2 size={12} />
                                                        <span>Remove</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* 2. ENROLL FORM VIEW */}
                {activeSection === 'enroll' && (
                    <div className="bg-[#0B1736]/75 border border-white/15 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl">
                        <div className="mb-6 flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Sparkles size={20} className="text-zinc-300" />
                                    Enroll Loved One to Patient's Memory Bank
                                </h2>
                                <p className="text-xs text-[#F4EDE0]/60 mt-1">
                                    Upload a face photo and relationship context so the AI can automatically recognize them and whisper reassurance.
                                </p>
                            </div>
                            <button
                                onClick={() => setActiveSection('enrolled')}
                                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#F4EDE0]/80 text-xs font-semibold border border-[#F4EDE0]/15"
                            >
                                Back to Memory Bank
                            </button>
                        </div>

                        {status === 'success' && (
                            <div className="p-4 mb-6 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl flex items-center gap-3 text-emerald-300 font-bold text-sm">
                                <Check size={20} />
                                <div>
                                    <p>Person successfully enrolled into Qdrant memory!</p>
                                    <p className="text-xs text-emerald-400/80 font-normal">Switching to Enrolled Memory Bank...</p>
                                </div>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="p-4 mb-6 bg-rose-950/80 border border-rose-500/50 rounded-2xl flex items-center gap-3 text-rose-300 font-bold text-sm">
                                <AlertTriangle size={20} />
                                <div>
                                    <p>{errorMessage || 'Enrollment failed. Please check photo and server connection.'}</p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-[#F4EDE0]/80">Full Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Rahul Sharma"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full mt-1 p-3 bg-[#070D1E]/60 border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-[#F4EDE0]/80">Relationship to Patient *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Grandson / Daughter / Doctor"
                                        value={formData.relation}
                                        onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                                        className="w-full mt-1 p-3 bg-[#070D1E]/60 border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-[#F4EDE0]/80">Key Memories & Context Notes (What should Mavora whisper to patient?)</label>
                                <textarea
                                    rows="3"
                                    placeholder="e.g. Loves acoustic guitar, visits on Sundays, brought jalebis last week."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full mt-1 p-3 bg-[#070D1E]/60 border border-white/15 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                {/* Photo Upload */}
                                <div>
                                    <label className="text-xs font-semibold text-[#F4EDE0]/80 block mb-2">Face Photo *</label>
                                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/20 hover:border-[#FF6B5B]/60 p-6 rounded-2xl cursor-pointer bg-[#070D1E]/60 transition-all">
                                        {filePreview ? (
                                            <img src={filePreview} alt="Preview" className="max-h-40 rounded-xl object-contain shadow" />
                                        ) : (
                                            <div className="text-center text-[#F4EDE0]/60">
                                                <UploadCloud size={32} className="mx-auto mb-2 text-zinc-300" />
                                                <span className="text-xs font-bold text-slate-200">Click to Upload Photo</span>
                                                <p className="text-[10px] text-[#F4EDE0]/50 mt-1">JPEG, PNG with clear front face</p>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const f = e.target.files[0];
                                                if (f) {
                                                    setFile(f);
                                                    setFilePreview(URL.createObjectURL(f));
                                                }
                                            }}
                                        />
                                    </label>
                                </div>

                                {/* Voice Sample (Optional) */}
                                <div>
                                    <label className="text-xs font-semibold text-[#F4EDE0]/80 block mb-2">Voice Recording (Optional)</label>
                                    <div className="p-4 bg-[#070D1E]/60 border border-white/15 rounded-2xl h-[140px] flex flex-col items-center justify-center">
                                        <AudioRecorder onRecordingComplete={(blob) => setAudioBlob(blob)} />
                                        <p className="text-[10px] text-[#F4EDE0]/50 mt-2 text-center">Record a reassuring greeting like "Hello Dad, it's Rahul!"</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setActiveSection('enrolled')}
                                    className="px-5 py-3 bg-white/5 hover:bg-white/10 text-[#F4EDE0]/80 font-bold text-xs rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={status === 'submitting'}
                                    className="px-8 py-3 bg-[#FF6B5B] hover:bg-[#ff5543] text-white font-bold text-xs rounded-xl shadow-lg shadow-[#FF6B5B]/30 transition-all disabled:opacity-50"
                                >
                                    {status === 'submitting' ? 'Generating Face Vectors...' : 'Save Person to Memory'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* 3. SCHEDULE & ROUTINE VIEW */}
                {activeSection === 'schedule' && (
                    <CaregiverScheduleManager />
                )}

                {/* 4. SAFE ZONE & HOME ADDRESS VIEW */}
                {activeSection === 'address' && (
                    <CaregiverAddressManager />
                )}
            </div>

            {/* CONFIRM DELETE MODAL */}
            {deleteModalPerson && (
                <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#14141a] border border-rose-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
                            <Trash2 size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">
                            Remove {deleteModalPerson.name} from Memory?
                        </h3>
                        <p className="text-xs text-[#F4EDE0]/60 leading-relaxed mb-6">
                            This will permanently delete <span className="text-white font-semibold">{deleteModalPerson.name}</span>'s 512-dimension face vectors, voice sample, and semantic memory facts from Qdrant. The AI assistant will no longer recognize them.
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => setDeleteModalPerson(null)}
                                disabled={Boolean(deletingId)}
                                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#F4EDE0]/80 text-xs font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={Boolean(deletingId)}
                                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/30 flex items-center gap-2"
                            >
                                {deletingId ? (
                                    <>
                                        <RefreshCw size={14} className="animate-spin" />
                                        <span>Deleting...</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={14} />
                                        <span>Yes, Remove</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CONFIRM CLEAR ALL MODAL */}
            {showClearAllModal && (
                <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#14141a] border border-rose-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
                            <AlertTriangle size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">
                            Clear Entire Memory Bank?
                        </h3>
                        <p className="text-xs text-[#F4EDE0]/60 leading-relaxed mb-6">
                            Are you sure you want to remove <span className="text-rose-400 font-semibold">all {people.length} enrolled individuals</span>? All face vector collections, voice records, and context facts will be completely freed.
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => setShowClearAllModal(false)}
                                disabled={clearingAll}
                                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#F4EDE0]/80 text-xs font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmClearAll}
                                disabled={clearingAll}
                                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/30 flex items-center gap-2"
                            >
                                {clearingAll ? (
                                    <>
                                        <RefreshCw size={14} className="animate-spin" />
                                        <span>Clearing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={14} />
                                        <span>Yes, Clear All Memory</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* EDIT PERSON MODAL */}
            {editModalPerson && (
                <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-[#14141a] border border-[#F4EDE0]/15 rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#F4EDE0]/15">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-[#F4EDE0]/15 flex items-center justify-center text-zinc-300">
                                    <Edit2 size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">
                                        Edit Memory: {editModalPerson.name}
                                    </h3>
                                    <p className="text-xs text-[#F4EDE0]/60">
                                        Update details, whisper context, face biometric photo, or voice recording.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setEditModalPerson(null)}
                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-[#F4EDE0]/60 hover:text-white flex items-center justify-center transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {editError && (
                            <div className="p-3 mb-4 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-300 text-xs font-medium flex items-center gap-2">
                                <AlertTriangle size={16} />
                                <span>{editError}</span>
                            </div>
                        )}

                        <form onSubmit={handleUpdatePerson} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#F4EDE0]/80 uppercase tracking-wider mb-1.5">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={editFormData.name}
                                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                        required
                                        className="w-full bg-[#1b1b24] border border-[#F4EDE0]/15 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#F4EDE0]/80 uppercase tracking-wider mb-1.5">
                                        Relation to Patient *
                                    </label>
                                    <input
                                        type="text"
                                        value={editFormData.relation}
                                        onChange={(e) => setEditFormData({ ...editFormData, relation: e.target.value })}
                                        required
                                        placeholder="e.g. Daughter, Son, Spouse"
                                        className="w-full bg-[#1b1b24] border border-[#F4EDE0]/15 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500"
                                    />
                                </div>
                            </div>

                            {/* Quick relation pills */}
                            <div className="flex flex-wrap gap-1.5">
                                {["Daughter", "Son", "Spouse", "Grandchild", "Sister", "Brother", "Caregiver", "Doctor"].map((rel) => (
                                    <button
                                        key={rel}
                                        type="button"
                                        onClick={() => setEditFormData({ ...editFormData, relation: rel })}
                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all border ${
                                            editFormData.relation === rel 
                                                ? 'bg-violet-600 text-white border-violet-500' 
                                                : 'bg-white/5 text-[#F4EDE0]/60 border-[#F4EDE0]/10 hover:bg-white/10 hover:text-white'
                                        }`}
                                    >
                                        {rel}
                                    </button>
                                ))}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#F4EDE0]/80 uppercase tracking-wider mb-1.5">
                                    Whisper Context / Memory Notes
                                </label>
                                <textarea
                                    rows="3"
                                    value={editFormData.notes}
                                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                                    placeholder="e.g. She visits every weekend. Loves gardening. Bring her favorite ginger tea."
                                    className="w-full bg-[#1b1b24] border border-[#F4EDE0]/15 rounded-xl p-3 text-white text-xs leading-relaxed focus:outline-none focus:border-violet-500"
                                />
                                <span className="text-[10px] text-[#F4EDE0]/50 mt-1 block">
                                    The AI assistant reads or whispers these context notes when comforting the patient.
                                </span>
                            </div>

                            {/* Photo Replacement */}
                            <div className="p-3.5 bg-[#171720] border border-[#F4EDE0]/10 rounded-2xl">
                                <label className="block text-xs font-bold text-[#F4EDE0]/80 uppercase tracking-wider mb-2">
                                    Update Face Photo (Biometric Embedding)
                                </label>
                                <div className="flex items-center gap-4">
                                    {editFilePreview ? (
                                        <img 
                                            src={editFilePreview} 
                                            alt="Preview" 
                                            className="w-16 h-16 rounded-xl object-cover border border-[#F4EDE0]/15 bg-slate-900 flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 rounded-xl bg-zinc-900 border border-[#F4EDE0]/15 flex items-center justify-center text-violet-300 font-bold flex-shrink-0">
                                            ?
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const f = e.target.files[0];
                                                if (f) {
                                                    setEditFile(f);
                                                    setEditFilePreview(URL.createObjectURL(f));
                                                }
                                            }}
                                            className="text-xs text-[#F4EDE0]/60 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-violet-600/30 file:text-violet-300 hover:file:bg-violet-600/50"
                                        />
                                        <p className="text-[10px] text-[#F4EDE0]/50 mt-1">
                                            Leave empty to keep existing photo and 512-dim facial vectors.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Voice Recording Section */}
                            <div className="p-3.5 bg-[#171720] border border-[#F4EDE0]/10 rounded-2xl">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-bold text-[#F4EDE0]/80 uppercase tracking-wider flex items-center gap-1.5">
                                        <Mic size={14} className="text-zinc-300" />
                                        Voice Profile & Reassurance Message
                                    </label>
                                    {editModalPerson.has_audio && (
                                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                            Current Voice Active
                                        </span>
                                    )}
                                </div>

                                {editModalPerson.audio_base64 && !editAudioBlob && (
                                    <div className="mb-3 p-2 bg-[#1b1b26] rounded-xl flex items-center justify-between">
                                        <span className="text-[11px] text-[#F4EDE0]/60 font-medium">Listen to existing voice sample:</span>
                                        <button
                                            type="button"
                                            onClick={() => playVoiceSample(editModalPerson)}
                                            className="px-3 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 text-xs font-bold flex items-center gap-1 border border-emerald-500/30"
                                        >
                                            {playingPersonId === (editModalPerson.id || editModalPerson.name) ? (
                                                <>
                                                    <Pause size={12} /> Stop
                                                </>
                                            ) : (
                                                <>
                                                    <Play size={12} /> Play
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}

                                <p className="text-[11px] text-[#F4EDE0]/60 mb-2">
                                    Record a new audio clip to replace or set their voice recording:
                                </p>
                                <AudioRecorder onRecordingComplete={(blob) => setEditAudioBlob(blob)} />
                                {editAudioBlob && (
                                    <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1.5 font-medium">
                                        <CheckCircle2 size={13} />
                                        <span>New voice recording ready to save!</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F4EDE0]/15">
                                <button
                                    type="button"
                                    onClick={() => setEditModalPerson(null)}
                                    disabled={updating}
                                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#F4EDE0]/80 text-xs font-semibold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="px-6 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                                >
                                    {updating ? (
                                        <>
                                            <RefreshCw size={14} className="animate-spin" />
                                            <span>Saving Updates...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Check size={14} />
                                            <span>Save Changes</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* QUICK RECORD VOICE MODAL */}
            {recordModalPerson && (
                <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#14141a] border border-emerald-500/40 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#F4EDE0]/15">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                                    <Mic size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-white">
                                        Voice Memory: {recordModalPerson.name}
                                    </h3>
                                    <p className="text-xs text-[#F4EDE0]/60">
                                        {recordModalPerson.relation || 'Loved One'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setRecordModalPerson(null);
                                    setRecordAudioBlob(null);
                                }}
                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-[#F4EDE0]/60 hover:text-white flex items-center justify-center transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mb-4 bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-3.5 text-xs text-[#F4EDE0]/80 leading-relaxed">
                            <p className="font-semibold text-emerald-400 mb-1">Why record their voice?</p>
                            Record a warm greeting (e.g. <em>"Hello Dad, it's {recordModalPerson.name}. You are safe at home."</em>). <span className="font-handwritten text-xl text-zinc-200 block mt-1">“When the patient feels confused or anxious, Mavora whispers this familiar voice to comfort them.”</span>
                        </div>

                        {recordModalPerson.audio_base64 && !recordAudioBlob && (
                            <div className="mb-4 p-3 bg-[#1b1b26] rounded-2xl border border-[#F4EDE0]/10 flex items-center justify-between">
                                <span className="text-xs text-[#F4EDE0]/80 font-medium">Existing recording:</span>
                                <button
                                    type="button"
                                    onClick={() => playVoiceSample(recordModalPerson)}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 text-xs font-bold flex items-center gap-1.5 border border-emerald-500/30"
                                >
                                    {playingPersonId === (recordModalPerson.id || recordModalPerson.name) ? (
                                        <>
                                            <Pause size={12} /> Stop
                                        </>
                                    ) : (
                                        <>
                                            <Play size={12} /> Play Current
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        <div className="p-4 bg-[#171720] border border-[#F4EDE0]/15 rounded-2xl mb-5">
                            <label className="block text-xs font-bold text-[#F4EDE0]/80 uppercase tracking-wider mb-2">
                                Record New Audio Clip:
                            </label>
                            <AudioRecorder onRecordingComplete={(blob) => setRecordAudioBlob(blob)} />
                            {recordAudioBlob && (
                                <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                                    <CheckCircle2 size={14} />
                                    <span>New audio captured! Click Save to apply.</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setRecordModalPerson(null);
                                    setRecordAudioBlob(null);
                                }}
                                disabled={savingAudio}
                                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#F4EDE0]/80 text-xs font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveVoiceOnly}
                                disabled={savingAudio || !recordAudioBlob}
                                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2 disabled:opacity-50"
                            >
                                {savingAudio ? (
                                    <>
                                        <RefreshCw size={14} className="animate-spin" />
                                        <span>Saving Voice...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check size={14} />
                                        <span>Save Voice Profile</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default CaregiverPortal;
