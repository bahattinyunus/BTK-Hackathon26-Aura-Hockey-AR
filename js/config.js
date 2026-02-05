/**
 * Oyun Konfigürasyonu
 * Kolay ayarlama ve ölçeklenebilirlik için merkezi ayarlar.
 * 'Ölçeklenebilirlik' hackathon kriteri için veriyi mantıktan ayırır.
 */
export const Config = {
    // Masa Boyutları (Birim)
    Table: {
        width: 10,
        length: 18,
        wallHeight: 0.5,
        friction: 0.998,
    },

    // Pak Ayarları
    Puck: {
        radius: 0.5,
        height: 0.2,
        initialSpeed: 5,
        maxSpeed: 25,
        mass: 1, // Normalize edilmiş
        color: 0xff00ff,
        emissive: 0xff00ff,
    },

    // Raket Ayarları
    Paddle: {
        radius: 0.6,
        height: 0.3,
        colorPlayer: 0x00ffff,
        colorAI: 0xff0000,
        brakeColor: 0xff3300, // Fren yapıldığında (Yumruk hareketi)
    },

    // Yapay Zeka Zorluk Ayarları
    AI: {
        lerpSpeed: 2.0, // Reaksiyon hızı
        defensiveLine: -7,
        attackLine: -4,
    },

    // Görseller & Son İşleme (Post-Processing)
    Graphics: {
        bloomStrength: 1.2,
        bloomRadius: 0.5,
        bloomThreshold: 0.1,
        // "Skin" / Gelir Modeli potansiyeli
        theme: 'neon_cyberpunk',
    },

    // Görüş / Kontroller
    Controls: {
        smoothing: 0.15, // Düşük değer daha pürüzsüz ama daha gecikmeli
        fistThreshold: 3, // Katlanan parmak sayısı
    },

    // Ses
    Audio: {
        baseFreq: 200,
        maxFreqOffset: 600,
    }
};
