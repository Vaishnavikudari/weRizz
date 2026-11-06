import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Compass, Navigation, PhoneCall, Volume2, X, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playPatientCalmChime, speakBreachAlert } from '../utils/geofenceSound';

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

/**
 * PatientGeofenceModal:
 * Runs silently on the patient's device (phone/laptop/tablet).
 * When the caregiver triggers a wandering alert or safe boundary is breached,
 * this modal surfaces a calm, supportive overlay that helps the patient return home safely.
 */
const PatientGeofenceModal = ({ onGuideHome }) => {
    const [alertData, setAlertData] = useState(null);
    const [isDismissed, setIsDismissed] = useState(false);
    const lastAlertTimestampRef = useRef(null);

    useEffect(() => {
        let isMounted = true;

        const checkAlert = async () => {
            try {
                const res = await axios.get(`${API_BASE}/patient/geofence_alert`);
                if (!isMounted) return;

                const data = res.data;
                const isBreached = Boolean(data?.active && data?.breached);

                if (isBreached) {
                    // Only chime and speak on a fresh alert instance
                    if (data.breached_at !== lastAlertTimestampRef.current) {
                        lastAlertTimestampRef.current = data.breached_at;
                        setIsDismissed(false);
                        playPatientCalmChime();
                        const distMeters = data.distance_meters || 500;
                        const distText = distMeters >= 1000 ? `${(distMeters / 1000).toFixed(1)} kilometers` : `${distMeters} meters`;
                        speakBreachAlert(`Please take a deep breath. You are completely safe. You are about ${distText} from home. Tap Guide Me Home to walk back safely.`);
                    }
                    setAlertData(data);
                } else {
                    setAlertData(null);
                    setIsDismissed(false);
                    lastAlertTimestampRef.current = null;
                }
            } catch (err) {
                // Ignore transient network glitches
            }
        };

        checkAlert();
        const pollTimer = setInterval(checkAlert, 3500);

        return () => {
            isMounted = false;
            clearInterval(pollTimer);
        };
    }, []);

    const handleDismiss = async () => {
        setIsDismissed(true);
        try {
            await axios.post(`${API_BASE}/patient/dismiss_geofence`);
        } catch (e) {}
    };

    const handleOpenMap = () => {
        const homeLat = alertData?.home_loc?.lat || 12.9716;
        const homeLng = alertData?.home_loc?.lng || 77.5946;
        const pLat = alertData?.patient_loc?.lat;
        const pLng = alertData?.patient_loc?.lng;

        const originParam = pLat && pLng ? `&origin=${pLat},${pLng}` : '';
        const mapsUrl = `https://www.google.com/maps/dir/?api=1${originParam}&destination=${homeLat},${homeLng}&travelmode=walking`;
        window.open(mapsUrl, '_blank');

        speakBreachAlert("Opening walking directions to guide you back home. Please follow the map and walk safely.");
        if (onGuideHome) onGuideHome();
    };

    const handleHearCalmVoice = () => {
        const distMeters = alertData?.distance_meters || 500;
        const distText = distMeters >= 1000 ? `${(distMeters / 1000).toFixed(1)} kilometers` : `${distMeters} meters`;
        playPatientCalmChime();
        speakBreachAlert(`You are completely safe. Your family is aware of your location. You are about ${distText} from home. Tap Guide Me Home to walk back safely.`);
    };

    if (!alertData || !alertData.active || isDismissed) {
        return null;
    }

    const distMeters = alertData.distance_meters || 500;
    const distText = distMeters >= 1000 ? `${(distMeters / 1000).toFixed(1)} km` : `${distMeters}m`;
    const homeAddress = alertData.home_loc?.address || "Safe Haven Home";
    const emergencyPhone = alertData.home_loc?.emergency_phone || "+91 98765 43210";

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 20 }}
                    className="max-w-lg w-full bg-[#0B1736] border-2 border-blue-400/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-white space-y-6 relative overflow-hidden"
                >
                    {/* Top Glow Accent */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-2 bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500 rounded-b-full shadow-[0_0_25px_rgba(56,189,248,0.6)]" />

                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-blue-500/20 border border-blue-400/30 text-blue-400 shrink-0 animate-pulse">
                                <Compass size={28} />
                            </div>
                            <div>
                                <span className="text-[10px] font-mono uppercase tracking-widest text-blue-300">
                                    Mavora Gentle Companion
                                </span>
                                <h2 
                                    className="font-serif text-2xl text-[#F4EDE0] leading-tight"
                                    style={{ fontFamily: '"The Seasons", "Instrument Serif", Georgia, serif' }}
                                >
                                    Are you feeling <span className="italic text-blue-400">lost?</span>
                                </h2>
                            </div>
                        </div>

                        <button
                            onClick={handleDismiss}
                            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all cursor-pointer"
                            title="Dismiss Alert"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Reassurance Message */}
                    <div className="p-4 rounded-2xl bg-[#070D1E]/80 border border-white/10 space-y-2">
                        <p className="text-sm text-white/90 leading-relaxed font-sans">
                            “Don’t worry. You are safe and your family is watching over you. You are currently <strong className="text-blue-300 font-semibold">{distText}</strong> from home.”
                        </p>
                        <p className="text-xs text-white/60 font-mono">
                            Home: {homeAddress}
                        </p>
                    </div>

                    {/* Primary Action Buttons */}
                    <div className="space-y-2.5">
                        <button
                            onClick={handleOpenMap}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-3 transition-all transform active:scale-95 cursor-pointer"
                        >
                            <Navigation size={22} />
                            Guide Me Home
                        </button>

                        <div className="grid grid-cols-2 gap-2.5">
                            <button
                                onClick={handleHearCalmVoice}
                                className="py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/15 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                            >
                                <Volume2 size={16} />
                                Hear Voice
                            </button>

                            <a
                                href={`tel:${emergencyPhone}`}
                                className="py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/15 flex items-center justify-center gap-2 transition-all active:scale-95 text-center"
                            >
                                <PhoneCall size={16} />
                                Call Family
                            </a>
                        </div>

                        <button
                            onClick={handleDismiss}
                            className="w-full py-2.5 text-center text-xs text-white/50 hover:text-white transition-colors cursor-pointer"
                        >
                            I am safe right now · Dismiss
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PatientGeofenceModal;
