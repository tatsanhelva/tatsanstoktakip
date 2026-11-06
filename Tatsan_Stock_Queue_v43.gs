/**
 * Tatsan Stok Takip — central stock transaction queue, v4.3.
 * Install in the SAME Google Apps Script project as the existing server.
 *
 * INTEGRATION (the existing server source is not in the GitHub repository):
 * In the authenticated POST router add a case for method 'stockTransaction':
 *   return tatsanStockTransaction_(request.arg, {
 *     user: authenticatedUser,
 *     read: () => existingReadWithRevision(),  // {data, revision}
 *     write: (expectedRevision, data, requestId) =>
 *       existingCompareAndSwapWrite(expectedRevision, data, requestId),
 *     quoteExit: (data, op, items, firm) =>
 *       existingAuthoritativeExitQuote(data, op, items, firm)
 *   });
 * Advertise authProbe.features.stockQueue=true ONLY AFTER this route is deployed.
 * Do not pass user, revision, or storage callbacks from the web client.
 */
function tatsanStockTransaction_(op, context) {
  if (!op || !context || !context.user || typeof context.read !== 'function' ||
      typeof context.write !== 'function') throw new Error('Güvenli stok işlemi kurulumu eksik.');
  var user=context.user;
  if (!user.id || user.active===false) throw new Error('Etkin kullanıcı oturumu gerekli.');
  var types={entry:'entry',exit:'exit',transfer:'transfer',count:'count'};
  var type=types[op.type];
  if (!type || !(user.role==='admin' || (user.permissions && user.permissions[type]===true)))
    throw new Error('Bu stok işlemi için yetkiniz yok.');
  if (!/^[a-zA-Z0-9_-]{8,100}$/.test(String(op.requestId||'')))
    throw new Error('İşlem kimliği geçersiz.');
  var lock=LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('İşlem sırası yoğun. Aynı işlem kimliğiyle tekrar deneyin.');
  try {
    var stored=context.read();
    if (!stored || !stored.data || !Number.isInteger(stored.revision))
      throw new Error('Güncel Drive kaydı okunamadı.');
    var db=JSON.parse(JSON.stringify(stored.data));
    var receipts=Array.isArray(db._stockQueueReceipts)?db._stockQueueReceipts:[];
    var receipt=receipts.find(function(x){return x.requestId===op.requestId;});
    if (receipt) {
      if (receipt.userId!==user.id) throw new Error('İşlem kimliği başka kullanıcıya ait.');
      return {ok:true,duplicate:true,revision:stored.revision,data:db,requestId:op.requestId};
    }
    if (!Array.isArray(db.products)||!Array.isArray(db.warehouses)||
        !db.stocks||typeof db.stocks!=='object'||!Array.isArray(db.movements))
      throw new Error('Drive stok verisi geçersiz.');
    var items=Array.isArray(op.items)?op.items:[];
    if (!items.length || items.length>100) throw new Error('1-100 ürün seçin.');
    var warehouse=String(op.warehouseId||''),target=String(op.targetWarehouseId||'');
    if (!db.warehouses.some(function(w){return w.id===warehouse;}))
      throw new Error('Kaynak depo bulunamadı.');
    if(type==='transfer' && (target===warehouse ||
       !db.warehouses.some(function(w){return w.id===target;})))
      throw new Error('Hedef depo geçersiz.');
    var seen={},computed=[],today=new Date().toISOString();
    for (var i=0;i<items.length;i++){
      var x=items[i],p=db.products.find(function(p){return p.id===x.productId && p.active!==false;});
      if(!p || seen[p.id])throw new Error('Tekrarlanan veya silinmiş ürün.');
      seen[p.id]=true;
      var unit=String(x.unit||'Koli'),amount=Number(x.amount),kg=p.unit==='Kg',
        pack=Number(p.packQty)||1;
      if(!(pack>0&&Number.isFinite(pack)))throw new Error('Ürün koli içi miktarı geçersiz.');
      if(!((kg&&(unit==='Koli'||unit==='Kg'))||
           (!kg&&(unit==='Koli'||unit==='Adet'))))throw new Error('Birim geçersiz.');
      if(!Number.isFinite(amount)||amount<0||amount>=1e9||
         (unit!=='Kg'&&!Number.isSafeInteger(amount))||
         (unit==='Kg'&&Math.abs(amount*1000-Math.round(amount*1000))>1e-6)||
         (type!=='count'&&amount===0))throw new Error('Miktar geçersiz.');
      var quantity=(unit==='Koli'?amount:amount/pack);
      var key=warehouse+'::'+p.id,before=Number(db.stocks[key]||0);
      if(!Number.isFinite(before))throw new Error('Mevcut stok geçersiz.');
      var after=type==='entry'?before+quantity:type==='count'?quantity:before-quantity;
      if(after< -1e-9 && !db.settings?.allowNegative)
        throw new Error(p.name+': kaynak depoda yeterli stok yok.');
      computed.push({p:p,unit:unit,amount:amount,quantity:quantity,
                     before:before,after:after,key:key});
    }
    var firm=null,quote=null;
    if(type==='exit'){
      firm=(db.firms||[]).find(function(f){return f.id===op.firmId&&f.active!==false;});
      if(!firm)throw new Error('Cari firma bulunamadı.');
      if(typeof context.quoteExit!=='function')
        throw new Error('Cari borç hesabı sunucuda yapılandırılmadı; çıkış engellendi.');
      quote=context.quoteExit(db,op,computed,firm);
      if(!quote||!Number.isSafeInteger(quote.grandTotalCents)||quote.grandTotalCents<=0)
        throw new Error('Sunucu satış ve KDV tutarını hesaplayamadı.');
      if(!Array.isArray(db.firmLedger))db.firmLedger=[];
    }
    var batch='q-'+op.requestId,doc=String(op.doc||'').slice(0,120),
      notes=String(op.notes||'').slice(0,500),date=today;
    function movement(t,w,c,b,a,detail){
      db.movements.push({id:'mv-'+op.requestId+'-'+db.movements.length,
        groupId:batch,type:t,warehouseId:w,productId:c.p.id,
        quantity:Math.abs(t==='SAYIM'?a-b:c.quantity),inputUnit:c.unit,
        inputQuantity:c.amount,countedValue:t==='SAYIM'?a:undefined,
        before:b,after:a,date:date,doc:doc,detail:detail||'',
        userId:user.id,userName:user.fullName||user.username||'',firmId:firm?firm.id:'',
        firmName:firm?firm.name:''});
    }
    computed.forEach(function(c){
      db.stocks[c.key]=Math.round(c.after*1e9)/1e9;
      if(type==='entry')movement('GIRIS',warehouse,c,c.before,c.after,notes);
      if(type==='exit')movement('CIKIS',warehouse,c,c.before,c.after,notes);
      if(type==='count')movement('SAYIM',warehouse,c,c.before,c.after,'Sayımı yapan: '+(user.fullName||user.username||'')+(notes?' | '+notes:''));
      if(type==='transfer'){
        movement('TRANSFER_CIKIS',warehouse,c,c.before,c.after,notes);
        var tk=target+'::'+c.p.id,tb=Number(db.stocks[tk]||0),ta=tb+c.quantity;
        db.stocks[tk]=Math.round(ta*1e9)/1e9;
        movement('TRANSFER_GIRIS',target,c,tb,ta,notes);
      }
    });
    if(type==='exit'){
      db.firmLedger.push({id:'cari-'+op.requestId,firmId:firm.id,type:'DEBT',
        amountCents:quote.grandTotalCents,date:today.slice(0,10),doc:doc,
        note:'Stok çıkışı | '+computed.length+' ürün',stockBatchId:batch,
        subtotalCents:quote.subtotalCents,discountCents:quote.discountCents,
        netCents:quote.netCents,vatCents:quote.vatCents,
        vatRateBasisPoints:quote.vatRateBasisPoints,lines:quote.lines,
        userId:user.id,userName:user.fullName||user.username||'',createdAt:today});
    }
    db._stockQueueReceipts=receipts.concat([{requestId:op.requestId,userId:user.id,
        type:type,date:today}]).slice(-500);
    var result=context.write(stored.revision,db,op.requestId);
    if(!result||!result.ok||!Number.isInteger(result.revision))
      throw new Error('Drive kayıt işlemi doğrulanmadı; aynı işlem kimliğiyle tekrar deneyin.');
    return {ok:true,duplicate:false,revision:result.revision,data:db,
      requestId:op.requestId,summary:{type:type,items:computed.length}};
  }finally{lock.releaseLock();}
}
