
const KEY='mi_garaje_public_demo_v1',EMPTY_DB={schemaVersion:8.32,vehicles:[],workshop:[],tires:[],itv:[],taxes:[],other:[],insuranceHistory:[],insurancePolicies:[]};
const PHOTO_DB='mi_garaje_photos_v1',PHOTO_STORE='photos';
let db;try{let raw=localStorage.getItem(KEY);db=raw?JSON.parse(raw):structuredClone(EMPTY_DB)}catch(e){db=structuredClone(EMPTY_DB)}
db=normalizeData(db);
let photoCache=new Map(),photoDB=null,photoStorageReady=false;
function openPhotoDB(){return new Promise((resolve,reject)=>{if(!('indexedDB' in window))return reject(new Error('IndexedDB no disponible'));let q=indexedDB.open(PHOTO_DB,1);q.onupgradeneeded=()=>{let d=q.result;if(!d.objectStoreNames.contains(PHOTO_STORE))d.createObjectStore(PHOTO_STORE)};q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error||new Error('No se pudo abrir IndexedDB'))})}
function photoGet(id){return new Promise((resolve,reject)=>{let t=photoDB.transaction(PHOTO_STORE,'readonly'),r=t.objectStore(PHOTO_STORE).get(id);r.onsuccess=()=>resolve(r.result||'');r.onerror=()=>reject(r.error)})}
function photoPut(id,data){return new Promise((resolve,reject)=>{let t=photoDB.transaction(PHOTO_STORE,'readwrite'),r=t.objectStore(PHOTO_STORE).put(data,id);t.oncomplete=()=>resolve(true);t.onerror=()=>reject(t.error||r.error)})}
function photoDelete(id){return new Promise((resolve,reject)=>{let t=photoDB.transaction(PHOTO_STORE,'readwrite');t.objectStore(PHOTO_STORE).delete(id);t.oncomplete=()=>resolve(true);t.onerror=()=>reject(t.error)})}
function photoClear(){return new Promise((resolve,reject)=>{let t=photoDB.transaction(PHOTO_STORE,'readwrite');t.objectStore(PHOTO_STORE).clear();t.oncomplete=()=>resolve(true);t.onerror=()=>reject(t.error)})}
function photoSrc(v){return photoCache.get(v.id)||v.photo||''}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(db));return true}catch(e){alert('No se ha podido guardar este cambio en el iPhone. Exporta una copia de seguridad antes de continuar.');return false}};
async function initPhotoStorage(){
  try{
    photoDB=await openPhotoDB();photoStorageReady=true;
    let migrated=false;
    for(const v of db.vehicles||[]){
      let stored=await photoGet(v.id).catch(()=>''),legacy=v.photo||'';
      if(stored)photoCache.set(v.id,stored);
      else if(legacy){await photoPut(v.id,legacy);photoCache.set(v.id,legacy)}
      if(legacy){v.photo='';migrated=true}
    }
    if(migrated)save();
  }catch(e){console.warn('IndexedDB fotos no disponible; se mantiene compatibilidad localStorage.',e);photoStorageReady=false;(db.vehicles||[]).forEach(v=>{if(v.photo)photoCache.set(v.id,v.photo)})}
}

db.vehicles.forEach(v=>{v.mileageHistory=v.mileageHistory||[];if(v.km && !v.mileageUpdated){v.mileageUpdated='';}});
let state={page:'garage',filter:'Moto',vid:null,module:null};const app=()=>document.getElementById('app');const esc=x=>String(x??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function pd(s){if(!s||s.startsWith('Año'))return null;let a=s.split('/').map(Number);return a.length===3?new Date(a[2],a[1]-1,a[0]):null}function fd(d){return d?String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear():''}function dy(d){return Math.ceil((d-new Date())/86400000)}function ay(d,n){let x=new Date(d);x.setFullYear(x.getFullYear()+n);return x}function V(){return db.vehicles.find(x=>x.id===state.vid)}function latest(a,id){return a.filter(x=>x.vehicle===id&&pd(x.date)).sort((x,y)=>pd(y.date)-pd(x.date))[0]}
function isOther(v){return !!v&&(v.type==='Otros'||v.type==='Otro'||v.type==='Bici')}function hasRoadDocs(v){return !isOther(v)}function hasMaintenance(v){return !v?.skipMaintenance}function vehicleFallbackIcon(v){return isOther(v)?(v.otherKind==='Trial'?'🏍️':'🚲'):v.type==='Moto'?'🏍️':'🚙'}
function itvDue(v){if(!hasRoadDocs(v)||v.status==='Histórico')return null;let rows=(db.itv||[]).filter(x=>x.vehicle===v.id&&pd(x.nextDate)).sort((a,b)=>pd(b.nextDate)-pd(a.nextDate));if(rows[0]?.nextDate)return pd(rows[0].nextDate);let l=latest(db.itv,v.id);if(l?.nextDate)return pd(l.nextDate);let f=pd(v.firstRegistration);return f?ay(f,4):null}function stat(d){if(!d)return ['Pendiente','bad'];let n=dy(d);return n<0?['Vencida','bad']:n<=30?[n+' días','warn']:[n+' días','good']}
function hasNum(v){return v!==''&&v!==null&&v!==undefined&&Number.isFinite(Number(v))}
function tireKmUsed(t,v){return t&&hasNum(t.km)&&hasNum(v.km)?Math.max(0,Number(v.km)-Number(t.km)):null}
function policyIsCurrent(p,v){return !!p&&v?.status!=='Histórico'&&!String(p.end||'').trim()}
function annualRenewalFromStart(start){let d=pd(start);if(!d)return null;let now=new Date(),today=new Date(now.getFullYear(),now.getMonth(),now.getDate()),r=new Date(d.getFullYear(),d.getMonth(),d.getDate());while(r<=today)r=ay(r,1);return r}
function effectivePolicyRenewal(p){if(!p)return null;let explicit=pd(p.renewal);if(explicit)return explicit;return !String(p.end||'').trim()?annualRenewalFromStart(p.start):null}
function policiesFor(v){let rows=(db.insurancePolicies||[]).filter(p=>p.vehicle===v.id);if(!rows.length&&v.insurance?.company){let q=v.insurance;rows=[{id:'legacy_policy_'+v.id,vehicle:v.id,company:q.company||'',policy:q.policy||'',holder:q.holder||'',additional:q.additional||'',coverage:q.coverage||'',start:q.start||'',renewal:q.renewal||'',end:'',bank:q.bank||'',active:true,legacy:true}]}return rows}
function currentPolicy(v){return policiesFor(v).filter(p=>policyIsCurrent(p,v)).sort((a,b)=>dateValue(b.start)-dateValue(a.start)||dateValue(b.renewal)-dateValue(a.renewal))[0]||null}
function insuranceDue(v){let p=currentPolicy(v);return p?effectivePolicyRenewal(p):null}
function moneySpend(n){let v=Math.round(Number(n||0)),sign=v<0?'-':'',digits=String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g,'.');return sign+digits+' €'}
function bottom(){return `<div class=copyright>© Cem 2026 · V8.3.2</div><div class=bottom>${[['garage','⌂','Garaje'],['agenda','▣','Agenda'],['spend','▥','Gastos'],['more','•••','Más']].map(n=>`<div class="nav ${state.page===n[0]?'on':''}" onclick="go('${n[0]}')"><b>${n[1]}</b>${n[2]}</div>`).join('')}</div>`}function go(p){state.page=p;render()}
function welcome(){
  app().innerHTML=`<div class=top><div class=brand>◉ Mi Garaje</div></div><main class=welcome><div class=card><h1>Bienvenido a Mi Garaje</h1><p class=muted>${window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone?'Esta copia instalada todavía no tiene tus datos. Importa la copia JSON completa que exportaste desde Safari.':'Empieza añadiendo tu primer vehículo o recupera una copia de seguridad.'}</p><button class=add onclick=addVehicle()>＋ Añadir mi primer vehículo</button><button class="add secondary" onclick="document.getElementById('welcomeImport').click()">Importar copia de seguridad</button><input id=welcomeImport type=file accept=".json,application/json" hidden onchange="importBackup(this.files[0]);this.value=''"></div></main>${bottom()}`
}
function garage(){
  if(!(db.vehicles||[]).length)return welcome();
  let vs=db.vehicles.filter(v=>state.filter==='Histórico'?v.status==='Histórico':state.filter==='Coche'?(v.status==='Activo'&&v.type==='Coche'):state.filter==='Otros'?(v.status==='Activo'&&isOther(v)):v.type===state.filter&&v.status==='Activo');
  vs.sort((a,b)=>{let A=pd(a.purchase),B=pd(b.purchase);return (B?B.getTime():-Infinity)-(A?A.getTime():-Infinity)||String(a.alias||'').localeCompare(String(b.alias||''),'es')});
  app().innerHTML=`<div class=top><div class=brandrow><div><div class=brand>◉ Mi Garaje</div></div><button class=plus onclick=addVehicle()>+</button></div><div class=chips>${['Moto','Coche','Otros','Histórico'].map(x=>`<button class="chip ${state.filter===x?'on':''}" onclick="state.filter='${x}';render()">${x==='Coche'?'Coches':x==='Moto'?'Motos':x}</button>`).join('')}</div></div><main>${vs.map(v=>vehicleCard(v)).join('')||'<div class=card>Sin vehículos en esta sección.</div>'}</main>${bottom()}`
}
function vehicleCard(v){
  let historical=v.status==='Histórico';
  let i=historical?['Histórico','']:stat(itvDue(v)),cp=historical?null:currentPolicy(v),due=cp?effectivePolicyRenewal(cp):null,sd=due?stat(due):null,t=latest(db.tires,v.id),tk=tireKmUsed(t,v);
  let ms=historical?
    [['✓','Vendido',v.saleDate||'Histórico'],['€','Importe',v.salePrice!==''&&v.salePrice!=null?money(v.salePrice):'—'],['→','Destinatario',v.saleRecipient||'—']]:
    isOther(v)?(hasMaintenance(v)?[['🔧','Mantenimiento',latest(db.workshop,v.id)?.date||'Sin datos'],['◉','Neumáticos',tk!=null?tk.toLocaleString('es-ES')+' km':'Sin km'],['','','']]:[['◉','Neumáticos',tk!=null?tk.toLocaleString('es-ES')+' km':'Sin km'],['▥','Gastos','Ver detalle'],['','', '']]):[['▣','ITV',i[0]],['⬟','Seguro',cp?(sd?sd[0]:'Vigente'):'Sin seguro'],['◉','Neumáticos',tk!=null?tk.toLocaleString('es-ES')+' km':'Sin km']];
  return `<div class=vehicle onclick="openV('${v.id}')"><div class=vpic>${photoSrc(v)?`<img src="${photoSrc(v)}" style="width:100%;height:100%;object-fit:cover">`:vehicleFallbackIcon(v)}<div class=vtitle><strong>${esc(v.alias)}</strong>${hasRoadDocs(v)?`<span class="plate editable" onclick="event.stopPropagation();state.vid='${v.id}';state.page='vehicle';render();setTimeout(()=>editVehicleField('plate'),0)">${v.plate?esc(v.plate):'＋ Añadir matrícula'}</span>`:''}</div></div><div class=metrics>${ms.map((m,j)=>m[0]?`<div class=metric><span>${m[0]} ${m[1]}</span><b class="${!historical&&j<2&&hasRoadDocs(v)?(j===0?i[1]:sd?.[1]||'bad'):''}">${esc(m[2])}</b></div>`:'<div></div>').join('')}</div></div>`
}
function openV(id){state.vid=id;state.page='vehicle';render()}
function addVehicle(){
  alert('Alta de vehículo · Paso 1 de 4\n\nPrimero crearemos la ficha. Después podrás introducir seguro e historial anterior.');
  let type=prompt('Tipo: Coche / Moto / Otros','Coche');if(type===null)return;let tl=String(type).trim().toLowerCase();
  type=tl.startsWith('m')?'Moto':tl.startsWith('c')?'Coche':(tl.startsWith('o')||tl.startsWith('b'))?'Otros':'';
  if(!type){alert('Tipo no válido.');return}
  let alias=prompt('Alias / nombre para identificarlo:','');if(alias===null||!String(alias).trim())return;
  let brand=prompt('Marca:','');if(brand===null)return;
  let model=prompt('Modelo:','');if(model===null)return;
  let purchase=promptDate('Fecha de compra','');if(purchase===null||purchase===undefined)return;
  let price=promptNumber('Precio de compra (€)','');if(price===null||price===undefined)return;
  let plate='',firstRegistration='';
  if(type!=='Otros'){
    plate=prompt('Matrícula:','');if(plate===null)return;
    firstRegistration=promptDate('Primera matriculación',purchase||'');if(firstRegistration===null||firstRegistration===undefined)return;
  }
  let vin=prompt(type==='Otros'?'Número de bastidor:':'VIN / bastidor:','');if(vin===null)return;
  let owner=prompt('Titular:','');if(owner===null)return;
  let fuel='',displacement='',environmentalLabel='',nive='';
  if(type!=='Otros'){
    fuel=prompt('Carburante (opcional):','');if(fuel===null)return;
    displacement=promptNumber('Cilindrada (cc, opcional)','');if(displacement===null||displacement===undefined)return;
    environmentalLabel=prompt('Distintivo ambiental (opcional):','');if(environmentalLabel===null)return;
    nive=prompt('NIVE (opcional):','');if(nive===null)return;
  }
  let km=promptNumber('Kilómetros actuales','');if(km===null||km===undefined)return;
  let sold=confirm('¿El vehículo ya está vendido?\n\nAceptar = vendido/histórico\nCancelar = activo');
  let id=uid('veh');
  db.vehicles.push({id,alias:String(alias).trim(),brand:String(brand).trim(),model:String(model).trim(),type,status:'Activo',plate:String(plate).trim(),vin:String(vin).trim(),purchase,firstRegistration,purchasePrice:price,km:km===''?'':km,mileageUpdated:km!==''?todayES():'',insurance:null,mileageHistory:[],saleDate:'',salePrice:'',saleRecipient:'',owner:String(owner).trim(),fuel:String(fuel).trim(),displacement:displacement===''?'':displacement,environmentalLabel:String(environmentalLabel).trim(),nive:String(nive).trim(),otherKind:type==='Otros'?'Otro':'',skipMaintenance:false});
  if(sold){state.vid=id;let v=db.vehicles[db.vehicles.length-1];let sd=promptDate('Fecha de venta',todayES());if(sd===undefined)sd='';let sp=promptNumber('Importe de venta (€)','');if(sp===undefined)sp='';let sr=prompt('Destinatario / comprador:','')??'';Object.assign(v,{status:'Histórico',saleDate:sd||'',salePrice:sp??'',saleRecipient:String(sr).trim()})}
  if(!save())return;state.vid=id;state.page='vehicle';render();
  if(type!=='Otros'&&confirm('Paso 2 de 4 · Seguro\n\n¿Quieres introducir ahora el seguro actual o seguros anteriores?'))insuranceWizard();
  if(confirm('Paso 3 de 4 · Historial anterior\n\n¿Quieres introducir gastos o intervenciones anteriores a hoy?'))historicalLoop();
  render();
  if(confirm('Paso 4 de 4 · Foto\n\n¿Quieres añadir ahora una foto del vehículo?'))setTimeout(()=>pickPhoto(),50);
  setTimeout(()=>{if(confirm('Vehículo creado.\n\n¿Quieres añadir otro vehículo?')){state.page='garage';render();setTimeout(addVehicle,50)}else{state.page='vehicle';render()}},100);
}
function insuranceWizard(){
  do{
    editPolicy(null);
    if(confirm('¿Quieres añadir pagos/cuotas de esta póliza?')){do{editInsurancePayment(null)}while(confirm('¿Añadir otra cuota de seguro?'))}
  }while(confirm('¿Quieres introducir otro seguro anterior o posterior?'));
}
function historicalLoop(){
  do{
    let k=prompt('Tipo de historial:\nTaller / Reparación / ITV / Impuesto / Neumáticos / Accesorios / Otros','Taller');if(k===null)return;
    k=String(k).trim().toLowerCase();
    if(k.startsWith('itv'))editItv(null);
    else if(k.startsWith('imp'))editTax(null);
    else if(k.startsWith('neu')||k.startsWith('rue'))editTire(null);
    else if(k.startsWith('acc'))editOther(null,'Accesorios');
    else if(k.startsWith('rep'))editWorkshop(null,'Reparación');
    else if(k.startsWith('tall')||k.startsWith('mant'))editWorkshop(null,'Mantenimiento');
    else editOther(null,'Otros');
  }while(confirm('¿Añadir otro gasto o intervención anterior?'));
}
function todayES(){let d=new Date();return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear()}
function uid(prefix='id'){return prefix+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8)}
function dateValue(s){let d=pd(s);return d?d.getTime():0}
function money(n){let v=Number(n||0);return v.toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2})+' €'}
function promptDate(label,value=''){let v=prompt(label+' (dd/mm/aaaa):',value||'');if(v===null)return null;v=String(v).trim();if(v==='')return '';if(!pd(v)){alert('Fecha no válida');return undefined}return v}
function promptNumber(label,value=''){let v=prompt(label+':',value??'');if(v===null)return null;v=String(v).trim();if(v==='')return '';let n=Number(v.replace(/\./g,'').replace(',','.'));if(!Number.isFinite(n)){alert('Importe no válido');return undefined}return n}
function deleteRecord(collection,id){
  if(!confirm('¿Eliminar este registro?'))return;
  if(collection==='insurancePolicies'&&id==='legacy_policy_'+state.vid){
    db.insurancePolicies=(db.insurancePolicies||[]).filter(x=>x.id!==id);
    if(V())V().insurance=null;
  }else db[collection]=(db[collection]||[]).filter(x=>x.id!==id);
  save();render()
}
function updateMileage(){let v=V(),n=prompt('Kilometraje actual:',v.km||'');if(n===null||String(n).trim()==='')return;n=Number(String(n).replace(/\./g,'').replace(',','.'));if(!Number.isFinite(n)||n<0){alert('Introduce un kilometraje válido.');return}let d=prompt('Fecha de lectura:',todayES());if(!d)return;v.mileageHistory=v.mileageHistory||[];if(v.km)v.mileageHistory.push({km:v.km,date:v.mileageUpdated||''});v.km=n;v.mileageUpdated=d;save();render()}
function editVehicleField(field){let v=V(),label='',old='',val=null;if(field==='km'){updateMileage();return}if(field==='plate'){if(!hasRoadDocs(v))return;label='Matrícula';old=v.plate||''}else if(field==='firstRegistration'){label='Fecha de primera matriculación (dd/mm/aaaa)';old=v.firstRegistration||''}else return;val=prompt(label+':',old);if(val===null)return;v[field]=String(val).trim();save();render()}
function editVehicle(){
  let v=V();if(!v)return;
  let alias=prompt('Alias:',v.alias||'');if(alias===null)return;
  let brand=prompt('Marca:',v.brand||'');if(brand===null)return;
  let model=prompt('Modelo:',v.model||'');if(model===null)return;
  let purchase=promptDate('Fecha de compra',v.purchase||'');if(purchase===null||purchase===undefined)return;
  let price=promptNumber('Precio de compra (€)',v.purchasePrice??'');if(price===null||price===undefined)return;
  let plate=v.plate||'',first=v.firstRegistration||'';
  if(hasRoadDocs(v)){plate=prompt('Matrícula:',plate);if(plate===null)return;first=promptDate('Primera matriculación',first);if(first===null||first===undefined)return}
  let vin=prompt('Bastidor / VIN:',v.vin||'');if(vin===null)return;
  let owner=prompt('Titular:',v.owner||'');if(owner===null)return;
  let fuel=v.fuel||'',displacement=v.displacement??'',environmentalLabel=v.environmentalLabel||'',nive=v.nive||'';
  if(hasRoadDocs(v)){
    fuel=prompt('Carburante:',fuel);if(fuel===null)return;
    displacement=promptNumber('Cilindrada (cc)',displacement);if(displacement===null||displacement===undefined)return;
    environmentalLabel=prompt('Distintivo ambiental:',environmentalLabel);if(environmentalLabel===null)return;
    nive=prompt('NIVE:',nive);if(nive===null)return;
  }
  Object.assign(v,{alias:alias.trim(),brand:brand.trim(),model:model.trim(),purchase,purchasePrice:price,plate:String(plate).trim(),firstRegistration:first,vin:vin.trim(),owner:String(owner).trim(),fuel:String(fuel).trim(),displacement:displacement===''?'':displacement,environmentalLabel:String(environmentalLabel).trim(),nive:String(nive).trim()});
  save();render()
}
function sellVehicle(){
  let v=V();if(!v)return;
  if(v.status==='Histórico'){
    if(!confirm('Este vehículo ya está en Histórico. ¿Quieres editar los datos de venta?'))return;
  }else if(!confirm('¿Registrar la venta de '+(v.alias||'este vehículo')+'?\n\nAl venderlo pasará a Histórico y dejará de generar avisos de ITV, seguro e impuestos.'))return;
  let date=promptDate('Fecha de venta',v.saleDate||todayES());if(date===null||date===undefined||!date)return;
  let price=promptNumber('Importe de venta (€)',v.salePrice??'');if(price===null||price===undefined)return;
  let recipient=prompt('Destinatario / comprador:',v.saleRecipient||'');if(recipient===null)return;
  Object.assign(v,{status:'Histórico',saleDate:date,salePrice:price,saleRecipient:recipient.trim()});
  (db.insurancePolicies||[]).filter(p=>p.vehicle===v.id&&p.active).forEach(p=>{p.active=false;if(!p.end)p.end=date});
  save();render()
}
function reactivateVehicle(){
  let v=V();if(!v||v.status!=='Histórico')return;
  if(!confirm('¿Volver a marcar este vehículo como activo? Los datos de la venta se conservarán.'))return;
  v.status='Activo';save();render()
}
function editPending(vehicleId,field){state.vid=vehicleId;if(field==='insurance'){state.page='insurance';render();return}if(field==='tires'){state.page='tires';render();return}state.page='vehicle';render();setTimeout(()=>editVehicleField(field),0)}
function vehicle(){
  let v=V(),historical=v.status==='Histórico',i=stat(itvDue(v)),cp=!historical?currentPolicy(v):null,due=cp?effectivePolicyRenewal(cp):null,sd=due?stat(due):null,t=latest(db.tires,v.id),tk=tireKmUsed(t,v),w=latest(db.workshop,v.id),tx=latest(db.taxes||[],v.id);
  let sale=historical?`<div class="card salecard"><div class=salehead><b>Vehículo vendido</b><span>Histórico</span></div>${[['Fecha de venta',v.saleDate||'—'],['Importe',v.salePrice!==''&&v.salePrice!=null?money(v.salePrice):'—'],['Destinatario',v.saleRecipient||'—']].map(r=>`<div class=row><span class=muted>${r[0]}</span><b>${esc(r[1])}</b></div>`).join('')}<button class="add secondary" onclick=sellVehicle()>Editar venta</button><button class="textbtn" onclick=reactivateVehicle()>Volver a marcar como activo</button></div>`:'';
  let cards=[];
  if(hasRoadDocs(v)){
    cards.push(['itv','ITV',historical?'Historial':i[0],historical?'Consultar ITV anteriores':(itvDue(v)?'Vence '+fd(itvDue(v)):'Completar datos')]);
    cards.push(['insurance','Seguro',historical?'Historial':(cp?(sd?sd[0]:'Vigente'):'Sin seguro'),historical?'Consultar pólizas y primas':(cp?.company||(cp?'Fecha de renovación pendiente':'Completar datos'))]);
  }
  cards.push(['tires','Neumáticos',tk!=null?tk.toLocaleString('es-ES')+' km':'—',t?'Último montaje '+t.date:'Sin datos']);
  if(hasMaintenance(v))cards.push(['workshop','Taller',w?.date||'Sin datos',w?.description||'Mantenimiento y reparaciones']);
  if(hasRoadDocs(v))cards.push(['taxes','Impuestos',tx?.date||'Sin datos',tx?.cost!==''&&tx?.cost!=null?money(tx.cost):'Historial de pagos']);
  cards.push(['other','Gastos','Ver historial','Accesorios y otros']);
  app().innerHTML=`<div class=top><button class=back onclick="go('garage')">‹ Mi Garaje</button></div><main><div class=hero><div class=heroimg>${photoSrc(v)?`<img src="${photoSrc(v)}">`:vehicleFallbackIcon(v)}<div class=herotxt><h1>${esc(v.alias)}</h1>${v.plate?`<span class=plate>${esc(v.plate)}</span>`:''}</div><button class=photobtn onclick=pickPhoto()>＋ Foto</button><input id=photo type=file accept="image/*" hidden onchange=setPhoto(this.files[0])></div><div class="dashboard navdashboard">${cards.map(c=>`<div class="dash navdash" onclick="openM('${c[0]}')"><span class=dashlabel>${c[1]}</span><b>${esc(c[2])}</b><small>${esc(c[3])}</small><span class=dashchev>›</span></div>`).join('')}<div class="dash navdash mileage" onclick=updateMileage()><span class=dashlabel>Kilometraje</span><b>${v.km!==''&&v.km!=null?Number(v.km).toLocaleString('es-ES')+' km':'—'}</b><small>${v.mileageUpdated?'Actualizado '+esc(v.mileageUpdated):'Toca para actualizar'}</small><span class=dashchev>›</span></div></div></div>${sale}<div class=section>Información del vehículo</div><div class="card infocard">${(isOther(v)?[['Marca',v.brand],['Modelo',v.model],['Titular',v.owner||'—'],['Fecha de compra',v.purchase||'—'],['Precio de compra',v.purchasePrice!==''&&v.purchasePrice!=null?money(v.purchasePrice):'—'],['Bastidor',v.vin||'—']]:[['Marca',v.brand],['Modelo',v.model],['Titular',v.owner||'—'],['Matrícula',v.plate||'—'],['Fecha de compra',v.purchase||'—'],['Precio de compra',v.purchasePrice!==''&&v.purchasePrice!=null?money(v.purchasePrice):'—'],['Primera matriculación',v.firstRegistration||'—'],['Carburante',v.fuel||'—'],['Cilindrada',v.displacement!==''&&v.displacement!=null?Number(v.displacement).toLocaleString('es-ES')+' cc':'—'],['Distintivo ambiental',v.environmentalLabel||'—'],['Bastidor',v.vin||'—'],['NIVE',v.nive||'—']]).map(r=>`<div class=row><span class=muted>${r[0]}</span><b>${esc(r[1])}</b></div>`).join('')}</div><button class="add secondary fullbtn" onclick=editVehicle()>Editar ficha completa</button>${historical||isOther(v)?'':`<button class="saleaction" onclick=sellVehicle()>Registrar venta</button>`}</main>${bottom()}`
}
function pickPhoto(){document.getElementById('photo').click()}
function photoData(img,max,quality){let w=img.width,h=img.height,scale=Math.min(1,max/Math.max(w,h)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*scale));c.height=Math.max(1,Math.round(h*scale));c.getContext('2d').drawImage(img,0,0,c.width,c.height);return c.toDataURL('image/jpeg',quality)}
async function setPhoto(f){
  if(!f)return;let r=new FileReader();
  r.onload=()=>{let img=new Image();img.onload=async()=>{
    let data=photoData(img,900,.70);if(data.length>420000)data=photoData(img,720,.60);if(data.length>320000)data=photoData(img,600,.55);
    let v=V(),previous=photoCache.get(v.id)||v.photo||'';
    if(photoStorageReady){
      try{await photoPut(v.id,data);photoCache.set(v.id,data);v.photo='';if(!save())throw new Error('No se pudo guardar la ficha');render();return}catch(e){console.error(e);if(previous)photoCache.set(v.id,previous);alert('No se ha podido guardar la foto en el almacenamiento ampliado del iPhone. La foto anterior se conserva.');return}
    }
    v.photo=data;photoCache.set(v.id,data);if(!save()){v.photo=previous;photoCache.set(v.id,previous);alert('El almacenamiento local de iOS está lleno.');return}render()
  };img.onerror=()=>alert('No se ha podido leer esa foto.');img.src=r.result};r.readAsDataURL(f)
}
function openM(m){state.module=m;state.page=m;render()}function moduleHead(title){return `<div class=top><button class=back onclick="state.page='vehicle';render()">‹ ${esc(V().alias)}</button><div class=head><h1>${title}</h1><button class=add onclick=addRecord()>＋ Añadir</button></div></div>`}
function recurringMaintenanceRecords(vehicleId){
  let v=(db.vehicles||[]).find(x=>x.id===vehicleId),plan=v?.maintenancePlan;if(!plan||!Number(plan.amount))return [];
  let amount=Number(plan.amount),day=Math.min(28,Math.max(1,Number(plan.day)||1)),now=new Date(),year=now.getFullYear(),months=0;
  for(let month=0;month<12;month++){if(new Date(year,month,day)<=now)months++;else break}
  if(!months)return [];
  return [{id:`recmaint_${vehicleId}_${year}`,vehicle:vehicleId,date:`Año ${year}`,km:'',place:'Plan de mantenimiento',description:`${plan.label||'Cuota mensual de mantenimiento'} · acumulado a ${todayES()}`,cost:Math.round(amount*months*100)/100,kind:'Plan mantenimiento',recurring:true}]
}
function editMaintenancePlan(){
  let v=V();if(!v)return;let p=v.maintenancePlan||{};
  let amount=promptNumber('Cuota mensual del plan de mantenimiento (€). Vacío para eliminar',p.amount??'');if(amount===null||amount===undefined)return;
  if(amount===''){delete v.maintenancePlan;save();render();return}
  let day=promptNumber('Día del mes en que se carga (1-28)',p.day??1);if(day===null||day===undefined||day==='')return;day=Math.min(28,Math.max(1,Math.round(day)));
  let label=prompt('Descripción del plan:',p.label||'Cuota mensual de mantenimiento');if(label===null)return;
  v.maintenancePlan={amount,day,label:label.trim()};save();render()
}
function workshop(){let cy=new Date().getFullYear(),v=V(),hasPlan=!!v?.maintenancePlan;let rows=[...db.workshop.filter(x=>x.vehicle===state.vid&&!(hasPlan&&x.kind==='Plan mantenimiento'&&String(x.date)==='Año '+cy)),...recurringMaintenanceRecords(state.vid)].sort((a,b)=>(pd(b.date)||0)-(pd(a.date)||0));let p=v?.maintenancePlan;app().innerHTML=moduleHead('🔧 Taller')+`<main class=modulepage><div class=card><h3>Plan mensual de mantenimiento</h3>${p?`<div class=row><span class=muted>Cuota mensual</span><b>${money(p.amount)}</b></div><div class=row><span class=muted>Día de cargo</span><b>${esc(p.day)}</b></div>`:'<p class=muted>Sin plan mensual configurado.</p>'}<button class="add secondary" onclick=editMaintenancePlan()>${p?'Editar plan':'Configurar plan'}</button></div><input class=search placeholder="Buscar frenos, batería, aceite..." oninput="filterEvents(this.value)"><div id=events class=timeline>${rows.map(eventHtml).join('')||'<div class=card>Sin intervenciones.</div>'}</div></main>${bottom()}`}
function editWorkshop(id,defaultKind='Mantenimiento'){
  let x=id?(db.workshop||[]).find(r=>r.id===id):null;if(x?.recurring)return;
  let date=promptDate('Fecha',x?.date||todayES());if(date===null||date===undefined||!date)return;
  let kind=prompt('Tipo (Mantenimiento / Reparación / Revisión):',x?.kind||defaultKind);if(kind===null)return;
  let desc=prompt('Concepto / trabajo realizado:',x?.description||'');if(desc===null||!desc.trim())return;
  let place=prompt('Taller / proveedor:',x?.place||'');if(place===null)return;
  let km=promptNumber('Kilómetros',x?.km??'');if(km===null||km===undefined)return;
  let cost=promptNumber('Importe (€)',x?.cost??'');if(cost===null||cost===undefined)return;
  let rec={id:x?.id||uid('wrk'),vehicle:state.vid,date,kind:kind.trim(),description:desc.trim(),place:place.trim(),km,cost};
  if(x)Object.assign(x,rec);else db.workshop.push(rec);save();render()
}
function eventHtml(x){return `<div class=event data-search="${esc((x.description+' '+x.kind+' '+x.place).toLowerCase())}"><div class=date>${esc(x.date)} ${x.km?`<span class=muted>· ${Number(x.km).toLocaleString('es-ES')} km</span>`:''}</div><div class=eventcard><span class=tag>${esc(x.kind)}</span>${x.cost!==''?`<span class=cost>${Number(x.cost).toLocaleString('es-ES',{minimumFractionDigits:2})} €</span>`:''}<b style="display:block;margin-top:9px">${esc(x.place)}</b><ul class=ops>${x.description.split(';').map(o=>`<li>${esc(o.trim())}</li>`).join('')}</ul>${x.recurring?'':`<div class=recordactions><button onclick="editWorkshop('${x.id}')">Editar</button><button class=dangerbtn onclick="deleteRecord('workshop','${x.id}')">Eliminar</button></div>`}</div></div>`}function filterEvents(q){document.querySelectorAll('.event').forEach(x=>x.style.display=x.dataset.search.includes(q.toLowerCase())?'':'none')}
function tireSides(x,v){
  let p=String(x.position||'').toLowerCase(),both=/ambos|todos|4 ruedas|delantero \+ trasero|delantera \+ trasera/.test(p);
  return {front:both||p.includes('delant'),rear:both||p.includes('tras')}
}
function latestTireSide(side){let v=V();return (db.tires||[]).filter(x=>x.vehicle===state.vid&&tireSides(x,v)[side]&&pd(x.date)).sort((a,b)=>pd(b.date)-pd(a.date))[0]}
function editTire(id){
  let x=id?(db.tires||[]).find(r=>r.id===id):null,v=V();
  let date=promptDate('Fecha de montaje/cambio',x?.date||todayES());if(date===null||date===undefined||!date)return;
  let desc=prompt('Neumático / descripción:',x?.description||'');if(desc===null||!desc.trim())return;
  let place=prompt('Taller / proveedor:',x?.place||'');if(place===null)return;
  let km=promptNumber('Km al montar',x?.km??v.km??'');if(km===null||km===undefined)return;
  let opts=v.type==='Coche'||v.type==='Otro'?'Delanteros / Traseros / Todos':'Delantero / Trasero / Ambos';
  let position=prompt('Posición: '+opts,x?.position||'');if(position===null)return;
  let cost=promptNumber('Importe (€)',x?.cost??'');if(cost===null||cost===undefined)return;
  let rec={id:x?.id||uid('tir'),vehicle:state.vid,date,description:desc.trim(),place:place.trim(),km,position:position.trim(),cost};
  if(x)Object.assign(x,rec);else db.tires.push(rec);save();render()
}
function tires(){
  let rows=db.tires.filter(x=>x.vehicle===state.vid).sort((a,b)=>(pd(b.date)||0)-(pd(a.date)||0)),v=V(),f=latestTireSide('front'),r=latestTireSide('rear');
  let use=x=>tireKmUsed(x,v);
  app().innerHTML=moduleHead('◉ Neumáticos')+`<main class=modulepage><div class=card><h3>Kilómetros por neumático</h3><div class=row><span>Delantero${v.type==='Coche'||v.type==='Otro'?'s':''}</span><b>${use(f)!=null?use(f).toLocaleString('es-ES')+' km':'—'}</b></div><div class=row><span>Trasero${v.type==='Coche'||v.type==='Otro'?'s':''}</span><b>${use(r)!=null?use(r).toLocaleString('es-ES')+' km':'—'}</b></div></div>${rows.map(x=>{let travelled=use(x);return `<div class=card><span class=cost>${money(x.cost)}</span><h3>${esc(x.description)}</h3><div class=row><span class=muted>Fecha</span><b>${esc(x.date)}</b></div><div class=row><span class=muted>Km al montar</span><b>${hasNum(x.km)?Number(x.km).toLocaleString('es-ES')+' km':'—'}</b></div><div class=row><span class=muted>Km recorridos</span><b>${travelled!=null?travelled.toLocaleString('es-ES')+' km':'—'}</b></div><div class=row><span class=muted>Taller</span><b>${esc(x.place||'—')}</b></div><div class=row><span class=muted>Posición</span><b>${esc(x.position||'—')}</b></div><div class=recordactions><button onclick="editTire('${x.id}')">Editar</button><button class=dangerbtn onclick="deleteRecord('tires','${x.id}')">Eliminar</button></div></div>`}).join('')||'<div class=card>Sin neumáticos registrados.</div>'}</main>${bottom()}`
}
function insurance(){
  let policies=policiesFor(V()).sort((a,b)=>(policyIsCurrent(b,V())?1:0)-(policyIsCurrent(a,V())?1:0)||dateValue(b.start)-dateValue(a.start));
  let pays=(db.insuranceHistory||[]).filter(x=>x.vehicle===state.vid).sort((a,b)=>dateValue(b.date)-dateValue(a.date));
  let years={};pays.forEach(x=>{let y=(x.date||'').slice(-4);if(!/^\d{4}$/.test(y))y='Sin año';(years[y]=years[y]||[]).push(x)});
  app().innerHTML=moduleHead('⬟ Seguro','Añadir póliza')+`<main class=modulepage>
  <div class=section>Pólizas</div>
  ${policies.map(p=>{let cur=policyIsCurrent(p,V()),er=effectivePolicyRenewal(p),renew=p.renewal||(er?fd(er)+' (calculada)':'');return `<div class=card><h3>${esc(p.company||'Compañía')} ${cur?'<span class=ok>VIGENTE</span>':''}</h3>${[['Póliza',p.policy],['Tomador',p.holder],['Conductor adicional',p.additional],['Cobertura',p.coverage],['Inicio',p.start],['Renovación',renew],['Fin',p.end],['Banco',p.bank]].map(r=>`<div class=row><span class=muted>${r[0]}</span><b>${esc(r[1]||'—')}</b></div>`).join('')}<div class=recordactions><button onclick="editPolicy('${p.id}')">Editar</button><button class=dangerbtn onclick="deleteRecord('insurancePolicies','${p.id}')">Eliminar</button></div></div>`}).join('')||'<div class=card>Sin pólizas registradas.</div>'}
  <div class="section sectionaction"><span>Histórico de primas</span><button class=add onclick=addInsurancePayment()>＋ Añadir cuota</button></div>
  ${Object.keys(years).sort((a,b)=>b.localeCompare(a)).map(y=>{let arr=years[y],tot=arr.reduce((n,x)=>n+(Number(x.cost)||0),0);return `<div class=card><h3>${esc(y)} · Total anual ${money(tot)}</h3>${arr.map(x=>`<div class=row><span>${esc(x.date||'Sin fecha')}</span><b>${money(x.cost)}</b></div><div class=recordactions><button onclick="editInsurancePayment('${x.id}')">Editar</button><button class=dangerbtn onclick="deleteRecord('insuranceHistory','${x.id}')">Eliminar</button></div>`).join('')}</div>`}).join('')||'<div class=card>Sin primas anteriores registradas.</div>'}</main>${bottom()}`
}
function editInsurance(){editPolicy(null)}
function editPolicy(id){
  let list=db.insurancePolicies||[];
  let x=id?list.find(r=>r.id===id):null;
  let legacy=null;
  if(!x&&id&&id==='legacy_policy_'+state.vid&&V().insurance?.company){let q=V().insurance;legacy={company:q.company||'',policy:q.policy||'',holder:q.holder||'',additional:q.additional||'',coverage:q.coverage||'',start:q.start||'',renewal:q.renewal||'',end:'',bank:q.bank||'',active:true}}
  let src=x||legacy||{};
  let company=prompt('Compañía:',src.company||'');if(company===null)return;
  let policy=prompt('Póliza:',src.policy||'');if(policy===null)return;
  let holder=prompt('Tomador:',src.holder||'');if(holder===null)return;
  let additional=prompt('Conductor adicional:',src.additional||'');if(additional===null)return;
  let coverage=prompt('Cobertura:',src.coverage||'');if(coverage===null)return;
  let startDate=promptDate('Fecha de inicio',src.start||'');if(startDate===null||startDate===undefined)return;
  let renewal=promptDate('Próxima renovación',src.renewal||'');if(renewal===null||renewal===undefined)return;
  let endDate=promptDate('Fecha de fin (vacío si vigente)',src.end||'');if(endDate===null||endDate===undefined)return;
  let bank=prompt('Banco:',src.bank||'');if(bank===null)return;
  let active=!String(endDate||'').trim();
  let rec={id:x?.id||(legacy?'legacy_policy_'+state.vid:uid('pol')),vehicle:state.vid,company:company.trim(),policy:policy.trim(),holder:holder.trim(),additional:additional.trim(),coverage:coverage.trim(),start:startDate,renewal,end:endDate,bank:bank.trim(),active};
  db.insurancePolicies=db.insurancePolicies||[];
  if(x)Object.assign(x,rec);else db.insurancePolicies.push(rec);
  syncLegacyInsurance();save();render()
}
function addInsurancePayment(){editInsurancePayment(null)}
function editInsurancePayment(id){
  let x=id?(db.insuranceHistory||[]).find(r=>r.id===id):null;
  let date=promptDate('Fecha de la cuota/pago',x?.date||todayES());if(date===null||date===undefined||!date)return;
  let cost=promptNumber('Importe de la cuota (€)',x?.cost??'');if(cost===null||cost===undefined||cost==='')return;
  let rec={id:x?.id||uid('ins'),vehicle:state.vid,date,cost};
  db.insuranceHistory=db.insuranceHistory||[];if(x)Object.assign(x,rec);else db.insuranceHistory.push(rec);save();render()
}

function itv(){let v=V(),d=itvDue(v),st=v.status==='Histórico'?['Sin control','']:stat(d),rows=(db.itv||[]).filter(x=>x.vehicle===state.vid).sort((a,b)=>(pd(b.nextDate)||pd(b.date)||0)-(pd(a.nextDate)||pd(a.date)||0));app().innerHTML=moduleHead('▣ ITV')+`<main class=modulepage><div class=card><div class=muted>${v.status==='Histórico'?'Vehículo histórico':'Próximo vencimiento'}</div><div style="font-size:34px;font-weight:850;margin:5px 0">${esc(st[0])}</div><b>${v.status==='Histórico'?'No se controlan vencimientos futuros':(d?fd(d):'Falta primera matriculación o ITV registrada')}</b></div><div class=section>Historial ITV</div>${rows.map(x=>`<div class=card><span class=cost>${x.cost!==''&&x.cost!=null?money(x.cost):''}</span><h3>${esc(x.date||(x.source==='DGT'?'Datos DGT':'Sin fecha'))}</h3><div class=row><span class=muted>Resultado</span><b>${esc(x.result||'—')}</b></div><div class=row><span class=muted>Centro ITV</span><b>${esc(x.center||'—')}</b></div><div class=row><span class=muted>Próximo vencimiento</span><b>${esc(x.nextDate||'—')}</b></div><div class=row><span class=muted>Kilometraje</span><b>${x.km!==''&&x.km!=null?Number(x.km).toLocaleString('es-ES')+' km':'—'}</b></div><div class=recordactions><button onclick="editItv('${x.id}')">Editar</button><button class=dangerbtn onclick="deleteRecord('itv','${x.id}')">Eliminar</button></div></div>`).join('')||'<div class=card>Sin ITV registradas.</div>'}</main>${bottom()}`}
function editItv(id){
  let x=id?(db.itv||[]).find(r=>r.id===id):null;
  let date=promptDate('Fecha ITV',x?.date||todayES());if(date===null||date===undefined||!date)return;
  let nextDate=promptDate('Próximo vencimiento',x?.nextDate||'');if(nextDate===null||nextDate===undefined)return;
  let result=prompt('Resultado:',x?.result||'Favorable');if(result===null)return;
  let center=prompt('Centro ITV:',x?.center||'');if(center===null)return;
  let km=promptNumber('Kilometraje',x?.km??'');if(km===null||km===undefined)return;
  let cost=promptNumber('Importe (€)',x?.cost??'');if(cost===null||cost===undefined)return;
  let rec={id:x?.id||uid('itv'),vehicle:state.vid,date,nextDate,result:result.trim(),center:center.trim(),km,cost};
  if(x)Object.assign(x,rec);else db.itv.push(rec);save();render()
}
function taxes(){let rows=(db.taxes||[]).filter(x=>x.vehicle===state.vid).sort((a,b)=>(pd(b.date)||0)-(pd(a.date)||0));app().innerHTML=moduleHead('€ Impuestos')+`<main class=modulepage>${rows.map(x=>`<div class=card><span class=cost>${x.cost!==''&&x.cost!=null?Number(x.cost).toLocaleString('es-ES',{minimumFractionDigits:2})+' €':''}</span><h3>${esc(x.date||(x.source==='DGT'?'Datos DGT':'Sin fecha'))}</h3><div class=recordactions><button onclick="editTax('${x.id}')">Editar</button><button class=dangerbtn onclick="deleteRecord('taxes','${x.id}')">Eliminar</button></div></div>`).join('')||'<div class=card>Sin impuestos registrados.</div>'}</main>${bottom()}`}
function editTax(id){let x=id?(db.taxes||[]).find(r=>r.id===id):null,date=prompt('Fecha de pago (dd/mm/aaaa):',x?.date||todayES());if(date===null)return;if(date&&!pd(date)){alert('Fecha no válida');return}let cost=prompt('Importe (€):',x?.cost??'');if(cost===null)return;let n=String(cost).trim()===''?'':Number(String(cost).replace(',','.'));if(n!==''&&!Number.isFinite(n)){alert('Importe no válido');return}let rec={id:x?.id||('tax_'+Date.now()),vehicle:state.vid,date:String(date||'').trim(),year:date&&pd(date)?String(pd(date).getFullYear()):String(x?.year||''),cost:n,municipality:x?.municipality||'',status:'Pagado'};if(x)Object.assign(x,rec);else db.taxes.push(rec);save();render()}
function docs(){app().innerHTML=moduleHead('▤ Documentos')+`<main><div class=card>Espacio preparado para pólizas, facturas, permiso de circulación y ficha técnica.</div></main>${bottom()}`}
function editOther(id,defaultKind='Otros'){
  let x=id?(db.other||[]).find(r=>r.id===id):null;
  let date=promptDate('Fecha',x?.date||todayES());if(date===null||date===undefined||!date)return;
  let kind=prompt('Tipo (Accesorios / Aparcamiento / Otros):',x?.kind||defaultKind);if(kind===null)return;
  let desc=prompt('Concepto:',x?.description||'');if(desc===null||!desc.trim())return;
  let place=prompt('Proveedor:',x?.place||'');if(place===null)return;
  let km=promptNumber('Kilómetros',x?.km??'');if(km===null||km===undefined)return;
  let cost=promptNumber('Importe (€)',x?.cost??'');if(cost===null||cost===undefined)return;
  let notes=prompt('Observaciones:',x?.notes||'');if(notes===null)return;
  let rec={id:x?.id||uid('oth'),vehicle:state.vid,date,kind:kind.trim(),description:desc.trim(),place:place.trim(),km,cost,notes:notes.trim()};
  if(x)Object.assign(x,rec);else db.other.push(rec);save();render()
}
function other(){let rows=(db.other||[]).filter(x=>x.vehicle===state.vid).sort((a,b)=>(pd(b.date)||0)-(pd(a.date)||0));app().innerHTML=moduleHead('▥ Gastos')+`<main class=modulepage><div class=section>Accesorios y otros</div>${rows.map(x=>`<div class=card><span class=tag>${esc(x.kind||'Gasto')}</span>${x.cost!==''?`<span class=cost>${money(x.cost)}</span>`:''}<h3>${esc(x.description)}</h3><div class=row><span class=muted>Fecha</span><b>${esc(x.date)}</b></div><div class=row><span class=muted>Proveedor</span><b>${esc(x.place||'—')}</b></div>${x.km!==''?`<div class=row><span class=muted>Kilometraje</span><b>${Number(x.km).toLocaleString('es-ES')} km</b></div>`:''}${x.notes?`<p class=muted>${esc(x.notes)}</p>`:''}<div class=recordactions><button onclick="editOther('${x.id}')">Editar</button><button class=dangerbtn onclick="deleteRecord('other','${x.id}')">Eliminar</button></div></div>`).join('')||'<div class=card>Sin gastos adicionales registrados.</div>'}</main>${bottom()}`}
function addRecord(){if(state.page==='insurance')return editPolicy(null);if(state.page==='itv')return editItv(null);if(state.page==='taxes')return editTax(null);if(state.page==='workshop')return editWorkshop(null);if(state.page==='tires')return editTire(null);if(state.page==='other')return editOther(null);}
function agenda(){let a=[];db.vehicles.filter(v=>v.status==='Activo'&&hasRoadDocs(v)).forEach(v=>{let d=itvDue(v);if(d)a.push([d,v,'ITV']);let s=insuranceDue(v);if(s)a.push([s,v,'Seguro'])});a.sort((x,y)=>x[0]-y[0]);app().innerHTML=`<div class=top><div class=brand>Agenda</div><div class=sub>Próximos vencimientos</div></div><main>${a.map(x=>`<div class=card onclick="openV('${x[1].id}')"><b>${esc(x[1].alias)} · ${x[2]}</b><span class=cost>${dy(x[0])} días</span><div class=muted>${fd(x[0])}</div></div>`).join('')}</main>${bottom()}`}
function expenseRecordsForVehicle(id){
  let out=[],cy=new Date().getFullYear(),v=db.vehicles.find(x=>x.id===id),hasPlan=!!(v?.maintenancePlan&&Number(v.maintenancePlan.amount));
  (db.workshop||[]).filter(x=>x.vehicle===id&&!(hasPlan&&x.kind==='Plan mantenimiento'&&String(x.date)==='Año '+cy)).forEach(x=>out.push({date:x.date,kind:x.kind||'Taller',description:x.description||'Mantenimiento / reparación',place:x.place||'',km:x.km,cost:Number(x.cost||0)}));
  if(hasPlan)recurringMaintenanceRecords(id).forEach(x=>out.push({date:x.date,kind:'Plan mantenimiento',description:x.description||v.maintenancePlan?.label||'Plan mantenimiento',place:x.place||'',km:x.km,cost:Number(x.cost||0)}));
  (db.tires||[]).filter(x=>x.vehicle===id).forEach(x=>out.push({date:x.date,kind:'Neumáticos',description:x.description||'Neumáticos',place:x.place||'',km:x.km,cost:Number(x.cost||0)}));
  (db.insuranceHistory||[]).filter(x=>x.vehicle===id).forEach(x=>out.push({date:x.date,kind:'Seguro',description:'Prima / cuota de seguro',place:'',km:'',cost:Number(x.cost||0)}));
  (db.itv||[]).filter(x=>x.vehicle===id&&hasNum(x.cost)&&Number(x.cost)!==0).forEach(x=>out.push({date:x.date||x.nextDate,kind:'ITV',description:'ITV',place:x.center||'',km:x.km,cost:Number(x.cost||0)}));
  (db.taxes||[]).filter(x=>x.vehicle===id).forEach(x=>out.push({date:x.date,kind:'Impuestos',description:'Impuesto',place:'',km:'',cost:Number(x.cost||0)}));
  (db.other||[]).filter(x=>x.vehicle===id).forEach(x=>out.push({date:x.date,kind:x.kind||'Otros',description:x.description||'Gasto',place:x.place||'',km:x.km,cost:Number(x.cost||0)}));
  return out
}
function expenseDateValue(s){let d=pd(s);if(d)return d.getTime();let m=String(s||'').match(/Año\s+(\d{4})/);return m?new Date(Number(m[1]),11,31).getTime():0}
function openSpendVehicle(id){state.vid=id;state.page='spendVehicle';render()}
function spendVehicle(){let v=V(),rows=expenseRecordsForVehicle(v.id).sort((a,b)=>expenseDateValue(b.date)-expenseDateValue(a.date)),total=rows.reduce((n,x)=>n+Number(x.cost||0),0),by={};rows.forEach(x=>by[x.kind]=(by[x.kind]||0)+Number(x.cost||0));app().innerHTML=`<div class=top><button class=back onclick="state.page='spend';render()">‹ Gastos</button><div class=head><h1>${esc(v.alias)}</h1></div><div class=sub>Detalle de gastos</div></div><main class=modulepage><div class="card spendtotal"><span class=muted>Total acumulado</span><b>${moneySpend(total)}</b></div><div class=section>Por concepto</div><div class=card>${Object.entries(by).sort((a,b)=>b[1]-a[1]).map(([k,n])=>`<div class=row><span>${esc(k)}</span><b>${moneySpend(n)}</b></div>`).join('')||'<div class=muted>Sin gastos registrados.</div>'}</div><div class=section>Movimientos</div>${rows.map(x=>`<div class=card><span class=cost>${moneySpend(x.cost)}</span><h3>${esc(x.description)}</h3><span class=tag>${esc(x.kind)}</span><div class=row><span class=muted>Fecha</span><b>${esc(x.date||'—')}</b></div>${x.place?`<div class=row><span class=muted>Proveedor / taller</span><b>${esc(x.place)}</b></div>`:''}${hasNum(x.km)?`<div class=row><span class=muted>Kilometraje</span><b>${Number(x.km).toLocaleString('es-ES')} km</b></div>`:''}</div>`).join('')||'<div class=card>Sin gastos registrados.</div>'}</main>${bottom()}`}
function spend(){let sums={};(db.vehicles||[]).forEach(v=>{let total=expenseRecordsForVehicle(v.id).reduce((n,x)=>n+Number(x.cost||0),0);if(total!==0)sums[v.id]=total});app().innerHTML=`<div class=top><div class=brand>Gastos</div><div class=sub>Taller, seguros, neumáticos, ITV, impuestos y otros gastos</div></div><main>${Object.entries(sums).sort((a,b)=>b[1]-a[1]).map(([id,n])=>{let v=db.vehicles.find(x=>x.id===id);return `<div class="card spendvehicle" onclick="openSpendVehicle('${id}')"><div><b>${esc(v?.alias||id)}</b><div class=muted>Ver detalle</div></div><span class=cost>${moneySpend(n)}</span><span class=spendchev>›</span></div>`}).join('')||'<div class=card>Sin gastos registrados.</div>'}</main>${bottom()}`}
function pending(){
  let items=[];
  db.vehicles.filter(v=>v.status==='Activo').forEach(v=>{
    if(!v.km)items.push([v.id,v.alias,'Kilometraje','Falta indicar el kilometraje actual','km']);
    if(hasRoadDocs(v)){
      if(!v.firstRegistration)items.push([v.id,v.alias,'Primera matriculación','Necesaria para calcular correctamente la ITV','firstRegistration']);
      if(!v.plate)items.push([v.id,v.alias,'Matrícula','Dato pendiente','plate']);
      let cp=currentPolicy(v);if(!cp)items.push([v.id,v.alias,'Seguro','Sin póliza vigente','insurance']);
      if(!latest(db.tires,v.id))items.push([v.id,v.alias,'Neumáticos','Sin datos de neumáticos','tires']);
    }
  });
  app().innerHTML=`<div class=top><button class=back onclick="go('more')">‹ Más</button><div class=brand>Datos pendientes</div><div class=sub>Toca un dato para completarlo</div></div><main>${items.map(x=>`<div class="card pendingcard" onclick="editPending('${x[0]}','${x[4]}')"><b>${esc(x[1])} · ${esc(x[2])}</b><div class=muted>${esc(x[3])}</div><span class=rowchev>›</span></div>`).join('')||'<div class=card>No hay datos pendientes.</div>'}</main>${bottom()}`
}
function more(){app().innerHTML=`<div class=top><div class=brand>Más</div></div><main><div class="card menucard" onclick="go('pending')"><div class=menuicon>!</div><div><b>Datos pendientes</b><p class=muted>Completar información que falta de los vehículos</p></div><span class=chev>›</span></div><div class=card><b>Copias y datos</b><p class=muted>JSON es la copia completa maestra e incluye las fotos.</p><button class=add onclick="document.getElementById('importFile').click()">Importar y fusionar JSON</button><input id=importFile type=file accept=".json,application/json" hidden onchange="importBackup(this.files[0]);this.value=''"><button class="add secondary" onclick=backup()>Exportar copia JSON</button><button class="textbtn" onclick="document.getElementById('restoreFile').click()">Restaurar JSON sustituyendo datos</button><input id=restoreFile type=file accept=".json,application/json" hidden onchange="restoreBackup(this.files[0]);this.value=''"></div><div class=card><b>Excel editable</b><p class=muted>Exporta todos los datos a hojas separadas, modifícalos en Excel y vuelve a incorporarlos. Las fotos permanecen en el iPhone y no se meten en el Excel.</p><button class=add onclick=exportExcel()>Exportar Excel</button><button class="add secondary" onclick="document.getElementById('excelFile').click()">Importar Excel modificado</button><input id=excelFile type=file accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" hidden onchange="importExcel(this.files[0]);this.value=''"></div></main>${bottom()}`}
function xlsxReady(){if(window.XLSX)return true;alert('El módulo Excel no se ha cargado. Abre Mi Garaje con conexión a Internet y vuelve a intentarlo.');return false}
function excelRows(){
  let vehicles=(db.vehicles||[]).map(v=>({id:v.id,Alias:v.alias||'',Tipo:v.type||'',Estado:v.status||'',Marca:v.brand||'',Modelo:v.model||'',Titular:v.owner||'',Matricula:v.plate||'',Bastidor:v.vin||'',NIVE:v.nive||'',PrimeraMatriculacion:v.firstRegistration||'',Carburante:v.fuel||'',Cilindrada:v.displacement??'',DistintivoAmbiental:v.environmentalLabel||'',FechaCompra:v.purchase||'',PrecioCompra:v.purchasePrice??'',KmActuales:v.km??'',FechaKm:v.mileageUpdated||'',PlanMantenimientoMensual:v.maintenancePlan?.amount??'',DiaCargoMantenimiento:v.maintenancePlan?.day??'',DescripcionPlanMantenimiento:v.maintenancePlan?.label||'',Foto:photoSrc(v)?'SI':''}));
  let sales=(db.vehicles||[]).filter(v=>v.saleDate||v.salePrice!==''&&v.salePrice!=null||v.saleRecipient).map(v=>({vehicleId:v.id,FechaVenta:v.saleDate||'',ImporteVenta:v.salePrice??'',Destinatario:v.saleRecipient||''}));
  let policies=(db.insurancePolicies||[]).map(x=>({id:x.id,vehicleId:x.vehicle,Compania:x.company||'',Poliza:x.policy||'',Tomador:x.holder||'',ConductorAdicional:x.additional||'',Cobertura:x.coverage||'',Inicio:x.start||'',Renovacion:x.renewal||'',Fin:x.end||'',Banco:x.bank||'',Vigente:x.active?'SI':'NO'}));
  let pays=(db.insuranceHistory||[]).map(x=>({id:x.id,vehicleId:x.vehicle,policyId:x.policyId||'',Fecha:x.date||'',Importe:x.cost??''}));
  let workshop=(db.workshop||[]).map(x=>({id:x.id,vehicleId:x.vehicle,Fecha:x.date||'',Km:x.km??'',Proveedor:x.place||'',Concepto:x.description||'',Importe:x.cost??'',Tipo:x.kind||''}));
  let tires=(db.tires||[]).map(x=>({id:x.id,vehicleId:x.vehicle,Fecha:x.date||'',Km:x.km??'',Proveedor:x.place||'',Neumatico:x.description||'',Importe:x.cost??'',Posicion:x.position||''}));
  let itv=(db.itv||[]).map(x=>({id:x.id,vehicleId:x.vehicle,Fecha:x.date||'',ProximaITV:x.nextDate||'',Resultado:x.result||'',Centro:x.center||'',Km:x.km??'',Importe:x.cost??''}));
  let taxes=(db.taxes||[]).map(x=>({id:x.id,vehicleId:x.vehicle,Fecha:x.date||'',Ano:x.year||'',Importe:x.cost??'',Estado:x.status||''}));
  let other=(db.other||[]).map(x=>({id:x.id,vehicleId:x.vehicle,Fecha:x.date||'',Tipo:x.kind||'',Concepto:x.description||'',Proveedor:x.place||'',Km:x.km??'',Importe:x.cost??'',Observaciones:x.notes||''}));
  let mileage=[];(db.vehicles||[]).forEach(v=>(v.mileageHistory||[]).forEach((x,n)=>mileage.push({id:x.id||`km_${v.id}_${n}`,vehicleId:v.id,Fecha:x.date||'',Km:x.km??''})));
  return {Vehiculos:vehicles,Ventas:sales,Seguros:policies,PagosSeguro:pays,Taller:workshop,Neumaticos:tires,ITV:itv,Impuestos:taxes,OtrosGastos:other,Kilometraje:mileage}
}
function exportExcel(){
  if(!xlsxReady())return;let wb=XLSX.utils.book_new(),sets=excelRows();
  Object.entries(sets).forEach(([name,rows])=>{let data=rows.length?rows:[{Info:'Sin datos'}],ws=XLSX.utils.json_to_sheet(data),headers=Object.keys(data[0]||{});ws['!autofilter']={ref:ws['!ref']};ws['!cols']=headers.map(h=>({wch:Math.min(34,Math.max(12,h.length+2,...data.slice(0,100).map(r=>String(r[h]??'').length+2)))}));XLSX.utils.book_append_sheet(wb,ws,name)});
  let d=new Date(),stamp=d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0');XLSX.writeFile(wb,`Mi_Garaje_${stamp}.xlsx`,{compression:true})
}
function sheetObjects(wb,name){let ws=wb.Sheets[name];return ws?XLSX.utils.sheet_to_json(ws,{defval:'',raw:true}):[]}
function xdate(v){if(v===null||v===undefined||v==='')return '';if(typeof v==='number'&&window.XLSX?.SSF?.parse_date_code){let d=XLSX.SSF.parse_date_code(v);if(d)return String(d.d).padStart(2,'0')+'/'+String(d.m).padStart(2,'0')+'/'+d.y}let s=String(v).trim();let m=s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);if(m){let y=Number(m[3]);if(y<100)y+=2000;return String(Number(m[1])).padStart(2,'0')+'/'+String(Number(m[2])).padStart(2,'0')+'/'+y}return s}
function yn(v){let s=String(v??'').trim().toLowerCase();return s==='si'||s==='sí'||s==='true'||s==='1'||s==='yes'}
function nval(v){if(v===null||v===undefined||v==='')return '';if(typeof v==='number')return v;let s=String(v).trim().replace(/\s/g,'').replace(/\.(?=\d{3}(\D|$))/g,'').replace(',','.');let n=Number(s);return Number.isFinite(n)?n:''}
function externalRecord(row,prefix,map){let o={id:String(row.id||uid(prefix))};Object.entries(map).forEach(([to,from])=>o[to]=row[from]??'');return o}
function importExcel(file){
  if(!file||!xlsxReady())return;let r=new FileReader();r.onload=async()=>{try{
    let wb=XLSX.read(r.result,{type:'array'}),vr=sheetObjects(wb,'Vehiculos');if(!vr.length)throw new Error('Falta la hoja Vehiculos');
    if(!confirm('Se hará primero una copia JSON de seguridad. Después, los valores del Excel actualizarán los registros con el mismo ID y se añadirán los nuevos. Las fotos existentes se conservarán. ¿Continuar?'))return;
    await downloadBackup('antes_de_importar_excel');let previous=structuredClone(db),incoming=structuredClone(EMPTY_DB);incoming.schemaVersion=8.32;
    incoming.vehicles=vr.filter(x=>x.id||x.Alias).map(row=>{let id=String(row.id||uid('veh'));let local=(db.vehicles||[]).find(v=>v.id===id);return {id,alias:row.Alias||'',type:row.Tipo||local?.type||'Otro',status:row.Estado||local?.status||'Activo',brand:row.Marca||'',model:row.Modelo||'',owner:row.Titular||local?.owner||'',plate:row.Matricula||'',vin:row.Bastidor||'',nive:row.NIVE||local?.nive||'',firstRegistration:xdate(row.PrimeraMatriculacion),fuel:row.Carburante||local?.fuel||'',displacement:nval(row.Cilindrada)!==''?nval(row.Cilindrada):(local?.displacement??''),environmentalLabel:row.DistintivoAmbiental||local?.environmentalLabel||'',purchase:xdate(row.FechaCompra),purchasePrice:nval(row.PrecioCompra),km:nval(row.KmActuales),mileageUpdated:xdate(row.FechaKm),photo:'',insurance:local?.insurance||null,mileageHistory:local?.mileageHistory||[],saleDate:local?.saleDate||'',salePrice:local?.salePrice??'',saleRecipient:local?.saleRecipient||'',maintenancePlan:(row.PlanMantenimientoMensual!==''&&row.PlanMantenimientoMensual!=null)?{amount:nval(row.PlanMantenimientoMensual),day:Math.min(28,Math.max(1,Math.round(nval(row.DiaCargoMantenimiento)||1))),label:row.DescripcionPlanMantenimiento||'Cuota mensual de mantenimiento'}:(local?.maintenancePlan||null)}}
    );
    let sales=sheetObjects(wb,'Ventas');sales.forEach(row=>{let v=incoming.vehicles.find(x=>x.id===String(row.vehicleId));if(v){v.saleDate=xdate(row.FechaVenta);v.salePrice=nval(row.ImporteVenta);v.saleRecipient=row.Destinatario||'';if(v.saleDate)v.status='Histórico'}});
    incoming.insurancePolicies=sheetObjects(wb,'Seguros').filter(x=>x.id||x.vehicleId).map(row=>({id:String(row.id||uid('pol')),vehicle:String(row.vehicleId||''),company:row.Compania||'',policy:row.Poliza||'',holder:row.Tomador||'',additional:row.ConductorAdicional||'',coverage:row.Cobertura||'',start:xdate(row.Inicio),renewal:xdate(row.Renovacion),end:xdate(row.Fin),bank:row.Banco||'',active:!xdate(row.Fin)}));
    incoming.insuranceHistory=sheetObjects(wb,'PagosSeguro').filter(x=>x.id||x.vehicleId).map(row=>({id:String(row.id||uid('ins')),vehicle:String(row.vehicleId||''),policyId:row.policyId||'',date:xdate(row.Fecha),cost:nval(row.Importe)}));
    incoming.workshop=sheetObjects(wb,'Taller').filter(x=>x.id||x.vehicleId).map(row=>({id:String(row.id||uid('wrk')),vehicle:String(row.vehicleId||''),date:xdate(row.Fecha),km:nval(row.Km),place:row.Proveedor||'',description:row.Concepto||'',cost:nval(row.Importe),kind:row.Tipo||''}));
    incoming.tires=sheetObjects(wb,'Neumaticos').filter(x=>x.id||x.vehicleId).map(row=>({id:String(row.id||uid('tir')),vehicle:String(row.vehicleId||''),date:xdate(row.Fecha),km:nval(row.Km),place:row.Proveedor||'',description:row.Neumatico||'',cost:nval(row.Importe),position:row.Posicion||''}));
    incoming.itv=sheetObjects(wb,'ITV').filter(x=>x.id||x.vehicleId).map(row=>({id:String(row.id||uid('itv')),vehicle:String(row.vehicleId||''),date:xdate(row.Fecha),nextDate:xdate(row.ProximaITV),result:row.Resultado||'',center:row.Centro||'',km:nval(row.Km),cost:nval(row.Importe)}));
    incoming.taxes=sheetObjects(wb,'Impuestos').filter(x=>x.id||x.vehicleId).map(row=>({id:String(row.id||uid('tax')),vehicle:String(row.vehicleId||''),date:xdate(row.Fecha),year:row.Ano||'',cost:nval(row.Importe),status:row.Estado||'Pagado'}));
    incoming.other=sheetObjects(wb,'OtrosGastos').filter(x=>x.id||x.vehicleId).map(row=>({id:String(row.id||uid('oth')),vehicle:String(row.vehicleId||''),date:xdate(row.Fecha),kind:row.Tipo||'',description:row.Concepto||'',place:row.Proveedor||'',km:nval(row.Km),cost:nval(row.Importe),notes:row.Observaciones||''}));
    let kms=sheetObjects(wb,'Kilometraje');incoming.vehicles.forEach(v=>{let local=(db.vehicles||[]).find(x=>x.id===v.id);let rows=kms.filter(x=>String(x.vehicleId)===v.id).map(x=>({id:String(x.id||uid('km')),date:xdate(x.Fecha),km:nval(x.Km)}));v.mileageHistory=rows.length?rows:(local?.mileageHistory||[])});
    db=mergeDataExternal(incoming,db);syncLegacyInsurance();if(!save()){db=previous;return}alert('Excel importado correctamente. Se han actualizado y añadido registros conservando las fotos del iPhone.');state.page='garage';render()
  }catch(e){console.error(e);alert('No se ha podido importar el Excel: '+(e?.message||'archivo no válido'))}};r.readAsArrayBuffer(file)
}
function normalizeData(data){
  if(!data||typeof data!=='object')data={};
  for(const k of ['vehicles','workshop','tires','itv','taxes','other','insuranceHistory','insurancePolicies'])if(!Array.isArray(data[k]))data[k]=[];
  // Migrate legacy single-policy records without losing them. Use a stable id so repeated imports do not duplicate policies.
  data.vehicles.forEach(v=>{if(hasRoadDocs(v)&&v.insurance&&v.insurance.company&&!data.insurancePolicies.some(p=>p.vehicle===v.id)){data.insurancePolicies.push({id:'legacy_policy_'+v.id,vehicle:v.id,company:v.insurance.company||'',policy:v.insurance.policy||'',holder:v.insurance.holder||'',additional:v.insurance.additional||'',coverage:v.insurance.coverage||'',start:v.insurance.start||'',renewal:v.insurance.renewal||'',end:'',bank:v.insurance.bank||'',active:true})}});
  data.insurancePolicies.forEach(p=>{p.end=p.end||'';p.renewal=p.renewal||'';p.active=!String(p.end).trim()});
  data.vehicles.forEach(v=>{if(v.type==='Bici'){v.type='Otros';v.otherKind=v.otherKind||'Bicicleta'}else if(v.type==='Otro')v.type='Otros';v.otherKind=v.otherKind||'';v.skipMaintenance=!!v.skipMaintenance;v.mileageHistory=Array.isArray(v.mileageHistory)?v.mileageHistory:[];v.saleDate=v.saleDate||'';v.salePrice=v.salePrice??'';v.saleRecipient=v.saleRecipient||'';v.owner=v.owner||'';v.fuel=v.fuel||'';v.displacement=v.displacement??'';v.environmentalLabel=v.environmentalLabel||'';v.nive=v.nive||'';if(v.maintenancePlan&&typeof v.maintenancePlan!=='object')v.maintenancePlan=null});
  data.schemaVersion=Math.max(Number(data.schemaVersion)||0,8.32);
  return data
}
function useful(v){return !(v===undefined||v===null||v==='')}
function mergeObjects(incoming,local){let out={...(incoming||{})};Object.entries(local||{}).forEach(([k,v])=>{if(useful(v))out[k]=v});return out}
function mergeArray(local,incoming){let m=new Map();(incoming||[]).forEach(x=>m.set(x.id||JSON.stringify(x),x));(local||[]).forEach(x=>{let k=x.id||JSON.stringify(x),prev=m.get(k);m.set(k,prev?mergeObjects(prev,x):x)});return [...m.values()]}
function mergeVehicle(incoming,local){let v=mergeObjects(incoming,local);v.insurance=mergeObjects(incoming?.insurance,local?.insurance);v.photo=local?.photo||incoming?.photo||'';v.mileageHistory=mergeArray(local?.mileageHistory||[],incoming?.mileageHistory||[]);return v}
function mergeData(incoming,local){
  incoming=normalizeData(incoming);local=normalizeData(local);
  let im=new Map(incoming.vehicles.map(v=>[v.id,v])),lm=new Map(local.vehicles.map(v=>[v.id,v])),ids=new Set([...im.keys(),...lm.keys()]);
  let vehicles=[...ids].map(id=>im.has(id)&&lm.has(id)?mergeVehicle(im.get(id),lm.get(id)):(lm.get(id)||im.get(id)));
  return {schemaVersion:Math.max(Number(incoming.schemaVersion)||0,Number(local.schemaVersion)||0,8.32),
    vehicles,
    workshop:mergeArray(local.workshop,incoming.workshop),
    tires:mergeArray(local.tires,incoming.tires),
    itv:mergeArray(local.itv,incoming.itv),
    taxes:mergeArray(local.taxes,incoming.taxes),
    other:mergeArray(local.other,incoming.other),
    insuranceHistory:mergeArray(local.insuranceHistory,incoming.insuranceHistory),
    insurancePolicies:mergeArray(local.insurancePolicies,incoming.insurancePolicies)
  }
}
function mergeArrayExternal(incoming,local){let m=new Map();(local||[]).forEach(x=>m.set(x.id||JSON.stringify(x),x));(incoming||[]).forEach(x=>{let k=x.id||JSON.stringify(x),prev=m.get(k);m.set(k,prev?{...prev,...x}:x)});return [...m.values()]}
function mergeDataExternal(incoming,local){incoming=normalizeData(incoming);local=normalizeData(local);let im=new Map(incoming.vehicles.map(v=>[v.id,v])),lm=new Map(local.vehicles.map(v=>[v.id,v])),ids=new Set([...lm.keys(),...im.keys()]);let vehicles=[...ids].map(id=>{let l=lm.get(id),i=im.get(id);if(!i)return l;if(!l)return i;return {...l,...i,photo:l.photo||i.photo||'',insurance:l.insurance||i.insurance||null,mileageHistory:i.mileageHistory?.length?i.mileageHistory:(l.mileageHistory||[])}});return {schemaVersion:8.32,vehicles,workshop:mergeArrayExternal(incoming.workshop,local.workshop),tires:mergeArrayExternal(incoming.tires,local.tires),itv:mergeArrayExternal(incoming.itv,local.itv),taxes:mergeArrayExternal(incoming.taxes,local.taxes),other:mergeArrayExternal(incoming.other,local.other),insuranceHistory:mergeArrayExternal(incoming.insuranceHistory,local.insuranceHistory),insurancePolicies:mergeArrayExternal(incoming.insurancePolicies,local.insurancePolicies)}}
function syncLegacyInsurance(){(db.vehicles||[]).forEach(v=>{if(v.status==='Histórico')return;let p=(db.insurancePolicies||[]).filter(x=>x.vehicle===v.id&&!String(x.end||'').trim()).sort((a,b)=>dateValue(b.start)-dateValue(a.start))[0];if(p){p.active=true;v.insurance={company:p.company||'',policy:p.policy||'',holder:p.holder||'',additional:p.additional||'',coverage:p.coverage||'',start:p.start||'',renewal:p.renewal||'',bank:p.bank||''}}})}

async function fullBackupData(){let out=structuredClone(db);for(const v of out.vehicles||[]){let p=photoCache.get(v.id)||'';if(!p&&photoStorageReady)p=await photoGet(v.id).catch(()=>'');v.photo=p||v.photo||''}out.schemaVersion=8.32;return out}
async function downloadBackup(name){let data=await fullBackupData(),a=document.createElement('a'),b=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),d=new Date(),stamp=d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0')+'_'+String(d.getHours()).padStart(2,'0')+String(d.getMinutes()).padStart(2,'0');a.href=URL.createObjectURL(b);a.download=`Mi_Garaje_${name}_${stamp}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function applyVehiclePatches(data){if(!Array.isArray(data?.vehiclePatches))return;for(const patch of data.vehiclePatches){let v=(db.vehicles||[]).find(x=>x.id===patch.id);if(!v)continue;let set=patch.set&&typeof patch.set==='object'?patch.set:{};Object.assign(v,set);if(v.skipMaintenance)v.maintenancePlan=null;}}
async function ingestPhotos(data,{replace=false}={}){if(!photoStorageReady)return false;try{if(replace){await photoClear();photoCache.clear()}for(const v of data.vehicles||[]){if(v.photo){await photoPut(v.id,v.photo);photoCache.set(v.id,v.photo);v.photo=''}else if(!replace){let old=photoCache.get(v.id);if(old)v.photo=''}}return true}catch(e){console.error('Error guardando fotos',e);return false}}
function importBackup(file){if(!file)return;let r=new FileReader();r.onload=async()=>{try{let data=JSON.parse(r.result);if(!data||(!Array.isArray(data.vehicles)&&!Array.isArray(data.vehiclePatches)))throw 0;data.vehicles=Array.isArray(data.vehicles)?data.vehicles:[];if(!confirm('Se hará primero una copia de seguridad de los datos actuales y después se fusionará el archivo. No se borrarán las fotos ni los datos que ya tengas. ¿Continuar?'))return;await downloadBackup('antes_de_importar');let previous=structuredClone(db),incoming=normalizeData(data);if(photoStorageReady){for(const v of incoming.vehicles||[]){if(v.photo){let existing=photoCache.get(v.id)||await photoGet(v.id).catch(()=>'');if(!existing){await photoPut(v.id,v.photo);photoCache.set(v.id,v.photo)}v.photo=''}}}db=mergeData(incoming,db);applyVehiclePatches(data);db=normalizeData(db);(db.vehicles||[]).forEach(v=>{if(photoStorageReady)v.photo=''});if(!save()){db=previous;return}alert('Datos fusionados correctamente. Se han conservado los datos y fotos existentes.');state.page='garage';state.filter='Moto';render()}catch(e){console.error(e);alert('No se ha podido importar la copia. Detalle: '+(e?.message||e||'desconocido'))}};r.readAsText(file)}
function restoreBackup(file){if(!file)return;let r=new FileReader();r.onload=async()=>{try{let data=JSON.parse(r.result);if(!data||!Array.isArray(data.vehicles))throw new Error('Copia JSON no válida');if(!confirm('ATENCIÓN: se hará primero una copia de seguridad y después este JSON sustituirá todos los datos actuales de Mi Garaje. ¿Continuar?'))return;await downloadBackup('antes_de_restaurar');let previous=structuredClone(db),incoming=normalizeData(data);let photoOk=true;if(photoStorageReady)photoOk=await ingestPhotos(incoming,{replace:true});if(photoStorageReady&&!photoOk)throw new Error('No se han podido guardar las fotos en IndexedDB');db=incoming;(db.vehicles||[]).forEach(v=>{if(photoStorageReady)v.photo=''});if(!save()){db=previous;return}alert('Copia restaurada correctamente.');state.page='garage';state.filter='Moto';render()}catch(e){console.error(e);alert('No se ha podido restaurar la copia: '+(e?.message||'archivo no válido'))}};r.readAsText(file)}

function backup(){downloadBackup('copia_completa')}
function render(){({garage,vehicle,workshop,tires,insurance,itv,taxes,docs,other,agenda,spend,spendVehicle,more,pending}[state.page]||garage)()}
(async()=>{await initPhotoStorage();render()})();
