# Tatsan — GitHub Pages + Google Drive

Bu sürümde arayüz GitHub Pages'te, JSON kayıtları mevcut Google Drive klasöründe tutulur. Eski Apps Script projesini kullanın; böylece DATA_ID ve BACKUP_ID özellikleri korunur.

## Bir defalık sunucu güncellemesi

1. Mevcut Apps Script projesinde Kod.gs içeriğini `apps-script/Code.gs` ile değiştirin. Eski fonksiyonları başka bir .gs dosyasında bırakmayın. Index.html sunucuda artık kullanılmaz.
2. Editörde işlev listesinden `configure_` seçip çalıştırın. Bu işlem mevcut veriyi silmez. Yürütme günlüğündeki özel bulut anahtarını güvenli bir yerde saklayın. Anahtarı GitHub'a veya sohbet mesajına yazmayın.
3. Dağıt → Dağıtımları yönet → Kalem → Yeni sürüm. Çalıştıran: **Ben**, erişim: **Herkes** (Google hesabı olmayanlar dahil). Bu yeni kod her okuma/yazmada özel anahtar ister. Eski kodu herkese açmayın.
4. Dağıtıp `/exec` URL'sini kopyalayın.
5. GitHub'daki değişiklikleri main dalına birleştirin. Pages yayımlandığında https://tatsanhelva.github.io/tatsanstoktakip/ adresini açın.
6. **Bulut Bağlantısı** düğmesinden /exec adresini ve özel anahtarı girin. Anahtar yalnızca sekme oturumunda tutulur; yeni sekmede tekrar girilir.
7. Giriş yapıp bir deneme ürünü ekleyin; **Drive: kaydedildi** yazısını bekleyin. **Drive’dan Çek** ile veriyi doğrulayın. Aynı kullanıcı aktifse oturum açık kalır.

Önce eski uygulamadan JSON yedeğinizi indirin. Veri çekme işlemi bulut verisini yerel verinin yerine koyar. Sayfayı bağlantısız sıfırdan açmak garanti edilmez; açık sayfadaki işlemler cihazda bekler. Çakışma olduğunda yerel yedeği indirip buluttan güncel sürümü çekin; bekleyen işlemleri güncel kayda tekrar uygulayın. Aynı cihazda tek sekme kullanın.

## Güvenlik ve sınırlar

Özel anahtar Drive verisinin tamamına okuma/yazma yetkisi verir. Bu sürüm güvenilir işletme yöneticileri içindir; uygulama içindeki personel yetkileri sunucu güvenlik sınırı değildir. Anahtarı güvenmediğiniz personele vermeyin. Çok kullanıcılı sunucu yetkilendirmesi ayrıca geliştirilmelidir. Anahtar kaynak koda gömülmez ve URL ile gönderilmez; HTTPS POST gövdesinde iletilir. Sunucu yanıtları yalnızca `https://tatsanhelva.github.io` kökenine gönderilir. Alan adı değişirse sunucudaki bu sabiti değiştirin.

Güncel stok.json ve son 5 yedek korunur. Daha eski oluşturulmuş yedekler yalnızca başarılı kayıttan sonra çöp kutusuna taşınır. Stok hareketleri silinmez. Ağ kesintisinde aynı kayıt kimliğiyle tekrar gönderilir; sürüm çakışması diğer cihazın verisini ezmez.

## Doğrulama

Yerel testler: sunucu erişim anahtarı, desteklenmeyen işlem, HTML içine veri kaçışları, sürüm çakışması, tekrar istek, son beş yedek ve başarısız yazmada yedek koruma.
Canlı Google dağıtımı ve tarayıcılar arası POST/iframe yanıtı ayrıca 7. adımla doğrulanmalıdır. Sunucuyu güncellemeden yeni arayüzü kullanmayın.
