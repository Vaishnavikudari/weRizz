import React, { useEffect, useRef } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

/**
 * PatientGpsBeacon:
 * Runs silently in the background on Laptop A (Patient device).
 * Regularly broadcasts live GPS coordinates to the backend so the caregiver's
 * Laptop B can monitor safety and trigger autonomous wandering alarms if breached.
 */
const PatientGpsBeacon = () => {
    const lastSentCoordsRef = useRef({ lat: 0, lng: 0 });

    useEffect(() => {
        if (!('geolocation' in navigator)) return;

        const sendLocation = async (lat, lng, accuracy = 10) => {
            // Avoid redundant network requests if coordinates haven't changed meaningfully
            const deltaLat = Math.abs(lat - lastSentCoordsRef.current.lat);
            const deltaLng = Math.abs(lng - lastSentCoordsRef.current.lng);
            if (deltaLat < 0.00005 && deltaLng < 0.00005) return;

            lastSentCoordsRef.current = { lat, lng };
            try {
                await axios.post(`${API_BASE}/patient/live_location`, {
                    lat,
                    lng,
                    accuracy: Math.round(accuracy),
                    is_simulated: false
                });
            } catch (e) {}
        };

        // 1. Initial position check
        navigator.geolocation.getCurrentPosition(
            (pos) => sendLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
            () => {},
            { enableHighAccuracy: true, timeout: 10000 }
        );

        // 2. Continuous real-time movement watcher
        const watchId = navigator.geolocation.watchPosition(
            (pos) => sendLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
            (err) => console.log("Patient GPS Beacon:", err.message),
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
        );

        // 3. Keepalive heartbeat interval every 12 seconds
        const heartbeat = setInterval(() => {
            navigator.geolocation.getCurrentPosition(
                (pos) => sendLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
                () => {},
                { enableHighAccuracy: true, timeout: 10000 }
            );
        }, 12000);

        return () => {
            navigator.geolocation.clearWatch(watchId);
            clearInterval(heartbeat);
        };
    }, []);

    return null; // Silent background service
};

export default PatientGpsBeacon;

