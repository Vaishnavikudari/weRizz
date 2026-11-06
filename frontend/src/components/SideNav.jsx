import axios from 'axios';
const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';
import React, { useState, useEffect } from 'react';
import { Home, Users, Settings, MapPin, Brain, Calendar, LogOut, Compass, Bell, BellRing } from 'lucide-react';
import { getNotificationPermission, requestNotificationPermission } from '../utils/browserNotifications';

const NavBar = ({ onViewChange, currentView, onOpenVoiceSettings }) => {
    const [geofenceActive, setGeofenceActive] = useState(false);
    const [notificationPerm, setNotificationPerm] = useState(() => getNotificationPermission());

    useEffect(() => {
        setNotificationPerm(getNotificationPermission());
        const checkAlert = async () => {
            try {
                const res = await axios.get(`${API_BASE}/patient/geofence_alert`);
                setGeofenceActive(Boolean(res.data?.active && res.data?.breached));
            } catch (e) {}
        };
        checkAlert();
        const t = setInterval(checkAlert, 3000);
        return () => clearInterval(t);
    }, []);

    const handleEnableNotifications = async () => {
        const perm = await requestNotificationPermission();
        setNotificationPerm(perm);
    };

    // Check if currently inside Patient Mode or Family Mode
    const isPatientSession = currentView === 'patient' || currentView === 'greeting' || currentView === 'patient_schedule' || currentView === 'patient_lost' || currentView === 'patient_gps';
    const isFamilySession = currentView === 'caregiver' || currentView === 'tracking';

    return (
        <>
            <header className="topnav">
                <div className="nav-brand" onClick={() => onViewChange('landing')} style={{ cursor: 'pointer' }}>
                    <Brain size={22} color="#60A5FA" strokeWidth={1.75} />
                    <span className="brand-text">Mavora</span>
                    {isPatientSession && (
                        <span className="mode-badge">Patient Space</span>
                    )}
                    {isFamilySession && (
                        <span className="mode-badge">Caregiver Portal</span>
                    )}
                </div>

                <nav className="nav-links">
                    {/* Native Chrome / Desktop Notification Pill */}
                    {notificationPerm !== 'granted' && notificationPerm !== 'unsupported' && (
                        <button
                            type="button"
                            className="nav-item notif-enable-btn"
                            onClick={handleEnableNotifications}
                            title="Enable Chrome system notifications for family alerts and reminders"
                        >
                            <Bell size={14} className="animate-bounce text-amber-300" />
                            <span className="hidden sm:inline text-amber-200 font-semibold">Enable Chrome Alerts</span>
                        </button>
                    )}

                    {/* 1. If in Patient Mode: ONLY SHOW PATIENT SAFE PAGES */}
                    {isPatientSession && (
                        <>
                            <button 
                                className={`nav-item ${currentView === 'patient' ? 'active' : ''}`} 
                                onClick={() => onViewChange('patient')}
                            >
                                <Users size={16} strokeWidth={1.5} />
                                <span className="hidden sm:inline">Voice Assistant & </span><span>Chat</span>
                            </button>

                            <button 
                                className={`nav-item ${currentView === 'patient_schedule' ? 'active' : ''}`} 
                                onClick={() => onViewChange('patient_schedule')}
                            >
                                <Calendar size={16} strokeWidth={1.5} />
                                <span className="hidden sm:inline">My Day & </span><span>Medicine</span>
                            </button>

                            <button 
                                className={`nav-item ${currentView === 'patient_gps' || currentView === 'patient_lost' ? 'active' : ''}`} 
                                onClick={() => onViewChange('patient_gps')}
                                title="Patient Live GPS & Take Me Home"
                            >
                                <Compass size={16} strokeWidth={1.5} />
                                <span className="hidden sm:inline">Live </span><span>GPS & Safety</span>
                            </button>

                            <button 
                                className="nav-item exit-item" 
                                onClick={() => onViewChange('landing')}
                                title="Exit to Home"
                            >
                                <LogOut size={15} strokeWidth={1.5} />
                                <span>Exit</span>
                            </button>
                        </>
                    )}

                    {/* 2. If in Family Mode: ONLY SHOW FAMILY CONTROLS */}
                    {isFamilySession && (
                        <>
                            <button 
                                className={`nav-item ${currentView === 'caregiver' ? 'active' : ''}`} 
                                onClick={() => onViewChange('caregiver')}
                            >
                                <Settings size={16} strokeWidth={1.5} />
                                <span>Family Dashboard</span>
                            </button>

                            <button 
                                className={`nav-item ${currentView === 'tracking' ? 'active' : ''} ${geofenceActive ? 'bg-red-500/20 text-red-200 border-red-500/40 animate-pulse' : ''}`} 
                                onClick={() => onViewChange('tracking')}
                            >
                                <MapPin size={16} className={geofenceActive ? "text-red-400 animate-bounce" : ""} strokeWidth={1.5} />
                                <span>GPS Tracker</span>
                                {geofenceActive && (
                                    <span className="ml-1 px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[9px] font-bold">
                                        ALERT
                                    </span>
                                )}
                            </button>

                            <button 
                                className="nav-item exit-item" 
                                onClick={() => onViewChange('landing')}
                                title="Exit to Home"
                            >
                                <LogOut size={15} strokeWidth={1.5} />
                                <span>Exit</span>
                            </button>
                        </>
                    )}

                    {/* 3. If on Landing/Login: Standard Entry Nav */}
                    {!isPatientSession && !isFamilySession && (
                        <>
                            <button 
                                className={`nav-item ${currentView === 'landing' ? 'active' : ''}`} 
                                onClick={() => onViewChange('landing')}
                            >
                                <Home size={16} strokeWidth={1.5} />
                                <span>Home</span>
                            </button>

                            <button 
                                className="nav-item patient-launch" 
                                onClick={() => onViewChange('patient')}
                            >
                                <Users size={15} strokeWidth={1.75} />
                                <span>Enter Patient Mode</span>
                            </button>

                            <button 
                                className="nav-item family-launch" 
                                onClick={() => onViewChange('caregiver')}
                            >
                                <Settings size={15} strokeWidth={1.5} />
                                <span>Family Login</span>
                            </button>
                        </>
                    )}
                </nav>
            </header>

            <style>{`
        .topnav {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 70px;
            background: rgba(7, 13, 30, 0.85);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.10);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 32px;
            z-index: 1000;
        }
        .nav-brand {
            display: flex;
            align-items: center;
            gap: 10px;
            user-select: none;
        }
        .brand-text {
            font-family: 'The Seasons', 'Cormorant Garamond', 'Playfair Display', serif;
            font-size: 1.35rem;
            font-weight: 600;
            letter-spacing: 0.02em;
            color: #FFFFFF;
        }
        .mode-badge {
            font-size: 0.65rem;
            font-family: 'Montserrat', sans-serif;
            text-transform: uppercase;
            letter-spacing: 0.16em;
            padding: 3px 9px;
            border-radius: 999px;
            background: rgba(96, 165, 250, 0.14);
            border: 1px solid rgba(96, 165, 250, 0.35);
            color: #93C5FD;
            margin-left: 6px;
        }
        .nav-links {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .nav-item {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 14px;
            border-radius: 12px;
            font-family: 'Montserrat', sans-serif;
            font-size: 0.82rem;
            font-weight: 500;
            color: rgba(226, 232, 240, 0.85);
            background: transparent;
            border: 1px solid transparent;
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
        }
        .nav-item:hover {
            color: #FFFFFF;
            background: rgba(255, 255, 255, 0.06);
            border-color: rgba(255, 255, 255, 0.10);
        }
        .nav-item.active {
            color: #FFFFFF;
            background: rgba(96, 165, 250, 0.18);
            border-color: rgba(96, 165, 250, 0.40);
        }
        .notif-enable-btn {
            background: rgba(245, 158, 11, 0.15) !important;
            border: 1px solid rgba(245, 158, 11, 0.35) !important;
            color: #FDE68A !important;
        }
        .notif-enable-btn:hover {
            background: rgba(245, 158, 11, 0.25) !important;
            border-color: rgba(245, 158, 11, 0.6) !important;
        }
        .patient-launch {
            background: #2563EB;
            color: #FFFFFF;
            font-weight: 600;
            box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
        }
        .patient-launch:hover {
            background: #1D4ED8;
            color: #FFFFFF;
        }
        .family-launch {
            background: rgba(255, 255, 255, 0.04);
            color: #E2E8F0;
            border: 1px solid rgba(255, 255, 255, 0.25);
        }
        .family-launch:hover {
            background: rgba(255, 255, 255, 0.08);
            color: #FFFFFF;
            border-color: rgba(255, 255, 255, 0.45);
        }
        .exit-item {
            color: rgba(226, 232, 240, 0.65);
        }
        .exit-item:hover {
            color: #93C5FD;
            background: rgba(96, 165, 250, 0.12);
        }
        @media (max-width: 768px) {
            .topnav {
                padding: 0 12px;
                height: 60px;
            }
            .brand-text {
                font-size: 1.15rem;
            }
            .mode-badge {
                display: none;
            }
            .nav-links {
                gap: 4px;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                max-width: calc(100vw - 110px);
                scrollbar-width: none;
            }
            .nav-links::-webkit-scrollbar {
                display: none;
            }
            .nav-item {
                padding: 5px 8px;
                font-size: 0.72rem;
                gap: 4px;
            }
        }
      `}</style>
        </>
    );
};

export default NavBar;
