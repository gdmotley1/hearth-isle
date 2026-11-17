/* Motley Island cloud backup. Every change to progress is copied to a private row in Supabase,
   a few seconds after it happens and again whenever the app is put away. The only thing you need
   to restore on a new phone is the backup code: the storage slot is derived from it.
   The key below is Supabase's publishable key: it is meant to be public, and the database only
   lets it call hearth_save and hearth_load for the row whose code matches. */
(function(){
const URL = 'https://fjbykizowoxhuyldjkws.supabase.co';
const KEY = 'sb_publishable_4Z9buQ254ts-IL95P0nhhw_2u3HZEY3';
const CK = 'hearth.cloud';
const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';    // no 0/O or 1/I, easy to read back

let conf = (() => { try { return JSON.parse(localStorage.getItem(CK)) || null; } catch(e) { return null; } })();
const saveConf = () => { try { localStorage.setItem(CK, JSON.stringify(conf)); } catch(e) {} };
let timer = 0, busy = false, again = false, listeners = [], status = conf && conf.last ? 'ok' : 'idle', lastError = '';

const tidy = code => String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/[01OI]/g, '');
const pretty = raw => raw.match(/.{1,4}/g).join('-');
function newCode(){ const b = crypto.getRandomValues(new Uint8Array(24)); return Array.from(b, x => A[x % 32]).join(''); }
async function slot(raw){
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('hearth-isle:' + raw)));
  h[6] = (h[6] & 0x0f) | 0x40; h[8] = (h[8] & 0x3f) | 0x80;
  const x = Array.from(h.slice(0, 16), b => b.toString(16).padStart(2, '0')).join('');
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20, 32)}`;
}
async function rpc(fn, body, keepalive){
  const r = await fetch(`${URL}/rest/v1/rpc/${fn}`, {method:'POST', keepalive:!!keepalive, headers:{apikey:KEY, 'Content-Type':'application/json'}, body:JSON.stringify(body)});
  const txt = await r.text();
  if (!r.ok){ let m = txt; try { m = JSON.parse(txt).message || txt; } catch(e) {} throw new Error(m); }
  return txt ? JSON.parse(txt) : null;
}
const emit = () => listeners.forEach(f => { try { f(info()); } catch(e) {} });
function info(){ return {on:!!(conf && conf.on), code:conf ? pretty(conf.code) : '', last:conf && conf.last, status, error:lastError}; }

/* Turn backup on with a fresh code (first run), unless one already exists. */
async function ensure(){
  if (conf && conf.code) return;
  conf = {code:newCode(), on:true, last:null};
  conf.id = await slot(conf.code); saveConf();
}
async function push(keepalive){
  if (!conf || !conf.on) return;
  if (busy){ again = true; return; }
  if (!navigator.onLine){ status = 'offline'; emit(); return; }
  busy = true; status = 'saving'; emit();
  try {
    if (!conf.id) conf.id = await slot(conf.code);
    const t = await rpc('hearth_save', {p_id:conf.id, p_secret:conf.code, p_data:JSON.parse(Store.exportJSON())}, keepalive);
    conf.last = t || new Date().toISOString(); saveConf(); status = 'ok'; lastError = '';
  } catch(e){ status = 'error'; lastError = e.message || 'Backup failed'; }
  busy = false; emit();
  if (again){ again = false; schedule(1500); }
}
function schedule(ms = 4000){ clearTimeout(timer); timer = setTimeout(() => push(false), ms); }

/* Look up a backup by code without changing anything here. */
async function peek(code){
  const raw = tidy(code);
  if (raw.length < 24) throw new Error('That code is too short. It has 24 letters and numbers.');
  const res = await rpc('hearth_load', {p_id:await slot(raw), p_secret:raw});
  if (!res) throw new Error('No backup matches that code. Check it and try again.');
  return {raw, data:res.data, updated:res.updated_at};
}
/* Replace progress on this phone with the backup, and keep backing up to that code from now on. */
async function restore(code){
  const p = await peek(code);
  Store.importJSON(JSON.stringify(p.data));
  conf = {code:p.raw, id:await slot(p.raw), on:true, last:p.updated}; saveConf();
  status = 'ok'; emit();
  return p;
}
/* After erasing progress: start a fresh code so the old backup stays intact. */
async function fresh(){ conf = null; try { localStorage.removeItem(CK); } catch(e) {} await ensure(); status = 'idle'; emit(); schedule(1500); }
function setOn(on){ if (!conf) return; conf.on = !!on; saveConf(); if (on) push(false); else { status = 'idle'; emit(); } }

async function start(){
  try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch(e) {}
  try { await ensure(); } catch(e) { status = 'error'; lastError = 'This browser cannot make a backup code.'; return; }
  window.onHearthSave = () => schedule();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { clearTimeout(timer); push(true); } });
  window.addEventListener('online', () => schedule(500));
  // back up once on open if the last one is older than an hour
  if (!conf.last || Date.now() - Date.parse(conf.last) > 3600e3) schedule(2500);
}

window.Cloud = {start, info, push:() => push(false), peek, restore, setOn, fresh, onChange:f => listeners.push(f), pretty, tidy};
})();
