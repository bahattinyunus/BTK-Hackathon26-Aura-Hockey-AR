/**
 * Oyun Konfigürasyonu
 * 'Premium' ve 'Ölçeklenebilirlik' ilkelerine uygun merkezi ayarlar.
 */
export const Config = {
    // Masa Boyutları
    Table: {
        width: 12,
        length: 22,
        wallHeight: 0.6,
        friction: 0.993, // Biraz daha akıcı
        gridSize: 22
    },

    // Pak (Puck)
    Puck: {
        radius: 0.55,
        height: 0.25,
        initialSpeed: 12,
        maxSpeed: 50,
        color: 0xFF00FF,
        trailLength: 15, // Yeni: İz uzunluğu
        particleCount: 20 // Yeni: Çarpışma parçacığı
    },

    // Raket (Paddle)
    Paddle: {
        radius: 0.85,
        height: 0.45,
        colorPlayer: 0x00FFFF,
        colorAI: 0xFF3333,
        brakeColor: 0xFFAA00,
        lerpSpeed: 2.2,
        predictLevel: 2 // 0: Takip, 1: Basit Tahmin, 2: Duvar Sekme Tahmini
    },

    // Oyun Mekaniği (Fever Mode)
    Gameplay: {
        rallyThreshold: 10, // 10 vuruş sonrası Fever Mode
        feverSpeedMult: 1.4,
        feverBloomMult: 2.0
    },

    // Görsel & Efektler
    Graphics: {
        bloomStrength: 2.5,
        bloomRadius: 0.4,
        bloomThreshold: 0.1,
        floorColor: 0x050510,
        gridColor: 0x222244,
        shakeIntensity: 0.2 // Sarsıntı şiddeti
    },

    // Ses (Spatial Synth)
    Audio: {
        masterVolume: 0.4,
        spatial: true, // Yeni: 3rd person spatial audio
        synth: {
            hit: { type: 'square', decay: 0.12, freqBase: 220 },
            wall: { type: 'triangle', decay: 0.18, freqBase: 110 },
            goal: { type: 'sawtooth', duration: 0.6 }
        }
    },

    // Kontroller & Vision
    Controls: {
        smoothing: 0.1,
        fistThreshold: 3,
        showHandSkeleton: true // Yeni: El iskeletini göster
    }
};
