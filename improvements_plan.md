# Aura Hockey AR - İyileştirme Planı

Bu belge, mevcut projenin eleştirel bir analizi sonucunda belirlenen iyileştirme alanlarını ve uygulanacak çözümleri içermektedir.

## 1. Fizik ve Oyun Mekaniği İyileştirmeleri
- **Duvar Çarpışmaları:** `physics.js` dosyasındaki duvar çarpışma mantığı basit (eksen hizalı). Köşe çarpışmaları ve daha yumuşak sekme efektleri için iyileştirilecek.
- **Pak-Raket Etkileşimi:** Raketin hızı (momentum) pakın sekme yönünü ve hızını daha gerçekçi etkileyecek şekilde geliştirilecek.
- **AI Zekası:** AI'nın sadece topu takip etmesi yerine, oyuncunun pozisyonuna göre savunma yapması veya köşelere atak yapması sağlanacak.

## 2. Görsel ve Efekt İyileştirmeleri
- **Shader Optimizasyonu:** `effects.js` içindeki grid shader ve post-processing efektleri düşük donanımlı cihazlar için optimize edilecek.
- **Parçacık Sistemleri:** Çarpışma anındaki parçacık efektleri daha dinamik ve "siberpunk" temasına uygun hale getirilecek.
- **Aydınlatma:** Dinamik ışıklandırma (PointLight) sayısı optimize edilecek ve emissive materyallerin kullanımı artırılacak.

## 3. Kullanıcı Deneyimi (UX) ve UI
- **Responsive Tasarım:** UI elementleri farklı ekran boyutlarına göre daha iyi uyum sağlayacak şekilde Tailwind sınıfları ile güncellenecek.
- **Geri Bildirim:** Skor yapıldığında veya özel yetenek kullanıldığında daha güçlü görsel ve işitsel geri bildirimler eklenecek.
- **Hata Yönetimi:** Kamera erişimi veya MediaPipe yükleme hataları için daha kullanıcı dostu uyarılar eklenecek.

## 4. Kod Kalitesi ve Yapılandırma
- **Modülerlik:** `main.js` içindeki bazı mantıklar ilgili modüllere (örn. CameraManager) taşınacak.
- **Performans:** `requestAnimationFrame` içindeki gereksiz hesaplamalar azaltılacak.
- **Dokümantasyon:** Kod içindeki yorumlar artırılacak ve README dosyası teknik detaylarla zenginleştirilecek.
