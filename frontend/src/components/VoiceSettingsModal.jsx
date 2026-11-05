import React, { useState, useEffect } from 'react';
import { Volume2, Sparkles, X, Check, Key, Mic, Play, RefreshCw, ShieldCheck } from 'lucide-react';

export const ELEVENLABS_VOICES = [
    {
        id: "21m00Tcm4TlvDq8ikWAM",
        name: "Rachel (ElevenLabs)",
        gender: "Female",
        tone: "Warm, calm & soothing — ideal for dementia & memory care",
        previewText: "Hello there. I am right here with you, and you are completely safe."
    },
    {
        id: "pNInz6obpgDQGcFmaJgB",
        name: "Adam (ElevenLabs)",
        gender: "Male",
        tone: "Reassuring, deep & steady caregiver voice",
        previewText: "Good morning. Take your time, I am keeping track of everything for you."
    },
    {
        id: "EXAVITQu4vr4xnSDxMaL",
        name: "Bella (ElevenLabs)",
        gender: "Female",
        tone: "Soft, gentle & empathetic companion",
        previewText: "It is wonderful to see you today. How are you feeling?"
    },
    {
        id: "ErXwobaYiN019PkySvjV",
        name: "Antoni (ElevenLabs)",
        gender: "Male",
        tone: "Warm, friendly & clear companion",
        previewText: "Hello! I am here to help you remember your favorite things and family."
    },
    {
        id: "MF3mGyEYCl7XYWbV9V6O",
        name: "Elli (ElevenLabs)",
        gender: "Female",
        tone: "Bright, youthful & encouraging voice",
        previewText: "Hi! Do not worry, we have a wonderful day planned together."
    }
];

const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

const VoiceSettingsModal = ({ isOpen, onClose, onTestSpeak }) => {
    const [apiKey, setApiKey] = useState("");
    const [selectedVoice, setSelectedVoice] = useState("21m00Tcm4TlvDq8ikWAM");
    const [isTesting, setIsTesting] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);

    useEffect(() => {
        const storedKey = localStorage.getItem('elevenlabs_api_key') || '';
        const storedVoice = localStorage.getItem('elevenlabs_voice_id') || '21m00Tcm4TlvDq8ikWAM';
        setApiKey(storedKey);
        setSelectedVoice(storedVoice);
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        localStorage.setItem('elevenlabs_api_key', apiKey.trim());
        localStorage.setItem('elevenlabs_voice_id', selectedVoice);
        setSavedSuccess(true);
        setTimeout(() => {
            setSavedSuccess(false);
            onClose();
        }, 1200);
    };

    const handleTestVoice = async (voice) => {
        setIsTesting(voice.id);
        try {
            const res = await fetch(`${API_BASE}/tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: voice.previewText,
                    voice_id: voice.id,
                    api_key: apiKey.trim() || undefined
                })
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);
                audio.onended = () => {
                    setIsTesting(false);
                    URL.revokeObjectURL(url);
                };
                audio.onerror = () => setIsTesting(false);
                await audio.play();
            } else {
                setIsTesting(false);
            }
        } catch (err) {
            console.error("Test voice error:", err);
            setIsTesting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-600/20 text-purple-400 rounded-xl border border-purple-500/30">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white flex items-center gap-2">
                                Voice & Audio Settings
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                                    ElevenLabs
                                </span>
                            </h2>
                            <p className="text-xs text-slate-400">Choose studio-grade AI voices for soothing memory assistance</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                    {/* ElevenLabs API Key Input */}
                    <div className="space-y-2 bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
                        <label className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                                <Key size={14} className="text-purple-400" />
                                ElevenLabs API Key
                            </span>
                            <a
                                href="https://elevenlabs.io/app/speech-synthesis"
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-purple-400 hover:text-purple-300 underline font-normal"
                            >
                                Get API Key →
                            </a>
                        </label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Enter xi-api-key (e.g. 5f8a...)"
                            className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-mono"
                        />
                        <div className="flex items-center justify-between pt-1">
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                {apiKey.trim() ? (
                                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                                        <ShieldCheck size={13} /> Custom ElevenLabs Key Loaded
                                    </span>
                                ) : (
                                    <span className="text-amber-300/80 flex items-center gap-1">
                                        ⚡ No key entered: Using ultra-natural Neural voice fallback
                                    </span>
                                )}
                            </span>
                        </div>
                    </div>

                    {/* Voices Selection */}
                    <div className="space-y-3">
                        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Volume2 size={14} className="text-purple-400" />
                            Select Companion Voice
                        </label>

                        <div className="space-y-2.5">
                            {ELEVENLABS_VOICES.map((v) => {
                                const isSelected = selectedVoice === v.id;
                                const isPlayingCurrent = isTesting === v.id;

                                return (
                                    <div
                                        key={v.id}
                                        onClick={() => setSelectedVoice(v.id)}
                                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                            isSelected
                                                ? 'bg-purple-900/30 border-purple-500/80 shadow-md shadow-purple-950/40'
                                                : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70 hover:border-slate-600'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                                isSelected ? 'border-purple-400 bg-purple-500' : 'border-slate-500'
                                            }`}>
                                                {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className={`text-sm font-semibold ${isSelected ? 'text-purple-200' : 'text-slate-200'}`}>
                                                        {v.name}
                                                    </h3>
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300 font-medium">
                                                        {v.gender}
                                                    </span>
                                                    {v.id === "21m00Tcm4TlvDq8ikWAM" && (
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                                                            Recommended
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-400 mt-0.5">{v.tone}</p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleTestVoice(v);
                                            }}
                                            disabled={isTesting !== false && !isPlayingCurrent}
                                            className="px-3 py-1.5 bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-all flex-shrink-0 active:scale-95 disabled:opacity-50"
                                        >
                                            {isPlayingCurrent ? (
                                                <>
                                                    <RefreshCw size={12} className="animate-spin text-purple-300" />
                                                    <span>Playing...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Play size={12} />
                                                    <span>Listen</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 px-6 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
                    <p className="text-[11px] text-slate-400">Settings save to this device instantly</p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-900/40 flex items-center gap-1.5 transition-all active:scale-95"
                        >
                            {savedSuccess ? (
                                <>
                                    <Check size={14} /> Saved!
                                </>
                            ) : (
                                "Save Voice Settings"
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoiceSettingsModal;

