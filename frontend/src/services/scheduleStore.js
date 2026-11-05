// Shared Schedule & Medication Store with LocalStorage & Cloud Backend synchronization
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

const DEFAULT_SCHEDULE = [
    {
        id: "sch-1",
        time: "07:30 AM",
        slot: "morning",
        title: "Morning Garden Walk & Tea",
        category: "routine",
        notes: "Dad loves fresh air in the balcony/garden. Keep a warm shawl ready.",
        completed: false
    },
    {
        id: "sch-2",
        time: "08:30 AM",
        slot: "morning",
        title: "Breakfast & Blood Pressure Pill (Amlodipine 5mg)",
        category: "medicine",
        notes: "Take 1 tablet with lukewarm water after eating breakfast.",
        voice_prompt: "Dad, it's Sneha. Please take your morning blood pressure pill with water.",
        voice_sender: "Sneha (Daughter)",
        audioData: null,
        completed: false,
        takenAt: null,
        takenBy: null
    },
    {
        id: "sch-3",
        time: "01:00 PM",
        slot: "afternoon",
        title: "Lunch & Vitamin B12 + Omega 3",
        category: "medicine",
        notes: "Essential for neuroprotection. Take right after lunch.",
        voice_prompt: "Dad, remember to take your Vitamin B12 and Omega 3 after lunch.",
        voice_sender: "Sneha (Daughter)",
        audioData: null,
        completed: false,
        takenAt: null,
        takenBy: null
    },
    {
        id: "sch-4",
        time: "05:00 PM",
        slot: "afternoon",
        title: "Listen to Classical Music & Family Call",
        category: "routine",
        notes: "Calms evening sundowning agitation. Call Rahul (grandson).",
        completed: false
    },
    {
        id: "sch-5",
        time: "08:30 PM",
        slot: "night",
        title: "Dinner & Memory Care Tablet (Donepezil 10mg)",
        category: "medicine",
        notes: "Crucial Alzheimer's memory stabilization pill before sleep.",
        voice_prompt: "Dad, good night. Please take your memory tablet before going to bed. Love you.",
        voice_sender: "Sneha (Daughter)",
        audioData: null,
        completed: false,
        takenAt: null,
        takenBy: null
    }
];

export const getStoredSchedule = () => {
    try {
        const saved = localStorage.getItem("mavora_shared_schedule");
        if (saved) return JSON.parse(saved);
    } catch (e) {}
    localStorage.setItem("mavora_shared_schedule", JSON.stringify(DEFAULT_SCHEDULE));
    return DEFAULT_SCHEDULE;
};

export const saveStoredSchedule = async (schedule) => {
    localStorage.setItem("mavora_shared_schedule", JSON.stringify(schedule));
    // Trigger storage event for cross-tab or component sync
    window.dispatchEvent(new Event("storage_schedule_updated"));
    try {
        await axios.post(`${API_BASE}/schedule`, schedule);
    } catch (e) {
        console.warn("Backend schedule sync error:", e.message);
    }
};

export const fetchScheduleFromBackend = async () => {
    try {
        const res = await axios.get(`${API_BASE}/schedule`);
        if (Array.isArray(res.data) && res.data.length > 0) {
            localStorage.setItem("mavora_shared_schedule", JSON.stringify(res.data));
            window.dispatchEvent(new Event("storage_schedule_updated"));
            return res.data;
        }
    } catch (e) {
        console.warn("Backend schedule fetch error:", e.message);
    }
    return getStoredSchedule();
};
