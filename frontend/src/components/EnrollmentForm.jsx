import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
    UserPlus, 
    PackagePlus, 
    Sparkles, 
    UploadCloud, 
    Check, 
    X, 
    Camera, 
    AlertTriangle,
    RefreshCw,
    Trash2
} from 'lucide-react';
import AudioRecorder from './AudioRecorder';

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

function EnrollmentForm({ type = 'person', onCancel, onSave, onSuccess }) {
    const isPerson = type === 'person';
    
    // Exactly matches Family / Caregiver Mode
    const [formData, setFormData] = useState({ name: '', relation: '', notes: '', age: '' });
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [audioBlob, setAudioBlob] = useState(null);
    const [status, setStatus] = useState(null); // 'submitting' | 'success' | 'error'
    const [errorMessage, setErrorMessage] = useState(null);

    // Live Camera snap mode option
    const [useCamera, setUseCamera] = useState(false);
    const [cameraStream, setCameraStream] = useState(null);
    const videoRef = useRef(null);

    useEffect(() => {
        return () => {
            if (cameraStream) {
                cameraStream.getTracks().forEach(t => t.stop());
            }
        };
    }, [cameraStream]);

    const startCamera = async () => {
        try {
            setUseCamera(true);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
                audio: false
            });
            setCameraStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                try {
                    await videoRef.current.play();
                } catch (e) {
                    console.warn("Video play error:", e);
                }
            }
        } catch (err) {
            console.error("Camera access error:", err);
            setUseCamera(false);
            alert("Could not access camera. Please allow camera permissions or upload a photo file.");
        }
    };

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(t => t.stop());
            setCameraStream(null);
        }
        setUseCamera(false);
    };

    const snapCameraPhoto = () => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
            if (blob) {
                const snappedFile = new File([blob], `${(formData.name || 'person').replace(/\s+/g, '_')}_snap.jpg`, { type: "image/jpeg" });
                setFile(snappedFile);
                setFilePreview(URL.createObjectURL(blob));
            }
            stopCamera();
        }, 'image/jpeg', 0.92);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return alert("Please enter a name.");
        if (!file) return alert("Please upload or take a photo.");

        setStatus('submitting');
        setErrorMessage(null);

        const data = new FormData();
        data.append('file', file);
        data.append('name', formData.name.trim());
        data.append('notes', formData.notes || '');

        try {
            if (!isPerson) {
                // Object enrollment
                const res = await axios.post(`${API_BASE}/remember/object`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                if (res.data && res.data.status === 'stored') {
                    setStatus('success');
                    setTimeout(() => {
                        if (onSuccess) onSuccess({ name: formData.name, ...res.data });
                        else if (onCancel) onCancel();
                    }, 1200);
                } else {
                    throw new Error(res.data?.message || "Failed to save item");
                }
            } else {
                // Person enrollment - SAME AS FAMILY MODE
                data.append('relation', formData.relation || 'Family');
                if (formData.age) data.append('age', formData.age);
                if (audioBlob) data.append('audio_file', audioBlob, 'voice.webm');

                const res = await axios.post(`${API_BASE}/remember/person`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (res.data && res.data.status === 'stored') {
                    setStatus('success');
                    setTimeout(() => {
                        if (onSuccess) onSuccess({ name: formData.name, ...res.data });
                        else if (onCancel) onCancel();
                    }, 1200);
                } else {
                    setStatus('error');
                    setErrorMessage(res.data?.message || 'Could not enroll person. Please try again.');
                }
            }
        } catch (err) {
            console.error("Enrollment error:", err);
            setStatus('error');
            const detail = err.response?.data?.detail || err.message || 'Server connection error';
            setErrorMessage(`Failed to save: ${detail}`);
        }
    };

    return (
        <div className="w-full h-full bg-transparent text-white flex flex-col p-4 md:p-6 overflow-y-auto">
            <div className="max-w-xl w-full mx-auto bg-[#0B1736]/75 border border-white/15 backdrop-blur-xl rounded-3xl p-5 md:p-7 shadow-2xl space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-white/5 pb-4">
                    <div>
                        <div className="flex items-center gap-2 text-violet-400 mb-1">
                            {isPerson ? <UserPlus size={18} /> : <PackagePlus size={18} />}
                            <span className="text-[11px] font-bold uppercase tracking-wider">
                                {isPerson ? "Memory Bank Enrollment" : "Item Tracking Enrollment"}
                            </span>
                        </div>
                        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                            <Sparkles size={18} className="text-violet-400" />
                            {isPerson ? "Enroll Loved One" : "Enroll Personal Item"}
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                            {isPerson 
                                ? "Upload a face photo so Mavora and the family portal can recognize them instantly."
                                : "Upload an item photo to remember where you placed it."}
                        </p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        title="Cancel and return to chat"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Status Banners */}
                {status === 'success' && (
                    <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl flex items-center gap-3 text-emerald-300 font-bold text-xs">
                        <Check size={18} className="text-emerald-400" />
                        <div>
                            <p>{isPerson ? "Person successfully enrolled into Memory Bank!" : "Item successfully remembered!"}</p>
                            <p className="text-[10px] text-emerald-400/80 font-normal">Saved to family memory. Returning to assistant...</p>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="p-4 bg-rose-950/80 border border-rose-500/50 rounded-2xl flex items-center gap-3 text-rose-300 font-bold text-xs">
                        <AlertTriangle size={18} className="text-rose-400 flex-shrink-0" />
                        <div>
                            <p>{errorMessage || 'Enrollment failed. Please check photo and try again.'}</p>
                        </div>
                    </div>
                )}

                {/* Main Form - Same as Family Mode */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-300">
                                {isPerson ? "Full Name *" : "Item Name *"}
                            </label>
                            <input
                                type="text"
                                required
                                placeholder={isPerson ? "e.g. Rahul Sharma" : "e.g. Medicine Box, Keys"}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full mt-1 p-3 bg-[#181820] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-white/30"
                            />
                        </div>

                        {isPerson ? (
                            <div>
                                <label className="text-xs font-semibold text-slate-300">Relationship *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Grandson / Daughter / Doctor"
                                    value={formData.relation}
                                    onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                                    className="w-full mt-1 p-3 bg-[#181820] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-white/30"
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="text-xs font-semibold text-slate-300">Usual Location</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Bedside table / Living room shelf"
                                    value={formData.relation}
                                    onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                                    className="w-full mt-1 p-3 bg-[#181820] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-white/30"
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-slate-300">
                            {isPerson ? "Key Memories & Context Notes (Whispered to Patient)" : "Description / Details"}
                        </label>
                        <textarea
                            rows="2"
                            placeholder={isPerson ? "e.g. Loves acoustic guitar, visits on Sundays, brought jalebis last week." : "e.g. Blue plastic box with morning and night pill slots."}
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full mt-1 p-3 bg-[#181820] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/30"
                        />
                    </div>

                    {/* PHOTO UPLOAD & CAMERA SNAP SECTION - Exactly like Family Mode */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-slate-300">
                                {isPerson ? "Face Photo *" : "Item Photo *"}
                            </label>
                            {!useCamera && (
                                <button
                                    type="button"
                                    onClick={startCamera}
                                    className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1.5 font-medium transition-colors"
                                >
                                    <Camera size={14} />
                                    <span>Take Photo with Camera</span>
                                </button>
                            )}
                        </div>

                        {/* Camera Stream Overlay */}
                        {useCamera ? (
                            <div className="relative rounded-2xl overflow-hidden bg-black border border-violet-500/40 p-2 flex flex-col items-center">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full max-h-56 object-cover rounded-xl"
                                />
                                <div className="flex items-center gap-3 mt-3">
                                    <button
                                        type="button"
                                        onClick={snapCameraPhoto}
                                        className="px-4 py-2 bg-white hover:bg-zinc-200 text-black text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                                    >
                                        <Camera size={14} /> Snap Photo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={stopCamera}
                                        className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-semibold rounded-xl"
                                    >
                                        Cancel Camera
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* File Upload Box (Same as Family Mode) */
                            <div className="relative">
                                <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/15 hover:border-white/30 p-5 rounded-2xl cursor-pointer bg-[#101014] transition-all">
                                    {filePreview ? (
                                        <div className="relative group">
                                            <img 
                                                src={filePreview} 
                                                alt="Preview" 
                                                className="max-h-40 rounded-xl object-contain shadow-lg border border-white/10" 
                                            />
                                            <div className="text-center mt-2">
                                                <span className="text-[11px] text-zinc-300 font-semibold underline">Click to change photo</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center text-slate-400 py-3">
                                            <UploadCloud size={32} className="mx-auto mb-2 text-zinc-300" />
                                            <span className="text-xs font-bold text-slate-200 block">Click to Upload Photo</span>
                                            <p className="text-[10px] text-slate-500 mt-1">JPEG, PNG with clear face visibility</p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const f = e.target.files[0];
                                            if (f) {
                                                setFile(f);
                                                setFilePreview(URL.createObjectURL(f));
                                            }
                                        }}
                                    />
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Voice Sample (Optional for Person) */}
                    {isPerson && (
                        <div>
                            <label className="text-xs font-semibold text-slate-300 block mb-2">Voice Recording (Optional)</label>
                            <div className="p-3 bg-[#181820] border border-white/10 rounded-2xl flex flex-col items-center justify-center min-h-[90px]">
                                <AudioRecorder onRecordingComplete={(blob) => setAudioBlob(blob)} />
                                <p className="text-[10px] text-slate-500 mt-1.5 text-center">Record a short greeting like "Hello Dad, it's Rahul!"</p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/5">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={status === 'submitting'}
                            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={status === 'submitting'}
                            className="px-6 py-2.5 bg-white hover:bg-zinc-200 text-black font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer active:scale-95"
                        >
                            {status === 'submitting' ? (
                                <>
                                    <RefreshCw size={14} className="animate-spin" />
                                    <span>Saving to Memory Bank...</span>
                                </>
                            ) : (
                                <>
                                    <UserPlus size={14} />
                                    <span>Save to Memory Bank</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EnrollmentForm;
