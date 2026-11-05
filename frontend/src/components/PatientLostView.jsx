import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";
import { ShieldCheck, Phone, Navigation, Home, Volume2, ArrowLeft, Heart, MapPin, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const PatientLostView = ({ onSpeakText, onBack }) => {
    const [patientLoc, setPatientLoc] = useState({ lat: 12.9725, lng: 77.5955 });
    const [homeLocation, setHomeLocation] = useState(() => {
        try {
            const saved = localStorage.getItem('mavora_home_loc');
            return saved ? JSON.parse(saved) : { lat: 12.9716, lng: 77.5946, address: "Home: 4th Cross, Green Park, Bangalore" };
        } catch (e) {
            return { lat: 12.9716, lng: 77.5946, address: "Home: 4th Cross, Green Park, Bangalore" };
        }
    });

    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setPatientLoc(loc);
                    axios.post(`${API_BASE}/patient/live_location`, {
                        lat: loc.lat,
                        lng: loc.lng,
                        accuracy: Math.round(pos.coords.accuracy || 10)
                    }).catch(() => {});
                },
                (err) => console.log("GPS err:", err)
            );
        }

        // Live backend sync for Safe Haven Home address set by family member on Laptop B
        const fetchSafeZone = async () => {
            try {
                const res = await axios.get(`${API_BASE}/patient/safe_zone`);
                if (res.data && res.data.address) {
                    setHomeLocation(res.data);
                    localStorage.setItem('mavora_home_loc', JSON.stringify(res.data));
                }
            } catch (err) {}
        };

        fetchSafeZone();
        const interval = setInterval(fetchSafeZone, 3000);
        return () => clearInterval(interval);
    }, []);

    const calmingMessage = "Please take a deep breath. You are completely safe. Your family has been notified and knows your exact location. Stay right where you are or follow the walking directions home.";

    const handleSpeakCalm = () => {
        if (onSpeakText) onSpeakText(calmingMessage);
    };

    const handleOpenDirections = () => {
        const url = `https://www.google.com/maps/dir/?api=1&origin=${patientLoc.lat},${patientLoc.lng}&destination=${homeLocation.lat},${homeLocation.lng}&travelmode=walking`;
        window.open(url, '_blank');
        if (onSpeakText) onSpeakText("Opening walking directions home. Walk carefully and stay on the sidewalk.");
    };

    return (
        <div className="w-full min-h-full px-4 pt-6 pb-20 md:px-8 md:pt-8 md:pb-24 flex flex-col items-center select-none bg-transparent text-white">
            <div className="w-full max-w-3xl space-y-6">

                {/* Back button */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-2 border border-[#F4EDE0]/15 transition-all cursor-pointer"
                    >
                        <ArrowLeft size={15} />
                        <span>Back to Dashboard</span>
                    </button>
                    <span className="text-[11px] font-mono font-medium text-zinc-300 bg-zinc-950 border border-[#F4EDE0]/15 px-3 py-1 rounded-full flex items-center gap-1.5">
                        <AlertTriangle size={13} className="text-zinc-400" />
                        Assistance Mode Active
                    </span>
                </div>

                {/* Main Comfort Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 md:p-8 rounded-3xl bg-[#0B1736]/75 border border-white/15 backdrop-blur-xl shadow-2xl text-center space-y-4"
                >
                    <div className="w-14 h-14 mx-auto rounded-full bg-white/5 border border-[#F4EDE0]/15 flex items-center justify-center text-zinc-200">
                        <ShieldCheck size={28} />
                    </div>

                    <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                        You Are Completely <span className="font-editorial italic font-normal text-zinc-100">Safe.</span>
                    </h1>

                    <p className="font-handwritten text-2xl text-zinc-300 max-w-xl mx-auto leading-relaxed">
                        “Please take a gentle breath. Mavora knows where you are and your family is watching over you with love.”
                    </p>

                    <button
                        onClick={handleSpeakCalm}
                        className="px-6 py-3 bg-white hover:bg-zinc-200 text-black rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
                    >
                        <Volume2 size={16} />
                        <span>Listen to Calming Voice</span>
                    </button>
                </motion.div>

                {/* Action Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Guide Me Home Card */}
                    <div className="p-5 rounded-2xl bg-[#0B1736]/75 border border-white/15 backdrop-blur-xl space-y-4 flex flex-col justify-between shadow-lg">
                        <div className="space-y-2">
                            <div className="p-2.5 bg-white/5 text-zinc-300 rounded-xl w-fit border border-[#F4EDE0]/15">
                                <Navigation size={20} />
                            </div>
                            <h3 className="text-sm font-bold text-white">Guide Me Home</h3>
                            <p className="text-xs text-zinc-400 font-mono">
                                {homeLocation.address}
                            </p>
                        </div>
                        <button
                            onClick={handleOpenDirections}
                            className="w-full py-3 bg-[#FF6B5B] hover:bg-[#ff5543] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B5B]/30 transition-all active:scale-95 cursor-pointer"
                        >
                            <MapPin size={15} />
                            <span>Start Walking Navigation</span>
                        </button>
                    </div>

                    {/* Emergency Family Call Card */}
                    <div className="p-5 rounded-2xl bg-[#0B1736]/75 border border-white/15 backdrop-blur-xl space-y-4 flex flex-col justify-between shadow-lg">
                        <div className="space-y-2">
                            <div className="p-2.5 bg-white/5 text-zinc-300 rounded-xl w-fit border border-[#F4EDE0]/15">
                                <Phone size={20} />
                            </div>
                            <h3 className="text-sm font-bold text-white">Call Family Caregiver</h3>
                            <p className="text-xs text-zinc-400 font-mono">
                                Primary Contact: Rahul (Son) • +91 98765 43210
                            </p>
                        </div>
                        <a
                            href="tel:+919876543210"
                            className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-[#F4EDE0]/15 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer text-center"
                        >
                            <Phone size={15} />
                            <span>One-Tap Call Family</span>
                        </a>
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950 border border-white/5 text-center">
                    <p className="font-handwritten text-lg text-zinc-400 flex items-center justify-center gap-1.5">
                        <Heart size={14} className="text-zinc-400" />
                        “Mavora safety monitoring is running gently in the background.”
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PatientLostView;
