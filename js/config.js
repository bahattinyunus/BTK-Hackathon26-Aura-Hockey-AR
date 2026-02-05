/**
 * Oyun Konfigürasyonu
 * 'Zero-Build' ve 'Ölçeklenebilirlik' ilkelerine uygun merkezi ayarlar.
 */
export const Config = {
    // Masa Boyutları
    Table: {
        width: 12,
        length: 22,
        wallHeight: 0.5,
        friction: 0.992,
        gridSize: 20
    },

    // Pak Ayarları
    Puck: {
        radius: 0.6,
        height: 0.25,
        initialSpeed: 10,
        maxSpeed: 40,
        color: 0xFF00FF, // Magenta Neon
        lightIntensity: 2
    },

    // Raket Ayarları
    Paddle: {
        radius: 0.8,
        height: 0.4,
        colorPlayer: 0x00FFFF, // Cyan Neon
        colorAI: 0xFF3333,    // Red Neon
        brakeColor: 0xFFAA00, // Orange (Fren)
        lerpSpeed: 2.0 // AI Zorluk Çarpanı
    },

    // Yapay Zeka (AI)
    AI: {
        predictSteps: 60, // Geleceği tahmin etme adım sayısı
        errorMargin: 0.5, // İnsan hatası simülasyonu
    },

    // Görsel & Efektler
    Graphics: {
        bloomStrength: 2.5,
        bloomRadius: 0.4,
        bloomThreshold: 0.1,
        floorColor: 0x050510,
        gridColor: 0x222244
    },

    // Ses (Prosedürel Synth)
    Audio: {
        masterVolume: 0.3,
        synth: {
            hit: { type: 'square', decay: 0.1, freqBase: 200 },
            wall: { type: 'triangle', decay: 0.15, freqBase: 100 },
            goal: { type: 'sawtooth', duration: 0.5 }
        }
    },

    // Kontroller
    Controls: {
        smoothing: 0.12, // Düşük = Daha smooth
        fistThreshold: 3 // Kapanan parmak sayısı
    }
};
