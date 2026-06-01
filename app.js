const DB_KEY='fib_case_portal_v2';
const SUPABASE_URL_KEY='fib_supabase_url';
const SUPABASE_KEY_KEY='fib_supabase_key';
const CATEGORIES={familien:{title:'Familien',icon:'♛',desc:'Kriminelle Familien, Mafia-Strukturen und organisierte Familienverbände.'},clans:{title:'Clans',icon:'◆',desc:'Clans, Gruppierungen und lose strukturierte Netzwerke.'},unternehmen:{title:'Unternehmen',icon:'▦',desc:'Scheinfirmen, legale Fassaden und wirtschaftliche Verbindungen.'},personen:{title:'Personen',icon:'◎',desc:'Einzelpersonen, Zielpersonen, Kontaktpersonen und Führungskräfte.'},sonstige:{title:'Sonstige',icon:'◇',desc:'Weitere Akten, Sonderlagen und noch nicht eindeutig zugeordnete Strukturen.'}};
const PRIORITIES=['Niedrig','Mittel','Hoch','Kritisch'];
const TYPES=['Observation','Beweis','Hinweis','Vernehmung','Lagebild','Kontakt','Sonstiges'];

let supabaseClient = null;
const supabaseUrl = localStorage.getItem(SUPABASE_URL_KEY);
const supabaseKey = localStorage.getItem(SUPABASE_KEY_KEY);
if (supabaseUrl && supabaseKey && window.supabase) {
  try {
    supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
  } catch (e) {
    console.error("Supabase-Verbindungsfehler:", e);
  }
}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
function nowDate(){return new Date().toISOString().slice(0,10)}
function handleImageSelect(file, hiddenId, previewId) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const maxDim = 800;
      let w = img.width, h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
        else { w = Math.round((w * maxDim) / h); h = maxDim; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const base64 = canvas.toDataURL('image/jpeg', 0.7);
      document.getElementById(hiddenId).value = base64;
      document.getElementById(previewId).innerHTML = `<img src="${base64}"><button type="button" class="btn-remove" onclick="clearImage('${hiddenId}','${previewId}')">Entfernen</button>`;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
function clearImage(hiddenId, previewId) {
  document.getElementById(hiddenId).value = '';
  document.getElementById(previewId).innerHTML = '<span class="muted">Kein Bild ausgewählt</span>';
}
async function load() {
  if (supabaseClient) {
    try {
      const { data: cases, error: e1 } = await supabaseClient.from('cases').select('*');
      const { data: entries, error: e2 } = await supabaseClient.from('entries').select('*');
      if (!e1 && !e2) {
        const db = { cases: cases || [], entries: entries || [] };
        localStorage.setItem(DB_KEY, JSON.stringify(db));
        return db;
      }
      console.warn("Supabase load failed, falling back to local cache:", e1, e2);
    } catch (err) {
      console.warn("Supabase connection failed, falling back to local cache:", err);
    }
  }
  let raw = localStorage.getItem(DB_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch (e) {}
  }
  const db = {
    cases: [
      {
        id: uid(),
        category: 'familien',
        name: 'La Sombra Eterna',
        priority: 'Kritisch',
        status: 'Aktiv',
        lead: 'Agent Fancy',
        location: 'Los Santos / Vinewood',
        summary: 'Hochorganisierte Familie mit Verdacht auf Waffenhandel, Erpressung und Einflussnahme auf Unternehmen.',
        structure: 'Patriarchale Führungsstruktur, mehrere bekannte Runner und Kontakte zu Scheinfirmen.',
        activities: 'Waffenhandel, Schutzgelderpressung, Geldwäsche, Einschüchterung.',
        createdAt: nowDate(),
        updatedAt: nowDate()
      },
      {
        id: uid(),
        category: 'unternehmen',
        name: 'White Logistics GmbH',
        priority: 'Mittel',
        status: 'Unter Beobachtung',
        lead: 'Agent Riviera',
        location: 'Industriegebiet',
        summary: 'Logistikunternehmen mit möglichen Verbindungen zu Warentransporten krimineller Organisationen.',
        structure: 'Geschäftsführung, Disposition, Fahrerpool.',
        activities: 'Verdacht auf Transportverschleierung und Lagerung sensibler Ware.',
        createdAt: nowDate(),
        updatedAt: nowDate()
      }
    ],
    entries: []
  };
  db.entries.push({
    id: uid(),
    caseId: db.cases[0].id,
    type: 'Observation',
    date: nowDate(),
    title: 'Erstsichtung Konvoi',
    priority: 'Hoch',
    author: 'SOK',
    content: 'Mehrere Fahrzeuge konnten im Umfeld eines bekannten Treffpunkts festgestellt werden. Kennzeichen und Personenbeschreibung wurden aufgenommen.'
  });
  await save(db);
  return db;
}
async function save(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  if (supabaseClient) {
    try {
      if (db.cases.length > 0) {
        await supabaseClient.from('cases').upsert(db.cases);
      }
      if (db.entries.length > 0) {
        await supabaseClient.from('entries').upsert(db.entries);
      }
    } catch (err) {
      console.error("Supabase upsert failed:", err);
    }
  }
}
function q(name){return new URLSearchParams(location.search).get(name)}
function esc(s){return String(s??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]))}
function pClass(p){return 'p-'+String(p||'niedrig').toLowerCase()}
function badge(p){return `<span class="tag priority ${pClass(p)}">${esc(p||'Niedrig')}</span>`}
function setActive(){document.querySelectorAll('[data-nav]').forEach(a=>{if(location.pathname.endsWith(a.getAttribute('href').split('?')[0]))a.classList.add('active')})}
function header(){
  const isOnline = !!supabaseClient;
  const syncStatusHtml = isOnline 
    ? `<div class="sync-status online" onclick="openSupabaseModal()"><span class="status-dot"></span>Online</div>`
    : `<div class="sync-status offline" onclick="openSupabaseModal()"><span class="status-dot"></span>Lokal</div>`;
  document.body.insertAdjacentHTML('afterbegin',`<div class="bg"></div><div class="grid-bg"></div><header class="topbar"><div class="topbar-inner"><a class="brand" href="index.html"><div class="seal"><span>FIB</span></div><div><strong>FIB AKTENPORTAL</strong><small>SOK • SECURE NETWORK</small></div></a><nav class="nav">${syncStatusHtml}<a data-nav href="index.html">Kategorien</a><a data-nav href="category.html?cat=familien">Familien</a><a data-nav href="category.html?cat=unternehmen">Unternehmen</a><a href="#" onclick="exportData();return false;">Export</a><a href="#" onclick="importData();return false;">Import</a></nav></div></header>`);
  setActive();
}
function footer(){document.body.insertAdjacentHTML('beforeend',`<footer class="footer">© 2026 FIB SOK • Aktenportal • Daten werden lokal im Browser gespeichert</footer>`)}
function getCases(db,cat){return db.cases.filter(c=>!cat||c.category===cat)}
function countEntries(caseId,db){return db.entries.filter(e=>e.caseId===caseId).length}
function sortByPriority(items){const rank={Kritisch:4,Hoch:3,Mittel:2,Niedrig:1};return [...items].sort((a,b)=>(rank[b.priority]||0)-(rank[a.priority]||0)||a.name.localeCompare(b.name))}
function caseCard(c,db){
  const hasImg = !!c.image;
  const imgHtml = hasImg ? `<div class="card-image" style="background-image: url('${c.image}')"></div>` : '';
  const entriesCount = db ? countEntries(c.id,db) : 0;
  return `<a class="card corner category-card ${hasImg ? 'has-image' : ''}" href="akte.html?id=${c.id}">
    ${imgHtml}
    <div class="${hasImg ? 'card-content' : ''}">
      <div class="classified">${esc(CATEGORIES[c.category]?.title||c.category)}</div>
      <h3 style="font-size:22px;margin-top:16px">${esc(c.name)}</h3>
      <p class="sub" style="margin:10px 0 0; font-size:14px">${esc(c.summary||'Keine Zusammenfassung hinterlegt.')}</p>
    </div>
    <div class="meta">${badge(c.priority)}<span class="tag">Status: ${esc(c.status||'-')}</span><span class="tag">Einträge: ${entriesCount}</span></div>
  </a>`;
}
async function renderIndex(){header();const db=await load();const root=document.querySelector('#app');const stats={cases:db.cases.length,entries:db.entries.length,kritisch:db.cases.filter(c=>c.priority==='Kritisch').length};root.innerHTML=`<section class="hero"><div><span class="kicker">Classified Case Management</span><h1>AKTENPORTAL</h1><p class="sub">Kategorien auswählen, Akten anlegen, Prioritäten vergeben und direkt zu jeder Akte einzelne Ermittlungs- und Beweiseinträge dokumentieren.</p></div></section><div class="stats"><div class="panel stat"><strong>${stats.cases}</strong><span>Akten</span></div><div class="panel stat"><strong>${stats.entries}</strong><span>Einträge</span></div><div class="panel stat"><strong>${stats.kritisch}</strong><span>Kritisch</span></div></div><div class="section-title"><div><h2>Kategorien</h2><p class="sub">Wähle zuerst eine Kategorie. Danach siehst du alle Akten innerhalb dieser Kategorie.</p></div><button class="btn primary" onclick="openCaseModal()">+ Neue Akte</button></div><div class="grid">${Object.entries(CATEGORIES).map(([key,c])=>{const n=db.cases.filter(x=>x.category===key).length;return `<a class="card corner category-card" href="category.html?cat=${key}"><div><div class="icon">${c.icon}</div><h3>${c.title}</h3><p class="sub" style="font-size:14px;margin-top:10px">${c.desc}</p></div><div class="meta"><span class="tag">${n} Akten</span><span class="tag">Öffnen →</span></div></a>`}).join('')}</div><div class="section-title"><div><h2>Hochprioritäre Akten</h2></div></div><div class="grid">${sortByPriority(db.cases).slice(0,4).map(c=>caseCard(c,db)).join('')||'<div class="empty">Noch keine Akten vorhanden.</div>'}</div>`;modalHtml();footer()}
async function renderCategory(){header();const cat=q('cat')||'familien';const cfg=CATEGORIES[cat]||CATEGORIES.sonstige;const db=await load();const cases=getCases(db,cat);document.querySelector('#app').innerHTML=`<div class="container"><div class="breadcrumb"><a href="index.html">Kategorien</a><span>/</span><span>${esc(cfg.title)}</span></div><section class="hero" style="min-height:180px"><div><span class="kicker">Kategorie</span><h1>${esc(cfg.title)}</h1><p class="sub">${esc(cfg.desc)}</p></div></section><div class="section-title"><div><h2>Akten in ${esc(cfg.title)}</h2><p class="sub">Klicke auf eine Akte, um Stammdaten und einzelne Einträge zu öffnen.</p></div><button class="btn primary" onclick="openCaseModal('${cat}')">+ Akte anlegen</button></div><div class="toolbar"><input id="search" class="input" placeholder="Akten durchsuchen..." oninput="filterCards()"><select id="prioFilter" onchange="filterCards()"><option value="">Alle Prioritäten</option>${PRIORITIES.map(p=>`<option>${p}</option>`).join('')}</select><button class="btn" onclick="resetFilters()">Zurücksetzen</button></div><div id="caseGrid" class="grid">${sortByPriority(cases).map(c=>caseCard(c,db)).join('')||'<div class="empty">In dieser Kategorie existieren noch keine Akten.</div>'}</div></div>`;modalHtml();footer()}
function filterCards(){const term=document.querySelector('#search')?.value.toLowerCase()||'';const pr=document.querySelector('#prioFilter')?.value||'';document.querySelectorAll('#caseGrid .card').forEach(card=>{const text=card.innerText.toLowerCase();const show=(!term||text.includes(term))&&(!pr||text.includes(pr.toLowerCase()));card.classList.toggle('hidden',!show)})}
function resetFilters(){document.querySelector('#search').value='';document.querySelector('#prioFilter').value='';filterCards()}
async function renderFile(){header();const id=q('id');const db=await load();const c=db.cases.find(x=>x.id===id);const root=document.querySelector('#app');if(!c){root.innerHTML='<div class="container"><div class="empty">Akte nicht gefunden. <a href="index.html">Zurück</a></div></div>';footer();return}const entries=db.entries.filter(e=>e.caseId===id).sort((a,b)=>String(b.date).localeCompare(String(a.date)));const mugshotHtml = c.image ? `<div class="dossier-mugshot"><img src="${c.image}" alt="${esc(c.name)}"><div class="mugshot-overlay"></div></div>` : '';root.innerHTML=`<div class="container"><div class="breadcrumb"><a href="index.html">Kategorien</a><span>/</span><a href="category.html?cat=${c.category}">${esc(CATEGORIES[c.category]?.title||c.category)}</a><span>/</span><span>${esc(c.name)}</span></div><div class="section-title"><div><span class="classified">AKTE • ${esc(CATEGORIES[c.category]?.title||c.category)}</span><h1 style="font-size:clamp(30px,4vw,54px);margin-bottom:8px">${esc(c.name)}</h1><div class="meta">${badge(c.priority)}<span class="tag">${esc(c.status||'-')}</span><span class="tag">Einträge: ${entries.length}</span><span class="tag">Letzte Änderung: ${esc(c.updatedAt||'-')}</span></div></div><div class="actions"><button class="btn" onclick="openCaseModal(null,'${c.id}')">Akte bearbeiten</button><button class="btn primary" onclick="openEntryModal('${c.id}')">+ Eintrag hinzufügen</button></div></div><div class="file-layout"><aside class="panel corner" style="padding:20px">${mugshotHtml}<h3>Stammdaten</h3><div class="info-list" style="margin-top:16px"><div class="info-row"><b>Federführender Agent</b>${esc(c.lead||'-')}</div><div class="info-row"><b>Ort / Gebiet</b>${esc(c.location||'-')}</div><div class="info-row"><b>Bekannte Aktivitäten</b>${esc(c.activities||'-')}</div><div class="info-row"><b>Struktur</b>${esc(c.structure||'-')}</div><div class="info-row"><b>Zusammenfassung</b>${esc(c.summary||'-')}</div></div><div class="danger-zone"><b style="color:#fca5a5">Gefahrenbereich</b><p class="sub" style="font-size:13px;margin:8px 0 12px">Löscht die komplette Akte inklusive aller Einträge.</p><button class="btn danger" onclick="deleteCase('${c.id}')">Akte löschen</button></div></aside><main><div class="section-title" style="margin-top:0"><div><h2>Einträge zur Akte</h2><p class="sub">Einträge sind jetzt eigene Unterakten: anklicken, öffnen, bearbeiten und gezielt verwalten.</p></div></div><div id="entries">${entries.map(entryCard).join('')||'<div class="empty">Noch keine Einträge zu dieser Akte vorhanden.</div>'}</div></main></div></div>`;modalHtml();entryModalHtml();footer()}
function entryCard(e){
  const hasImg = !!e.image;
  const imgHtml = hasImg ? `<div class="entry-thumbnail" style="background-image: url('${e.image}')"></div>` : '';
  return `<a class="panel corner entry entry-link" href="entry.html?id=${e.id}">
    <div class="entry-layout">
      ${imgHtml}
      <div class="entry-content">
        <div class="entry-head">
          <div><span class="classified">${esc(e.type)} • ${esc(e.date)}</span><h3 style="margin-top:10px">${esc(e.title)}</h3></div>
          ${badge(e.priority)}
        </div>
        <p>${esc(e.content)}</p>
        <div class="meta">
          <span class="tag">Autor: ${esc(e.author||'-')}</span>
          <span class="tag">Eintrag öffnen →</span>
        </div>
      </div>
    </div>
  </a>`;
}
async function renderEntry(){header();const id=q('id');const db=await load();const e=db.entries.find(x=>x.id===id);const root=document.querySelector('#app');if(!e){root.innerHTML='<div class="container"><div class="empty">Eintrag nicht gefunden. <a href="index.html">Zurück</a></div></div>';footer();return}const c=db.cases.find(x=>x.id===e.caseId);if(!c){root.innerHTML='<div class="container"><div class="empty">Zugehörige Akte nicht gefunden. <a href="index.html">Zurück</a></div></div>';footer();return}const evidenceHtml = e.image ? `<div class="evidence-photo"><img src="${e.image}" alt="Beweismittel"><div class="evidence-label">BEWEISMITTEL • SECURE DATABASE</div></div>` : '';root.innerHTML=`<div class="container"><div class="breadcrumb"><a href="index.html">Kategorien</a><span>/</span><a href="category.html?cat=${c.category}">${esc(CATEGORIES[c.category]?.title||c.category)}</a><span>/</span><a href="akte.html?id=${c.id}">${esc(c.name)}</a><span>/</span><span>${esc(e.title)}</span></div><div class="section-title"><div><span class="classified">EINTRAGSAKTE • ${esc(e.type)}</span><h1 style="font-size:clamp(30px,4vw,54px);margin-bottom:8px">${esc(e.title)}</h1><div class="meta">${badge(e.priority)}<span class="tag">Datum: ${esc(e.date||'-')}</span><span class="tag">Autor: ${esc(e.author||'-')}</span><span class="tag">Hauptakte: ${esc(c.name)}</span></div></div><div class="actions"><a class="btn" href="akte.html?id=${c.id}">← Zur Hauptakte</a><button class="btn" onclick="openEntryModal('${c.id}','${e.id}')">Eintrag bearbeiten</button><button class="btn danger" onclick="deleteEntry('${e.id}','${c.id}')">Eintrag löschen</button></div></div><div class="file-layout"><aside class="panel corner" style="padding:20px"><h3>Eintragsdaten</h3><div class="info-list" style="margin-top:16px"><div class="info-row"><b>Art</b>${esc(e.type||'-')}</div><div class="info-row"><b>Priorität</b>${esc(e.priority||'-')}</div><div class="info-row"><b>Datum</b>${esc(e.date||'-')}</div><div class="info-row"><b>Autor</b>${esc(e.author||'-')}</div><div class="info-row"><b>Zugehörige Akte</b>${esc(c.name)}</div></div></aside><main><div class="panel corner dossier-text"><span class="classified">DOKUMENTATION</span><h2 style="margin-top:16px">Inhalt des Eintrags</h2><p>${esc(e.content||'Kein Inhalt hinterlegt.')}</p>${evidenceHtml}</div></main></div></div>`;modalHtml();entryModalHtml();footer()}
function modalHtml(){if(document.querySelector('#caseModal'))return;document.body.insertAdjacentHTML('beforeend',`<div id="caseModal" class="modal"><div class="panel corner modal-box"><h2 id="caseModalTitle">Akte anlegen</h2><form id="caseForm" onsubmit="saveCaseForm(event)"><input type="hidden" name="id"><div class="form-grid"><div><label>Kategorie</label><select name="category">${Object.entries(CATEGORIES).map(([k,c])=>`<option value="${k}">${c.title}</option>`).join('')}</select></div><div><label>Priorität</label><select name="priority">${PRIORITIES.map(p=>`<option>${p}</option>`).join('')}</select></div><div><label>Name der Akte</label><input class="input" name="name" required placeholder="z.B. Familie / Organisation"></div><div><label>Status</label><input class="input" name="status" placeholder="Aktiv / Beobachtung / Archiviert"></div><div><label>Federführender Agent</label><input class="input" name="lead" placeholder="Agent / Dienstnummer"></div><div><label>Ort / Gebiet</label><input class="input" name="location" placeholder="Gebiet / PLZ / Objekt"></div><div class="full"><label>Zusammenfassung</label><textarea name="summary" placeholder="Kurze Lagebeschreibung"></textarea></div><div class="full"><label>Struktur</label><textarea name="structure" placeholder="Führung, Mitglieder, Kontakte, Aufbau"></textarea></div><div class="full"><label>Bekannte Aktivitäten</label><textarea name="activities" placeholder="Delikte, Muster, Verbindungen"></textarea></div><div class="full"><label>Aktenbild / Dossier-Foto</label><input type="hidden" name="image" id="caseImage"><input type="file" id="caseImageFile" accept="image/*" style="display:none" onchange="handleImageSelect(this.files[0], 'caseImage', 'caseImagePreview')"><div class="upload-zone" onclick="document.getElementById('caseImageFile').click()"><strong>[ BILD AUSWÄHLEN ]</strong><span>Klicken, um ein Foto hochzuladen</span></div><div id="caseImagePreview" class="image-preview"><span class="muted">Kein Bild ausgewählt</span></div></div></div><div class="actions"><button type="button" class="btn" onclick="closeModal('caseModal')">Abbrechen</button><button class="btn primary">Speichern</button></div></form></div></div>`)}
function entryModalHtml(){if(document.querySelector('#entryModal'))return;document.body.insertAdjacentHTML('beforeend',`<div id="entryModal" class="modal"><div class="panel corner modal-box"><h2 id="entryModalTitle">Eintrag hinzufügen</h2><form id="entryForm" onsubmit="saveEntryForm(event)"><input type="hidden" name="id"><input type="hidden" name="caseId"><div class="form-grid"><div><label>Art</label><select name="type">${TYPES.map(t=>`<option>${t}</option>`).join('')}</select></div><div><label>Priorität</label><select name="priority">${PRIORITIES.map(p=>`<option>${p}</option>`).join('')}</select></div><div><label>Datum</label><input class="input" type="date" name="date" required></div><div><label>Autor</label><input class="input" name="author" placeholder="Agent / Einheit"></div><div class="full"><label>Titel</label><input class="input" name="title" required placeholder="Kurzer Titel des Eintrags"></div><div class="full"><label>Inhalt</label><textarea name="content" required placeholder="Was wurde festgestellt? Wer war beteiligt? Welche Beweise liegen vor?"></textarea></div><div class="full"><label>Beweisfoto / Anhang</label><input type="hidden" name="image" id="entryImage"><input type="file" id="entryImageFile" accept="image/*" style="display:none" onchange="handleImageSelect(this.files[0], 'entryImage', 'entryImagePreview')"><div class="upload-zone" onclick="document.getElementById('entryImageFile').click()"><strong>[ BILD AUSWÄHLEN ]</strong><span>Klicken, um ein Beweisfoto hochzuladen</span></div><div id="entryImagePreview" class="image-preview"><span class="muted">Kein Bild ausgewählt</span></div></div></div><div class="actions"><button type="button" class="btn" onclick="closeModal('entryModal')">Abbrechen</button><button class="btn primary">Eintrag speichern</button></div></form></div></div>`)}
async function openCaseModal(cat,id){modalHtml();const f=document.querySelector('#caseForm');f.reset();f.id.value='';document.getElementById('caseImage').value='';document.getElementById('caseImagePreview').innerHTML='<span class="muted">Kein Bild ausgewählt</span>';document.querySelector('#caseModalTitle').textContent=id?'Akte bearbeiten':'Akte anlegen';if(cat)f.category.value=cat;if(id){const db=await load();const c=db.cases.find(x=>x.id===id);if(c){Object.keys(c).forEach(k=>{if(f[k])f[k].value=c[k]??''});if(c.image){document.getElementById('caseImage').value=c.image;document.getElementById('caseImagePreview').innerHTML=`<img src="${c.image}"><button type="button" class="btn-remove" onclick="clearImage('caseImage','caseImagePreview')">Entfernen</button>`}}}document.querySelector('#caseModal').classList.add('open')}
async function openEntryModal(caseId,id){entryModalHtml();const f=document.querySelector('#entryForm');f.reset();f.id.value='';f.caseId.value=caseId;f.date.value=nowDate();document.getElementById('entryImage').value='';document.getElementById('entryImagePreview').innerHTML='<span class="muted">Kein Bild ausgewählt</span>';document.querySelector('#entryModalTitle').textContent=id?'Eintrag bearbeiten':'Eintrag hinzufügen';if(id){const db=await load();const e=db.entries.find(x=>x.id===id);if(e){Object.keys(e).forEach(k=>{if(f[k])f[k].value=e[k]??''});if(e.image){document.getElementById('entryImage').value=e.image;document.getElementById('entryImagePreview').innerHTML=`<img src="${e.image}"><button type="button" class="btn-remove" onclick="clearImage('entryImage','entryImagePreview')">Entfernen</button>`}}}document.querySelector('#entryModal').classList.add('open')}
function closeModal(id){document.querySelector('#'+id)?.classList.remove('open')}
async function saveCaseForm(ev){ev.preventDefault();const data=Object.fromEntries(new FormData(ev.target).entries());const db=await load();const date=nowDate();if(data.id){const idx=db.cases.findIndex(c=>c.id===data.id);db.cases[idx]={...db.cases[idx],...data,updatedAt:date}}else{data.id=uid();data.createdAt=date;data.updatedAt=date;db.cases.push(data)}await save(db);location.href=`akte.html?id=${data.id}`}
async function saveEntryForm(ev){ev.preventDefault();const data=Object.fromEntries(new FormData(ev.target).entries());const db=await load();const c=db.cases.find(x=>x.id===data.caseId);if(data.id){const idx=db.entries.findIndex(e=>e.id===data.id);if(idx>=0)db.entries[idx]={...db.entries[idx],...data}}else{data.id=uid();db.entries.push(data)}if(c)c.updatedAt=nowDate();await save(db);location.href=`entry.html?id=${data.id}`}
async function deleteCase(id){
  if(!confirm('Diese Akte inklusive aller Einträge wirklich löschen?'))return;
  const db=await load();
  db.cases=db.cases.filter(c=>c.id!==id);
  db.entries=db.entries.filter(e=>e.caseId!==id);
  if(supabaseClient){
    try{await supabaseClient.from('cases').delete().eq('id',id)}catch(e){}
  }
  await save(db);
  location.href='index.html';
}
async function deleteEntry(id,caseId){
  if(!confirm('Diesen Eintrag wirklich löschen?'))return;
  const db=await load();
  const e=db.entries.find(x=>x.id===id);
  const targetCase=caseId||e?.caseId;
  db.entries=db.entries.filter(e=>e.id!==id);
  if(supabaseClient){
    try{await supabaseClient.from('entries').delete().eq('id',id)}catch(e){}
  }
  await save(db);
  if(location.pathname.endsWith('entry.html'))location.href='akte.html?id='+targetCase;
  else location.reload();
}
async function exportData(){const db=await load();const blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='fib-aktenportal-export.json';a.click();URL.revokeObjectURL(a.href)}
function importData(){
  const input=document.createElement('input');
  input.type='file';
  input.accept='application/json';
  input.onchange=()=>{
    const file=input.files[0];
    if(!file)return;
    const r=new FileReader();
    r.onload=async ()=>{
      try{
        const db=JSON.parse(r.result);
        if(!db.cases||!db.entries)throw new Error('Ungültige Datei');
        await save(db);
        location.reload();
      }catch(e){
        alert('Import fehlgeschlagen: '+e.message);
      }
    };
    r.readAsText(file);
  };
  input.click();
}

/* Supabase Configuration Modal functions */
function supabaseModalHtml() {
  if (document.querySelector('#supabaseModal')) return;
  const urlVal = localStorage.getItem(SUPABASE_URL_KEY) || '';
  const keyVal = localStorage.getItem(SUPABASE_KEY_KEY) || '';
  document.body.insertAdjacentHTML('beforeend', `
    <div id="supabaseModal" class="modal">
      <div class="panel corner modal-box" style="max-width: 520px">
        <h2>Supabase Konfiguration</h2>
        <div class="sync-hint">
          Hier kannst du dein **Supabase-Backend** verbinden, um Daten in der Cloud zu speichern und online abzurufen. Lass die Felder leer, um wieder lokal in deinem Browser zu speichern.
        </div>
        <form onsubmit="saveSupabaseConfig(event)">
          <div class="form-grid">
            <div class="full">
              <label>Projekt URL</label>
              <input class="input" id="cfgUrl" value="${esc(urlVal)}" placeholder="https://xxxx.supabase.co">
            </div>
            <div class="full">
              <label>Anon API Key</label>
              <input class="input" id="cfgKey" value="${esc(keyVal)}" placeholder="eyJh......">
            </div>
          </div>
          <div class="actions">
            <button type="button" class="btn" onclick="closeModal('supabaseModal')">Abbrechen</button>
            <button class="btn primary">Speichern & Verbinden</button>
          </div>
        </form>
      </div>
    </div>
  `);
}
function openSupabaseModal() {
  supabaseModalHtml();
  document.querySelector('#supabaseModal').classList.add('open');
}
function saveSupabaseConfig(ev) {
  ev.preventDefault();
  const url = document.getElementById('cfgUrl').value.trim();
  const key = document.getElementById('cfgKey').value.trim();
  if (url && key) {
    localStorage.setItem(SUPABASE_URL_KEY, url);
    localStorage.setItem(SUPABASE_KEY_KEY, key);
  } else {
    localStorage.removeItem(SUPABASE_URL_KEY);
    localStorage.removeItem(SUPABASE_KEY_KEY);
  }
  location.reload();
}
