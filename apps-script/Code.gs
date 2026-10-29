function setup_(){const p=PropertiesService.getScriptProperties();if(p.getProperty('DATA_ID'))return;const f=DriveApp.createFolder('Tatsan Stok Bulut');const b=f.createFolder('Yedekler');const d=f.createFile('stok.json',JSON.stringify({revision:0,data:null,requestId:''}),MimeType.PLAIN_TEXT);p.setProperties({DATA_ID:d.getId(),BACKUP_ID:b.getId()});}
function cloudRead_(){return read_();}
function read_(){const id=PropertiesService.getScriptProperties().getProperty('DATA_ID');if(!id)throw new Error('Önce setup çalıştırılmalı.');return JSON.parse(DriveApp.getFileById(id).getBlob().getDataAsString());}
function cloudWrite_(req){
 const lock=LockService.getScriptLock();lock.waitLock(30000);
 try{const old=read_();if(old.requestId===req.requestId){pruneBackups_();return {ok:true,revision:old.revision};}
 if(req.revision!==old.revision)return {ok:false,conflict:true,revision:old.revision};
 const d=req.data;if(!d||!Array.isArray(d.products)||!Array.isArray(d.users)||!d.users.length||!Array.isArray(d.movements)||!Array.isArray(d.warehouses)||!d.stocks)throw new Error('Geçersiz stok verisi');
 const p=PropertiesService.getScriptProperties();const folder=DriveApp.getFolderById(p.getProperty('BACKUP_ID'));
 if(old.data)folder.createFile('stok-r'+old.revision+'-'+Date.now()+'.json',JSON.stringify(old.data),MimeType.PLAIN_TEXT);
 const next={revision:old.revision+1,data:d,requestId:req.requestId,updatedAt:new Date().toISOString()};
 DriveApp.getFileById(p.getProperty('DATA_ID')).setContent(JSON.stringify(next));pruneBackups_();return {ok:true,revision:next.revision};
 }finally{lock.releaseLock();}
}

// Only generated backups in the configured backup folder are eligible.
function pruneBackups_(){
 const id=PropertiesService.getScriptProperties().getProperty('BACKUP_ID');
 const files=DriveApp.getFolderById(id).getFiles(), backups=[];
 while(files.hasNext()){
  const file=files.next(), match=/^stok-r(\d+)-(\d+)\.json$/.exec(file.getName());
  if(match&&!file.isTrashed())backups.push({file,revision:Number(match[1]),time:Number(match[2])});
 }
 backups.sort((a,b)=>b.revision-a.revision||b.time-a.time);
 backups.slice(5).forEach(item=>item.file.setTrashed(true));
}

// Separate admin records: does not change stok.json or its existing revision.
function adminFile_(){
 const p=PropertiesService.getScriptProperties();let id=p.getProperty('LICENSE_DATA_ID');
 if(id)return DriveApp.getFileById(id);
 const stockId=p.getProperty('DATA_ID');if(!stockId)throw new Error('Önce setup_ çalıştırın.');
 const stock=DriveApp.getFileById(stockId),parents=stock.getParents();
 if(!parents.hasNext())throw new Error('Stok klasörü bulunamadı.');
 const f=parents.next().createFile('lisanslar.json',JSON.stringify({users:[]}),MimeType.PLAIN_TEXT);
 p.setProperty('LICENSE_DATA_ID',f.getId());return f;
}
function adminRead_(){
 const d=JSON.parse(adminFile_().getBlob().getDataAsString());
 return {users:Array.isArray(d.users)?d.users:[]};
}
function adminSave_(arg){
 const lock=LockService.getScriptLock();lock.waitLock(30000);
 try{
  if(!arg||!arg.user)throw new Error('Kullanıcı eksik.');
  const u=arg.user, name=String(u.username||'').trim();
  if(!/^[a-zA-Z0-9._-]{1,60}$/.test(name))throw new Error('Kullanıcı adı geçersiz.');
  if(typeof u.fullName!=='string'||!u.fullName.trim()||u.fullName.length>120)throw new Error('Ad soyad geçersiz.');
  if(!['admin','user'].includes(u.role))throw new Error('Rol geçersiz.');
  if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(u.expiresAt)||Number.isNaN(Date.parse(u.expiresAt+'T00:00:00Z')))throw new Error('Lisans tarihi geçersiz.');
  if(typeof u.enabled!=='boolean')throw new Error('Durum geçersiz.');
  const allowed=['products','warehouses','entry','exit','transfer','count','stock','movements','reports'];
  const permissions={};allowed.forEach(k=>permissions[k]=u.permissions&&u.permissions[k]===true);
  const clean={username:name,fullName:u.fullName.trim(),role:u.role,expiresAt:u.expiresAt,enabled:u.enabled,permissions};
  const file=adminFile_(),db=adminRead_(),original=String(arg.originalUsername||'');
  const idx=original?db.users.findIndex(x=>x.username===original):-1;
  if(original&&idx<0)throw new Error('Düzenlenecek kullanıcı bulunamadı.');
  if(db.users.some((x,i)=>x.username.toLowerCase()===name.toLowerCase()&&i!==idx))throw new Error('Kullanıcı adı zaten mevcut.');
  if(idx<0)db.users.push(clean);else db.users[idx]=clean;
  file.setContent(JSON.stringify(db));return db;
 }finally{lock.releaseLock();}
}
function configure_(){
 setup_();const p=PropertiesService.getScriptProperties();
 if(!p.getProperty('API_KEY'))p.setProperty('API_KEY',Utilities.getUuid()+Utilities.getUuid());
 if(!p.getProperty('ADMIN_KEY'))p.setProperty('ADMIN_KEY',Utilities.getUuid()+Utilities.getUuid());
 console.log('Özel bulut anahtarı (GitHub’a yüklemeyin): '+p.getProperty('API_KEY'));
 console.log('Yönetici anahtarı (GitHub’a yüklemeyin): '+p.getProperty('ADMIN_KEY'));
}
function doGet(){return HtmlService.createHtmlOutput('Tatsan Drive API hazır. Uygulamayı GitHub Pages adresinden açın.');}
function doPost(e){
 let req={},reply={channel:'tatsan-drive'};
 try{
  req=JSON.parse(e.parameter.request||'{}');reply.nonce=req.nonce;
  const key=PropertiesService.getScriptProperties().getProperty('API_KEY');
  const isAdmin=req.method==='adminList'||req.method==='adminSave';
  const adminKey=PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');
  if(isAdmin){
   if(!adminKey||typeof req.key!=='string'||req.key!==adminKey)throw new Error('Yönetici anahtarı geçersiz.');
  }else if(!key||typeof req.key!=='string'||req.key!==key)throw new Error('Bulut erişim anahtarı geçersiz.');
  if(req.method==='adminList')reply.result=adminRead_();
  else if(req.method==='adminSave')reply.result=adminSave_(req.arg);
  else if(req.method==='cloudRead')reply.result=cloudRead_();
  else if(req.method==='cloudWrite')reply.result=cloudWrite_(req.arg);
  else throw new Error('Geçersiz işlem.');
 }catch(err){reply.error=String(err.message||err)}
 const json=JSON.stringify(reply).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
 return HtmlService.createHtmlOutput('<script>window.top.postMessage('+json+',"https://tatsanhelva.github.io");</script>').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
