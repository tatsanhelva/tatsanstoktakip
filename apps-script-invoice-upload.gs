/**
 * Tatsan Stok Takip — Apps Script invoice upload handler.
 *
 * Add this file to the EXISTING deployed Apps Script project (not GitHub Pages).
 * IMPORTANT: Dispatch the RPC method "invoiceUpload" ONLY AFTER the existing
 * server's secure session and permissions validation succeeds. Never expose
 * this handler via a public, unauthenticated doPost() branch.
 *
 * Dispatcher example inside its authenticated switch:
 * case 'invoiceUpload':
 *   // Assert your authenticated user has permission 'purchasing'.
 *   result = tatsanInvoiceUpload_(arg, authenticatedUser);
 *   break;
 *
 * Set Script Property TATSAN_INVOICE_FOLDER_ID to the Drive folder ID.
 * Access to Drive files inherits that folder's sharing policy. Never share
 * invoice files with "anyone with link".
 */
function tatsanInvoiceUpload_(arg, authenticatedUser) {
  if (!authenticatedUser || authenticatedUser.active === false ||
      !(authenticatedUser.role === 'admin' ||
        (authenticatedUser.permissions &&
         authenticatedUser.permissions.purchasing === true))) {
    throw new Error('Fatura yükleme yetkisi yok.');
  }
  if (!arg || typeof arg !== 'object') throw new Error('Fatura eksik.');
  var name = String(arg.fileName || '').trim().replace(/[\\/\x00-\x1F]/g, '_').slice(0, 160);
  if (!/\.pdf$/i.test(name) || arg.mimeType !== 'application/pdf') {
    throw new Error('Sadece PDF yükleyebilirsiniz.');
  }
  var value = String(arg.dataBase64 || '');
  if (!value || value.length > 4 * 1024 * 1024 + 100 ||
      !/^[a-zA-Z0-9+/]+={0,2}$/.test(value)) throw new Error('PDF boyutu geçersiz.');
  var bytes = Utilities.base64Decode(value);
  if (bytes.length === 0 || bytes.length > 3 * 1024 * 1024 ||
      bytes[0] !== 37 || bytes[1] !== 80 ||
      bytes[2] !== 68 || bytes[3] !== 70 || bytes[4] !== 45) {
    throw new Error('Geçersiz PDF veya boyut 3 MB üstünde.');
  }
  var folderId = PropertiesService.getScriptProperties().getProperty('TATSAN_INVOICE_FOLDER_ID');
  if (!folderId) throw new Error('Fatura klasörü ayarlanmamış.');
  var folder = DriveApp.getFolderById(folderId);
  var blob = Utilities.newBlob(bytes, 'application/pdf', name);
  var file = folder.createFile(blob);
  var safeId = String(file.getId());
  return {fileId: safeId, url: 'https://drive.google.com/file/d/' + safeId + '/view'};
}
