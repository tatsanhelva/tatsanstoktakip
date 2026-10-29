# TATSAN Merkez: GitHub ↔ Google Apps Script otomasyonu

**Durum:** GitHub Actions iş akışı hazır. Google yetkilendirmesi henüz girilmediği için hiçbir Apps Script projesi değiştirilmedi.

## Önemli sınırlar
- GitHub deposu **PUBLIC / herkese açık**. Bir kere `KODU_AL` çalıştırırsanız mevcut `Kod.gs` kaynak kodu depoya **herkese açık** olarak yüklenir. Şifre, erişim anahtarı, Drive dosya ID'si veya OAuth token kaynağa yazılmamalıdır. Gizli kod istiyorsanız önce özel (private) depo kullanın.
- `/dev` Apps Script'in HEAD sürümüdür; otomasyon **mevcut /exec web uygulamasını yeniden dağıtmaz**.
- `clasp push` dosyaları topluca değiştirir. İş akışı önce bütün mevcut dosyaları `clasp pull` ile alır, yalnızca `Kod` dosyasının içeriğini günceller, mevcut `appsscript.json` ve diğer dosyaları taşır. Yazmadan hemen önce `clasp create-version` ile geri dönüş sürümü oluşturur.
- Yalnızca `feature/merkezi-stok-entegrasyonu` test dalındaki `gas-merkez/Kod.gs` değişiklikleri otomatik /dev senkronizasyonu tetikler; `main` veya GitHub Pages değişiklikleri tetiklemez.

## Bir kerelik bağlantı (yönetici kendi bilgisayarında)
1. **TATSAN MERKEZİ YÖNETİM** Apps Script projesini aç; **Proje ayarları (dişli) → Kimlikler → Komut Dosyası Kimliği (Script ID)** değerini kopyala. **/exec veya deployment ID değil.**
2. Aynı, yeni Google hesabıyla [Apps Script API ayarları](https://script.google.com/home/usersettings) sayfasını aç; **Google Apps Script API** erişimini aç.
3. Windows'ta Node.js 22 veya üzeri kurulu değilse [Node.js](https://nodejs.org/) kur; sonra PowerShell aç ve:
   ```powershell
   npm install --global @google/clasp@3.4.1
   clasp login
   ```
   Açılan Google girişinde **merkezî Apps Script projesinin sahibi olan Google hesabını** seçip izin ver. Ardından PowerShell'de:
   ```powershell
   Get-Content "$env:USERPROFILE\.clasprc.json" -Raw | Set-Clipboard
   ```
   Bu komut OAuth dosyasının içeriğini panoya alır; **sohbete göndermeyin!**
4. [GitHub Actions Secrets](https://github.com/tatsanhelva/tatsanstoktakip/settings/secrets/actions) sayfasında **New repository secret** ile iki gizli değer oluştur:
   - `CLASPRC_JSON` → panodaki **tam** JSON içeriğini yapıştır.
   - `GAS_SCRIPT_ID` → 1. adımda aldığın **Script ID** değerini yapıştır.
   JSON içeriğini GitHub'a düz dosya olarak ekleme; yalnızca **Secrets** alanını kullan.
5. [GitHub otomasyon sayfası](https://github.com/tatsanhelva/tatsanstoktakip/actions/workflows/merkez-gas.yml) → **Run workflow** → branch `main`, işlem `KODU_AL`, onay `HERKESE_ACIK` → **Run workflow**. Bu ilk işlem **Apps Script'e yazmaz**, kodu GitHub'daki test dalında `gas-merkez/Kod.gs` dosyasına alır. Kaynağı yayımlamayı istemiyorsan **bu adımı çalıştırma**.

## Bundan sonra
- ChatGPT'nin veya sizin GitHub'da test dalındaki `gas-merkez/Kod.gs` dosyasına gönderdiği sonraki commitler otomatik olarak Apps Script'in **/dev** sürümüne aktarılır.
- İstersen Actions'taki `DEV_GUNCELLE` işlemini `onay=DEV_GUNCELLE` ile elle çalıştırabilirsin.
- Apps Script editöründe aynı kodu paralel düzenleme; sonraki GitHub aktarımı o değişiklikleri ezer.
- Hata olursa GitHub → **Actions** sayfasındaki ilgili çalışmanın günlüklerine bak. `CLASPRC_JSON` eksik veya süresi geçmişse yerelde yeniden `clasp login` yapıp GitHub Secret'i yenile.
- İlk bağlantı tamamlanana kadar **hiçbir otomatik Apps Script değişikliği yapılmaz**.

## Güvenlik
- `.clasprc.json` dosyası Google OAuth yenileme belirteci içerir; güçlü erişim yetkisine sahiptir. **Sohbete, GitHub kaynak dosyalarına veya ekran görüntülerine koyma.**
- GitHub Actions yetkilerini yalnızca güvendiğin kişilere ver. İhtiyaç kalmazsa Google hesabındaki uygulama erişimini ve GitHub Secrets değerlerini iptal et.
