import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";
import { 
    MapPin, 
    Navigation, 
    ShieldCheck,
    ShieldAlert, 
    AlertTriangle, 
    Volume2, 
    PhoneCall, 
    Home, 
    Compass, 
    RefreshCw, 
    ArrowLeft 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playCaregiverBreachSound, playPatientCalmChime, speakBreachAlert } from '../utils/geofenceSound';

// Haversine distance calculator between 2 coordinates in meters
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
};

const PatientTracking = ({ userRole = 'family', onBack, onSpeakText }) => {
    const isPatient = userRole === 'patient';

    // Default safe home location (persisted in localStorage)
    const [homeLocation, setHomeLocation] = useState(() => {
        try {
            const saved = localStorage.getItem('mavora_home_loc');
            return saved ? JSON.parse(saved) : { lat: 12.9716, lng: 77.5946, address: "Home: 4th Cross, Green Park, Bangalore" };
        } catch (e) {
            return { lat: 12.9716, lng: 77.5946, address: "Home: 4th Cross, Green Park, Bangalore" };
        }
    });

    const [safeRadius, setSafeRadius] = useState(() => {
        const saved = localStorage.getItem('mavora_safe_radius');
        return saved ? parseInt(saved, 10) : 500;
    });

    // Patient simulated or live GPS coordinates
    const [patientLoc, setPatientLoc] = useState({
        lat: 12.9720,
        lng: 77.5950,
        accuracy: 10,
        lastUpdated: new Date().toLocaleTimeString()
    });

    const [isSimulated, setIsSimulated] = useState(false);
    const [alertMuted, setAlertMuted] = useState(false);
    const [mapProvider, setMapProvider] = useState('google'); // 'google' | 'satellite' | 'osm'
    const [isMapLoading, setIsMapLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);


    // Real-time backend sync across multiple devices (Laptop A <-> Laptop B)
    useEffect(() => {
        // Local window event sync
        const handleHomeSync = (e) => {
            if (e.detail) {
                setHomeLocation(prev => ({ ...prev, ...e.detail }));
                if (e.detail.radius_meters) {
                    setSafeRadius(e.detail.radius_meters);
                }
            }
        };
        window.addEventListener('mavora_home_updated', handleHomeSync);

        // Cross-laptop poll for safe haven home address
        const fetchSafeZone = async () => {
            try {
                const res = await axios.get(`${API_BASE}/patient/safe_zone`);
                if (res.data && res.data.address) {
                    setHomeLocation(prev => {
                        if (
                            prev.address !== res.data.address ||
                            Math.abs(prev.lat - res.data.lat) > 0.0001 ||
                            Math.abs(prev.lng - res.data.lng) > 0.0001
                        ) {
                            localStorage.setItem('mavora_home_loc', JSON.stringify(res.data));
                            return { ...prev, ...res.data };
                        }
                        return prev;
                    });
                    if (res.data.radius_meters) {
                        setSafeRadius(res.data.radius_meters);
                        localStorage.setItem('mavora_safe_radius', res.data.radius_meters.toString());
                    }
                }
            } catch (err) {
                // Ignore network hiccups
            }
        };

        fetchSafeZone();
        const pollTimer = setInterval(fetchSafeZone, 3000);

        const handleVisibility = () => {
            if (!document.hidden) fetchSafeZone();
        };
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            window.removeEventListener('mavora_home_updated', handleHomeSync);
            clearInterval(pollTimer);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, []);

    // 1. Patient device broadcaster: pushes coordinates to backend
    useEffect(() => {
        if (!isPatient) return;
        if (patientLoc.lat && patientLoc.lng) {
            axios.post(`${API_BASE}/patient/live_location`, {
                lat: patientLoc.lat,
                lng: patientLoc.lng,
                accuracy: patientLoc.accuracy || 10,
                is_simulated: isSimulated
            }).catch(() => {});
        }
    }, [isPatient, isSimulated, patientLoc.lat, patientLoc.lng]);

    // 2. Caregiver / Family poller: reads live patient location from backend
    useEffect(() => {
        if (isPatient || isSimulated) return;
        let isMounted = true;
        const fetchPatientLocation = async () => {
            try {
                const res = await axios.get(`${API_BASE}/patient/live_location`);
                if (isMounted && res.data && res.data.lat && res.data.lng) {
                    setPatientLoc(prev => {
                        if (Math.abs(prev.lat - res.data.lat) > 0.00005 || Math.abs(prev.lng - res.data.lng) > 0.00005) {
                            return {
                                lat: res.data.lat,
                                lng: res.data.lng,
                                accuracy: res.data.accuracy || 10,
                                lastUpdated: res.data.updated_at || new Date().toLocaleTimeString()
                            };
                        }
                        return prev;
                    });
                }
            } catch (e) {
                console.warn("Caregiver live GPS poll error:", e.message);
            }
        };

        fetchPatientLocation();
        const locTimer = setInterval(fetchPatientLocation, 3000);
        return () => {
            isMounted = false;
            clearInterval(locTimer);
        };
    }, [isPatient, isSimulated]);

    // 3. Live Geolocation watcher: ONLY runs on patient device, NEVER on caregiver device!
    useEffect(() => {
        if (!isPatient || !('geolocation' in navigator)) return;

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                if (!isSimulated) {
                    setPatientLoc({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                        accuracy: Math.round(pos.coords.accuracy || 10),
                        lastUpdated: new Date().toLocaleTimeString()
                    });
                }
            },
            (err) => {
                console.log("Patient GPS Watch Error:", err.message);
            },
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [isPatient, isSimulated]);

    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        try {
            const res = await axios.get(`${API_BASE}/patient/live_location`);
            if (res.data && res.data.lat && res.data.lng) {
                setPatientLoc({
                    lat: res.data.lat,
                    lng: res.data.lng,
                    accuracy: res.data.accuracy || 10,
                    lastUpdated: res.data.updated_at || new Date().toLocaleTimeString()
                });
            }
        } catch (e) {}
        setTimeout(() => setIsRefreshing(false), 500);
    };

    // Calculate current distance from Home
    const currentDistance = calculateDistance(
        patientLoc.lat,
        patientLoc.lng,
        homeLocation.lat,
        homeLocation.lng
    );

    const isWandering = currentDistance > safeRadius;
    const lastWanderingRef = useRef(false);

    useEffect(() => {
        if (isWandering && !alertMuted) {
            if (!lastWanderingRef.current) {
                lastWanderingRef.current = true;
                if (isPatient) {
                    playPatientCalmChime();
                    speakBreachAlert(`Please stay calm. You are ${currentDistance} meters from home. Tap Guide Me Home to return safely.`);
                } else {
                    playCaregiverBreachSound();
                    const distText = currentDistance >= 1000 
                        ? `${(currentDistance / 1000).toFixed(1)} kilometers` 
                        : `${currentDistance} meters`;
                    speakBreachAlert(`Wandering Alert: Patient has crossed safe perimeter. Currently ${distText} from home.`);
                }
            }
        } else {
            lastWanderingRef.current = false;
        }
    }, [isWandering, alertMuted, isPatient, currentDistance]);



    // Simulate wandering outside safe zone for demo (Caregiver only)
    const toggleSimulateWander = async () => {
        if (!isSimulated) {
            setIsSimulated(true);
            const simLat = homeLocation.lat + 0.0055;
            const simLng = homeLocation.lng + 0.0055;
            const updated = {
                lat: simLat,
                lng: simLng,
                accuracy: 5,
                lastUpdated: new Date().toLocaleTimeString()
            };
            setPatientLoc(updated);
            try {
                await axios.post(`${API_BASE}/patient/live_location`, {
                    lat: simLat,
                    lng: simLng,
                    accuracy: 5,
                    is_simulated: true
                });
            } catch (e) {}
        } else {
            setIsSimulated(false);
            const homeLat = homeLocation.lat + 0.0002;
            const homeLng = homeLocation.lng + 0.0002;
            const updated = {
                lat: homeLat,
                lng: homeLng,
                accuracy: 8,
                lastUpdated: new Date().toLocaleTimeString()
            };
            setPatientLoc(updated);
            try {
                await axios.post(`${API_BASE}/patient/live_location`, {
                    lat: homeLat,
                    lng: homeLng,
                    accuracy: 8,
                    is_simulated: false
                });
                await axios.post(`${API_BASE}/patient/dismiss_geofence`);
            } catch (e) {}
        }
    };

    // Guide Me Home Action for Patient
    const handleGuideHome = () => {
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${patientLoc.lat},${patientLoc.lng}&destination=${homeLocation.lat},${homeLocation.lng}&travelmode=walking`;
        window.open(mapsUrl, '_blank');
        
        const spoken = "Opening walking directions to take you safely back home. Please follow the map and walk carefully. You are completely safe.";
        if (onSpeakText) {
            onSpeakText(spoken);
        } else if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(spoken);
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        }
    };

    // Patient Calming Audio Reassurance
    const handleCalmingVoice = () => {
        const reassurance = `Please take a deep breath. You are completely safe. Your family is aware of your location. You are only ${currentDistance} meters from home. You can tap Guide Me Home to walk back or call your family anytime.`;
        if (onSpeakText) {
            onSpeakText(reassurance);
        } else if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(reassurance);
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        }
    };

    return (
        <div className="w-full min-h-full bg-transparent text-white px-4 pt-6 pb-20 md:px-8 md:pt-8 md:pb-24">
            {/* Top Header - Minimalist Black & Cursive */}
            <div className="max-w-6xl w-full mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    {isPatient && onBack && (
                        <button
                            onClick={onBack}
                            className="px-3.5 py-2.5 rounded-xl bg-[#0B1736]/60 hover:bg-[#102554] text-white text-xs font-semibold flex items-center gap-2 border border-white/15 backdrop-blur-md transition-colors mr-2 cursor-pointer"
                            title="Return to Voice Assistant"
                        >
                            <ArrowLeft size={16} />
                            <span>Back to Assistant</span>
                        </button>
                    )}
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl border border-white/15 bg-[#0B1736]/60 text-white backdrop-blur-md">
                            {isPatient ? <Compass size={24} /> : <ShieldCheck size={24} />}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-mono text-[10px] uppercase tracking-wider text-[#F4EDE0]/70">
                                {isPatient ? "Patient Safety Space" : "Caregiver Radar"}
                            </span>
                            <h1 
                                className="font-serif text-2xl sm:text-3xl text-[#F4EDE0] tracking-[-0.025em] leading-tight"
                                style={{ fontFamily: '"The Seasons", "Instrument Serif", Georgia, serif' }}
                            >
                                {isPatient ? (
                                    <>Live location & <span className="italic text-blue-400">safety guide</span></>
                                ) : (
                                    <>Family GPS & <span className="italic text-blue-400">safety geofence</span></>
                                )}
                            </h1>
                            <p className="text-[#F4EDE0]/70 text-xs sm:text-sm mt-0.5">
                                {isPatient 
                                    ? "Mavora is watching over your steps. You can walk back home anytime." 
                                    : "Real-time location monitoring and autonomous wandering alerts."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Minimalist Status Badge */}
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-medium px-3.5 py-1.5 rounded-full border border-white/15 bg-[#0B1736]/60 text-white backdrop-blur-md flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        {isPatient ? "Patient Mode" : "Caregiver Portal"}
                    </span>
                </div>
            </div>

            {/* CRITICAL WANDERING ALERT BANNER - In-line in document flow, pushes content down, 0% overlapping */}
            <AnimatePresence>
                {isWandering && !alertMuted && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="max-w-6xl w-full mx-auto mb-6 bg-red-950/90 border-2 border-red-500 rounded-3xl p-5 sm:p-6 shadow-[0_15px_50px_rgba(239,68,68,0.35)] backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-500/10 rounded-full text-red-400 flex-shrink-0">
                                <AlertTriangle size={32} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-red-200">
                                    {isPatient 
                                        ? "⚠️ You are outside your usual home area" 
                                        : "⚠️ WANDERING ALERT: Patient has crossed safe perimeter!"}
                                </h2>
                                <p className="font-handwritten text-xl text-zinc-300 mt-0.5">
                                    {isPatient 
                                        ? `“You are currently ${currentDistance}m from home. Please stay calm. Tap Guide Me Home below.”` 
                                        : `Patient is currently ${currentDistance >= 1000 ? (currentDistance / 1000).toFixed(1) + ' km' : currentDistance + 'm'} from Home (Safe limit: ${safeRadius}m).`}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                            {isPatient ? (
                                <button
                                    onClick={handleGuideHome}
                                    className="px-5 py-2.5 bg-white text-black font-bold rounded-xl flex items-center gap-2 text-xs shadow-sm hover:bg-zinc-200 cursor-pointer active:scale-95 transition-all"
                                >
                                    <Navigation size={16} /> Guide Me Home
                                </button>
                            ) : (
                                <a 
                                    href={`tel:${homeLocation.emergency_phone || "+919876543210"}`}
                                    className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl flex items-center gap-2 text-xs shadow-sm"
                                >
                                    <PhoneCall size={16} /> Call Patient
                                </a>
                            )}
                            <button
                                onClick={() => {
                                    if (isPatient) {
                                        playPatientCalmChime();
                                        speakBreachAlert(`Please take a deep breath. You are ${currentDistance} meters from home. Tap Guide Me Home to return safely.`);
                                    } else {
                                        playCaregiverBreachSound();
                                        const distText = currentDistance >= 1000 
                                            ? `${(currentDistance / 1000).toFixed(1)} kilometers` 
                                            : `${currentDistance} meters`;
                                        speakBreachAlert(`Wandering Alert: Patient has crossed safe perimeter. Currently ${distText} away.`);
                                    }
                                }}
                                className="px-3.5 py-2.5 bg-red-900/80 hover:bg-red-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                                title="Hear / Replay the wandering alert sound"
                            >
                                <Volume2 size={14} />
                                <span>Hear Sound</span>
                            </button>
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${patientLoc.lat},${patientLoc.lng}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-4 py-2.5 bg-red-900/60 hover:bg-red-800 border border-red-500/40 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                            >
                                <Navigation size={14} /> Maps
                            </a>
                            <button
                                onClick={async () => {
                                    setAlertMuted(true);
                                    try { await axios.post(`${API_BASE}/patient/dismiss_geofence`); } catch(e){}
                                }}
                                className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-red-200 hover:text-white text-xs font-semibold rounded-xl cursor-pointer"
                            >
                                Dismiss
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MAIN CONTENT AREA */}
            <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT / CENTER: INTERACTIVE LIVE MAP & STATUS */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Embedded Live Map Display */}
                    <div className="bg-[#0B1736]/75 border border-white/15 backdrop-blur-xl rounded-2xl overflow-hidden relative shadow-2xl min-h-[420px] flex flex-col">
                        <div className="p-4 bg-[#070D1E]/60 border-b border-white/15 flex items-center justify-between backdrop-blur-md">
                            <div className="flex items-center gap-2">
                                <MapPin size={16} className={isWandering ? "text-red-400 animate-bounce" : "text-emerald-400"} />
                                <span className="font-semibold text-xs tracking-wide uppercase font-mono text-zinc-200">
                                    {isPatient ? "Your Real-Time Location" : "Live GPS Map View"}
                                </span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-[#F4EDE0]/15 text-zinc-400">
                                    Updated {patientLoc.lastUpdated}
                                </span>
                            </div>

                            {/* Demo Simulator button: ONLY SHOWN FOR FAMILY MODE */}
                            {!isPatient && (
                                <button
                                    onClick={toggleSimulateWander}
                                    className={`text-xs px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                                        isSimulated 
                                            ? 'bg-zinc-800 border-white/20 text-white' 
                                            : 'bg-zinc-900 border-[#F4EDE0]/15 text-zinc-400 hover:text-white'
                                    }`}
                                >
                                    <RefreshCw size={12} className={isSimulated ? "animate-spin" : ""} />
                                    {isSimulated ? "Reset to Home" : "Simulate Wandering Away"}
                                </button>
                            )}
                        </div>

                        {/* Interactive Live Map with Google Maps & OpenStreetMap Support */}
                        <div className="relative flex-1 w-full h-[380px] bg-slate-950 overflow-hidden">
                            {/* Loading state indicator */}
                            {isMapLoading && (
                                <div className="absolute inset-0 bg-[#070D1E]/90 backdrop-blur-md flex flex-col items-center justify-center gap-3 z-10">
                                    <RefreshCw size={26} className="text-[#60A5FA] animate-spin" />
                                    <p className="text-xs text-white/80 font-mono">Loading Real-Time GPS Map...</p>
                                </div>
                            )}

                            {/* Map Iframe */}
                            <iframe
                                key={`${mapProvider}-${patientLoc.lat.toFixed(4)}-${patientLoc.lng.toFixed(4)}`}
                                title="Patient Live Location Map"
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                scrolling="no"
                                onLoad={() => setIsMapLoading(false)}
                                src={
                                    mapProvider === 'satellite'
                                        ? `https://maps.google.com/maps?q=${patientLoc.lat},${patientLoc.lng}&t=k&z=17&ie=UTF8&iwloc=&output=embed`
                                        : mapProvider === 'osm'
                                        ? `https://www.openstreetmap.org/export/embed.html?bbox=${patientLoc.lng - 0.005}%2C${patientLoc.lat - 0.003}%2C${patientLoc.lng + 0.005}%2C${patientLoc.lat + 0.003}&layer=mapnik&marker=${patientLoc.lat}%2C${patientLoc.lng}`
                                        : `https://maps.google.com/maps?q=${patientLoc.lat},${patientLoc.lng}&z=16&ie=UTF8&iwloc=&output=embed`
                                }
                                style={mapProvider === 'osm' ? { filter: 'invert(90%) hue-rotate(180deg) brightness(85%) contrast(100%)' } : { border: 0 }}
                            />

                            {/* Floating Map Status Overlay */}
                            <div className="absolute top-4 left-4 bg-zinc-950/90 backdrop-blur-md border border-white/20 p-3 rounded-xl shadow-xl flex items-center gap-3 z-10">
                                <div className={`w-3 h-3 rounded-full ${isWandering ? 'bg-red-500 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
                                <div className="text-xs">
                                    <p className="font-semibold text-zinc-100 flex items-center gap-2">
                                        <span>{isWandering ? "Outside Safe Zone" : "Inside Safe Zone"}</span>
                                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-zinc-300">
                                            {mapProvider === 'osm' ? 'OpenStreetMap' : mapProvider === 'satellite' ? 'Google Satellite' : 'Google Maps'}
                                        </span>
                                    </p>
                                    <p className="text-[11px] text-zinc-400 font-mono">
                                        {currentDistance >= 1000 ? `${(currentDistance / 1000).toFixed(1)} km` : `${currentDistance}m`} from Home Base
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Map Footer Bar */}
                        <div className="p-3 bg-[#070D1E]/60 border-t border-white/15 flex flex-wrap items-center justify-between text-[11px] text-white/70 font-mono gap-2 backdrop-blur-md">
                            <span>Lat: {patientLoc.lat.toFixed(5)}, Lng: {patientLoc.lng.toFixed(5)}</span>
                            <span>GPS Accuracy: ±{patientLoc.accuracy}m</span>
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${patientLoc.lat},${patientLoc.lng}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-white hover:underline flex items-center gap-1 font-semibold"
                            >
                                Open in Google Maps ↗
                            </a>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: DEDICATED ROLES */}
                <div className="flex flex-col gap-6">

                    {/* 1. ONLY PATIENT VIEW IN PATIENT MODE */}
                    {isPatient && (
                        <div className="bg-[#0B1736]/75 border border-white/15 backdrop-blur-xl rounded-2xl p-6 shadow-2xl flex flex-col justify-between h-full space-y-6">
                            <div>
                                <div className="flex items-center gap-2 text-[#F4EDE0]/70 mb-2">
                                    <Compass size={16} />
                                    <span className="font-mono text-[10px] tracking-wider uppercase">Patient Assistance</span>
                                </div>
                                <h3 
                                    className="font-serif text-2xl text-[#F4EDE0] mb-2"
                                    style={{ fontFamily: '"The Seasons", "Instrument Serif", Georgia, serif' }}
                                >
                                    Are you feeling <span className="italic text-blue-400">lost?</span>
                                </h3>
                                <p className="text-[#F4EDE0]/70 text-sm leading-[1.6]">
                                    Don't worry. Your family is aware and you are completely safe. Tap below anytime and we will walk back home together.
                                </p>
                            </div>

                            <div className="space-y-3">
                                {/* Crisp Apple-Style Guide Me Home Button */}
                                <button
                                    onClick={handleGuideHome}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-3 transition-all transform active:scale-95 cursor-pointer"
                                >
                                    <Navigation size={22} />
                                    Guide Me Home
                                </button>

                                {/* Spoken Voice Reassurance Button */}
                                <button
                                    onClick={handleCalmingVoice}
                                    className="w-full py-3 bg-[#070D1E]/60 hover:bg-white/10 text-white font-semibold text-xs rounded-xl border border-white/15 backdrop-blur-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                                >
                                    <Volume2 size={16} />
                                    Hear Calming Voice
                                </button>

                                {/* Quick Family Call */}
                                <a
                                    href="tel:911"
                                    className="w-full py-3 bg-[#070D1E]/60 hover:bg-white/10 text-white font-semibold text-xs rounded-xl border border-white/15 backdrop-blur-md flex items-center justify-center gap-2 transition-all active:scale-95"
                                >
                                    <PhoneCall size={15} />
                                    Call Family / Caregiver
                                </a>

                                {/* Registered Home Address */}
                                <div className="p-3.5 bg-[#070D1E]/60 backdrop-blur-md rounded-xl border border-white/15 text-xs text-white/80 space-y-1">
                                    <div className="flex items-center gap-1.5 text-zinc-200 font-semibold">
                                        <Home size={14} className="text-zinc-400" />
                                        <span>Registered Home Address:</span>
                                    </div>
                                    <p className="font-mono text-zinc-400 text-[11px]">{homeLocation.address}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. ONLY FAMILY VIEW IN FAMILY MODE */}
                    {!isPatient && (
                        <div className="bg-[#0B1736]/75 border border-white/15 backdrop-blur-xl rounded-2xl p-6 shadow-2xl flex flex-col justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-2 text-zinc-400 mb-2">
                                    <ShieldCheck size={20} />
                                    <span className="font-mono font-bold text-xs tracking-wider uppercase">Caregiver Geofencing</span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1">
                                    Safe Zone Settings
                                </h3>
                                <p className="font-handwritten text-lg text-zinc-400 mb-4">
                                    “Configure a gentle boundary to keep them safe and sound.”
                                </p>

                                {/* Safe Radius Slider */}
                                <div className="space-y-2 bg-[#070D1E]/60 backdrop-blur-md p-4 rounded-xl border border-white/15 mb-4">
                                    <div className="flex justify-between text-xs font-semibold">
                                        <span className="text-zinc-300">Safe Boundary Radius:</span>
                                        <span className="text-white font-mono font-bold">{safeRadius} Meters</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="50"
                                        max="1000"
                                        step="25"
                                        value={safeRadius}
                                        onChange={(e) => {
                                            setSafeRadius(parseInt(e.target.value));
                                            localStorage.setItem('mavora_safe_radius', e.target.value);
                                        }}
                                        className="w-full accent-white cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                                        <span>50m (House)</span>
                                        <span>500m (Neighbourhood)</span>
                                        <span>1000m (Subdistrict)</span>
                                    </div>
                                </div>

                                {/* Configured Safe Home Display */}
                                <div className="bg-[#070D1E]/60 backdrop-blur-md p-3.5 rounded-xl border border-white/15">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Current Safe Home</span>
                                        {onNavigate && (
                                            <button 
                                                onClick={() => onNavigate('caregiver')} 
                                                className="text-[11px] text-[#60A5FA] hover:underline cursor-pointer"
                                            >
                                                Edit in Family Dashboard →
                                            </button>
                                        )}
                                    </div>
                                    <p className="font-mono text-zinc-300 text-xs truncate">{homeLocation.address || 'Safe Haven Home'}</p>
                                </div>
                            </div>

                            {/* Quick Stats Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-[#070D1E]/60 backdrop-blur-md p-3.5 rounded-xl border border-white/15">
                                    <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Current Status</p>
                                    <p className={`text-xs font-bold mt-1 ${isWandering ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {isWandering ? 'Wandering Alert' : 'Safe at Home'}
                                    </p>
                                </div>
                                <div className="bg-[#070D1E]/60 backdrop-blur-md p-3.5 rounded-xl border border-white/15">
                                    <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Distance from Home</p>
                                    <p className="text-xs font-mono font-bold text-white mt-1">
                                        {currentDistance} meters
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            </div>
    );
};

export default PatientTracking;
