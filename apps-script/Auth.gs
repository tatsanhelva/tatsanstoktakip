// Tatsan secure authentication foundation. Kept separate from live stock data.
// This file and Code.gs belong to the same Google Apps Script project.
function authDigest_(salt,password){
 const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,salt+':'+password);
 return bytes.map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');
}
function authSetPassword_(username,password){
 if(typeof password!=='string'||password.length<10||password.length>256)throw new Error('Şifre en az 10 karakter olmalı.');
 const salt=Utilities.getUuid()+Utilities.getUuid();
 const p=PropertiesService.getScriptProperties();
 p.setProperty('USER_AUTH_'+username.toLowerCase(),JSON.stringify({salt,hash:authDigest_(salt,password),version:Date.now()}));
}
function authCredential_(username){const raw=PropertiesService.getScriptProperties().getProperty('USER_AUTH_'+String(username).toLowerCase());return raw?JSON.parse(raw):null;}
function authFind_(username){
 return adminRead_().users.find(u=>u.username.toLowerCase()===String(username).toLowerCase());
}
function authActive_(u){
 if(!u||!u.enabled||!/^\d{4}-\d{2}-\d{2}$/.test(u.expiresAt))return false;
 const today=Utilities.formatDate(new Date(),Session.getScriptTimeZone()||'Europe/Istanbul','yyyy-MM-dd');
 return u.expiresAt>=today;
}
function authLogin_(arg){
 if(!arg||typeof arg.username!=='string'||typeof arg.password!=='string')throw new Error('Giriş başarısız.');
 const u=authFind_(arg.username),c=authCredential_(arg.username);
 // Same response for unknown, inactive and invalid login.
 if(!authActive_(u)||!c||authDigest_(c.salt,arg.password)!==c.hash)throw new Error('Giriş başarısız.');
 const token=Utilities.getUuid()+Utilities.getUuid(),value=JSON.stringify({username:u.username,version:c.version});
 CacheService.getScriptCache().put('SESSION_'+token,value,21600);
 return {token,user:{username:u.username,fullName:u.fullName,role:u.role,permissions:u.permissions},expiresInSeconds:21600};
}
function authRequire_(token){
 if(typeof token!=='string'||!/^[a-f0-9-]{70,100}$/i.test(token))throw new Error('Oturum geçersiz.');
 const raw=CacheService.getScriptCache().get('SESSION_'+token);
 if(!raw)throw new Error('Oturum sona erdi. Tekrar giriş yapın.');
 const saved=JSON.parse(raw),u=authFind_(saved.username),c=authCredential_(saved.username);
 if(!authActive_(u)||!c||c.version!==saved.version)throw new Error('Kullanıcı pasif veya lisans süresi dolmuş.');
 return u;
}
function authLogout_(token){if(typeof token==='string')CacheService.getScriptCache().remove('SESSION_'+token);return {ok:true};}
function authChangeAllowed_(u,oldData,newData){
 if(u.role==='admin')return;
 if(!oldData||!newData)throw new Error('İşlem izni yok.');
 const permissions=u.permissions||{};
 const sectionPermissions={products:'products',categories:'products',warehouses:'warehouses',firms:'products',settings:null,users:null,auditLog:null,stocks:null,movements:null};
 for(const key of Object.keys(sectionPermissions)){
  if(JSON.stringify(oldData[key])===JSON.stringify(newData[key]))continue;
  const perm=sectionPermissions[key];
  if(!perm||permissions[perm]!==true)throw new Error('Bu veriyi değiştirme izniniz bulunmuyor: '+key);
 }
 // Movements and stock are coupled: a movement may change multiple stock entries.
 if(JSON.stringify(oldData.movements)!==JSON.stringify(newData.movements)||JSON.stringify(oldData.stocks)!==JSON.stringify(newData.stocks)){
  const approved=['entry','exit','transfer','count'];
  if(!approved.some(k=>permissions[k]===true))throw new Error('Stok hareketi yetkiniz bulunmuyor.');
  // A server-side per-operation stock mutation API is required before deploying
  // employee stock writes. Fail closed instead of trusting client-produced diffs.
  throw new Error('Personel stok yazma işlemi için güvenli sunucu işlemi henüz etkin değil.');
 }
 for(const key of Object.keys(newData)){
  if(Object.prototype.hasOwnProperty.call(sectionPermissions,key))continue;
  if(JSON.stringify(oldData[key])!==JSON.stringify(newData[key]))throw new Error('Değişiklik izni yok: '+key);
 }
}
function authRead_(arg){
 const u=authRequire_(arg&&arg.token);
 const data=cloudRead_();
 // Until scoped read responses are implemented, only administrators receive full data.
 if(u.role!=='admin')throw new Error('Personel veri okuma sınırlandırması henüz etkin değil.');
 return data;
}
function authWrite_(arg){
 const u=authRequire_(arg&&arg.token);
 if(!arg||!arg.write)throw new Error('Yazma isteği eksik.');
 if(u.role!=='admin'){
  const old=cloudRead_();
  authChangeAllowed_(u,old.data,arg.write.data);
 }
 return cloudWrite_(arg.write);
}
function adminPassword_(arg){
 if(!arg||typeof arg.username!=='string'||!authFind_(arg.username))throw new Error('Kullanıcı bulunamadı.');
 authSetPassword_(arg.username,arg.password);
 return {ok:true};
}
