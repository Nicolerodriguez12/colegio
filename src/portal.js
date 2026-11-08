import logoInstitucional from './logo_jose.png';
// Sistema del Colegio José Francisco Caldas.
// Solo se incluyen la URL de Supabase y una clave PUBLICABLE.
// Nunca introducir aquí una clave secreta ni una contraseña administrativa.
const URL='https://zdnodaxxxueijgzlzsbc.supabase.co';
const API_KEY='sb_publishable_nPTzcjGpY7AOEqLdxWtX_g_nAoPEq6o';
const ROOT=document.getElementById('root');
const LS='colegio-caldas-auth-v1';
let auth=null, perfil=null, students=[],subjects=[],periods=[],grades=[], section='resumen', feedback='', isError=false, selectedStudent='', editingGrade=null, selectedPeriod='';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>v==null||!Number.isFinite(Number(v))?'—':Number(v).toFixed(2).replace('.',',');
const int=v=>Number(v);
const opt=(val,label,selected)=>`<option value="${esc(val)}" ${String(val)===String(selected)?'selected':''}>${esc(label)}</option>`;
const gr=(id)=>grades.find(g=>String(g.id)===String(id));
const student=id=>students.find(s=>String(s.id)===String(id));
const subject=id=>subjects.find(s=>String(s.id)===String(id));
const period=id=>periods.find(s=>String(s.id)===String(id));
const average=list=>list.length?(list.reduce((a,b)=>a+Number(b),0)/list.length):null;
function message(msg,error=false){feedback=msg;isError=error;render();}
function apiError(body,status){return new Error(body?.msg||body?.message||body?.error_description||body?.error||`Error de Supabase (${status})`);}
async function call(path,{method='GET',body=null,query='',authRequired=true}={}){
 let headers={'apikey':API_KEY,'Content-Type':'application/json'};
 if(auth?.access_token)headers.Authorization=`Bearer ${auth.access_token}`;
 const url=`${URL}${path}${query?'?'+query:''}`;
 const r=await fetch(url,{method,headers:{...headers,...(path.startsWith('/rest/')?{'Prefer':'return=representation'}:{})},body:body===null?undefined:JSON.stringify(body)});
 let json=null;try{json=await r.json();}catch{}
 if(!r.ok)throw apiError(json,r.status);
 return json;
}
async function signIn(email,password){
 const a=await call('/auth/v1/token',{method:'POST',query:'grant_type=password',body:{email,password},authRequired:false});
 if(!a.access_token)throw new Error('No se recibió sesión válida.');
 auth=a; sessionStorage.setItem(LS,JSON.stringify(a));
 try{await loadProfile();}catch(e){auth=null;sessionStorage.removeItem(LS);throw e;}
 await loadData();
}
async function loadProfile(){
 const users=await call('/rest/v1/perfiles',{query:`select=id,nombre,rol,activo&id=eq.${encodeURIComponent(auth.user.id)}&limit=1`});
 if(!users?.length||users[0].activo!==true)throw new Error('Esta cuenta no tiene un perfil activo. Revisa el rol en public.perfiles.');
 perfil=users[0];
 if(perfil.rol!=='administrador')throw new Error('Esta versión está configurada únicamente para el administrador principal.');
}
async function resume(){
 try{let stored=JSON.parse(sessionStorage.getItem(LS)||'null');if(!stored?.refresh_token)return render();
 auth=stored;
 const next=await call('/auth/v1/token',{method:'POST',query:'grant_type=refresh_token',body:{refresh_token:stored.refresh_token}});
 auth=next;sessionStorage.setItem(LS,JSON.stringify(next));await loadProfile();await loadData();
 }catch(e){auth=null;perfil=null;sessionStorage.removeItem(LS);message('La sesión terminó. Inicia sesión nuevamente.',true);}
}
async function loadData(){
 const [s,m,p,g]=await Promise.all([
 call('/rest/v1/estudiantes',{query:'select=*&order=nombre.asc'}),
 call('/rest/v1/materias',{query:'select=*&order=nombre.asc'}),
 call('/rest/v1/periodos_academicos',{query:'select=*&order=anio.desc,id.asc'}),
 call('/rest/v1/calificaciones',{query:'select=*&order=id.desc'})]);
 students=s;subjects=m;periods=p;grades=g;
 if(!students.some(s=>String(s.id)===String(selectedStudent)))selectedStudent=students[0]?.id||'';
 if(!periods.some(p=>String(p.id)===String(selectedPeriod)))selectedPeriod=periods[0]?.id||'';
 render();
}
function logo(){return '<div class="logo-shell hero-logo-shell"><img class="hero-logo" src="${logoInstitucional}" alt="Escudo Colegio José Francisco Caldas"></div>';}
function login(){return `<main class="shell auth-shell"><section class="hero-panel">${logo()}<div class="badge">Portal institucional</div><h1>Colegio José Francisco Caldas</h1><p>Sistema de gestión de calificaciones académicas. Tres notas por período con ponderación de 30 %, 30 % y 40 %.</p></section><section class="card auth-card"><div class="auth-card-header"><h2>Iniciar sesión</h2><p>Ingresa con la cuenta del administrador registrada en Supabase.</p></div><form id="login-form" class="stack auth-form"><label>Correo electrónico<input type="email" name="email" autocomplete="username" required></label><label>Contraseña<input type="password" name="password" autocomplete="current-password" required></label><button class="primary">Ingresar</button></form>${alert()}</section></main>`;}
function alert(){return feedback?`<div class="feedback ${isError?'danger':''}" role="status">${esc(feedback)}</div>`:'';}
function top(){return `<header class="topbar card"><div class="brand-block"><div class="logo-shell topbar-logo-shell"><img class="topbar-logo" src="${logoInstitucional}" alt="Escudo del colegio"></div><div><div class="badge">Colegio José Francisco Caldas</div><h2>${esc(perfil.nombre)}</h2><p>Administrador · Base de datos Supabase</p></div></div><button class="ghost" data-action="logout">Cerrar sesión</button></header>`;}
function tabs(){const nav=[['resumen','Inicio'],['estudiantes','Estudiantes'],['materias','Materias'],['periodos','Períodos'],['notas','Calificaciones']];return `<nav class="card staff-window-bar">${nav.map(([id,t])=>`<button class="window-tab ${section===id?'active':''}" data-action="nav" data-id="${id}">${t}</button>`).join('')}</nav>`;}
function stats(){return `<section class="stats-grid"><article class="card stat"><span>Estudiantes registrados</span><strong>${students.length}</strong></article><article class="card stat"><span>Asignaturas</span><strong>${subjects.length}</strong></article><article class="card stat"><span>Períodos académicos</span><strong>${periods.length}</strong></article><article class="card stat"><span>Registros de notas</span><strong>${grades.length}</strong></article></section>`;}
function overview(){return `${stats()}<section class="card section-pad"><h3>Bienvenido al sistema</h3><p>Empieza agregando estudiantes y materias. Después crea un período académico y registra las tres notas por materia y período.</p><div class="grades-list"><div class="grade-entry"><strong>Regla de calificación</strong><div class="grades-numbers"><div><span>Nota 1</span><strong>30 %</strong></div><div><span>Nota 2</span><strong>30 %</strong></div><div><span>Nota 3</span><strong>40 %</strong></div></div><p class="small">Ejemplo: 4,50 · 3,80 · 4,20 = 4,17</p></div><div class="grade-entry"><strong>Seguridad</strong><p class="small">El acceso requiere autenticación de Supabase y un perfil activo de administrador. Las reglas de acceso y el bloqueo de períodos cerrados se validan en la base de datos.</p></div></div></section>`;}
function studentPane(){return `<section class="admin-grid"><section class="card section-pad"><h3>Estudiantes registrados</h3><div class="student-list">${students.length?students.map(s=>`<div class="student-item"><strong>${esc(s.nombre)}</strong><span>Documento: ${esc(s.documento)} · Grado: ${esc(s.grado)} · ${s.activo?'Activo':'Inactivo'}</span></div>`).join(''):'<p class="empty">Todavía no hay estudiantes registrados.</p>'}</div></section><section class="card section-pad"><h3>Agregar estudiante</h3><form id="student-form" class="compact-form"><label>Nombre completo<input name="nombre" required maxlength="160"></label><label>Documento de identidad<input name="documento" required maxlength="40"></label><label>Grado y grupo<input name="grado" placeholder="Ej. 8° B" required maxlength="60"></label><button class="primary">Guardar estudiante</button></form></section></section>`;}
function subjectPane(){return `<section class="admin-grid"><section class="card section-pad"><h3>Materias</h3><div class="subject-list">${subjects.length?subjects.map(m=>`<span>${esc(m.nombre)}</span>`).join(''):'<p class="empty">Aún no hay asignaturas.</p>'}</div></section><section class="card section-pad"><h3>Agregar materia</h3><form id="subject-form" class="compact-form"><label>Nombre<input name="nombre" required maxlength="100"></label><label>Descripción (opcional)<input name="descripcion" maxlength="300"></label><button class="primary">Guardar materia</button></form></section></section>`;}
function periodPane(){return `<section class="admin-grid"><section class="card section-pad"><h3>Períodos académicos</h3><div class="grades-list">${periods.length?periods.map(p=>`<div class="grade-entry"><div class="grade-top"><div><strong>${esc(p.nombre)} · ${p.anio}</strong><div class="small">${p.fecha_inicio||'Sin fecha inicial'} — ${p.fecha_fin||'Sin fecha final'}</div></div><span class="pill ${p.cerrado?'closed':''}">${p.cerrado?'Cerrado':'Abierto'}</span></div><div class="action-buttons"><button type="button" class="outline" data-action="toggle-period" data-id="${p.id}">${p.cerrado?'Reabrir':'Cerrar'} período</button></div></div>`).join(''):'<p class="empty">Aún no hay períodos.</p>'}</div></section><section class="card section-pad"><h3>Crear período</h3><form id="period-form" class="compact-form"><label>Nombre del período<input name="nombre" placeholder="Ej. Período 1" required maxlength="100"></label><label>Año<input type="number" name="anio" value="${new Date().getFullYear()}" min="2000" max="2200" required></label><label>Fecha inicial (opcional)<input type="date" name="fecha_inicio"></label><label>Fecha final (opcional)<input type="date" name="fecha_fin"></label><button class="primary">Crear período</button></form></section></section>`;}
function notePane(){const e=editingGrade?gr(editingGrade):null;const sid=e?.estudiante_id??selectedStudent;const pid=e?.periodo_id??selectedPeriod;
return `<section class="admin-grid"><section class="card section-pad"><h3>${e?'Modificar calificación':'Registrar calificación'}</h3><p class="small">Cada estudiante tiene tres notas por asignatura y período: 30 %, 30 % y 40 %.</p>${students.length&&subjects.length&&periods.length?`<form id="grade-form" class="compact-form"><label>Estudiante<select name="estudiante_id" required ${e?'disabled':''}>${students.map(s=>opt(s.id,`${s.nombre} · ${s.grado}`,sid)).join('')}</select></label><label>Materia<select name="materia_id" required ${e?'disabled':''}>${subjects.map(m=>opt(m.id,m.nombre,e?.materia_id??subjects[0].id)).join('')}</select></label><label>Período<select name="periodo_id" required ${e?'disabled':''}>${periods.map(p=>opt(p.id,`${p.nombre} · ${p.anio}${p.cerrado?' (cerrado)':''}`,pid)).join('')}</select></label><div class="score-grid">${[1,2,3].map((n)=>`<label>Nota ${n} (${n===3?40:30} %)<input type="number" min="0" max="5" step="0.01" name="nota${n}" value="${e?.['nota'+n]??''}" required></label>`).join('')}</div><button class="primary full" ${e&&period(e.periodo_id)?.cerrado?'disabled':''}>${e?'Actualizar notas':'Guardar notas'}</button>${e?'<button type="button" class="outline full" data-action="cancel-edit">Cancelar edición</button>':''}</form>`:'<p class="empty">Primero registra al menos un estudiante, una materia y un período.</p>'}</section><section class="card section-pad"><h3>Consulta de calificaciones</h3><div class="two-col"><label>Estudiante<select id="filter-student"><option value="">Todos</option>${students.map(s=>opt(s.id,s.nombre,selectedStudent)).join('')}</select></label><label>Período<select id="filter-period"><option value="">Todos</option>${periods.map(p=>opt(p.id,`${p.nombre} · ${p.anio}`,selectedPeriod)).join('')}</select></label></div><div class="grades-list" style="margin-top:16px">${grades.filter(g=>(!selectedStudent||String(g.estudiante_id)===String(selectedStudent))&&(!selectedPeriod||String(g.periodo_id)===String(selectedPeriod))).map(g=>`<div class="grade-entry"><div class="grade-top"><div><strong>${esc(student(g.estudiante_id)?.nombre||'Estudiante')}</strong><div class="small">${esc(subject(g.materia_id)?.nombre||'Materia')} · ${esc(period(g.periodo_id)?.nombre||'Período')}</div></div><span class="pill ${period(g.periodo_id)?.cerrado?'closed':''}">${period(g.periodo_id)?.cerrado?'Cerrado':'Abierto'}</span></div><div class="grades-numbers"><div><span>Nota 1 (30 %)</span><strong>${fmt(g.nota1)}</strong></div><div><span>Nota 2 (30 %)</span><strong>${fmt(g.nota2)}</strong></div><div><span>Nota 3 (40 %)</span><strong>${fmt(g.nota3)}</strong></div><div><span>Definitiva</span><strong>${fmt(g.nota_final)}</strong></div></div>${!period(g.periodo_id)?.cerrado?`<div class="action-buttons"><button type="button" class="outline" data-action="edit-grade" data-id="${g.id}">Modificar</button></div>`:''}</div>`).join('')||'<p class="empty">No hay calificaciones para esta selección.</p>'}</div></section></section>`;}
function render(){if(!perfil){ROOT.innerHTML=login();return;}const views={resumen:overview,estudiantes:studentPane,materias:subjectPane,periodos:periodPane,notas:notePane};ROOT.innerHTML=`<main class="shell dashboard-shell">${top()}${tabs()}${alert()}${(views[section]||overview)()}<footer>Gestión académica · Colegio José Francisco Caldas · Datos almacenados en Supabase</footer></main>`;}
async function perform(fn){try{await fn();}catch(e){console.error(e);message(e.message||'Error al guardar datos.',true);}}
ROOT.addEventListener('click',async e=>{const b=e.target.closest('[data-action]');if(!b)return;const action=b.dataset.action,id=b.dataset.id;
 if(action==='logout'){const old=auth;auth=null;perfil=null;sessionStorage.removeItem(LS);feedback='';render();try{await fetch(`${URL}/auth/v1/logout`,{method:'POST',headers:{apikey:API_KEY,Authorization:`Bearer ${old?.access_token}`}});}catch{}return;}
 if(action==='nav'){section=id;editingGrade=null;feedback='';render();return;}
 if(action==='cancel-edit'){editingGrade=null;render();return;}
 if(action==='edit-grade'){editingGrade=id;section='notas';render();scrollTo({top:0,behavior:'smooth'});return;}
 if(action==='toggle-period'){const p=period(id);if(!p)return;if(!confirm(`¿${p.cerrado?'Reabrir':'Cerrar'} ${p.nombre} de ${p.anio}?`))return;await perform(async()=>{await call('/rest/v1/periodos_academicos',{method:'PATCH',query:`id=eq.${p.id}`,body:{cerrado:!p.cerrado}});feedback='Estado del período actualizado.';isError=false;editingGrade=null;await loadData();});}
});
ROOT.addEventListener('change',e=>{if(e.target.id==='filter-student'){selectedStudent=e.target.value;render();}if(e.target.id==='filter-period'){selectedPeriod=e.target.value;render();}});
ROOT.addEventListener('submit',async event=>{event.preventDefault();const form=event.target;const v=Object.fromEntries(new FormData(form).entries());
 if(form.id==='login-form'){await perform(async()=>{feedback='';await signIn(v.email.trim(),v.password);});return;}
 if(!perfil||perfil.rol!=='administrador')return message('No tienes autorización.',true);
 await perform(async()=>{
  if(form.id==='student-form'){
   await call('/rest/v1/estudiantes',{method:'POST',body:{nombre:v.nombre.trim(),documento:v.documento.trim(),grado:v.grado.trim()}});
   feedback='Estudiante guardado en Supabase.';
  }else if(form.id==='subject-form'){
   await call('/rest/v1/materias',{method:'POST',body:{nombre:v.nombre.trim(),descripcion:v.descripcion.trim()||null}});
   feedback='Materia guardada en Supabase.';
  }else if(form.id==='period-form'){
   if(v.fecha_inicio&&v.fecha_fin&&v.fecha_fin<v.fecha_inicio)throw new Error('La fecha final no puede ser anterior a la inicial.');
   await call('/rest/v1/periodos_academicos',{method:'POST',body:{nombre:v.nombre.trim(),anio:Number(v.anio),fecha_inicio:v.fecha_inicio||null,fecha_fin:v.fecha_fin||null}});
   feedback='Período creado en Supabase.';
  }else if(form.id==='grade-form'){
   const n=[v.nota1,v.nota2,v.nota3].map(Number);
   if(n.some(x=>!Number.isFinite(x)||x<0||x>5))throw new Error('Las tres notas deben estar entre 0 y 5.');
   if(editingGrade){const g=gr(editingGrade);if(!g||period(g.periodo_id)?.cerrado)throw new Error('Este período está cerrado.');
     await call('/rest/v1/calificaciones',{method:'PATCH',query:`id=eq.${g.id}`,body:{nota1:n[0],nota2:n[1],nota3:n[2]}});
   }else{
     if(period(v.periodo_id)?.cerrado)throw new Error('No se pueden guardar notas en períodos cerrados.');
     await call('/rest/v1/calificaciones',{method:'POST',body:{estudiante_id:Number(v.estudiante_id),materia_id:Number(v.materia_id),periodo_id:Number(v.periodo_id),nota1:n[0],nota2:n[1],nota3:n[2]}});
   }
   selectedStudent=editingGrade?gr(editingGrade)?.estudiante_id:v.estudiante_id;
   selectedPeriod=editingGrade?gr(editingGrade)?.periodo_id:v.periodo_id;
   editingGrade=null;feedback='Calificaciones guardadas. La nota final se calculó en Supabase.';
  }else{return;}
  isError=false;await loadData();
 });
});
render();resume();
