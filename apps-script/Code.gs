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

function configure_(){
 setup_();const p=PropertiesService.getScriptProperties();
 if(!p.getProperty('API_KEY'))p.setProperty('API_KEY',Utilities.getUuid()+Utilities.getUuid());
 console.log('Özel bulut anahtarı (GitHub’a yüklemeyin): '+p.getProperty('API_KEY'));
}
function doGet(){return HtmlService.createHtmlOutput('Tatsan Drive API hazır. Uygulamayı GitHub Pages adresinden açın.');}
function doPost(e){
 let req={},reply={channel:'tatsan-drive'};
 try{
  req=JSON.parse(e.parameter.request||'{}');reply.nonce=req.nonce;
  const key=PropertiesService.getScriptProperties().getProperty('API_KEY');
  if(!key||typeof req.key!=='string'||req.key!==key)throw new Error('Bulut erişim anahtarı geçersiz.');
  if(req.method==='cloudRead')reply.result=cloudRead_();
  else if(req.method==='cloudWrite')reply.result=cloudWrite_(req.arg);
  else throw new Error('Geçersiz işlem.');
 }catch(err){reply.error=String(err.message||err)}
 const json=JSON.stringify(reply).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
 return HtmlService.createHtmlOutput('<script>window.top.postMessage('+json+',"https://tatsanhelva.github.io");</script>').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
