export class Sound {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.buffers = {};
        this.enabled = true;
        this.init();
    }

    async init() {
        // Resume context if suspended (browser policy)
        if (this.ctx.state === 'suspended') {
            window.addEventListener('click', () => this.ctx.resume(), { once: true });
        }

        await this.loadSounds();
        console.log("Ses motoru hazır (Varlık tabanlı)");
    }

    async loadSounds() {
        const files = {
            'hit': 'assets/audio/hit1.ogg',
            'edge': 'assets/audio/edge1.ogg',
            'goal': 'assets/audio/goal1.ogg'
        };

        for (const [name, path] of Object.entries(files)) {
            try {
                const response = await fetch(path);
                const arrayBuffer = await response.arrayBuffer();
                this.buffers[name] = await this.ctx.decodeAudioData(arrayBuffer);
            } catch (e) {
                console.error(`Ses yükleme hatası (${name}):`, e);
            }
        }
    }

    playSound(name, volume = 1.0) {
        if (!this.enabled || !this.buffers[name]) return;

        const source = this.ctx.createBufferSource();
        source.buffer = this.buffers[name];

        const gainNode = this.ctx.createGain();
        gainNode.gain.value = volume;

        source.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        source.start(0);
    }

    playCollisionSound(velocity) {
        // Velocity (0-20) -> Volume (0.2-1.0)
        const volume = Math.min(Math.max(velocity / 20, 0.2), 1.0);
        this.playSound('hit', volume);
    }

    playEdgeSound(velocity) {
        const volume = Math.min(Math.max(velocity / 20, 0.2), 0.8);
        this.playSound('edge', volume);
    }

    playGoalSound() {
        this.playSound('goal', 1.0);
    }
}
