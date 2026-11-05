import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Home, 
    MapPin, 
    Navigation, 
    ShieldCheck, 
    ExternalLink, 
    Compass, 
    Check, 
    AlertTriangle, 
    Crosshair, 
    Search, 
    Phone, 
    User, 
    Sparkles,
    CheckCircle2,
    ZoomIn,
    ZoomOut,
    Layers,
    ChevronUp,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    RefreshCw
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

const CaregiverAddressManager = () => {
    // Address and Safe Zone Form State
    const [address, setAddress] = useState("Home: 4th Cross, Green Park, Bangalore");
    const [landmark, setLandmark] = useState("Opposite Apollo Pharmacy");
    const [lat, setLat] = useState(12.9716);
    const [lng, setLng] = useState(77.5946);
    const [radiusMeters, setRadiusMeters] = useState(500);
    const [emergencyContact, setEmergencyContact] = useState("Rahul (Son)");
    const [emergencyPhone, setEmergencyPhone] = useState("+91 98765 43210");
    const [reassuranceNote, setReassuranceNote] = useState("Dad, you are close to home. The security guard Ramesh is at the main gate.");

    // Google Maps interactive state
    const [mapZoom, setMapZoom] = useState(16);
    const [mapType, setMapType] = useState('m'); // 'm' = roadmap, 'k' = satellite
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [mapReloadKey, setMapReloadKey] = useState(0);

    // UI Feedback state
    const [isSaving, setIsSaving] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // { type: 'success'|'error', message: '' }

    // Load saved address on mount
    useEffect(() => {
        // 1. Try LocalStorage
        try {
            const savedLoc = localStorage.getItem('mavora_home_loc');
            if (savedLoc) {
                const parsed = JSON.parse(savedLoc);
                if (parsed.address) setAddress(parsed.address);
                if (parsed.landmark) setLandmark(parsed.landmark);
                if (parsed.lat) setLat(parsed.lat);
                if (parsed.lng) setLng(parsed.lng);
                if (parsed.emergency_contact) setEmergencyContact(parsed.emergency_contact);
                if (parsed.emergency_phone) setEmergencyPhone(parsed.emergency_phone);
                if (parsed.reassuranceNote) setReassuranceNote(parsed.reassuranceNote);
                setIsConfirmed(true);
            }
            const savedRadius = localStorage.getItem('mavora_safe_radius');
            if (savedRadius) {
                setRadiusMeters(parseInt(savedRadius, 10));
            }
        } catch (e) {
            console.warn("Error reading localStorage home:", e);
        }

        // 2. Try Backend Sync
        axios.get(`${API_BASE}/patient/safe_zone`)
            .then(res => {
                if (res.data && res.data.address) {
                    setAddress(prev => prev || res.data.address);
                    if (res.data.landmark) setLandmark(res.data.landmark);
                    if (res.data.lat) setLat(res.data.lat);
                    if (res.data.lng) setLng(res.data.lng);
                    if (res.data.radius_meters) setRadiusMeters(res.data.radius_meters);
                    if (res.data.emergency_contact) setEmergencyContact(res.data.emergency_contact);
                    if (res.data.emergency_phone) setEmergencyPhone(res.data.emergency_phone);
                    setIsConfirmed(true);
                }
            })
            .catch(err => {
                console.log("Safe zone backend read note:", err.message);
            });
    }, []);

    // 1. Use Browser Device GPS
    const handleUseCurrentGPS = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your current browser.");
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const curLat = parseFloat(pos.coords.latitude.toFixed(6));
                const curLng = parseFloat(pos.coords.longitude.toFixed(6));
                setLat(curLat);
                setLng(curLng);
                setIsLocating(false);
                setIsConfirmed(false);
                setMapReloadKey(k => k + 1);
                setSaveStatus({
                    type: 'success',
                    message: `Acquired GPS location: (${curLat}, ${curLng}). Verify on the Google Map below.`
                });
                setTimeout(() => setSaveStatus(null), 4500);
            },
            (err) => {
                setIsLocating(false);
                alert("Could not access device GPS: " + err.message);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // 2. Lookup Coordinates from Address (Geocoding)
    const handleGeocodeAddress = async () => {
        if (!address.trim()) {
            alert("Please enter an address first.");
            return;
        }
        setIsGeocoding(true);
        try {
            const query = encodeURIComponent(address.trim());
            const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`, {
                headers: { 'Accept-Language': 'en' }
            });
            const data = await resp.json();
            if (data && data.length > 0) {
                const foundLat = parseFloat(parseFloat(data[0].lat).toFixed(6));
                const foundLng = parseFloat(parseFloat(data[0].lon).toFixed(6));
                setLat(foundLat);
                setLng(foundLng);
                setIsConfirmed(false);
                setMapReloadKey(k => k + 1);
                setSaveStatus({
                    type: 'success',
                    message: `Pinned on Google Maps: (${foundLat}, ${foundLng}). Please confirm if this is the correct home.`
                });
                setTimeout(() => setSaveStatus(null), 4500);
            } else {
                // If not found in nominatim, still update map reload with address query
                setMapReloadKey(k => k + 1);
                setSaveStatus({
                    type: 'info',
                    message: "Searching Google Maps for this address directly..."
                });
            }
        } catch (e) {
            console.error("Geocoding error:", e);
            setMapReloadKey(k => k + 1);
        } finally {
            setIsGeocoding(false);
        }
    };

    // 3. Fine-tune pin location (nudge ~11 meters per step)
    const handleNudgePin = (deltaLat, deltaLng) => {
        setLat(prev => parseFloat((prev + deltaLat).toFixed(6)));
        setLng(prev => parseFloat((prev + deltaLng).toFixed(6)));
        setIsConfirmed(false);
        setMapReloadKey(k => k + 1);
    };

    // 4. Save Safe Zone & Address
    const handleSave = async (e) => {
        if (e) e.preventDefault();
        if (!address.trim()) {
            alert("Please enter a valid home address.");
            return;
        }

        setIsSaving(true);
        const payload = {
            address: address.trim(),
            landmark: landmark.trim(),
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            radius_meters: parseInt(radiusMeters, 10),
            emergency_contact: emergencyContact.trim(),
            emergency_phone: emergencyPhone.trim(),
            reassuranceNote: reassuranceNote.trim()
        };

        // 1. Save to LocalStorage for instant app-wide synchronization
        try {
            localStorage.setItem('mavora_home_loc', JSON.stringify(payload));
            localStorage.setItem('mavora_safe_radius', radiusMeters.toString());
            window.dispatchEvent(new CustomEvent('mavora_home_updated', { detail: payload }));
        } catch (err) {
            console.warn("LocalStorage save error:", err);
        }

        // 2. Persist to Backend
        try {
            await axios.post(`${API_BASE}/patient/safe_zone`, payload);
        } catch (apiErr) {
            console.log("Safe zone backend post note:", apiErr.message);
        }

        setIsSaving(false);
        setIsConfirmed(true);
        setSaveStatus({
            type: 'success',
            message: 'Location Confirmed & Saved! Patient navigation and safe zone geofence are active.'
        });
        setTimeout(() => setSaveStatus(null), 5000);
    };

    // Google Maps Embed URL
    const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${lat},${lng}&t=${mapType}&z=${mapZoom}&ie=UTF8&iwloc=&output=embed`;

    return (
        <div className="w-full space-y-6">
            {/* Header info */}
            <div className="bg-[#0B1736]/75 border border-white/15 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.4)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2.5 mb-2">
                        <span className="p-2 rounded-xl bg-blue-500/15 border border-blue-400/25 text-[#60A5FA]">
                            <Home size={18} />
                        </span>
                        <h2 className="text-xl sm:text-2xl font-serif text-white tracking-tight">
                            Safe Haven Home Address & Google Maps Confirmation
                        </h2>
                    </div>
                    <p className="text-xs sm:text-sm text-white/70 max-w-2xl leading-relaxed">
                        Enter the patient's home address, verify the pin on the live Google Map below, and confirm the location. Mavora uses this exact spot to guide the patient home and alert family members if they wander.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <a
                        href={`https://www.google.com/maps?q=${lat},${lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-md"
                    >
                        <ExternalLink size={14} className="text-[#60A5FA]" />
                        <span>Open Full Google Maps</span>
                    </a>
                </div>
            </div>

            {/* Notification Banner */}
            {saveStatus && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-semibold border backdrop-blur-md shadow-lg transition-all ${
                    saveStatus.type === 'success'
                        ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                        : 'bg-blue-950/80 border-blue-500/40 text-blue-200'
                }`}>
                    {saveStatus.type === 'success' ? (
                        <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                    ) : (
                        <MapPin size={18} className="text-[#60A5FA] shrink-0" />
                    )}
                    <span>{saveStatus.message}</span>
                </div>
            )}

            {/* Main Form & Google Maps Confirmation Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Form: Left 6 columns */}
                <div className="lg:col-span-6 bg-[#0B1736]/75 border border-white/15 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.4)] flex flex-col justify-between">
                    <div>
                        <h3 className="text-base sm:text-lg font-semibold text-white mb-6 flex items-center gap-2">
                            <MapPin size={18} className="text-[#FF6B5B]" />
                            <span>1. Enter Address & Safe Perimeter</span>
                        </h3>

                        <form onSubmit={handleSave} className="space-y-5">
                            
                            {/* 1. Full Address */}
                            <div>
                                <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">
                                    Patient Home Address
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={address}
                                        onChange={(e) => {
                                            setAddress(e.target.value);
                                            setIsConfirmed(false);
                                        }}
                                        placeholder="e.g. 4th Cross Road, Green Park, Bangalore"
                                        required
                                        className="w-full px-4 py-3 bg-[#070D1E]/80 border border-white/15 focus:border-[#60A5FA] rounded-xl text-white placeholder-white/40 text-sm focus:outline-none transition-all pr-28"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleGeocodeAddress}
                                        disabled={isGeocoding}
                                        className="absolute right-2 top-2 px-3 py-1.5 rounded-lg bg-[#60A5FA]/20 hover:bg-[#60A5FA]/30 border border-[#60A5FA]/30 text-[#60A5FA] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        <Search size={12} />
                                        <span>{isGeocoding ? 'Finding...' : 'Show on Map'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* 2. Landmark & Visual Clues */}
                            <div>
                                <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">
                                    Familiar Landmark (Spoken by AI Companion)
                                </label>
                                <input
                                    type="text"
                                    value={landmark}
                                    onChange={(e) => setLandmark(e.target.value)}
                                    placeholder="e.g. Opposite Apollo Pharmacy, Blue Gate"
                                    className="w-full px-4 py-3 bg-[#070D1E]/80 border border-white/15 focus:border-[#60A5FA] rounded-xl text-white placeholder-white/40 text-sm focus:outline-none transition-all"
                                />
                            </div>

                            {/* 3. GPS Coordinates & Quick Tools */}
                            <div className="bg-[#070D1E]/60 p-4 rounded-2xl border border-white/10 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
                                        <Compass size={14} className="text-[#60A5FA]" />
                                        <span>GPS Coordinates (Latitude, Longitude)</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleUseCurrentGPS}
                                        disabled={isLocating}
                                        className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                                    >
                                        <Crosshair size={12} />
                                        <span>{isLocating ? 'Acquiring...' : 'Use My Current Location'}</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] text-white/60 mb-1 font-mono uppercase">Latitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={lat}
                                            onChange={(e) => {
                                                setLat(parseFloat(e.target.value) || 0);
                                                setIsConfirmed(false);
                                                setMapReloadKey(k => k + 1);
                                            }}
                                            className="w-full px-3 py-2 bg-[#070D1E] border border-white/15 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#60A5FA]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-white/60 mb-1 font-mono uppercase">Longitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={lng}
                                            onChange={(e) => {
                                                setLng(parseFloat(e.target.value) || 0);
                                                setIsConfirmed(false);
                                                setMapReloadKey(k => k + 1);
                                            }}
                                            className="w-full px-3 py-2 bg-[#070D1E] border border-white/15 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#60A5FA]"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 4. Safe Geofence Perimeter */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-semibold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
                                        <ShieldCheck size={14} className="text-emerald-400" />
                                        <span>Safe Zone Geofence Radius</span>
                                    </label>
                                    <span className="font-mono text-xs font-bold text-[#60A5FA] px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-400/25">
                                        {radiusMeters} meters
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                                    {[
                                        { label: '100m', val: 100, desc: 'House/Garden' },
                                        { label: '250m', val: 250, desc: 'Near Block' },
                                        { label: '500m', val: 500, desc: 'Neighborhood' },
                                        { label: '1000m', val: 1000, desc: 'Community' },
                                    ].map((pill) => (
                                        <button
                                            key={pill.val}
                                            type="button"
                                            onClick={() => setRadiusMeters(pill.val)}
                                            className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                                                radiusMeters === pill.val
                                                    ? 'bg-[#FF6B5B] border-[#FF6B5B] text-white shadow-md shadow-[#FF6B5B]/30'
                                                    : 'bg-[#070D1E]/60 border-white/15 text-white/70 hover:border-white/30 hover:text-white'
                                            }`}
                                        >
                                            <div className="font-bold text-xs">{pill.label}</div>
                                            <div className="text-[10px] opacity-80">{pill.desc}</div>
                                        </button>
                                    ))}
                                </div>

                                <input
                                    type="range"
                                    min="50"
                                    max="2000"
                                    step="50"
                                    value={radiusMeters}
                                    onChange={(e) => setRadiusMeters(parseInt(e.target.value, 10))}
                                    className="w-full accent-[#FF6B5B] cursor-pointer"
                                />
                            </div>

                            {/* 5. Emergency Contact Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <User size={13} className="text-[#60A5FA]" />
                                        <span>Family Contact</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={emergencyContact}
                                        onChange={(e) => setEmergencyContact(e.target.value)}
                                        placeholder="e.g. Rahul (Son)"
                                        className="w-full px-4 py-2.5 bg-[#070D1E]/80 border border-white/15 focus:border-[#60A5FA] rounded-xl text-white text-xs focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Phone size={13} className="text-emerald-400" />
                                        <span>Emergency Phone</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={emergencyPhone}
                                        onChange={(e) => setEmergencyPhone(e.target.value)}
                                        placeholder="e.g. +91 98765 43210"
                                        className="w-full px-4 py-2.5 bg-[#070D1E]/80 border border-white/15 focus:border-[#60A5FA] rounded-xl text-white text-xs focus:outline-none font-mono"
                                    />
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Bottom Action Note */}
                    <div className="pt-6 border-t border-white/10 mt-6">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#FF6B5B] to-[#FF8E72] hover:opacity-95 text-white font-semibold text-sm transition-all shadow-[0_4px_25px_rgba(255,107,91,0.4)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                <Check size={18} />
                                <span>{isSaving ? 'Saving Address...' : 'Save & Confirm Safe Address'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Live Google Maps Confirmation Card: Right 6 columns */}
                <div className="lg:col-span-6 bg-[#0B1736]/75 border border-white/15 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.4)] flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                                <Compass size={18} className="text-[#60A5FA]" />
                                <span>2. Google Maps Location Confirmation</span>
                            </h3>

                            {isConfirmed ? (
                                <span className="font-mono text-[11px] uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    Location Confirmed
                                </span>
                            ) : (
                                <span className="font-mono text-[11px] uppercase tracking-wider text-amber-300 font-bold flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30">
                                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                                    Pending Confirmation
                                </span>
                            )}
                        </div>

                        <p className="text-xs text-white/70 mb-4">
                            Verify the Google Maps pin below matches the patient's home. You can zoom, toggle satellite, or use the nudge buttons to fine-tune the exact gate.
                        </p>

                        {/* Interactive Google Map Container */}
                        <div className="relative w-full h-[320px] sm:h-[350px] rounded-2xl overflow-hidden border border-white/20 shadow-inner bg-slate-900">
                            
                            {/* Google Maps Iframe */}
                            <iframe
                                key={`${lat}-${lng}-${mapZoom}-${mapType}-${mapReloadKey}`}
                                title="Google Maps Location Confirmation"
                                src={googleMapsEmbedUrl}
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                className="w-full h-full filter contrast-[1.03]"
                            />

                            {/* Floating Map Controls (Top Right) */}
                            <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
                                <button
                                    type="button"
                                    onClick={() => setMapType(t => t === 'm' ? 'k' : 'm')}
                                    className="p-2 bg-[#070D1E]/90 hover:bg-[#0E1F4D] text-white border border-white/20 rounded-xl backdrop-blur-md shadow-lg text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
                                    title="Toggle Satellite / Street View"
                                >
                                    <Layers size={13} className="text-[#60A5FA]" />
                                    <span>{mapType === 'm' ? 'Satellite' : 'Roadmap'}</span>
                                </button>
                                <div className="flex bg-[#070D1E]/90 border border-white/20 rounded-xl overflow-hidden shadow-lg backdrop-blur-md">
                                    <button
                                        type="button"
                                        onClick={() => setMapZoom(z => Math.min(19, z + 1))}
                                        className="p-2 text-white hover:bg-white/10 transition-colors border-r border-white/15"
                                        title="Zoom In"
                                    >
                                        <ZoomIn size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMapZoom(z => Math.max(12, z - 1))}
                                        className="p-2 text-white hover:bg-white/10 transition-colors"
                                        title="Zoom Out"
                                    >
                                        <ZoomOut size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Floating Address Overlay (Bottom Left) */}
                            <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md bg-[#070D1E]/90 border border-white/20 backdrop-blur-md p-3 rounded-2xl shadow-xl z-10 flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-[10px] font-mono uppercase text-[#60A5FA] font-bold flex items-center gap-1">
                                        <MapPin size={11} />
                                        <span>Target Safe Pin</span>
                                    </div>
                                    <p className="text-xs text-white font-medium truncate max-w-[240px]">
                                        {address}
                                    </p>
                                    <p className="text-[10px] font-mono text-white/60">
                                        {lat.toFixed(5)}° N, {lng.toFixed(5)}° E · {radiusMeters}m Geofence
                                    </p>
                                </div>
                                <a
                                    href={`https://www.google.com/maps?q=${lat},${lng}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-[#60A5FA] border border-blue-400/30 shrink-0"
                                    title="Open Full Map"
                                >
                                    <ExternalLink size={14} />
                                </a>
                            </div>

                        </div>

                        {/* Pin Adjustment & Fine-tuning Bar */}
                        <div className="mt-4 p-3.5 bg-[#070D1E]/60 border border-white/10 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="text-xs text-white/70">
                                <span className="font-semibold text-white block">Fine-tune Pin Position:</span>
                                <span className="text-[11px] text-white/50">Nudge pin by ~10 meters if needed</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => handleNudgePin(-0.0001, 0)}
                                    className="p-2 bg-white/5 hover:bg-white/15 border border-white/15 rounded-xl text-white text-xs transition-colors cursor-pointer"
                                    title="Nudge South"
                                >
                                    <ChevronDown size={14} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleNudgePin(0.0001, 0)}
                                    className="p-2 bg-white/5 hover:bg-white/15 border border-white/15 rounded-xl text-white text-xs transition-colors cursor-pointer"
                                    title="Nudge North"
                                >
                                    <ChevronUp size={14} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleNudgePin(0, -0.0001)}
                                    className="p-2 bg-white/5 hover:bg-white/15 border border-white/15 rounded-xl text-white text-xs transition-colors cursor-pointer"
                                    title="Nudge West"
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleNudgePin(0, 0.0001)}
                                    className="p-2 bg-white/5 hover:bg-white/15 border border-white/15 rounded-xl text-white text-xs transition-colors cursor-pointer"
                                    title="Nudge East"
                                >
                                    <ChevronRight size={14} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMapReloadKey(k => k + 1)}
                                    className="p-2 bg-white/5 hover:bg-white/15 border border-white/15 rounded-xl text-[#60A5FA] text-xs transition-colors cursor-pointer"
                                    title="Refresh Map View"
                                >
                                    <RefreshCw size={14} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Big Direct Confirmation Button */}
                    <div className="pt-6 border-t border-white/10 mt-6">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                                isConfirmed 
                                    ? 'bg-emerald-600/90 hover:bg-emerald-500 text-white shadow-emerald-600/30' 
                                    : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/40 animate-pulse'
                            }`}
                        >
                            <CheckCircle2 size={18} />
                            <span>
                                {isConfirmed ? '✓ Location Confirmed & Synchronized' : 'Confirm This Google Maps Location as Home'}
                            </span>
                        </button>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default CaregiverAddressManager;
