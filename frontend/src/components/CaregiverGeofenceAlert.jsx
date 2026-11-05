import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ShieldAlert, MapPin, Phone, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

// Helper to format large distance cleanly
const formatDistance = (meters) => {
    if (!meters || meters < 0) return '0 m';
    if (meters >= 1000) {
        return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
};

// Web Audio API emergency double-chime
const playEmergencyBuzzer = () => {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        
        // High-low urgency pulses
        const freqs = [880, 587.33, 880, 587.33];
        freqs.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + idx * 0.22);
            gain.gain.setValueAtTime(0.12, now + idx * 0.22);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.22 + 0.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.22);
            osc.stop(now + idx * 0.22 + 0.2);
        });
    } catch (e) {}
};

const speakEmergencyVoice = (text) => {
    if ('speechSynthesis' in window) {
        try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.95;
            utterance.pitch = 1.05;
            window.speechSynthesis.speak(utterance);
        } catch (e) {}
    }
};

const CaregiverGeofenceAlert = ({ onViewChange }) => {
    const [geofenceAlert, setGeofenceAlert] = useState(null);
    const lastSpokenTimestampRef = useRef(null);

    useEffect(() => {
        const pollGeofence = async () => {
            try {
                const res = await axios.get(`${API_BASE}/patient/geofence_alert`);
                if (res.data?.active && res.data?.breached) {
                    setGeofenceAlert(res.data);

                    // Speak once per new breach event
                    const breachId = `${res.data.breached_at}-${res.data.distance_meters}`;
                    if (lastSpokenTimestampRef.current !== breachId) {
                        lastSpokenTimestampRef.current = breachId;
                        playEmergencyBuzzer();
                        const distFormatted = formatDistance(res.data.distance_meters);
                        speakEmergencyVoice(
                            `Safety Alert: Patient has crossed the safe boundary. Currently ${distFormatted} from home.`
                        );
                    }
                } else {
                    setGeofenceAlert(null);
                }
            } catch (e) {}
        };

        pollGeofence();
        const timer = setInterval(pollGeofence, 2000);
        return () => clearInterval(timer);
    }, []);

    const handleDismiss = async () => {
        try {
            await axios.post(`${API_BASE}/patient/dismiss_geofence`);
        } catch (e) {}
        setGeofenceAlert(null);
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };

    if (!geofenceAlert || !geofenceAlert.active) return null;

    const patientLat = geofenceAlert.patient_loc?.lat || 12.9720;
    const patientLng = geofenceAlert.patient_loc?.lng || 77.5950;
    const distanceMeters = geofenceAlert.distance_meters || 0;
    const safeRadiusMeters = geofenceAlert.radius_meters || 500;
    const homeAddress = geofenceAlert.home_loc?.address || "Safe Haven Home";
    const emergencyPhone = geofenceAlert.home_loc?.emergency_phone || "+919876543210";

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="fixed bottom-6 right-4 sm:right-6 z-[3000] w-[calc(100%-2rem)] sm:w-[440px] max-w-[460px] pointer-events-auto"
            >
                <div className="bg-[#12070A]/95 border-2 border-red-500/90 rounded-3xl p-5 shadow-[0_15px_60px_rgba(239,68,68,0.45)] backdrop-blur-2xl text-white">
                    {/* Top Header Row with Icon, Tag, Time and Close Button */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-red-600 rounded-xl text-white animate-pulse shadow-md shadow-red-600/40">
                                <ShieldAlert size={18} />
                            </div>
                            <div>
                                <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300">
                                    CRITICAL SAFETY ALERT
                                </span>
                                <span className="font-mono text-[11px] text-zinc-400 ml-2">
                                    {geofenceAlert.breached_at || 'Just now'}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            title="Dismiss Alert"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-white tracking-tight">
                        Patient Wandered Out of Safe Zone!
                    </h3>

                    {/* Distance and Location Info */}
                    <div className="mt-2.5 p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-zinc-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-zinc-400">Current Distance:</span>
                            <span className="font-mono font-bold text-red-400 text-sm">
                                {formatDistance(distanceMeters)} away
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="text-zinc-400">Safe Boundary:</span>
                            <span className="font-mono text-zinc-300">{safeRadiusMeters} meters</span>
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate pt-1 border-t border-white/10">
                            Home: <span className="text-zinc-200">{homeAddress}</span>
                        </div>
                    </div>

                    {/* Action Buttons in 1 clean row */}
                    <div className="grid grid-cols-3 gap-2 mt-3.5">
                        {onViewChange && (
                            <button
                                onClick={() => onViewChange('tracking')}
                                className="py-2.5 px-2 bg-white hover:bg-zinc-100 text-red-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                            >
                                <MapPin size={13} />
                                <span>Live GPS</span>
                            </button>
                        )}

                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${patientLat},${patientLng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="py-2.5 px-2 bg-red-900/60 hover:bg-red-800 border border-red-500/40 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                        >
                            <ExternalLink size={13} />
                            <span>Maps</span>
                        </a>

                        <a
                            href={`tel:${emergencyPhone}`}
                            className="py-2.5 px-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                        >
                            <Phone size={13} />
                            <span>Call</span>
                        </a>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default CaregiverGeofenceAlert;
