# Tatsan v4.3 — Merkezi Stok İşlem Kuyruğu (Kurulum)

Bu güncellemede GitHub'daki `index.html` v4.3 olarak hazırlandı ve `Tatsan_Stock_Queue_v43.gs` eklendi. **GitHub'a yüklemek Apps Script'in çalışan /exec dağıtımını değiştirmez.**

## Canlıya alma ön koşulu

Çalışan Google Apps Script projesindeki ana sunucu kaynağı bu GitHub deposunda bulunmuyor. Bu nedenle gerçek /exec dağıtımı ve mevcut Drive JSON okuma/yazma fonksiyonlarına bağlanma işlemleri henüz yapılamadı. Mevcut sunucu dosyası alınmadan körlemesine yeni bir /exec yayına alınmamalıdır.

1. Çalışan Apps Script projesinin güncel `Code.gs` / ilgili `.gs` dosyalarının sürüm kontrolü için yedeğini alın.
2. Aynı Apps Script projesine `Tatsan_Stock_Queue_v43.gs` içeriğini ekleyin.
3. **Kimlik doğrulanmış** POST yönlendiricisine `stockTransaction` yöntemini ekleyin. Oturumdan doğrulanmış `user` nesnesi ve mevcut revizyonlu Drive okuma/yazma adaptörleri sunucu içinde verilmelidir. Kullanıcı bilgisi veya erişim izni tarayıcı isteklerinden alınmamalıdır.
4. `context.write` fonksiyonu, sunucu kilidi zaten tutulurken mevcut JSON dosyasını **revizyon denetimiyle** yazmalı ve önceki 5 yedeği tutmalıdır. Adaptör, aynı kilidi tekrar almaya çalışmamalıdır.
5. Çıkıştaki cari borç, iskonto ve KDV tutarı mevcut **sunucu tarafı** fiyatlama mantığından `quoteExit` ile yeniden hesaplanmalıdır. Tarayıcının gönderdiği toplam tutar güvenilir kabul edilmemelidir.
6. Aynı istek kimliğinin tekrarı, aynı anda iki kullanıcı testi, yetersiz stok, sayım-çıkış eşzamanlılığı, kesilen bağlantı/yeniden deneme, izin denetimi ve tüm veri seti yedek/restore testlerini yapın.
7. Sunucu işlemleri doğrulandıktan sonra `authProbe` cevabında `features.stockQueue = true` yapın ve **yeni Apps Script sürümünü /exec'e dağıtın**. O zamana kadar frontend yeni yolu etkinleştirmez.

## Doğrulama

- A ve B kullanıcılarının aynı ürüne aynı anda +20 ve −15 koli işlemi: son stok, başlangıç +5 olmalı; her işlem tek kez yazılmalı.
- A'nın aynı `requestId` ile 2. isteği stoğu ikinci kez değiştirmemeli.
- Yetersiz stok işlemi reddedildiğinde stok, hareket geçmişi ve cari borç değişmemeli.
- Sayım ve çıkış işlemlerinin sırası, kilit içinde okunan güncel Drive stoğuna dayanmalı.
- Çıkış stok hareketleri ve cari borç tek bir atomik Drive JSON yazımında oluşmalı.
- Mevcut yerel bekleyen kayıtlar varken yeni merkezi işlem başlatılmamalı.
- Başarılı kayıt sonucunda arayüz sunucunun döndürdüğü veri ve revizyonu kullanmalı.

**Önemli:** Bu dosya kurulum/entegrasyon rehberidir. GitHub'daki kod hazırdır; canlı sunucuya uyarlama ve gerçek eşzamanlılık testi henüz yapılmamıştır.
