# 🏒 Aura Hockey AR - Enhanced Edition

**Ankara AI Hackathon 2026 | Yapay Zeka Tabanlı AR Oyun Platformu**

[![AI Powered](https://img.shields.io/badge/AI-MediaPipe_Vision-ff00ff?style=for-the-badge&logo=google)](https://mediapipe.dev)
[![Tech Stack](https://img.shields.io/badge/Stack-Three.js_+_WebGL-white?style=for-the-badge&logo=three.js)](https://threejs.org)

> **"Yapay Zeka ile Oyun Deneyimini Yeniden Tanımlıyoruz"**  
> *Eller serbest, kontrol zihinsel, deneyim sınırsız.*

---

## 🌟 Yapılan İyileştirmeler (v4.1)

Bu sürümde oyunun hem teknik altyapısı hem de kullanıcı deneyimi önemli ölçüde geliştirilmiştir:

### 1. 🛠️ Gelişmiş Fizik Motoru
- **Dinamik Çarpışma Mantığı:** Raket ve pak arasındaki etkileşim, momentum transferi ve bağıl hız hesaplamaları ile daha gerçekçi hale getirildi.
- **Kale ve Duvar Sistemi:** Gerçekçi kale boşlukları ve köşe sekmeleri eklendi.
- **AI Zekası:** AI artık sadece pakı takip etmekle kalmıyor, pozisyon tahmini yaparak (prediction) daha zorlu bir rakip haline geliyor.

### 2. 🎨 Görsel ve Atmosferik Güncellemeler
- **Siberpunk Estetiği:** Yazı tipleri (Orbitron), renk paleti ve UI efektleri tamamen yenilendi.
- **Dinamik Kamera:** Çarpışma şiddetine bağlı olarak sarsıntı (camera shake) efekti eklendi.
- **Efekt Optimizasyonu:** Post-processing ve shader efektleri performans kaybı yaşatmadan optimize edildi.

### 3. ⌨️ Kod Kalitesi ve Modülerlik
- **Refactoring:** `main.js` ve `physics.js` dosyaları daha temiz, okunabilir ve modüler bir yapıya kavuşturuldu.
- **Log Sistemi:** Oyun içindeki önemli olayları takip eden gerçek zamanlı bir "Aura OS" log sistemi eklendi.

---

## 🚀 Hızlı Başlangıç

1. **Repoyu klonlayın:**
   ```bash
   git clone https://github.com/bahattinyunus/BTK-Hackathon26-Aura-Hockey-AR.git
   cd BTK-Hackathon26-Aura-Hockey-AR
   ```

2. **Yerel sunucu başlatın:**
   ```bash
   python -m http.server 8000
   ```

3. **Tarayıcıda açın:** `http://localhost:8000`

---

## 🎮 Kontroller

- **İşaret Parmağı:** Raketi hareket ettirir.
- **Yumruk (Fist):** Aura Burst (Hız artışı) özelliğini şarj eder.
- **Seviye Atlama:** Her bölümde belirlenen skora ulaşarak bir sonraki hikaye aşamasına geçin.

---

## 🏗️ Teknik Mimari

| Katman | Teknoloji |
|--------|-----------|
| **AI/ML** | MediaPipe Hands |
| **3D Engine** | Three.js |
| **UI** | Tailwind CSS |
| **Audio** | Web Audio API |

---

© 2026 NEO-ANKARA INDUSTRIES
