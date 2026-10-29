/**
 * TATSAN MERKEZI YONETIM icin STOK OKUMA KAPISI - GELISTIRME / TEST.
 * Eski stok Apps Script projesine degil, YENI merkez projesine eklenecek.
 * Oturum kontrolu merkezdeki session_ ve readData_ fonksiyonlarini kullanir.
 *
 * ONEMLI: Bu dosya su an merkezdeki doPost'a bagli DEGILDIR.
 * Calisan eski cloudRead/cloudWrite endpoint'leri engellenmedikce
 * gercek guvenlik saglanmaz. Bu dosya hicbir stok verisini yazmaz.
 */
const STOCK_READ_FILE_PROP = 'TATSAN_STOCK_FILE_ID';

function stockReadTest_(token) {
  const session = session_(token, 'user'); // passif lisans her istekte reddedilir
  const licensed = readData_().users.find(u => u.username === session.username);
  if (!licensed || !licenseActive_(licensed)) throw new Error('Lisans gecersiz.');
  if (licensed.role !== 'admin' && licensed.permissions?.stock !== true)
    throw new Error('Stok goruntuleme yetkisi yok.');
  const fileId = PropertiesService.getScriptProperties().getProperty(STOCK_READ_FILE_PROP);
  if (!fileId) throw new Error('Test stok dosyasi tanimlanmamis.');
  const raw = DriveApp.getFileById(fileId).getBlob().getDataAsString('UTF-8');
  const stock = JSON.parse(raw);
  if (!Number.isInteger(stock.revision) || !stock.data ||
      !Array.isArray(stock.data.products) || !Array.isArray(stock.data.warehouses))
    throw new Error('Stok dosyasi yapisi gecersiz.');
  // Employees cannot receive full stock JSON: it includes users/password hashes.
  if (licensed.role !== 'admin') {
    return {
      revision:stock.revision,
      products:stock.data.products.map(p=>({
        id:p.id,code:p.code,name:p.name,barcode:p.barcode,unit:p.unit,packQty:p.packQty
      })),
      warehouses:stock.data.warehouses.map(w=>({id:w.id,code:w.code,name:w.name})),
      stocks:stock.data.stocks || {}
    };
  }
  return {revision:stock.revision,data:stock.data};
}
