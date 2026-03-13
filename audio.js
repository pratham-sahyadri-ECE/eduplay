/**
 * audio.js – Web Audio API sound engine for Math Racing
 * All sounds are procedurally synthesized (no external files needed).
 */

const AudioEngine = (() => {
    let ctx = null;
    let gainMaster = null;
    let ambienceOsc = null;
    let ambienceGain = null;
    let ambienceRunning = false;
    let muted = false;

    function getCtx() {
        if (!ctx) {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            gainMaster = ctx.createGain();
            gainMaster.gain.value = 0.7;
            gainMaster.connect(ctx.destination);
        }
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }

    // ── Core helpers ─────────────────────────────────────────────────

    function createOsc(type, freq, startTime, duration, gainVal = 0.4) {
        const c = getCtx();
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);
        g.gain.setValueAtTime(gainVal, startTime);
        g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(g);
        g.connect(gainMaster);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);
        return { osc, g };
    }

    function createNoiseBuffer(duration) {
        const c = getCtx();
        const bufLen = Math.floor(c.sampleRate * duration);
        const buf = c.createBuffer(1, bufLen, c.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
        return buf;
    }

    // ── Public API ───────────────────────────────────────────────────

    function playEngineBoost() {
        if (muted) return;
        const c = getCtx();
        const now = c.currentTime;
        // Rising engine roar
        createOsc('sawtooth', 80, now, 0.05, 0.3);
        createOsc('sawtooth', 100, now + 0.02, 0.6, 0.35);
        const { osc } = createOsc('square', 120, now + 0.05, 0.4, 0.15);
        osc.frequency.exponentialRampToValueAtTime(280, now + 0.35);
        createOsc('sine', 200, now + 0.3, 0.3, 0.2);
    }

    function playBuzz() {
        if (muted) return;
        const c = getCtx();
        const now = c.currentTime;
        createOsc('square', 110, now, 0.12, 0.3);
        createOsc('square', 90, now + 0.15, 0.12, 0.25);
        createOsc('square', 70, now + 0.30, 0.18, 0.2);
    }

    function playCountdownBeep(pitch = 440) {
        if (muted) return;
        const c = getCtx();
        const now = c.currentTime;
        createOsc('sine', pitch, now, 0.18, 0.4);
    }

    function playGo() {
        if (muted) return;
        const c = getCtx();
        const now = c.currentTime;
        createOsc('sine', 880, now, 0.1, 0.5);
        createOsc('sine', 1320, now + 0.05, 0.35, 0.4);
        createOsc('sine', 1760, now + 0.12, 0.5, 0.35);
    }

    function playVictory() {
        if (muted) return;
        const c = getCtx();
        const now = c.currentTime;
        // Victory fanfare notes
        const melody = [523, 659, 784, 1047, 784, 1047];
        melody.forEach((freq, i) => {
            createOsc('triangle', freq, now + i * 0.13, 0.2, 0.35);
        });
        // Crowd noise burst
        const buf = createNoiseBuffer(1.5);
        const src = c.createBufferSource();
        const filt = c.createBiquadFilter();
        const g = c.createGain();
        src.buffer = buf;
        filt.type = 'bandpass';
        filt.frequency.value = 1200;
        filt.Q.value = 0.5;
        g.gain.setValueAtTime(0.15, now + 0.3);
        g.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
        src.connect(filt);
        filt.connect(g);
        g.connect(gainMaster);
        src.start(now + 0.3);
        src.stop(now + 2.5);
    }

    function startRaceAmbience() {
        if (muted || ambienceRunning) return;
        const c = getCtx();
        ambienceOsc = c.createOscillator();
        ambienceGain = c.createGain();
        const dist = c.createWaveShaper();
        // Soft distort for engine rumble feel
        const curve = new Float32Array(256);
        for (let i = 0; i < 256; i++) {
            const x = (i * 2) / 256 - 1;
            curve[i] = (Math.PI + 200) * x / (Math.PI + 200 * Math.abs(x));
        }
        dist.curve = curve;
        ambienceOsc.type = 'sawtooth';
        ambienceOsc.frequency.value = 55;
        ambienceGain.gain.value = 0.06;
        ambienceOsc.connect(dist);
        dist.connect(ambienceGain);
        ambienceGain.connect(gainMaster);
        ambienceOsc.start();
        ambienceRunning = true;
    }

    function stopRaceAmbience() {
        if (!ambienceRunning || !ambienceOsc) return;
        ambienceGain.gain.exponentialRampToValueAtTime(0.001, getCtx().currentTime + 0.5);
        setTimeout(() => {
            try { ambienceOsc.stop(); } catch (e) { }
            ambienceRunning = false;
        }, 600);
    }

    function setMuted(val) { muted = val; }
    function isMuted() { return muted; }

    return { playEngineBoost, playBuzz, playCountdownBeep, playGo, playVictory, startRaceAmbience, stopRaceAmbience, setMuted, isMuted };
})();
