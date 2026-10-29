// Bu dosya sadece ayrı "Tatsan Lisans Yönetimi" Apps Script projesine eklenir.
// Mevcut stok takip Apps Script projesine yüklemeyin.
// LisansAPI.gs dosyasındaki lisansListele_() fonksiyonunu kullanır.

function lisansDurumKontrol_(kullaniciAdi) {
  const ad = String(kullaniciAdi || '').trim().toLowerCase();
  const kullanici = lisansListele_().users.find(
    u => String(u.username || '').toLowerCase() === ad
  );

  // Lisans tarihi, Türkiye yerel tarihine göre gün sonuna kadar geçerlidir.
  const bugun = Utilities.formatDate(
    new Date(), 'Europe/Istanbul', 'yyyy-MM-dd'
  );

  if (!kullanici) {
    return {izinli: false, sebep: 'Kullanıcı bulunamadı.'};
  }

  if (kullanici.enabled !== true) {
    return {izinli: false, sebep: 'Kullanıcı pasif.'};
  }

  if (typeof kullanici.expiresAt !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(kullanici.expiresAt) ||
      kullanici.expiresAt < bugun) {
    return {izinli: false, sebep: 'Lisans süresi dolmuş.'};
  }

  return {
    izinli: true,
    sebep: 'Lisans aktif.',
    rol: kullanici.role,
    izinler: kullanici.permissions || {}
  };
}

function testPasifLisans() {
  const sonuc = lisansDurumKontrol_('deneme1');
  console.log(sonuc.izinli ? 'ERİŞİM AÇIK' : 'ERİŞİM KAPALI');
  console.log(sonuc.sebep);
}
