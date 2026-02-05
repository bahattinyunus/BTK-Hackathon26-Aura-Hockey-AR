import { Config } from './config.js';

export class Sound {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = null;
        this.enabled = true;
        this.analyser = null;
        this.dataArray = null;
        this.bufferLength = 0;
        this.tempo = 124;
        this.rhythmTimer = null;

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

        // Analyser
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 128; // Hızlı analiz
        this.bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);
        this.masterGain.connect(this.analyser);

        this.startRhythm();
    }

    getAverageVolume() {
        if (!this.analyser) return 0;
        this.analyser.getByteFrequencyData(this.dataArray);
        let values = 0;
        for (let i = 0; i < this.bufferLength; i++) {
            values += this.dataArray[i];
        }
        return (values / this.bufferLength) / 255.0; // 0-1 arası
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

    startRhythm() {
        let step = 0;
        const interval = (60 / this.tempo) / 2 * 1000; // 8th notes

        this.rhythmTimer = setInterval(() => {
            if (!this.enabled) return;
            const rally = window.game?.physics?.rallyCount || 0;

            // Kick on 1 and 3
            if (step % 2 === 0) {
                this.playTone('sine', 60, 0.1, 0.2); // Kick
            }

            // Hi-hat on off-beats (scales with rally)
            if (step % 2 === 1 && rally > 4) {
                this.playTone('noise', 10000, 0.02, 0.05); // Hat
            }

            // Bass synth on high rally
            if (step % 4 === 2 && rally > 10) {
                this.playTone('sawtooth', 40, 0.1, 0.4); // Bass
            }

            // Procedural Melody (Melodic Techno)
            if (rally > 5 && (step === 3 || step === 7)) {
                const notes = [440, 523, 587, 659]; // A Minor Pentatonic
                const note = notes[Math.floor(Math.random() * notes.length)];
                this.playTone('triangle', note, 0.05, 0.1);
            }

            step = (step + 1) % 8;
        }, interval);
    }
}
