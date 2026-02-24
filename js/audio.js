// ============================================================
// audio.js — SoundManager (Web Audio API, procedural 8-bit SFX)
// ============================================================
const SoundManager = {
    ctx: null,
    enabled: true,
    initialized: false,

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    },

    _tone(freq, dur, type = 'square', vol = 0.12, delay = 0) {
        if (!this.enabled || !this.ctx) return;
        const t = this.ctx.currentTime + delay;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.start(t);
        osc.stop(t + dur);
    },

    _noise(dur, vol = 0.06, delay = 0) {
        if (!this.enabled || !this.ctx) return;
        const t = this.ctx.currentTime + delay;
        const bufferSize = this.ctx.sampleRate * dur;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        const gain = this.ctx.createGain();
        src.connect(gain);
        gain.connect(this.ctx.destination);
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
        src.start(t);
        src.stop(t + dur);
    },

    playCollect() {
        this._tone(523, 0.08, 'square', 0.1, 0);
        this._tone(659, 0.08, 'square', 0.1, 0.06);
        this._tone(784, 0.12, 'square', 0.1, 0.12);
    },

    playWrong() {
        this._tone(200, 0.15, 'sawtooth', 0.08, 0);
        this._tone(150, 0.2, 'sawtooth', 0.08, 0.1);
        this._noise(0.15, 0.04, 0.05);
    },

    playWarp() {
        for (let i = 0; i < 12; i++) {
            this._tone(200 + i * 120, 0.06, 'sine', 0.04, i * 0.025);
        }
        this._noise(0.3, 0.03, 0);
    },

    playFormulaComplete() {
        this._tone(523, 0.12, 'sine', 0.1, 0);
        this._tone(784, 0.12, 'sine', 0.1, 0.1);
        this._tone(1047, 0.2, 'sine', 0.12, 0.2);
    },

    playBossCorrect() {
        this._tone(523, 0.08, 'square', 0.09, 0);
        this._tone(659, 0.08, 'square', 0.09, 0.08);
        this._tone(784, 0.08, 'square', 0.09, 0.16);
        this._tone(1047, 0.18, 'square', 0.1, 0.24);
    },

    playBossWrong() {
        this._tone(392, 0.14, 'triangle', 0.08, 0);
        this._tone(349, 0.14, 'triangle', 0.08, 0.14);
        this._tone(294, 0.28, 'triangle', 0.08, 0.28);
    },

    playClick() {
        this._tone(800, 0.04, 'sine', 0.06);
    },

    playLevelUp() {
        [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => {
            this._tone(f, 0.1, 'square', 0.09, i * 0.09);
        });
    },

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
};
