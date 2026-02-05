# 🌌 Aura Hockey AR

### *Ankara AI Hackathon '26 - "Yapay Zeka ile Geleceği Birlikte İnşa Ediyoruz"*

> **HACKATHON MOTTOSU:**
> *"En çok kod yazan değil, en iyi ürünü çıkaran kazanır."*
>
> **AI KODLAYICI DİREKTİFİ:**
> Bu proje, **Ankara AI Hackathon 2026**'nın "Ürün & Problem Uyumu" ve "Teknik Yetkinlik" kriterlerinden tam puan (100/100) alacak şekilde tasarlanmıştır. Ucanble Hub entegrasyonuna hazır, uçtan uca çalışan bir sistemdir. Kod yapısı sade, modüler ve gösterişli (Wow Effect) olmalıdır.

---

## 🌟 Proje Vizyonu ve Problem Çözümü

**Problem:** Dijital çağda fiziksel hareketsizlik ve erişilebilirlik sorunları. Geleneksel VR/AR sporları pahalı donanımlar gerektirir.
**Çözüm:** **Aura Hockey AR**; yapay zeka teknolojilerini (MediaPipe) kullanarak, herhangi bir ek donanım gerektirmeden, her tarayıcıyı bir spor sahasına dönüştüren "Mekansal Web" (Spatial Web) ürünüdür.

* **Sınırsız Erişim:** Pahalı gözlüklere son. Sadece bir webcam yeterli.
* **Ucanble Hub Entegrasyonu:** Tek tıkla yayınlanan, geniş kitlelere ulaşan ölçeklenebilir bir Web uygulaması.

---

## 🏆 Jüri & Değerlendirme Uyumluluğu (100 Tam Puan Hedefi)

Projemiz, yarışmanın 5 temel kriterine tam uyum sağlayacak şekilde mimarilendirilmiştir:

### 1. Teknik Yetkinlik (25 Puan)
*   **Edge AI & Performans:** Bulut maliyeti yok. Tüm Computer Vision (Görü) işlemleri tarayıcıda (Client-Side) 60 FPS'de çalışır.
*   **Custom Physics:** Eksen Hizalamalı Sınırlayıcı Kutu (AABB) çarpışma motoru sıfırdan yazılarak performans optimize edilmiştir.
*   **Mimari:** "Zero-Build" yapısı ile saf ES Modülleri kullanılmıştır.

### 2. Ürün & Problem Uyumu (20 Puan)
*   Gerçek bir kullanıcı ihtiyacına (Hareketsizlik & Eğlence) dokunur.
*   "Yapay Zekayı Ürüne Dönüştürmek" hedefini tam karşılar; sadece bir demo değil, oynanabilir tam bir üründür.

### 3. Yenilikçilik (15 Puan)
*   **Orijinallik:** Klasik bir oyunu AR ile yeniden icat etmek.
*   **Farklılaşma:** Raket kontrolünde "Jest Tabanlı Fizik" (Yumruk sıkınca fren yapma vb.) kullanarak rakiplerden ayrışır.

### 4. Ticarileşme Potansiyeli (20 Puan)
*   **Gelir Modeli:** Oyun içi kozmetik satışları (NFT Raketler, Neon Temalar) ve Web tabanlı Arcade abonelik sistemi için uygundur.
*   **Pazar:** Hiper-basit (Hyper-casual) oyun pazarında anında ölçeklenebilir.

### 5. Ölçeklenebilirlik & Sunum (20 Puan)
*   **Config-Driven:** Tüm oyun dinamiği tek bir `config.js` dosyasından yönetilir.
*   **Demo Hazır:** 1 dakikalık "Wow" faktörü yüksek tanıtım için görsel efektler (Bloom, Particles) maksimize edilmiştir.

---

## 🛠 Teknik Plan & Mimari (30 Saatlik Akışa Uygun)

Bu proje, hackathon'un 30 saatlik akışına (Fikir -> Mimari -> Core -> Ürün) göre optimize edilmiştir.

*   **Motor:** `Three.js` (Görsel Şölen)
*   **Algı:** `MediaPipe` (Yapay Zeka)
*   **Stil:** `Tailwind CSS` (Hızlı UI)
*   **Ses:** `Web Audio API` (Prosedürel)

---

## 🎯 Uygulama Yol Haritası (Direktifler)

### Faz 1: Teknik Plan & Mimari (0-5. Saat)
*   **Sahne (`main.js`):** Neon siberpunk atmosferi kur. Bloom efektini aç. Performans bütçesini koru.
*   **Veri Akışı:** Webcam -> MediaPipe -> 3D Dünya koordinat eşlemesini kur.

### Faz 2: Core Geliştirme (5-15. Saat)
*   **Vision (`vision.js`):** El takibini pürüzsüzleştir (Lerp Function). Titremeyi yok et.
*   **AI Rakip (`physics.js`):** Basit bot yerine "Prediction" (Tahmin) algoritması kullanan zeki bir rakip yaz.

### Faz 3: Ürünleştirme & Arayüz (15-25. Saat)
*   **UI:** Skor tabelası, başlangıç ekranı ve "Oyun Bitti" ekranlarını Tailwind ile şık bir şekilde tasarla.
*   **Ses (`sound.js`):** Vuruş hissiyatını (Juice) artırmak için dinamik ses sentezi ekle.

### Faz 4: Test & Sunum Hazırlığı (25-30. Saat)
*   **Hata Ayıklama:** Işıklandırma ve çarpışma kenar durumlarını (Edge Cases) test et.
*   **Sunum:** Proje, jüri sunumunda "Canlı Demo" yapabilecek kararlılıkta olmalıdır.

---

## 📂 Proje Yapısı

```text
/Ankara-AI-Hackathon-Aura-Hockey
├── index.html          # Giriş & UI
├── js/
│   ├── main.js         # Sahne & Render Döngüsü
│   ├── vision.js       # AI Görü İşleme (MediaPipe)
│   ├── physics.js      # Oyun Fiziği & AI Bot
│   ├── sound.js        # Ses Motoru
│   └── config.js       # Merkezi Ayarlar (Ölçeklenebilirlik)
└── css/
    └── style.css       # Animasyonlar
```

---

## 🚀 Nasıl Çalıştırılır

1.  Repoyu indirin.
2.  Bir yerel sunucu başlatın (Örn: `Live Server` veya `python -m http.server`).
3.  Tarayıcıda açın ve kameraya izin verin.
4.  **Ucanble Hub** üzerinde yayınlanmaya hazırdır.

---

*"Gelecek, kod satırlarında değil, yarattığın değerdedir."*
