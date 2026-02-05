


# 🌌 Aura Hockey AR

### *Ankara AI Hackathon '26 - Yapay Zeka Destekli Mekansal Spor Ürünü*

> **AI KODLAYICI İÇİN TALİMAT:** Lütfen bu projeyi aşağıda tanımlanan teknoloji yığını ve mimariyi kullanarak uygulayın. Sadece CDN tabanlı ES Modüllerini kullanın. Derleme araçlarına (npm/webpack) izin verilmez. Tüm mantığın temiz, modüler bir yapı içinde olduğundan emin olun.

---

## 🛠 Proje Mimarisi & Teknoloji Yığını

* **Motor:** CDN üzerinden `Three.js (v0.150.1)`.
* **Yapay Zeka Görüşü:** CDN üzerinden `MediaPipe Hands & Face Detection`.
* **Stil:** Play CDN üzerinden `Tailwind CSS`.
* **Ses:** `Web Audio API` (Prosedürel sentez, harici varlık yok).
* **Fizik:** Özel Eksen Hizalamalı Sınırlayıcı Kutu (AABB) ve Daire-Daire çarpışma mantığı.

---

## 🎯 Uygulama Yol Haritası (Direktifler)

### 1. Sahne Kurulumu (`main.js`)

* 3D Neon temalı bir Hava Hokeyi masası oluşturun.
* `PerspectiveCamera` ve `OrbitControls` kullanın (hata ayıklama için).
* Pak (puck) ve neon sınırlar üzerinde parlama efekti için `BloomPass` ekleyin.

### 2. Jest Kontrol Sistemi (`vision.js`)

* **MediaPipe Hands**'i başlatın.
* `Index_Finger_Tip` (İşaret Parmağı Ucu - Landmark 8) koordinatlarını Three.js 3D düzlemine eşleyin.
* Raket hareketindeki titremeyi önlemek için bir yumuşatma fonksiyonu (Lerp) uygulayın.
* **El Hareketi:** El kapalıysa (yumruk), raket rengini değiştirin veya sürtünmeyi artırın (Fren).

### 3. Nöral Rakip (AI) (`physics.js`)

* AI raketi, yapılandırılabilir bir gecikme (`kolay`, `orta`, `zor`) ile pakın X eksenini takip etmelidir.
* `Zor` modda, AI duvar sekmelerine dayalı olarak pakın yörüngesini tahmin etmelidir.

### 4. Prosedürel Ses Motoru (`sound.js`)

* Her çarpışmada bir `GainNode` ve `OscillatorNode` tetikleyin.
* Frekans, pakın hızıyla ilişkili olmalıdır (daha yüksek hız = daha yüksek perde).

---

## 🏆 Hackathon Hedefleri ("Neden")

Bu proje, **Ankara AI Hackathon '26** için şunları göstermek amacıyla yapılmıştır:

1. **Düşük Gecikmeli AI:** Tarayıcı içinde 60 FPS'de el takibi ve 3D oluşturma.
2. **Erişilebilirlik:** Ellerini kullanamayan kullanıcılar için kafa takibi kontrolü sağlama potansiyeli.
3. **Dağıtılabilirlik:** **Ucanble Hub** dağıtımı için hazır hafif mimari.
4. **Ölçeklenebilirlik:** Merkezi konfigürasyon (`config.js`) ile kolayca ayarlanabilir oyun dinamiği.

---

## 📂 Proje Yapısı

```text
/Ankara-AI-Hackathon-Aura-Hockey
├── index.html          # Ana Giriş (Arayüz & Script İçe Aktarmaları)
├── js/
│   ├── main.js         # Çekirdek Döngü
│   ├── vision.js       # MediaPipe Mantığı
│   ├── physics.js      # Çarpışma & Hareket
│   ├── sound.js        # Ses Sentezi
│   └── config.js       # Merkezi Konfigürasyon (Ölçeklenebilirlik)
└── css/
    └── style.css       # Özel Animasyonlar

```

---

## 🚀 Nasıl Çalıştırılır

1. Yukarıdaki mimari gereksinimleri okuyun.
2. Gerekli tüm CDN bağlantılarıyla `index.html` oluşturun.
3. 3D dünyayı başlatmak için `main.js` yazın.
4. Kamera görüntüsünü 3D raket ile köprülemek için `vision.js` uygulayın.
5. `index.html` dosyasını bir tarayıcıda açın.

---
