
const KEY='mi_garaje_public_demo_v1',EMPTY_DB={schemaVersion:8,vehicles:[],workshop:[],tires:[],itv:[],taxes:[],other:[],insuranceHistory:[],insurancePolicies:[]};
let db;try{let raw=localStorage.getItem(KEY);db=raw?JSON.parse(raw):structuredClone(EMPTY_DB)}catch(e){db=structuredClone(EMPTY_DB)}
db=normalizeData(db);
function isGasGas(v){return (v.plate||'').replace(/\s/g,'').toUpperCase()==='B-9378-SS'||((v.brand||'').toLowerCase().includes('gas gas')&&(v.model||'').toLowerCase().includes('250'))}
function migrateV66(){let changed=false;(db.vehicles||[]).forEach(v=>{if(v.type!=='Bici'&&!isGasGas(v)&&v.purchase){let f=pd(v.firstRegistration);if(!f||f.getFullYear()<1950){v.firstRegistration=v.purchase;changed=true}}});if(changed)save()}
setTimeout(migrateV66,0);

function migrateTireClassification(){
  db.tires=db.tires||[];db.workshop=db.workshop||[];let changed=false;
  let w2=db.workshop.find(x=>x.id==='w2'&&x.vehicle==='ktm2971'&&x.date==='11/11/2020'&&Number(x.cost)===227&&/neum[aá]tico trasero/i.test(x.description||''));
  if(w2){
    if(!db.tires.some(x=>x.id==='t_ktm2971_20201111'))db.tires.push({id:'t_ktm2971_20201111',vehicle:'ktm2971',date:'11/11/2020',km:'',place:w2.place||'Manel',description:'Neumático trasero',cost:100,position:'Trasero'});
    w2.description='Pastillas traseras; líquido ruedas; cadena; mano de obra';w2.cost=127;changed=true
  }
  let w5=db.workshop.find(x=>x.id==='w5'&&x.vehicle==='ktm2971'&&x.date==='27/08/2022'&&/neum[aá]tico trasero/i.test(x.description||''));
  if(w5){
    if(!db.tires.some(x=>x.id==='t_ktm2971_20220827'))db.tires.push({id:'t_ktm2971_20220827',vehicle:'ktm2971',date:'27/08/2022',km:w5.km||'',place:w5.place||'Manel',description:w5.description,cost:w5.cost,position:'Trasero'});
    db.workshop=db.workshop.filter(x=>x!==w5);changed=true
  }
  if(changed)save()
}
setTimeout(migrateTireClassification,0);

db.vehicles.forEach(v=>{v.mileageHistory=v.mileageHistory||[];if(v.km && !v.mileageUpdated){v.mileageUpdated='';}});
let state={page:'garage',filter:'Moto',vid:null,module:null};const app=()=>document.getElementById('app');const esc=x=>String(x??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(db));return true}catch(e){alert('No se ha podido guardar este cambio en el iPhone. El almacenamiento puede estar lleno. Exporta una copia de seguridad antes de continuar.');return false}};
function pd(s){if(!s||s.startsWith('Año'))return null;let a=s.split('/').map(Number);return a.length===3?new Date(a[2],a[1]-1,a[0]):null}function fd(d){return d?String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear():''}function dy(d){return Math.ceil((d-new Date())/86400000)}function ay(d,n){let x=new Date(d);x.setFullYear(x.getFullYear()+n);return x}function V(){return db.vehicles.find(x=>x.id===state.vid)}function latest(a,id){return a.filter(x=>x.vehicle===id&&pd(x.date)).sort((x,y)=>pd(y.date)-pd(x.date))[0]}
function itvDue(v){if(v.type==='Bici')return null;let l=latest(db.itv,v.id);if(l?.nextDate)return pd(l.nextDate);let f=pd(v.firstRegistration);return f?ay(f,4):null}function stat(d){if(!d)return ['Pendiente','bad'];let n=dy(d);return n<0?['Vencida','bad']:n<=30?[n+' días','warn']:[n+' días','good']}
function bottom(){return `<div class=copyright>© Cem 2026 · V8.0</div><div class=bottom>${[['garage','⌂','Garaje'],['agenda','▣','Agenda'],['spend','▥','Gastos'],['more','•••','Más']].map(n=>`<div class="nav ${state.page===n[0]?'on':''}" onclick="go('${n[0]}')"><b>${n[1]}</b>${n[2]}</div>`).join('')}</div>`}function go(p){state.page=p;render()}
function welcome(){
  app().innerHTML=`<div class=top><div class=brand>◉ Mi Garaje</div></div><main class=welcome><div class=card><h1>Bienvenido a Mi Garaje</h1><p class=muted>Empieza añadiendo tu primer vehículo o recupera una copia de seguridad.</p><button class=add onclick=addVehicle()>＋ Añadir mi primer vehículo</button><button class="add secondary" onclick="document.getElementById('welcomeImport').click()">Importar copia de seguridad</button><input id=welcomeImport type=file accept=".json,application/json" hidden onchange="importBackup(this.files[0]);this.value=''"></div></main>${bottom()}`
}
function garage(){
  if(!(db.vehicles||[]).length)return welcome();
  let vs=db.vehicles.filter(v=>state.filter==='Histórico'?v.status==='Histórico':state.filter==='Coche'?(v.status==='Activo'&&(v.type==='Coche'||v.type==='Otro')):v.type===state.filter&&v.status==='Activo');
  vs.sort((a,b)=>{let A=pd(a.purchase),B=pd(b.purchase);return (B?B.getTime():-Infinity)-(A?A.getTime():-Infinity)||String(a.alias||'').localeCompare(String(b.alias||''),'es')});
  app().innerHTML=`<div class=top><div class=brandrow><div><div class=brand>◉ Mi Garaje</div></div><button class=plus onclick=addVehicle()>+</button></div><div class=chips>${['Moto','Coche','Bici','Histórico'].map(x=>`<button class="chip ${state.filter===x?'on':''}" onclick="state.filter='${x}';render()">${x==='Coche'?'Coches':x==='Moto'?'Motos':x==='Bici'?'Bicis':x}</button>`).join('')}</div></div><main>${vs.map(v=>vehicleCard(v)).join('')||'<div class=card>Sin vehículos en esta sección.</div>'}</main>${bottom()}`
}
function vehicleCard(v){let i=stat(itvDue(v)),sd=v.insurance?stat(pd(v.insurance.renewal)):null,t=latest(db.tires,v.id),tk=t&&v.km&&t.km?Math.max(0,+v.km-+t.km):null;let ms=v.type==='Bici'?[['🔧','Mantenimiento',latest(db.workshop,v.id)?.date||'Sin datos'],['◉','Neumáticos',tk!=null?tk.toLocaleString('es-ES')+' km':'Sin km'],['','', '']]:[['▣','ITV',i[0]],['⬟','Seguro',sd?sd[0]:'Pendiente'],['◉','Neumáticos',tk!=null?tk.toLocaleString('es-ES')+' km':'Sin km']];return `<div class=vehicle onclick="openV('${v.id}')"><div class=vpic>${v.photo?`<img src="${v.photo}" style="width:100%;height:100%;object-fit:cover">`:v.type==='Bici'?'🚲':v.type==='Moto'?'🏍️':'🚙'}<span class=type>${v.type==='Bici'?'Bicicleta':v.type}</span><div class=vtitle><strong>${esc(v.alias)}</strong>${v.type!=='Bici'?`<span class="plate editable" onclick="event.stopPropagation();state.vid='${v.id}';state.page='vehicle';render();setTimeout(()=>editVehicleField('plate'),0)">${v.plate?esc(v.plate):'＋ Añadir matrícula'}</span>`:''}</div></div><div class=metrics>${ms.map((m,j)=>m[0]?`<div class=metric><span>${m[0]} ${m[1]}</span><b class="${j<2&&v.type!=='Bici'?(j===0?i[1]:sd?.[1]||'bad'):''}">${esc(m[2])}</b></div>`:'<div></div>').join('')}</div></div>`}
function openV(id){state.vid=id;state.page='vehicle';render()}
function addVehicle(){
  alert('Alta de vehículo · Paso 1 de 4\n\nPrimero crearemos la ficha. Después podrás introducir seguro e historial anterior.');
  let type=prompt('Tipo: Coche / Moto / Bicicleta / Otro','Coche');if(type===null)return;let tl=String(type).trim().toLowerCase();
  type=tl.startsWith('m')?'Moto':tl.startsWith('b')?'Bici':tl.startsWith('c')?'Coche':tl.startsWith('o')?'Otro':'';
  if(!type){alert('Tipo no válido.');return}
  let alias=prompt('Alias / nombre para identificarlo:','');if(alias===null||!String(alias).trim())return;
  let brand=prompt('Marca:','');if(brand===null)return;
  let model=prompt('Modelo:','');if(model===null)return;
  let purchase=promptDate('Fecha de compra','');if(purchase===null||purchase===undefined)return;
  let price=promptNumber('Precio de compra (€)','');if(price===null||price===undefined)return;
  let plate='',firstRegistration='';
  if(type!=='Bici'){
    plate=prompt('Matrícula:','');if(plate===null)return;
    firstRegistration=promptDate('Primera matriculación',purchase||'');if(firstRegistration===null||firstRegistration===undefined)return;
  }
  let vin=prompt(type==='Bici'?'Número de bastidor:':'VIN / bastidor:','');if(vin===null)return;
  let km=promptNumber('Kilómetros actuales','');if(km===null||km===undefined)return;
  let sold=confirm('¿El vehículo está vendido / es histórico?\n\nAceptar = vendido/histórico\nCancelar = activo');
  let id=uid('veh');
  db.vehicles.push({id,alias:String(alias).trim(),brand:String(brand).trim(),model:String(model).trim(),type,status:sold?'Histórico':'Activo',plate:String(plate).trim(),vin:String(vin).trim(),purchase,firstRegistration,purchasePrice:price,km:km===''?'':km,mileageUpdated:km!==''?todayES():'',insurance:null,mileageHistory:[]});
  if(!save())return;state.vid=id;state.page='vehicle';render();
  if(type!=='Bici'&&confirm('Paso 2 de 4 · Seguro\n\n¿Quieres introducir ahora el seguro actual o seguros anteriores?'))insuranceWizard();
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
function deleteRecord(collection,id){if(!confirm('¿Eliminar este registro?'))return;db[collection]=(db[collection]||[]).filter(x=>x.id!==id);save();render()}
function updateMileage(){let v=V(),n=prompt('Kilometraje actual:',v.km||'');if(n===null||String(n).trim()==='')return;n=Number(String(n).replace(/\./g,'').replace(',','.'));if(!Number.isFinite(n)||n<0){alert('Introduce un kilometraje válido.');return}let d=prompt('Fecha de lectura:',todayES());if(!d)return;v.mileageHistory=v.mileageHistory||[];if(v.km)v.mileageHistory.push({km:v.km,date:v.mileageUpdated||''});v.km=n;v.mileageUpdated=d;save();render()}
function editVehicleField(field){let v=V(),label='',old='',val=null;if(field==='km'){updateMileage();return}if(field==='plate'){if(v.type==='Bici')return;label='Matrícula';old=v.plate||''}else if(field==='firstRegistration'){label='Fecha de primera matriculación (dd/mm/aaaa)';old=v.firstRegistration||''}else return;val=prompt(label+':',old);if(val===null)return;v[field]=String(val).trim();save();render()}
function editVehicle(){
  let v=V();if(!v)return;
  let alias=prompt('Alias:',v.alias||'');if(alias===null)return;
  let brand=prompt('Marca:',v.brand||'');if(brand===null)return;
  let model=prompt('Modelo:',v.model||'');if(model===null)return;
  let purchase=promptDate('Fecha de compra',v.purchase||'');if(purchase===null||purchase===undefined)return;
  let price=promptNumber('Precio de compra (€)',v.purchasePrice??'');if(price===null||price===undefined)return;
  let plate=v.plate||'',first=v.firstRegistration||'';
  if(v.type!=='Bici'){plate=prompt('Matrícula:',plate);if(plate===null)return;first=promptDate('Primera matriculación',first);if(first===null||first===undefined)return}
  let vin=prompt('Bastidor / VIN:',v.vin||'');if(vin===null)return;
  let historical=confirm('Estado del vehículo:\n\nAceptar = vendido/histórico\nCancelar = activo');
  Object.assign(v,{alias:alias.trim(),brand:brand.trim(),model:model.trim(),purchase,purchasePrice:price,plate:String(plate).trim(),firstRegistration:first,vin:vin.trim(),status:historical?'Histórico':'Activo'});
  save();render()
}
function editPending(vehicleId,field){state.vid=vehicleId;if(field==='insurance'){state.page='insurance';render();return}if(field==='tires'){state.page='tires';render();return}state.page='vehicle';render();setTimeout(()=>editVehicleField(field),0)}
function vehicle(){let v=V(),i=stat(itvDue(v)),sd=v.insurance?stat(pd(v.insurance.renewal)):null,t=latest(db.tires,v.id),tk=t&&v.km&&t.km?Math.max(0,+v.km-+t.km):null;let mods=v.type==='Bici'?[['workshop','🔧','Taller'],['tires','◉','Neumáticos'],['other','▤','Otros']]:[['workshop','🔧','Taller'],['tires','◉','Neumáticos'],['insurance','⬟','Seguro'],['itv','▣','ITV'],['taxes','€','Impuestos'],['other','▥','Gastos']];app().innerHTML=`<div class=top><button class=back onclick="go('garage')">‹ Mi Garaje</button></div><main><div class=hero><div class=heroimg>${v.photo?`<img src="${v.photo}">`:v.type==='Bici'?'🚲':v.type==='Moto'?'🏍️':'🚙'}<div class=herotxt><h1>${esc(v.alias)}</h1>${v.plate?`<span class=plate>${esc(v.plate)}</span>`:''}</div><button class=photobtn onclick=pickPhoto()>＋ Foto</button><input id=photo type=file accept="image/*" hidden onchange=setPhoto(this.files[0])></div><div class=dashboard>${v.type!=='Bici'?`<div class="dash ringdash" onclick="${'${!v.firstRegistration?"editVehicleField(\'firstRegistration\')":"openM(\'itv\')"}'}"><div class="progressring cyan"><span>ITV</span></div><b>${i[0]}</b><small>${itvDue(v)?'Vence '+fd(itvDue(v)):'Completar matrícula'}</small></div><div class="dash ringdash" onclick="openM('insurance')"><div class="progressring mint"><span>Seguro</span></div><b>${sd?sd[0]:'Pendiente'}</b><small>${v.insurance?.renewal||'Completar datos'}</small></div>`:''}<div class="dash blue" onclick="openM('tires')">◉ Neumáticos<b>${tk!=null?tk.toLocaleString('es-ES')+' km':'—'}</b><small>${t?'Montados: '+t.date:'Sin datos'}</small></div><div class="dash mileage" onclick=updateMileage()>◴ Kilometraje<b>${v.km?Number(v.km).toLocaleString('es-ES')+' km':'—'}</b><small>${v.mileageUpdated?'Actualizado '+esc(v.mileageUpdated):'Fecha no registrada'} · <u>Actualizar</u></small></div></div><div class=modules>${mods.map(m=>`<div class=mod onclick="openM('${m[0]}')"><div class=ico>${m[1]}</div>${m[2]}</div>`).join('')}</div></div><div class=section>Información del vehículo</div><div class="card infocard">${(v.type==='Bici'?[['Marca',v.brand],['Modelo',v.model],['Fecha de compra',v.purchase||'—'],['Precio de compra',v.purchasePrice!==''&&v.purchasePrice!=null?money(v.purchasePrice):'—'],['Bastidor',v.vin||'—']]:[['Marca',v.brand],['Modelo',v.model],['Matrícula',v.plate||'—'],['Fecha de compra',v.purchase||'—'],['Precio de compra',v.purchasePrice!==''&&v.purchasePrice!=null?money(v.purchasePrice):'—'],['Primera matriculación',v.firstRegistration||'—'],['Bastidor',v.vin||'—']]).map(r=>`<div class=row><span class=muted>${r[0]}</span><b>${esc(r[1])}</b></div>`).join('')}</div><button class="add secondary" onclick=editVehicle()>Editar ficha completa</button></main>${bottom()}`}
function pickPhoto(){document.getElementById('photo').click()}function setPhoto(f){if(!f)return;let r=new FileReader();r.onload=()=>{let img=new Image();img.onload=()=>{let max=1200,w=img.width,h=img.height,scale=Math.min(1,max/Math.max(w,h)),c=document.createElement('canvas');c.width=Math.round(w*scale);c.height=Math.round(h*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);let previous=V().photo;V().photo=c.toDataURL('image/jpeg',.82);if(!save()){V().photo=previous;return}render()};img.onerror=()=>alert('No se ha podido leer esa foto.');img.src=r.result};r.readAsDataURL(f)}
function openM(m){state.module=m;state.page=m;render()}function moduleHead(title){return `<div class=top><button class=back onclick="state.page='vehicle';render()">‹ ${esc(V().alias)}</button><div class=head><h1>${title}</h1><button class=add onclick=addRecord()>＋ Añadir</button></div></div>`}
function recurringMaintenanceRecords(vehicleId){
  const plans={glc:{amount:70,day:17,label:'Cuota fija mantenimiento Mercedes'},smart:{amount:38.01,day:17,label:'Cuota fija mantenimiento Smart'}};
  const plan=plans[vehicleId];if(!plan)return [];
  const now=new Date(),year=now.getFullYear();let months=0;
  for(let month=0;month<12;month++){if(new Date(year,month,plan.day)<=now)months++;else break}
  if(!months)return [];
  return [{id:`recmaint_${vehicleId}_${year}`,vehicle:vehicleId,date:`Año ${year}`,km:'',place:'Plan de mantenimiento',description:`${plan.label} · acumulado a ${todayES()}`,cost:Math.round(plan.amount*months*100)/100,kind:'Plan mantenimiento',recurring:true}]
}
function workshop(){let rows=[...db.workshop.filter(x=>x.vehicle===state.vid),...recurringMaintenanceRecords(state.vid)].sort((a,b)=>(pd(b.date)||0)-(pd(a.date)||0));app().innerHTML=moduleHead('🔧 Taller')+`<main><input class=search placeholder="Buscar frenos, batería, aceite..." oninput="filterEvents(this.value)"><div id=events class=timeline>${rows.map(eventHtml).join('')||'<div class=card>Sin intervenciones.</div>'}</div></main>${bottom()}`}
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
  let use=x=>x&&x.km!==''&&v.km!==''?Math.max(0,+v.km-+x.km):null;
  app().innerHTML=moduleHead('◉ Neumáticos')+`<main><div class=card><h3>Kilómetros por neumático</h3><div class=row><span>Delantero${v.type==='Coche'||v.type==='Otro'?'s':''}</span><b>${use(f)!=null?use(f).toLocaleString('es-ES')+' km':'—'}</b></div><div class=row><span>Trasero${v.type==='Coche'||v.type==='Otro'?'s':''}</span><b>${use(r)!=null?use(r).toLocaleString('es-ES')+' km':'—'}</b></div></div>${rows.map(x=>`<div class=card><span class=cost>${money(x.cost)}</span><h3>${esc(x.description)}</h3><div class=row><span class=muted>Fecha</span><b>${esc(x.date)}</b></div><div class=row><span class=muted>Km al montar</span><b>${x.km!==''?Number(x.km).toLocaleString('es-ES')+' km':'—'}</b></div><div class=row><span class=muted>Taller</span><b>${esc(x.place||'—')}</b></div><div class=row><span class=muted>Posición</span><b>${esc(x.position||'—')}</b></div><div class=recordactions><button onclick="editTire('${x.id}')">Editar</button><button class=dangerbtn onclick="deleteRecord('tires','${x.id}')">Eliminar</button></div></div>`).join('')||'<div class=card>Sin neumáticos registrados.</div>'}</main>${bottom()}`
}
function insurance(){
  let policies=(db.insurancePolicies||[]).filter(x=>x.vehicle===state.vid).sort((a,b)=>(b.active?1:0)-(a.active?1:0)||dateValue(b.start)-dateValue(a.start));if(!policies.length&&V().insurance?.company){let q=V().insurance;policies=[{id:'legacy_policy_'+V().id,vehicle:V().id,company:q.company||'',policy:q.policy||'',holder:q.holder||'',additional:q.additional||'',coverage:q.coverage||'',start:q.start||'',renewal:q.renewal||'',end:'',bank:q.bank||'',active:true,legacy:true}]}
  let pays=(db.insuranceHistory||[]).filter(x=>x.vehicle===state.vid).sort((a,b)=>dateValue(b.date)-dateValue(a.date));
  let years={};pays.forEach(x=>{let y=(x.date||'').slice(-4);if(!/^\d{4}$/.test(y))y='Sin año';(years[y]=years[y]||[]).push(x)});
  app().innerHTML=moduleHead('⬟ Seguro','Añadir póliza')+`<main>
  <div class=section>Pólizas</div>
  ${policies.map(p=>`<div class=card><h3>${esc(p.company||'Compañía')} ${p.active?'<span class=ok>ACTUAL</span>':''}</h3>${[['Póliza',p.policy],['Tomador',p.holder],['Conductor adicional',p.additional],['Cobertura',p.coverage],['Inicio',p.start],['Renovación',p.renewal],['Fin',p.end],['Banco',p.bank]].map(r=>`<div class=row><span class=muted>${r[0]}</span><b>${esc(r[1]||'—')}</b></div>`).join('')}<div class=recordactions><button onclick="editPolicy('${p.id}')">Editar</button><button class=dangerbtn onclick="deleteRecord('insurancePolicies','${p.id}')">Eliminar</button></div></div>`).join('')||'<div class=card>Sin pólizas registradas.</div>'}
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
  let active=confirm('¿Es la póliza actual/vigente?');
  let rec={id:x?.id||(legacy?'legacy_policy_'+state.vid:uid('pol')),vehicle:state.vid,company:company.trim(),policy:policy.trim(),holder:holder.trim(),additional:additional.trim(),coverage:coverage.trim(),start:startDate,renewal,end:endDate,bank:bank.trim(),active};
  db.insurancePolicies=db.insurancePolicies||[];
  if(active)db.insurancePolicies.filter(q=>q.vehicle===state.vid).forEach(q=>q.active=false);
  if(x)Object.assign(x,rec);else db.insurancePolicies.push(rec);
  if(active){V().insurance=V().insurance||{};Object.assign(V().insurance,{company:rec.company,policy:rec.policy,holder:rec.holder,additional:rec.additional,coverage:rec.coverage,start:rec.start,renewal:rec.renewal,bank:rec.bank});}
  save();render()
}
function addInsurancePayment(){editInsurancePayment(null)}
function editInsurancePayment(id){
  let x=id?(db.insuranceHistory||[]).find(r=>r.id===id):null;
  let date=promptDate('Fecha de la cuota/pago',x?.date||todayES());if(date===null||date===undefined||!date)return;
  let cost=promptNumber('Importe de la cuota (€)',x?.cost??'');if(cost===null||cost===undefined||cost==='')return;
  let rec={id:x?.id||uid('ins'),vehicle:state.vid,date,cost};
  db.insuranceHistory=db.insuranceHistory||[];if(x)Object.assign(x,rec);else db.insuranceHistory.push(rec);save();render()
}

function itv(){let v=V(),d=itvDue(v),st=stat(d),rows=(db.itv||[]).filter(x=>x.vehicle===state.vid).sort((a,b)=>(pd(b.date)||0)-(pd(a.date)||0));app().innerHTML=moduleHead('▣ ITV')+`<main><div class=card><div class=muted>Próximo vencimiento</div><div style="font-size:34px;font-weight:850;margin:5px 0">${esc(st[0])}</div><b>${d?fd(d):'Falta primera matriculación o ITV registrada'}</b></div><div class=section>Historial ITV</div>${rows.map(x=>`<div class=card><span class=cost>${x.cost!==''&&x.cost!=null?money(x.cost):''}</span><h3>${esc(x.date||'Sin fecha')}</h3><div class=row><span class=muted>Resultado</span><b>${esc(x.result||'—')}</b></div><div class=row><span class=muted>Centro ITV</span><b>${esc(x.center||'—')}</b></div><div class=row><span class=muted>Próximo vencimiento</span><b>${esc(x.nextDate||'—')}</b></div><div class=row><span class=muted>Kilometraje</span><b>${x.km?Number(x.km).toLocaleString('es-ES')+' km':'—'}</b></div><div class=recordactions><button onclick="editItv('${x.id}')">Editar</button><button class=dangerbtn onclick="deleteRecord('itv','${x.id}')">Eliminar</button></div></div>`).join('')||'<div class=card>Sin ITV registradas.</div>'}</main>${bottom()}`}
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
function taxes(){let rows=(db.taxes||[]).filter(x=>x.vehicle===state.vid).sort((a,b)=>(pd(b.date)||0)-(pd(a.date)||0));app().innerHTML=moduleHead('€ Impuestos')+`<main>${rows.map(x=>`<div class=card><span class=cost>${x.cost!==''&&x.cost!=null?Number(x.cost).toLocaleString('es-ES',{minimumFractionDigits:2})+' €':''}</span><h3>${esc(x.date||'Sin fecha')}</h3><div class=recordactions><button onclick="editTax('${x.id}')">Editar</button><button class=dangerbtn onclick="deleteRecord('taxes','${x.id}')">Eliminar</button></div></div>`).join('')||'<div class=card>Sin impuestos registrados.</div>'}</main>${bottom()}`}
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
function other(){let rows=(db.other||[]).filter(x=>x.vehicle===state.vid).sort((a,b)=>(pd(b.date)||0)-(pd(a.date)||0));app().innerHTML=moduleHead('▥ Gastos')+`<main><div class=section>Accesorios y otros</div>${rows.map(x=>`<div class=card><span class=tag>${esc(x.kind||'Gasto')}</span>${x.cost!==''?`<span class=cost>${money(x.cost)}</span>`:''}<h3>${esc(x.description)}</h3><div class=row><span class=muted>Fecha</span><b>${esc(x.date)}</b></div><div class=row><span class=muted>Proveedor</span><b>${esc(x.place||'—')}</b></div>${x.km!==''?`<div class=row><span class=muted>Kilometraje</span><b>${Number(x.km).toLocaleString('es-ES')} km</b></div>`:''}${x.notes?`<p class=muted>${esc(x.notes)}</p>`:''}<div class=recordactions><button onclick="editOther('${x.id}')">Editar</button><button class=dangerbtn onclick="deleteRecord('other','${x.id}')">Eliminar</button></div></div>`).join('')||'<div class=card>Sin gastos adicionales registrados.</div>'}</main>${bottom()}`}
function addRecord(){if(state.page==='insurance')return editPolicy(null);if(state.page==='itv')return editItv(null);if(state.page==='taxes')return editTax(null);if(state.page==='workshop')return editWorkshop(null);if(state.page==='tires')return editTire(null);if(state.page==='other')return editOther(null);}
function agenda(){let a=[];db.vehicles.filter(v=>v.status==='Activo'&&v.type!=='Bici').forEach(v=>{let d=itvDue(v);if(d)a.push([d,v,'ITV']);let s=pd(v.insurance?.renewal);if(s)a.push([s,v,'Seguro'])});a.sort((x,y)=>x[0]-y[0]);app().innerHTML=`<div class=top><div class=brand>Agenda</div><div class=sub>Próximos vencimientos</div></div><main>${a.map(x=>`<div class=card onclick="openV('${x[1].id}')"><b>${esc(x[1].alias)} · ${x[2]}</b><span class=cost>${dy(x[0])} días</span><div class=muted>${fd(x[0])}</div></div>`).join('')}</main>${bottom()}`}
function spend(){let sums={};db.workshop.forEach(x=>sums[x.vehicle]=(sums[x.vehicle]||0)+Number(x.cost||0));['glc','smart'].forEach(id=>recurringMaintenanceRecords(id).forEach(x=>sums[id]=(sums[id]||0)+Number(x.cost||0)));db.tires.forEach(x=>sums[x.vehicle]=(sums[x.vehicle]||0)+Number(x.cost||0));(db.taxes||[]).forEach(x=>sums[x.vehicle]=(sums[x.vehicle]||0)+Number(x.cost||0));(db.other||[]).forEach(x=>sums[x.vehicle]=(sums[x.vehicle]||0)+Number(x.cost||0));app().innerHTML=`<div class=top><div class=brand>Gastos</div><div class=sub>Taller, neumáticos, impuestos y otros gastos</div></div><main>${Object.entries(sums).sort((a,b)=>b[1]-a[1]).map(([id,n])=>{let v=db.vehicles.find(x=>x.id===id);return `<div class=card><b>${esc(v?.alias||id)}</b><span class=cost>${n.toLocaleString('es-ES',{minimumFractionDigits:2})} €</span></div>`}).join('')}</main>${bottom()}`}
function pending(){
  let items=[];
  db.vehicles.filter(v=>v.status==='Activo').forEach(v=>{
    if(!v.km)items.push([v.id,v.alias,'Kilometraje','Falta indicar el kilometraje actual','km']);
    if(v.type!=='Bici'){
      if(!v.firstRegistration)items.push([v.id,v.alias,'Primera matriculación','Necesaria para calcular correctamente la ITV','firstRegistration']);
      if(!v.plate)items.push([v.id,v.alias,'Matrícula','Dato pendiente','plate']);
      if(!v.insurance?.renewal)items.push([v.id,v.alias,'Seguro','Falta próxima renovación','insurance']);
      if(!latest(db.tires,v.id))items.push([v.id,v.alias,'Neumáticos','Sin datos de neumáticos','tires']);
    }
  });
  app().innerHTML=`<div class=top><button class=back onclick="go('more')">‹ Más</button><div class=brand>Datos pendientes</div><div class=sub>Toca un dato para completarlo</div></div><main>${items.map(x=>`<div class="card pendingcard" onclick="editPending('${x[0]}','${x[4]}')"><b>${esc(x[1])} · ${esc(x[2])}</b><div class=muted>${esc(x[3])}</div><span class=rowchev>›</span></div>`).join('')||'<div class=card>No hay datos pendientes.</div>'}</main>${bottom()}`
}
function more(){app().innerHTML=`<div class=top><div class=brand>Más</div></div><main><div class="card menucard" onclick="go('pending')"><div class=menuicon>!</div><div><b>Datos pendientes</b><p class=muted>Completar información que falta de los vehículos</p></div><span class=chev>›</span></div><div class=card><b>Copias y datos</b><p class=muted>La copia incluye también las fotos. Al importar, Mi Garaje fusiona la información y conserva los datos que ya tengas.</p><button class=add onclick="document.getElementById('importFile').click()">Importar y fusionar copia</button><input id=importFile type=file accept=".json,application/json" hidden onchange="importBackup(this.files[0]);this.value=''"><button class="add secondary" onclick=backup()>Exportar copia completa</button></div></main>${bottom()}`}
function normalizeData(data){
  if(!data||typeof data!=='object')data={};
  for(const k of ['vehicles','workshop','tires','itv','taxes','other','insuranceHistory','insurancePolicies'])if(!Array.isArray(data[k]))data[k]=[];
  // Migrate legacy single-policy records without losing them. Use a stable id so repeated imports do not duplicate policies.
  data.vehicles.forEach(v=>{if(v.type!=='Bici'&&v.insurance&&v.insurance.company&&!data.insurancePolicies.some(p=>p.vehicle===v.id)){data.insurancePolicies.push({id:'legacy_policy_'+v.id,vehicle:v.id,company:v.insurance.company||'',policy:v.insurance.policy||'',holder:v.insurance.holder||'',additional:v.insurance.additional||'',coverage:v.insurance.coverage||'',start:v.insurance.start||'',end:'',bank:v.insurance.bank||'',active:true})}});
  data.vehicles.forEach(v=>v.mileageHistory=Array.isArray(v.mileageHistory)?v.mileageHistory:[]);
  data.schemaVersion=Math.max(Number(data.schemaVersion)||0,8);
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
  return {schemaVersion:Math.max(Number(incoming.schemaVersion)||0,Number(local.schemaVersion)||0,8),
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
function downloadBackup(name){let a=document.createElement('a'),b=new Blob([JSON.stringify(db,null,2)],{type:'application/json'}),d=new Date(),stamp=d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0')+'_'+String(d.getHours()).padStart(2,'0')+String(d.getMinutes()).padStart(2,'0');a.href=URL.createObjectURL(b);a.download=`Mi_Garaje_${name}_${stamp}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function importBackup(file){if(!file)return;let r=new FileReader();r.onload=()=>{try{let data=JSON.parse(r.result);if(!data||!Array.isArray(data.vehicles))throw 0;if(!confirm('Se hará primero una copia de seguridad de los datos actuales y después se fusionará el archivo. No se borrarán las fotos ni los datos que ya tengas. ¿Continuar?'))return;downloadBackup('antes_de_importar');let previous=db;db=mergeData(data,db);if(!save()){db=previous;return}alert('Datos fusionados correctamente. Se han conservado los datos y fotos existentes.');state.page='garage';state.filter='Moto';render()}catch(e){console.error(e);alert('No se ha podido importar la copia. El archivo JSON es legible, pero se ha producido un error al fusionar sus datos. Detalle: '+(e?.message||e||'desconocido'))}};r.readAsText(file)}
function backup(){downloadBackup('copia_completa')}
function render(){({garage,vehicle,workshop,tires,insurance,itv,taxes,docs,other,agenda,spend,more,pending}[state.page]||garage)()}render();
