// Sound and Voice synthesizer for GPS Wandering / Geofence Alerts

// Emergency Attention Chime for Family / Caregiver Mode
export const playCaregiverBreachSound = () => {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        const now = ctx.currentTime;
        
        // High-clarity 4-tone alert cadence (D5 -> G5 -> A5 -> D6)
        const tones = [
            { freq: 587.33, start: 0.00, dur: 0.16, gain: 0.25 },
            { freq: 783.99, start: 0.18, dur: 0.16, gain: 0.28 },
            { freq: 880.00, start: 0.36, dur: 0.20, gain: 0.30 },
            { freq: 1174.66, start: 0.58, dur: 0.38, gain: 0.25 }
        ];

        tones.forEach(t => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(t.freq, now + t.start);
            gain.gain.setValueAtTime(t.gain, now + t.start);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + t.start + t.dur);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + t.start);
            osc.stop(now + t.start + t.dur);
        });
    } catch (e) {
        console.warn('Caregiver breach audio error:', e);
    }
};

// Gentle Calming Melodic Chime for Patient Mode (Never jarring or scary)
export const playPatientCalmChime = () => {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        const now = ctx.currentTime;
        
        // Warm harmonic chord (C4, E4, G4, C5)
        const chord = [261.63, 329.63, 392.00, 523.25];
        chord.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.18);
            gain.gain.setValueAtTime(0.18, now + idx * 0.18);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.18 + 0.9);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.18);
            osc.stop(now + idx * 0.18 + 0.9);
        });
    } catch (e) {
        console.warn('Patient calm audio error:', e);
    }
};

// Speech synthesis announcer
export const speakBreachAlert = (text) => {
    if ('speechSynthesis' in window) {
        try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.92;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.warn('Speech synthesis alert error:', e);
        }
    }
};

