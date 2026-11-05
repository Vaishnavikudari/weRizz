import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";
import { 
    MapPin, 
    Navigation, 
    ShieldCheck, 
    AlertTriangle, 
    Volume2, 
    PhoneCall, 
    Home, 
    Compass, 
    RefreshCw, 
    ArrowLeft 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [editAddressText, setEditAddressText] = useState('');
    const [editLandmarkText, setEditLandmarkText] = useState('');

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

    // Cross-device patient live GPS synchronization
    useEffect(() => {
        if (isPatient) {
            // Patient device: broadcast live position to backend for caregiver to see
            if (patientLoc.lat && patientLoc.lng) {
                axios.post(`${API_BASE}/patient/live_location`, {
                    lat: patientLoc.lat,
                    lng: patientLoc.lng,
                    accuracy: patientLoc.accuracy || 10,
                    is_simulated: isSimulated
                }).catch(() => {});
            }
        } else if (!isSimulated) {
            // Caregiver device: poll patient's live location from backend
            const fetchPatientLocation = async () => {
                try {
                    const res = await axios.get(`${API_BASE}/patient/live_location`);
                    if (res.data && res.data.lat && res.data.lng) {
                        setPatientLoc(prev => ({
                            lat: res.data.lat,
                            lng: res.data.lng,
                            accuracy: res.data.accuracy || 10,
                            lastUpdated: res.data.updated_at || prev.lastUpdated
                        }));
                    }
                } catch (e) {}
            };
            fetchPatientLocation();
            const locTimer = setInterval(fetchPatientLocation, 3000);
            return () => clearInterval(locTimer);
        }
    }, [isPatient, isSimulated, patientLoc.lat, patientLoc.lng]);

    // Live Geolocation watcher
    useEffect(() => {
        if (!('geolocation' in navigator)) return;

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
                console.log("GPS Live Watch Error:", err.message);
            },
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [isSimulated]);

    // Calculate current distance from Home
    const currentDistance = calculateDistance(
        patientLoc.lat,
        patientLoc.lng,
        homeLocation.lat,
        homeLocation.lng
    );

    const isWandering = currentDistance > safeRadius;

    // Save current GPS spot as Home Base (Caregiver action)
    const handleSetCurrentAsHome = async () => {
        const newHome = {
            lat: patientLoc.lat,
            lng: patientLoc.lng,
            address: `Saved Home (${patientLoc.lat.toFixed(4)}, ${patientLoc.lng.toFixed(4)})`,
            radius_meters: safeRadius
        };
        setHomeLocation(newHome);
        localStorage.setItem('mavora_home_loc', JSON.stringify(newHome));
        window.dispatchEvent(new CustomEvent('mavora_home_updated', { detail: newHome }));
        try {
            await axios.post(`${API_BASE}/patient/safe_zone`, newHome);
        } catch (e) {}
        alert("Home location saved and synced across all devices!");
    };

    const handleSaveCustomAddress = async () => {
        if (!editAddressText.trim()) return alert("Please enter an address.");
        const updated = {
            ...homeLocation,
            address: editAddressText.trim(),
            landmark: editLandmarkText.trim(),
            radius_meters: safeRadius
        };
        setHomeLocation(updated);
        localStorage.setItem('mavora_home_loc', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('mavora_home_updated', { detail: updated }));
        try {
            await axios.post(`${API_BASE}/patient/safe_zone`, updated);
        } catch (e) {}
        setShowAddressModal(false);
    };

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
                                    <>Live location & <span className="italic text-[#FF6B5B]">safety guide</span></>
                                ) : (
                                    <>Family GPS & <span className="italic text-[#FF6B5B]">safety geofence</span></>
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

            {/* CRITICAL WANDERING ALERT BANNER */}
            <AnimatePresence>
                {isWandering && !alertMuted && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="max-w-6xl w-full mx-auto mb-6 bg-[#0B1736]/85 border-2 border-red-500/70 backdrop-blur-xl rounded-2xl p-4 md:p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4"
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
                                        : `Patient is currently ${currentDistance}m from Home (Safe limit: ${safeRadius}m).`}
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
                                    href="tel:911"
                                    className="px-5 py-2.5 bg-white text-black font-bold rounded-xl flex items-center gap-2 text-xs shadow-sm hover:bg-zinc-200"
                                >
                                    <PhoneCall size={16} /> Call Caregiver
                                </a>
                            )}
                            <button
                                onClick={() => setAlertMuted(true)}
                                className="px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-xl cursor-pointer"
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

                        {/* OpenStreetMap Iframe with clean minimalist dark filter */}
                        <div className="relative flex-1 w-full h-[360px] bg-black">
                            <iframe
                                title="Patient Live Location Map"
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                scrolling="no"
                                src={`https://www.openstreetmap.org/export/embed.html?bbox=${patientLoc.lng - 0.005}%2C${patientLoc.lat - 0.003}%2C${patientLoc.lng + 0.005}%2C${patientLoc.lat + 0.003}&layer=mapnik&marker=${patientLoc.lat}%2C${patientLoc.lng}`}
                                style={{ filter: 'invert(90%) hue-rotate(180deg) brightness(85%) contrast(100%)' }}
                            />

                            {/* Minimal Overlay Badge on Map */}
                            <div className="absolute top-4 left-4 bg-zinc-950/90 backdrop-blur-md border border-[#F4EDE0]/15 p-3 rounded-xl shadow-xl flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${isWandering ? 'bg-red-500 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
                                <div className="text-xs">
                                    <p className="font-semibold text-zinc-100">
                                        {isWandering ? "Outside Safe Zone" : "Inside Safe Zone"}
                                    </p>
                                    <p className="text-[11px] text-zinc-400 font-mono">
                                        {currentDistance}m from Home Base
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
                                    Are you feeling <span className="italic text-[#FF6B5B]">lost?</span>
                                </h3>
                                <p className="text-[#F4EDE0]/70 text-sm leading-[1.6]">
                                    Don't worry. Your family is aware and you are completely safe. Tap below anytime and we will walk back home together.
                                </p>
                            </div>

                            <div className="space-y-3">
                                {/* Crisp Apple-Style Guide Me Home Button */}
                                <button
                                    onClick={handleGuideHome}
                                    className="w-full py-4 bg-[#FF6B5B] hover:bg-[#ff5543] text-white font-extrabold text-base rounded-2xl shadow-lg shadow-[#FF6B5B]/30 flex items-center justify-center gap-3 transition-all transform active:scale-95 cursor-pointer"
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

                                {/* Home Address Actions */}
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => {
                                            setEditAddressText(homeLocation.address || '');
                                            setEditLandmarkText(homeLocation.landmark || '');
                                            setShowAddressModal(true);
                                        }}
                                        className="py-2.5 bg-[#FF6B5B]/15 hover:bg-[#FF6B5B]/25 text-[#FF8E72] hover:text-white text-xs font-semibold rounded-xl border border-[#FF6B5B]/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                    >
                                        <MapPin size={14} />
                                        Add / Edit Address
                                    </button>
                                    <button
                                        onClick={handleSetCurrentAsHome}
                                        className="py-2.5 bg-[#070D1E]/60 hover:bg-white/10 text-white text-xs font-semibold rounded-xl border border-white/15 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                    >
                                        <Home size={14} />
                                        Pin GPS Here
                                    </button>
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

            {/* Quick Address Edit Modal for Family Member */}
            {showAddressModal && (
                <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0B1736] border border-white/20 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <MapPin size={18} className="text-[#FF6B5B]" />
                                <span>Set Patient Safe Home Address</span>
                            </h3>
                            <button 
                                onClick={() => setShowAddressModal(false)}
                                className="text-white/60 hover:text-white p-1 rounded-lg"
                            >
                                ✕
                            </button>
                        </div>
                        <p className="text-xs text-white/70">
                            Enter the address where the patient lives. Mavora will navigate them here when they tap "Take Me Home".
                        </p>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-[11px] font-semibold text-white/80 uppercase mb-1">
                                    Full Street Address
                                </label>
                                <input
                                    type="text"
                                    value={editAddressText}
                                    onChange={(e) => setEditAddressText(e.target.value)}
                                    placeholder="e.g. Flat 301, 4th Cross, Green Park, Bangalore"
                                    className="w-full px-3 py-2.5 bg-[#070D1E] border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-[#60A5FA]"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-white/80 uppercase mb-1">
                                    Landmark (Spoken by AI Guide)
                                </label>
                                <input
                                    type="text"
                                    value={editLandmarkText}
                                    onChange={(e) => setEditLandmarkText(e.target.value)}
                                    placeholder="e.g. Near Apollo Pharmacy, Green Gate"
                                    className="w-full px-3 py-2.5 bg-[#070D1E] border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-[#60A5FA]"
                                />
                            </div>

                            {/* Google Maps Confirmation Iframe */}
                            <div>
                                <label className="block text-[11px] font-semibold text-white/80 uppercase mb-1 flex items-center justify-between">
                                    <span>Google Maps Location Preview</span>
                                    <span className="text-[#60A5FA] font-mono text-[10px]">
                                        ({homeLocation.lat.toFixed(4)}, {homeLocation.lng.toFixed(4)})
                                    </span>
                                </label>
                                <div className="h-44 w-full rounded-2xl overflow-hidden border border-white/15 bg-slate-900">
                                    <iframe
                                        key={`${homeLocation.lat}-${homeLocation.lng}`}
                                        title="Modal Google Maps Preview"
                                        src={`https://maps.google.com/maps?q=${homeLocation.lat},${homeLocation.lng}&z=16&output=embed`}
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        allowFullScreen=""
                                        loading="lazy"
                                        className="w-full h-full"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                onClick={() => setShowAddressModal(false)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveCustomAddress}
                                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF6B5B] to-[#FF8E72] text-white text-xs font-bold shadow-lg shadow-[#FF6B5B]/30 hover:opacity-95"
                            >
                                Save Address
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientTracking;
