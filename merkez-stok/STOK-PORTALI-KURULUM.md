# TATSAN — lisanslı stok portalı (sandbox)

## Hazır teslim

Tek dosyalık Google Apps Script **`TATSAN_MERKEZI_STOK_PORTALI_TAM_KOD.gs`** hazırlanmıştır. Dosya bu sohbet üzerinden verilir; bu GitHub dosyasının parçası değildir. Mevcut merkez yönetim Apps Script projesindeki `Kod.gs` içeriğinin tamamı yerine konur. Yeni, ayrı bir GAS projesi kurmayın.

**Test adresi:** mevcut merkez Apps Script `/dev?view=stock`. **Yönetim paneli:** eski `/dev` adresinde kalır. `/dev` en son kaydedilen kodu kullandığı için yalnızca kayıt yeterlidir. `/exec` sürüm güncellemesi yapılmadan aynı davranışı göstermez.

## İşlevler

- Merkezden doğrulanan personel girişi, altı saatlik mevcut sunucu oturumu; her istekte lisans, parola sürümü ve izin denetimi.
- Yalnızca ayrı `stok-yazma-sandbox.json` test dosyasını okuyabilen stok tablosu; personel şifreleri ve kullanıcı kayıtları API yanıtında yok.
- Koli cinsinden stok girişi, çıkışı, transferi ve sayımı; tüm yazma işlemleri sunucuda doğrulanır.
- Sürüm çakışması, aynı isteğin tekrar uygulanmaması, yanlış miktar, yetersiz stok ve aynı depo transferini engelleme.
- Yönetici paneline **Lisanslı Stok Portalını Aç** bağlantısı.

## Otomatik test durumu

29 Ekim 2026: yerel Google Apps Script API taklit ortamında 15/15 senaryo geçti (lisans, oturum, yetki, stok işlemleri, çakışma, tekrar, kaynak/sandbox ayrımı). Yönetim ve stok portalı HTML içindeki JavaScript sözdizimi doğrulandı. **Gerçek Apps Script dağıtımında kullanıcı testi henüz yapılmadı.**

## Güvenlik sınırları

- Hiçbir kod, eski canlı `stok.json` dosyasına yazmaz. Kaynak test kopyası da korunur.
- Mevcut GitHub Pages stok uygulaması henüz bu portala geçmemiştir ve eski `cloudRead/cloudWrite` erişim yolu hâlâ canlıdır.
- Bu portalın çalışması **canlı entegrasyonun tamamlandığı anlamına gelmez**.
- Canlıya geçmeden eski tam-JSON API'sinin kapatılması, kullanıcı izinlerinin tüm modüllere genişletilmesi, audit/backup, test ve kontrollü veri taşınması gerekir.
