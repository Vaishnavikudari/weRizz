import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { AlertTriangle, MapPin, Phone, X, ExternalLink, ShieldAlert, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

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
    const buzzerIntervalRef = useRef(null);

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
                        speakEmergencyVoice(
                            `Safety Alert: Patient has crossed the safe boundary. Currently ${res.data.distance_meters} meters from home.`
                        );
                    }
                } else {
                    setGeofenceAlert(null);
                    if (buzzerIntervalRef.current) clearInterval(buzzerIntervalRef.current);
                }
            } catch (e) {}
        };

        pollGeofence();
        const timer = setInterval(pollGeofence, 2000);
        return () => {
            clearInterval(timer);
            if (buzzerIntervalRef.current) clearInterval(buzzerIntervalRef.current);
        };
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
                initial={{ opacity: 0, y: -40, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                className="fixed top-20 left-1/2 -translate-x-1/2 z-[3000] w-[95%] max-w-4xl"
            >
                <div className="bg-red-950/95 border-2 border-red-500 rounded-3xl p-5 sm:p-6 shadow-[0_15px_60px_rgba(239,68,68,0.45)] backdrop-blur-2xl text-white">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        {/* Left alert content */}
                        <div className="flex items-start gap-4">
                            <div className="p-3.5 bg-red-600 rounded-2xl text-white flex-shrink-0 animate-bounce shadow-lg shadow-red-600/50">
                                <ShieldAlert size={28} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-red-500 text-white">
                                        CRITICAL SAFETY ESCALATION
                                    </span>
                                    <span className="font-mono text-xs text-red-300">
                                        Breached at {geofenceAlert.breached_at || 'Just now'}
                                    </span>
                                </div>
                                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                                    Patient Wandered Out of Safe Perimeter!
                                </h3>
                                <p className="text-xs sm:text-sm text-red-200 mt-1 max-w-xl">
                                    Patient is currently <span className="text-white font-bold underline">{distanceMeters}m away</span> from safe zone (Allowed limit: {safeRadiusMeters}m).
                                    Home: <span className="text-white font-medium">{homeAddress}</span>.
                                </p>
                            </div>
                        </div>

                        {/* Right Action buttons */}
                        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
                            {onViewChange && (
                                <button
                                    onClick={() => onViewChange('tracking')}
                                    className="px-4 py-2.5 bg-white hover:bg-zinc-100 text-red-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                                >
                                    <MapPin size={15} />
                                    <span>Live GPS Tracker</span>
                                </button>
                            )}

                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${patientLat},${patientLng}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-4 py-2.5 bg-red-800/80 hover:bg-red-700 border border-red-400/40 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                            >
                                <ExternalLink size={14} />
                                <span>Google Maps</span>
                            </a>

                            <a
                                href={`tel:${emergencyPhone}`}
                                className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                            >
                                <Phone size={14} />
                                <span>Call Patient</span>
                            </a>

                            <button
                                onClick={handleDismiss}
                                className="p-2.5 bg-white/10 hover:bg-white/20 text-red-200 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                                title="Dismiss Alert"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default CaregiverGeofenceAlert;

