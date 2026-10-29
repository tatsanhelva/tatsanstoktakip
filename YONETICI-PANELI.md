# Yönetici paneli — geliştirme dalı

Bu çalışma **canlıya alınmamıştır**. Dosyalar `feature/yonetici-lisans-paneli` dalındadır.

- `yonetici.html`: Kullanıcı/lisans ekleme, düzenleme, pasif/aktif, bitiş tarihi, modül izinleri.
- `apps-script/Code.gs`: Ayrı `ADMIN_KEY`, `adminList` ve `adminSave` işlemleri. Kayıtlar stok verisine dokunmadan Drive'daki `lisanslar.json` dosyasına yazılır.
- `configure_` yönetici anahtarını da üretir; anahtarı kaynak koda veya herkese açık bağlantılara koymayın.

## ÖNEMLİ: Üretime hazır değil

Bu sürüm yalnızca bağımsız yönetim kayıtlarının temelidir. Mevcut `index.html` kullanıcı doğrulamasını tarayıcıda yapar, eski `cloudRead/cloudWrite` uçları ortak API_KEY kullanır ve **sunucuda kullanıcı lisansı veya modül izni kontrol etmez**. Bu nedenle burada pasife alınan kullanıcılar henüz stok uygulamasından engellenmez. Gerçek erişim engelleme için kullanıcıya özel giriş/oturum belirteçleri, sunucuda her veri işleminde kullanıcı yetkisi kontrolü, kullanıcı yönetimi ile stok kullanıcılarının geçişi ve oturum iptali yapılmadan bu dalı canlıya birleştirmeyin.

Mevcut Drive dağıtımı bu dalı kullanmaz. Canlı sistemin verisini veya API anahtarını değiştirmeyin. Sunucu değişikliklerini sadece test dağıtımında doğrulayın; gerçek verilerin kopyasıyla test edin.

## Eklenen güvenli sunucu temeli

- `apps-script/Auth.gs`: şifre doğrulama, 6 saatlik geçici oturum, her istekte aktiflik ve lisans kontrolü, çıkış.
- Yönetici panelinde kullanıcı şifresi oluşturma/değiştirme alanı bulunur. Şifre sunucu tarafında salt eklenerek SHA-256 ile tutulur. Canlı kullanım öncesinde daha güçlü parola türetme ve giriş denemesi sınırlaması uygulanmalıdır.
- Personelin tam stok verisini okuması ve stok hareketi yazması **bilerek engellidir**: yetkiye göre sunucu verisi süzme ve doğrulanmış stok işlem API'si tamamlanmadan açılmayacak.
- Eski `cloudRead/cloudWrite` API_KEY rotası mevcut kodda çalışmaya devam eder. Dolayısıyla **yetki bypass'ı hâlâ mümkündür**. Eski API'nin kapatılması ve stok arayüzünün yeni kimlik doğrulamaya taşınması tamamlanmadan üretime alınmamalıdır.
- Apps Script'e geçirildiğinde **hem** `Code.gs` **hem** `Auth.gs` dosyaları gerekir. Şu aşamada canlı Apps Script projesini değiştirmeyin.
