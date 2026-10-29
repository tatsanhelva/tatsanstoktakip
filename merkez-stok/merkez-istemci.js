/* TATSAN central license transport — development branch only.
 * No credentials or tokens are persisted. This is NOT a replacement for server-side stock authorization.
 */
(function(global){
 'use strict';
 let token=null, identity=null;
 const endpoint='https://script.google.com/macros/s/AKfycbyYoJr88EABQSYCnGM3ybddgalCQlYGvGRYZ4S0H4-WueL9LGzkMMmwBk6tSf_jfIJa/exec';
 function request(method,arg){
  return new Promise((resolve,reject)=>{
   const nonce=Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('');
   const frame=document.createElement('iframe');frame.hidden=true;frame.name='tatsan_center_'+nonce;
   const form=document.createElement('form');form.method='POST';form.action=endpoint;form.target=frame.name;form.hidden=true;
   const input=document.createElement('input');input.name='request';input.value=JSON.stringify({method,arg,nonce});form.append(input);
   const timeout=setTimeout(()=>finish(new Error('Merkez sunucusu 30 saniyede yanıt vermedi.')),30000);
   function finish(err,result){clearTimeout(timeout);window.removeEventListener('message',receive);form.remove();frame.remove();err?reject(err):resolve(result);}
   function receive(e){
    if(e.source!==frame.contentWindow)return;
    if(!/^https:\/\/(?:script\.googleusercontent\.com|[a-z0-9-]+\.script\.googleusercontent\.com)$/.test(e.origin))return;
    if(e.data?.channel!=='tatsan-drive'||e.data?.nonce!==nonce)return;
    finish(e.data.error?new Error(String(e.data.error)):null,e.data.result);
   }
   window.addEventListener('message',receive);document.body.append(frame,form);form.submit();
  });
 }
 global.TatsanMerkez={
  async login(username,password){
   token=null;identity=null;
   const result=await request('userLogin',{username,password});
   if(!result||typeof result.token!=='string'||!result.token)throw Error('Merkez geçerli oturum vermedi.');
   token=result.token;identity=result.user||{username};return identity;
  },
  async stockSummary(){if(!token)throw Error('Önce merkezî giriş yapın.');return request('stockSummary',{token});},
  async logout(){const t=token;token=null;identity=null;if(t)try{await request('userLogout',{token:t});}catch(_){}},
  get user(){return identity;},get authenticated(){return !!token;}
 };
})(window);
