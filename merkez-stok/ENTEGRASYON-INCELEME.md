# Tatsan merkezi entegrasyon — gerçek kod incelemesi

Tarih: 2026-10-29. Dal: `feature/merkezi-stok-entegrasyonu`.

## İncelenen kaynak
`index.html` (GitHub'daki mevcut stok uygulaması) ve merkez Apps Script'te doğrulanan `stockSummary`, `stockSandboxOperation_` testleri.

## Kritik bulgular
1. `bootstrapSheetsBeforeLogin()` girişten **önce** `rpc('cloudRead')` çağırıyor; tüm `db` verisini tarayıcıya indiriyor. Sunucu tarafında personel lisansı doğrulanmıyor.
2. `login(e)` parolayı tarayıcıda `db.users` ile karşılaştırıyor. Merkezi lisans oturumu kullanılmıyor. `initSession()` tarayıcıdaki `sessionStorage` ile oturumu geri açıyor.
3. `rpc(name,arg)` tüm çağrılara ortak `tatsanCloudKey` ekliyor. `pushToSheets()` `cloudWrite` ile bütün `db` JSON'unu yolluyor. Merkezdeki operasyon bazlı `stockSandboxOperation_` ile uyumsuz.
4. `saveDB` ve yerel otomatik senkronizasyonun mevcut iş akışı, yalnızca sunucu taraflı operasyon doğrulamasına geçirilmeden eski API kapatılamaz.
5. Merkez `stockSummaryAuthorized_` yalnızca kısıtlı alanlar döndürüyor; eski uygulamanın ürün, firma, kullanıcı, hareket, rapor ekranlarının veri ihtiyaçlarını karşılamıyor.
6. Mevcut test kopyasında sadece 1 depo var; gerçek transfer için iki depo içeren test verisi gerekir.

## Güvenli geçiş sırası
- A. Önce merkez sunucuda kullanıcıya göre izinli **ayrı okuma uçları** ve her işlem türü için doğrulanan yazma uçları; gerçek şifre/oturum yönetimi, idempotency ve sürüm kilidi.
- B. Stok uygulamasında merkezi giriş ve oturum kontrolü; yerel `db.users` kimlik doğrulamasını ve parola hatırlamayı kaldır.
- C. Eski tam-JSON `cloudWrite` çağrılarını ürün, depo, firma, stok, sayım, hareket gibi yetkili operasyonlara dönüştür. Arayüz izinleri yalnızca UX; sunucu zorunlu.
- D. Geliştirme dalında uçtan uca tarayıcı testleri; pasif lisans, süresi dolmuş lisans, rol/yetki, çakışma, tekrar istek, hata kurtarma.
- E. Eski API'yi sunucuda kapat/anahtarı döndür, eski veriyi yedekle, ardından kontrollü canlıya geç.

## Mevcut durum
Canlı `index.html`, `cloudRead/cloudWrite`, eski sunucu ve canlı stok dosyası **değiştirilmedi**. `merkez-stok/entegrasyon-test.html` yalnızca izole bir tarayıcı denemesidir; gerçek stok uygulamasına entegrasyon değildir.
