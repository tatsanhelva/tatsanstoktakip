# Tatsan merkezi stok entegrasyonu — kontrollü test

Yeni **TATSAN MERKEZİ YÖNETİM** Apps Script projesi ile eski stok uygulaması iki ayrı Google hesabında/dağıtımda bulunuyor. Canlı dosyalara dokunulmadı.

## Tamamlanan hazırlık
- GitHub'da ayrı `feature/merkezi-stok-entegrasyonu` dalı oluşturuldu.
- `merkez-stok/StockReadGateway.gs`: Sunucuda oturum, lisans ve **stok görüntüleme** yetkisini kontrol eden, yazma yapmayan taslak. Personel için kullanıcı/şifre kayıtlarını yanıttan çıkarıyor.
- Dosya hiçbir canlı API'ye bağlanmadı; kullanıcıların stok verisine erişmesini sağlamaz.

## Canlıya almadan önce zorunlu
1. Eski `stok.json` dosyasının ayrı **kopyasını** yeni Google hesabındaki test klasörüne taşı ve test dosyasına erişim ver. Eski dosyanın kimliğini yeni sunucunun özelliklerine ekleyip doğrudan canlı üzerinde test YAPMA.
2. Merkez sunucuda test kopyasının ID'sini `TATSAN_STOCK_FILE_ID` özelliğinde sakla. Gerçek dosya ID'si kodda/GitHub'da olmamalı.
3. Merkez `doPost` rotasına yetkili stok okuma eylemi ekle. Önce her istekte lisans, oturum, izin kontrolü ve personel için veri alanı süzme testleri yap.
4. Stok giriş/çıkış/transfer/sayım değişikliklerini **sunucuda doğrulanan ayrı operasyonlar** şeklinde tasarla. Tarayıcıdan gelen tüm stok JSON'unun yazılması, yetki atlatmaya açıktır.
5. Mevcut `index.html` içindeki eski `cloudRead/cloudWrite` ve ortak API_KEY bağlantısını yeni kimlik doğrulamayla değiştir. Eski API rotasını kapat / anahtarını döndür. Aksi halde pasif kullanıcı doğrudan eski API ile veriyi okuyabilir.
6. Kopya veriyle işlemleri ve oturum iptalini test et. Ancak sonra kontrollü taşıma, yedek ve geri dönüş planıyla canlıya al.

**Durum:** Test için taslak hazır. Eski stok verileri ve çalışan uygulama değiştirilmedi. Sunucu yetkilendirmesi henüz üretime hazır değil.
