import { Config } from './config.js';

export class Sound {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = null;
        this.enabled = true;

        // Ses türleri için osilatör konfigürasyonları Config'den alınır
    }

    init() {
        // Tarayıcı politikası gereği kullanıcı etkileşimi beklenir
        if (this.ctx.state === 'suspended') {
            const resumeAudio = () => {
                this.ctx.resume();
                console.log("Ses Motoru (Synth) Başlatıldı");
                window.removeEventListener('click', resumeAudio);
                window.removeEventListener('touchstart', resumeAudio);
            };
            window.addEventListener('click', resumeAudio);
            window.addEventListener('touchstart', resumeAudio);
        }

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = Config.Audio.masterVolume;
        this.masterGain.connect(this.ctx.destination);
    }

    /**
     * Prosedürel Ses Sentezleyicisi
     * Dosya yüklemek yok. Anlık matematiksel dalga üretimi.
     */
    playTone(type, frequency, duration, decay, pan = 0) {
        if (this.ctx.state === 'suspended' || !this.enabled) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const panner = this.ctx.createStereoPanner();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
        panner.pan.setValueAtTime(pan, this.ctx.currentTime);

        // Zarf (Envelope)
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(1, this.ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration + decay);

        osc.connect(gain);
        gain.connect(panner);
        panner.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration + decay + 0.1);
    }

    playCollisionSound(velocity, xPos = 0) {
        const pan = Math.max(-1, Math.min(1, xPos / (Config.Table.width / 2)));
        const intensity = Math.min(velocity / 30, 1.0);
        const freq = Config.Audio.synth.hit.freqBase + (intensity * 400);

        this.playTone(
            Config.Audio.synth.hit.type,
            freq,
            0.05,
            Config.Audio.synth.hit.decay,
            pan
        );
    }

    playEdgeSound(velocity, xPos = 0) {
        const pan = Math.max(-1, Math.min(1, xPos / (Config.Table.width / 2)));
        const intensity = Math.min(velocity / 30, 1.0);
        const freq = Config.Audio.synth.wall.freqBase + (intensity * 200);

        this.playTone(
            Config.Audio.synth.wall.type,
            freq,
            0.05,
            Config.Audio.synth.wall.decay,
            pan
        );
    }

    playGoalSound() {
        // Basit bir arpej (Zafer melodisi)
        const now = this.ctx.currentTime;
        const notes = [440, 554, 659, 880]; // A Major

        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone('sine', freq, 0.2, 0.3);
            }, i * 100);
        });
    }
}
