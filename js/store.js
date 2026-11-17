/* Motley Island state: everything lives in this phone's localStorage under one key.
   The log is the source of truth; every total, the island and the settlers are derived from it. */
(function(){
const KEY = 'hearth.v1';

// What each kind of task earns.
const PTS = {
  lift:       {res:'stone',   pts:12},
  mobility:   {res:'spirit',  pts:3},
  walk:       {res:'land',    pts:8},
  intervals:  {res:'land',    pts:12},
  pickleball: {res:'land',    pts:18},
  breakfast:  {res:'harvest', pts:4},
  lunch:      {res:'harvest', pts:4},
  dinner:     {res:'harvest', pts:5},
  sleep:      {res:'spirit',  pts:4},
  plan:       {res:'harvest', pts:8}
};
// Self-reported extras: points per minute bucket, or a flat amount.
const EXTRA = {
  strength: {res:'stone',   per:2, label:'Strength work'},
  cardio:   {res:'land',    per:3, label:'Cardio or sport'},
  meal:     {res:'harvest', flat:4, label:'Healthy meal'},
  recovery: {res:'spirit',  per:5, label:'Recovery'}
};
// A 12-week season. A full plan week earns about 207 points; the total is set at three-quarters of
// that for 12 weeks (155 x 12), so a solid season finishes the island in week 12, a perfect one around week 9.
const SEASON = {weeks:12, total:1860, stone:480, land:800, harvest:865, spirit:290};
const RES = ['stone','land','harvest','spirit'];

const pad = n => String(n).padStart(2,'0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parse = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); };
function mondayOf(d){ const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - (x.getDay()+6)%7); return ymd(x); }

function fresh(){ return {v:1, start:mondayOf(new Date()), log:[], grocery:{}, sets:{}, prep:{}, ing:{}, swaps:{}, favs:{}, built:null, target:null, crops:{}, onboarded:false}; }
function load(){
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1) return Object.assign(fresh(), s); } catch(e) {}
  return fresh();
}
let state = load();
function save(){ try { localStorage.setItem(KEY, JSON.stringify(state)); } catch(e) {} if (window.onHearthSave) window.onHearthSave(); }

function weekNo(d = new Date()){ return Math.max(1, Math.floor((parse(ymd(d)) - parse(state.start)) / 864e5 / 7) + 1); }
function seasonWeek(d){ return ((weekNo(d)-1) % SEASON.weeks) + 1; }

function totals(){
  const t = {stone:0, land:0, harvest:0, spirit:0};
  state.log.forEach(e => { t[e.res] = (t[e.res]||0) + e.pts; });
  t.all = RES.reduce((a,k) => a + t[k], 0);
  return t;
}
// The island grows on a front-loaded curve: early points build more, so weeks 1 and 2 feel rewarding.
// Raw share of the season 0..1 -> drawn progress 0..1. thToPts turns an unlock threshold (0-4 stages) into points.
const SHAPE = .665;
const progress = () => Math.pow(Math.min(1, totals().all / SEASON.total), SHAPE);
const thToPts = th => SEASON.total * Math.pow(Math.min(1, th / 4), 1 / SHAPE);
const settlers = () => 3 + Math.floor(totals().all / 45);
function gardens(){
  const p = progress(), f = p*4;
  const label = f < .6 ? 'Plans drawn' : f < 1.5 ? 'Foundation laid' : f < 2.5 ? 'Tier 1 of 3' : f < 3.6 ? 'Tier 2 of 3' : p >= 1 ? 'Complete' : 'Tier 3 of 3';
  return {pct: Math.round(p*100), label};
}

const isDone = (date, key) => state.log.some(e => e.date === date && e.key === key);
function complete(date, key, label, type){
  if (isDone(date, key)) return null;
  const p = PTS[type];
  const e = {id: Date.now().toString(36) + Math.random().toString(36).slice(2,6), date, key, label, res:p.res, pts:p.pts, at:Date.now()};
  state.log.push(e); save(); return e;
}
/* A log entry with its own points (eating out, skipping a meal). Same shape as every other entry. */
function completeWith(date, key, label, res, pts){
  if (isDone(date, key)) return null;
  const e = {id: Date.now().toString(36) + Math.random().toString(36).slice(2,6), date, key, label, res, pts, at:Date.now()};
  state.log.push(e); save(); return e;
}
/* What replaced a planned meal: swaps['2026-11-17|dinner'] = {type:'recipe'|'out'|'home'|'skip', ...}. */
function setSwap(date, slot, v){ state.swaps = state.swaps || {}; if (v) state.swaps[date + '|' + slot] = v; else delete state.swaps[date + '|' + slot]; save(); }
const getSwap = (date, slot) => (state.swaps || {})[date + '|' + slot] || null;
/* Hearted recipes, by week and id: favs['3:peruvian-chicken'] = {id, wk, name}. */
function setFav(key, v){ state.favs = state.favs || {}; if (v) state.favs[key] = v; else delete state.favs[key]; save(); }
const isFav = key => !!(state.favs || {})[key];
/* Buildings in the order they went up, with what each one cost: built = [{k, s:{stone, land, ...}, d}]. */
function saveBuilt(list){ state.built = list; save(); }
/* The building the settlers save for (null: the usual order), and what each farm plot grows. */
function setTarget(k){ state.target = k || null; save(); }
function setCrop(k, crop){ state.crops = state.crops || {}; state.crops[k] = crop; save(); }
function undo(date, key){ state.log = state.log.filter(e => !(e.date === date && e.key === key)); save(); }
function addExtra(type, minutes, note){
  const x = EXTRA[type]; if (!x) return null;
  const pts = x.flat || Math.max(1, Math.round((+minutes||0) / x.per));
  const label = note ? note : x.label + (x.flat ? '' : ` · ${minutes} min`);
  const e = {id: Date.now().toString(36), date: ymd(new Date()), key:'extra:'+Date.now(), label, res:x.res, pts, at:Date.now(), extra:true};
  state.log.push(e); save(); return e;
}
function removeEntry(id){ state.log = state.log.filter(e => e.id !== id); save(); }

// Simple keyed checkboxes for grocery, set and prep tracking.
function flag(bucket, key, val){
  state[bucket] = state[bucket] || {};
  if (val === undefined) return !!state[bucket][key];
  if (val) state[bucket][key] = 1; else delete state[bucket][key];
  save(); return val;
}
function clearPrefix(bucket, prefix){ Object.keys(state[bucket]||{}).forEach(k => { if (k.startsWith(prefix)) delete state[bucket][k]; }); save(); }

// Reps logged in the workout player, one list per session per day: sets['2026-11-16|A'] = [[block, set, reps], ...].
function saveSets(date, sid, list){ state.sets = state.sets || {}; state.sets[date + '|' + sid] = list; save(); }
function lastSets(sid, before){
  const ks = Object.keys(state.sets || {}).filter(k => k.endsWith('|' + sid) && Array.isArray(state.sets[k]) && k.split('|')[0] < before).sort();
  return ks.length ? state.sets[ks[ks.length - 1]] : null;
}

function setStart(s){ state.start = s; save(); }
function setOnboarded(){ state.onboarded = true; save(); }
function exportJSON(){ return JSON.stringify(state, null, 1); }
function importJSON(txt){ const s = JSON.parse(txt); if (!s || s.v !== 1 || !Array.isArray(s.log)) throw new Error('That file is not a Motley Island backup.'); state = Object.assign(fresh(), s); save(); }
function reset(){ state = fresh(); save(); }

window.Store = {PTS, EXTRA, SEASON, RES, ymd, parse, mondayOf, weekNo, seasonWeek, totals, progress, settlers, gardens,
  isDone, complete, completeWith, setSwap, getSwap, setFav, isFav, saveBuilt, setTarget, setCrop, undo, addExtra, saveSets, lastSets, thToPts, setOnboarded, removeEntry, flag, clearPrefix, setStart, exportJSON, importJSON, reset,
  get state(){ return state; }};
})();
