/* Motley Island app: hash router, four tabs (Isle, Train, Market, Kitchen), detail screens,
   a guided workout player, cook mode and first-run onboarding. */
(function(){
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const app = $('#app'), view = $('#view'), nav = $('#nav'), layer = $('#layer');
const bar = document.createElement('div'); bar.className = 'bar'; app.appendChild(bar);
const dock = document.createElement('div'); dock.className = 'dock'; app.appendChild(dock);
// A screen with its own bottom button tucks the tab bar away so the two never overlap.
new MutationObserver(() => app.classList.toggle('docked', !!dock.innerHTML.trim())).observe(dock, {childList:true, subtree:true});

const DAYS = ['mon','tue','wed','thu','fri','sat','sun'];
const DAYN = {mon:'Monday',tue:'Tuesday',wed:'Wednesday',thu:'Thursday',fri:'Friday',sat:'Saturday',sun:'Sunday'};
const SLOT = {breakfast:'Breakfast',lunch:'Lunch',dinner:'Dinner'};
const RESN = {stone:'Stone',land:'Land',harvest:'Harvest',spirit:'Spirit'};
const MEAL_WEEKS = [1, 2, 3, 4, 5, 6, 7];
const SETTLERS = ['Juno','Mira','Tobi','Pell','Wren','Ansel','Ivy','Corin','Bea','Otto','Lark','Fen','Rhea','Sol','Nell','Arlo','Hale','Tess'];
const BUILD = {house:'a cottage',farm:'a farm plot',tree:'an orchard tree',pine:'a pine grove',well:'the village well',stall:'a market stall',windmill:'the windmill',tower:'the watchtower',
  lantern:'a lantern',flowers:'a flower bed',rock:'a standing stone',gfound:'the Gardens foundation',g1:'the first Gardens tier',g2:'the second Gardens tier',g3:'the Hanging Gardens',
  dock:'the dock',port1:'the cargo pier',port2:'the harbor',port3:'the lighthouse'};
const BUILD_T = {house:'Cottage',farm:'Farm plot',tree:'Orchard tree',pine:'Pine grove',well:'Village well',stall:'Market stall',windmill:'Windmill',tower:'Watchtower',
  lantern:'Lantern',flowers:'Flower bed',rock:'Standing stone',gfound:'Gardens foundation',g1:'Gardens · tier one',g2:'Gardens · tier two',g3:'Hanging Gardens',
  dock:'The dock',port1:'Cargo pier',port2:'Harbor',port3:'Lighthouse'};

/* ---------------- icons ---------------- */
const P = {
  lift:'<path d="M6.5 7v10M3.5 9.5v5M17.5 7v10M20.5 9.5v5M6.5 12h11"/>',
  walk:'<path d="M13.5 4.5a1.6 1.6 0 1 0 0 .1M10 21l2.2-6.2L15 17v4M9 11.5l2.5-3.5 3 1.5 2 3.5M11.5 8 8 9.5 6.5 13"/>',
  intervals:'<path d="M13 2.8 5 13.5h6.2L10 21.2l8-10.7h-6.2z"/>',
  pickleball:'<path d="M15.2 3.3a5.5 5.5 0 0 1 0 7.8l-3.4 3.4a1.8 1.8 0 0 1-2.5 0L7.5 12.7a1.8 1.8 0 0 1 0-2.5l3.4-3.4a5.5 5.5 0 0 1 4.3-3.5z"/><path d="M8.4 13.6 3.8 18.2l2 2 4.6-4.6"/><circle cx="18.5" cy="18" r="2"/>',
  mobility:'<circle cx="12" cy="4.6" r="1.8"/><path d="M4.5 9.5 12 11l7.5-1.5M12 11v4.2l-3.6 5.3M12 15.2l3.6 5.3"/>',
  breakfast:'<path d="M3 17.5h18M6.5 17.5a5.5 5.5 0 0 1 11 0M12 4.5v3M5.4 8.4l2 2M18.6 8.4l-2 2"/>',
  lunch:'<path d="M3.5 11.5h17a8.5 8.5 0 0 1-17 0z"/><path d="M8.5 8c0-1.2 1-1.2 1-2.5M12 8c0-1.2 1-1.2 1-2.5M15.5 8c0-1.2 1-1.2 1-2.5"/>',
  dinner:'<path d="M3 17.5h18M5 17.5a7 7 0 0 1 14 0M12 8.2V6.5M10.4 6.5h3.2"/>',
  sleep:'<path d="M19.5 14.6A8 8 0 0 1 9.4 4.5a8 8 0 1 0 10.1 10.1z"/>',
  extra:'<path d="M12 3.5 13.8 9l5.7 1.5-5.7 1.6L12 17.6l-1.8-5.5L4.5 10.5 10.2 9z"/><path d="M18.5 16.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
  stone:'<path d="M12 3 19.5 7.3v9.4L12 21l-7.5-4.3V7.3z"/><path d="M12 12v9M12 12l7.5-4.7M12 12 4.5 7.3"/>',
  land:'<path d="M3.5 6.5 9 4l6 2.5L20.5 4v13.5L15 20l-6-2.5-5.5 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
  harvest:'<path d="M5 19C5 10 10 5 19 5c0 9-5 14-14 14z"/><path d="M5 19l8-8"/>',
  spirit:'<path d="M12 3c1.3 3.2 5 5 5 9.5a5 5 0 0 1-10 0c0-2.4 1.2-3.8 2-4.8.4 1.6 1.3 2.6 2.4 2.8C10.9 7.8 11.3 5.3 12 3z"/>',
  house:'<path d="M4 11 12 4l8 7M6 9.5V20h12V9.5M10 20v-5h4v5"/>',
  anchor:'<circle cx="12" cy="5" r="2"/><path d="M12 7v14M8 11h8M4.5 13.5a7.5 7.5 0 0 0 15 0"/>',
  isle:'<path d="M3 18c2 1.3 4 1.3 6 0s4-1.3 6 0 4 1.3 6 0"/><path d="M5 14.5c2-3 12-3 14 0"/><path d="M12 13V6m0 0c-1.5-2-4-2.2-5.5-1M12 6c1.5-2 4-2.2 5.5-1M12 6c-.5-1.8.3-3 1.5-3.6"/>',
  train:'<path d="M6.5 7v10M3.5 9.5v5M17.5 7v10M20.5 9.5v5M6.5 12h11"/>',
  market:'<path d="M4 9h16l-1.6 9.2a2 2 0 0 1-2 1.8H7.6a2 2 0 0 1-2-1.8z"/><path d="M8.5 9 11 4M15.5 9 13 4"/>',
  kitchen:'<path d="M4 11h16v3a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z"/><path d="M2 11h2M20 11h2M9 7.5c0-1.3 1-1.3 1-2.6M13 7.5c0-1.3 1-1.3 1-2.6"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  back:'<path d="M15 5l-7 7 7 7"/>', close:'<path d="M6 6l12 12M18 6 6 18"/>', chev:'<path d="M9 5l7 7-7 7"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>', play:'<path d="M7 4.5v15l12.5-7.5z" fill="currentColor"/>',
  clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', flame:'<path d="M12 3c1.3 3.2 5 5 5 9.5a5 5 0 0 1-10 0c0-2.4 1.2-3.8 2-4.8.4 1.6 1.3 2.6 2.4 2.8C10.9 7.8 11.3 5.3 12 3z"/>',
  layers:'<path d="M12 3.5 21 8l-9 4.5L3 8z"/><path d="M3 12.5l9 4.5 9-4.5M3 16.5l9 4.5 9-4.5"/>', people:'<circle cx="9" cy="8" r="3"/><path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5M16 5.5a3 3 0 0 1 0 5.6M17.5 14.6c1.8.6 3 2.4 3 4.9"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', today:'<path d="M10 6h10M10 12h10M10 18h10"/><path d="M3.5 6l1.5 1.5L7.5 5M3.5 12l1.5 1.5L7.5 11M3.5 18l1.5 1.5L7.5 17"/>', out:'<path d="M7 3v8a2 2 0 0 0 4 0V3M9 11v10M16 3c-1.5 2-2 4-2 6s.9 3 2 3v9"/>', swap:'<path d="M7 7h12l-3-3M17 17H5l3 3"/>', heart:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>', book:'<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20M8 7.5h8M8 11h6"/>', sound:'<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/>', mute:'<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>', timer:'<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 1.5M9.5 2.5h5"/>', minus:'<path d="M5 12h14"/>', info:'<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
  list:'<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>', cart:'<path d="M3 4h2.5l2.2 11h10.6L20.5 8H7"/><circle cx="9.5" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/>',
  download:'<path d="M12 4v11M7 10.5l5 5 5-5M4.5 19.5h15"/>', upload:'<path d="M12 15.5v-11M7 9l5-5 5 5M4.5 19.5h15"/>', calendar:'<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  Mexican:'<path d="M3 16.5a9 9 0 0 1 18 0z"/><path d="M6.5 12.8c1-1 2-1 3 0s2 1 3 0 2-1 3 0 1.8.8 2 1"/>',
  Asian:'<path d="M3.5 12h17a8.5 8.5 0 0 1-17 0z"/><path d="M13.5 3.2 11 10M19 4.2 14 10.2"/>',
  Italian:'<path d="M7 3v6a2 2 0 0 0 4 0V3M9 11v10M16.5 3c-1.5 2-2 4-2 6s.9 3 2 3v9"/>',
  Mediterranean:'<path d="M5 19C5 10 10 5 19 5c0 9-5 14-14 14z"/><path d="M5 19l8-8"/>',
  Breakfast:'<path d="M3 17.5h18M6.5 17.5a5.5 5.5 0 0 1 11 0M12 4.5v3M5.4 8.4l2 2M18.6 8.4l-2 2"/>',
  American:'<path d="M4 11h16v2.5a7.5 7.5 0 0 1-15 0z" transform="translate(.5 0)"/><path d="M3 11h18M9 7.5c0-1.3 1-1.3 1-2.6M13 7.5c0-1.3 1-1.3 1-2.6"/>',
  Indian:'<path d="M3.5 12.5h17a8.5 8.5 0 0 1-17 0z"/><path d="M7 9.5c1.5-1.5 3.5-1.5 5 0s3.5 1.5 5 0M12 4.5v2"/>',
  Peruvian:'<path d="M14.5 5.5c2.5 0 4 1.8 4 4.2 0 4.8-5.6 9.8-11.3 9.8-1.6 0-2.7-.6-2.7-1.6 0-1.3 1.7-1.6 3.4-2.6 3-1.8 3.3-5.3 3.8-7.1.5-1.7 1.2-2.7 2.8-2.7z"/><path d="M14.5 5.5c0-1.2.7-2.2 2-2.7"/>',
  Prep:'<path d="M12 3.5 21 8l-9 4.5L3 8z"/><path d="M3 12.5l9 4.5 9-4.5M3 16.5l9 4.5 9-4.5"/>',
  Snack:'<path d="M12 7.5c-1-2-3-3-5-2.5-3 1-3.5 4.5-2.5 8 1 3.5 3.5 7 5.5 7 1 0 1.2-.6 2-.6s1 .6 2 .6c2 0 4.5-3.5 5.5-7s.5-7-2.5-8c-2-.5-4 .5-5 2.5z"/><path d="M12 7.5c0-2 1-3.5 2.5-4"/>'
};
const ic = (k, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[k] || P.extra}</svg>`;

const MW = {};
let shopWeek = null;
let W = null, M = null, seen = null, trainDay = null, kitchenDay = null, mkFilter = 'all', lastAll = null;
let play = null, cook = null, wake = null, scrollAt = 60;

/* ---------------- data helpers ---------------- */
const today = () => new Date();
const dayKey = d => DAYS[(d.getDay() + 6) % 7];
const mealWeek = () => { const w = Store.weekNo(); return MEAL_WEEKS.filter(n => n <= w).pop() || MEAL_WEEKS[0]; };
const phase = () => { const sw = Store.seasonWeek(); return W.phases.find(p => sw >= p.from && sw <= p.to) || W.phases[0]; };
const gro = id => M.groceries.find(g => g.id === id);
const pan = id => M.pantry.find(p => p.id === id);
const weekend = d => d === 'sat' || d === 'sun';
const money = n => '$' + n.toFixed(2);
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const totalSets = s => s.blocks.reduce((a, b) => a + b.sets, 0);

function planItems(d){
  const out = [];
  (W.week[d] || []).forEach(it => {
    if (it.type === 'lift' || it.type === 'mobility'){
      const s = W.sessions[it.session];
      out.push({key:it.type, type:it.type, icon:it.type === 'lift' ? 'lift' : 'mobility', label:s.title, meta:`${s.minutes} min · ${plural(s.blocks.length, 'move')}`, session:it.session, go:'#session/' + it.session});
    } else if (it.type === 'pickleball'){
      out.push({key:'pickleball', type:'pickleball', icon:'pickleball', label:'Pickleball', meta:`${it.minutes / 60} hours on court`});
    } else if (it.type === 'intervals'){
      out.push({key:'intervals', type:'intervals', icon:'intervals', label:'Walk-jog intervals', meta:`${it.minutes} min · 8 × 1 min jog`});
    } else if (it.type === 'walk'){
      out.push({key:'walk', type:'walk', icon:'walk', label:it.optional ? 'Long walk downtown' : 'Walk', meta:`${it.minutes} min · ${it.note}`, optional:!!it.optional});
    }
  });
  return out;
}
const TIERN = {L:'light', B:'balanced', I:'indulgent'};
/* One meal slot on a date: the planned recipe, or whatever replaced it. */
function mealTask(ds, slot, menu, D, wn){
  const id = menu[slot], r = D.recipes[id], sw = Store.getSwap(ds, slot), base = {key:slot, type:slot, icon:slot, meal:true, planned:id, wn};
  if (sw && sw.type === 'recipe') return Object.assign(base, {label:sw.name, meta:`${SLOT[slot]} · swapped in · ${sw.minutes} min`, go:`#recipe/${sw.id}/${sw.wk}`, recipe:sw.id, swapped:true});
  if (sw && sw.type === 'out') return Object.assign(base, {icon:'out', label:sw.dish, meta:`${SLOT[slot]} · ate out · ${TIERN[sw.tier] || ''}`, swapped:true, fixedPts:sw.pts});
  if (sw && sw.type === 'home') return Object.assign(base, {label:sw.name, meta:`${SLOT[slot]} · made at home`, swapped:true});
  if (sw && sw.type === 'skip') return Object.assign(base, {icon:'minus', label:`Skipped ${SLOT[slot].toLowerCase()}`, meta:'No points, no guilt', swapped:true, fixedPts:0});
  if (!r) return null;
  return Object.assign(base, {label:r.name, meta:`${SLOT[slot]}${menu.shared === slot ? ' · for two' : ''} · ${r.minutes} min`, go:`#recipe/${id}/${wn}`, recipe:id});
}
function tasksFor(date){
  const d = dayKey(date), ds = Store.ymd(date), out = planItems(d), wn = mealWeekOf(date), D = MW[wn] || M, menu = D.menu[d];
  if (menu) Object.keys(SLOT).forEach(slot => { const t = mealTask(ds, slot, menu, D, wn); if (t) out.push(t); });
  out.push({key:'sleep', type:'sleep', icon:'sleep', label:'Slept 7+ hours', meta:'Last night'});
  if (weekend(d)) out.push({key:'plan', type:'plan', icon:'calendar', label:"Plan next week's meals", meta:'Swap recipes and the grocery list follows', go:'#plan', planTask:true});
  const times = Object.assign({plan:'10:00'}, (W.routine && W.routine.times[d]) || {});
  return out.map(t => { Object.assign(t, Store.PTS[t.type], {at:times[t.key] || '23:59', done:t.planTask ? !!planDoneThisWeek() : Store.isDone(ds, t.key), optional:t.optional || weekend(d)}); if (t.fixedPts != null) t.pts = t.fixedPts; return t; })
    .sort((a, b) => a.at.localeCompare(b.at));
}
/* '17:30' -> '5:30 PM' */
const clock = hm => { const [h, m] = hm.split(':').map(Number); return `${(h + 11) % 12 + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
/* Parts of the day built around work 8 to 5 with lunch at home 12 to 1. */
function dayParts(d){
  return weekend(d)
    ? [['Morning', '', '00:00'], ['Afternoon', '', '12:00'], ['Evening', '', '17:00']]
    : [['Morning', 'before work', '00:00'], ['Lunch break', '12 to 1 at home', '11:00'], ['After work', 'from 5', '15:00']];
}
function dayProgress(date){
  const t = tasksFor(date), req = t.filter(x => !x.optional);
  const base = req.length ? req : t;
  return {done:base.filter(x => x.done).length, total:base.length};
}
/* ---------------- the island economy ----------------
   Each building costs specific resources. Its total price follows the season's front-loaded curve, split
   by what that kind of building is made of, and scaled so each resource's season total matches how much of
   it the plan earns. Resources are spent when something goes up; if one is short, settlers trade 2 of the
   others for 1 of it, so a lopsided week slows building down but never stops it. */
const MIX = {house:{stone:.6, harvest:.4}, farm:{harvest:.6, land:.4}, tree:{land:.5, spirit:.5}, pine:{land:.7, spirit:.3},
  well:{stone:.5, land:.5}, stall:{harvest:.6, stone:.4}, windmill:{land:.4, harvest:.4, stone:.2}, tower:{stone:.6, spirit:.4},
  lantern:{spirit:1}, flowers:{harvest:.5, spirit:.5}, rock:{stone:1}, gfound:{stone:.5, land:.5},
  g1:{stone:.25, land:.25, harvest:.25, spirit:.25}, g2:{stone:.25, land:.25, harvest:.25, spirit:.25}, g3:{stone:.25, land:.25, harvest:.25, spirit:.25}};
// Share of each resource in a full plan week: 3 lifts, walks and pickleball, home meals and the plan, sleep and mobility.
const EARN_SHARE = {stone:.17, land:.31, harvest:.35, spirit:.17};
const COST_SCALE = .78;
const COSTS = (() => {
  const list = Isle.unlocks(); let prev = 0;
  const raw = list.map(u => { const q = Store.thToPts(u.th), inc = q - prev; prev = q; return {k:u.k, inc, m:MIX[u.t] || {stone:1}}; });
  const sums = {stone:0, land:0, harvest:0, spirit:0}; raw.forEach(x => Store.RES.forEach(r => { sums[r] += x.inc * (x.m[r] || 0); }));
  // COST_SCALE leaves room for the small bottlenecks specific prices create, so a balanced 75% season still finishes in week 12.
  const scale = {}; Store.RES.forEach(r => { scale[r] = sums[r] ? Store.SEASON.total * EARN_SHARE[r] * COST_SCALE / sums[r] : 0; });
  const out = {}; raw.forEach(x => { const c = {}; Store.RES.forEach(r => { if (x.m[r]) c[r] = Math.max(1, Math.round(x.inc * x.m[r] * scale[r])); }); out[x.k] = c; });
  return out;
})();
/* The port is optional: its tiers are never in the usual order, only built when you pick one as the goal.
   Each costs about what a cottage or windmill does at that point in the season. */
Object.assign(COSTS, {port1:{land:20, harvest:25}, port2:{stone:25, land:15, harvest:25}, port3:{stone:35, spirit:30}});
const PORTK = new Set(Isle.PORT.map(u => u.k));
const allBuilds = () => Isle.unlocks().concat(Isle.PORT);
const portNext = (b = builtSet()) => Isle.PORT.find(u => !b.has(u.k)) || null;
const costSum = c => Object.values(c).reduce((a, b) => a + b, 0);
function balances(){
  const t = Store.totals(), b = {stone:t.stone, land:t.land, harvest:t.harvest, spirit:t.spirit};
  (Store.state.built || []).forEach(e => Store.RES.forEach(r => { b[r] -= (e.s[r] || 0); }));
  return b;
}
/* What paying for a building would take from each balance, trading 2 for 1 to cover a shortfall; null if it cannot be paid yet. */
function payFor(k, bal){
  const c = COSTS[k] || {}, spend = {}, rem = Object.assign({}, bal); let short = 0;
  Store.RES.forEach(r => { const need = c[r] || 0, use = Math.min(need, Math.max(0, rem[r])); spend[r] = use; rem[r] -= use; short += need - use; });
  if (!short) return spend;
  let owe = short * 2;
  for (const r of Store.RES.filter(x => rem[x] > 0).sort((a, b) => rem[b] - rem[a])){ const take = Math.min(rem[r], owe); spend[r] += take; rem[r] -= take; owe -= take; if (!owe) break; }
  return owe > 0 ? null : spend;
}
/* What can be built next: the next few unbuilt buildings in order, with each Gardens tier after the one before it. */
function buildChoices(b = builtSet(), max = 4){
  const out = [];
  for (const u of Isle.unlocks()){
    if (b.has(u.k)) continue;
    const prev = {g1:'gfound', g2:'g1', g3:'g2'}[u.t]; if (prev && !b.has(prev)) continue;
    out.push(u); if (out.length >= max) break;
  }
  return out;
}
/* The building the settlers are saving for: the one you picked, or the next in the usual order. */
function nextUp(b = builtSet()){
  const t = Store.state.target;
  if (t && !b.has(t)){ const u = allBuilds().find(x => x.k === t), pn = portNext(b); if (u && (buildChoices(b, 99).some(x => x.k === t) || (pn && pn.k === t))) return u; }
  return buildChoices(b, 1)[0] || null;
}
/* Build everything that can now be paid for. Returns the new entries. */
function settle(){
  const built = (Store.state.built || []).slice(), added = [];
  for (;;){
    const next = nextUp(new Set(built.map(e => e.k))); if (!next) break;
    const sp = payFor(next.k, (() => { const b = balances(); added.forEach(e => Store.RES.forEach(r => { b[r] -= e.s[r] || 0; })); return b; })());
    if (!sp) break;
    const e = {k:next.k, s:sp, d:Store.ymd(today())}; built.push(e); added.push(e);
    if (Store.state.target === next.k) Store.setTarget(null);
  }
  if (added.length) Store.saveBuilt(built);
  return added;
}
/* Older saves had no built list: everything earned under the old rules counts as built and paid for. */
function migrateBuilt(){
  if (Array.isArray(Store.state.built)) return;
  const all = Store.totals().all, d = Store.ymd(today());
  // carried-over buildings use up what was earned, at most their price, and never leave a balance below zero
  const t = Store.totals(), rem = {stone:t.stone, land:t.land, harvest:t.harvest, spirit:t.spirit};
  Store.saveBuilt(Isle.unlocks().filter(u => Store.thToPts(u.th) <= all + 1e-9).map(u => {
    const c = COSTS[u.k], sp = {}; Store.RES.forEach(r => { const use = Math.min(c[r] || 0, Math.max(0, rem[r])); sp[r] = use; rem[r] -= use; });
    return {k:u.k, s:sp, d, carried:true}; }));
}
const builtSet = () => new Set((Store.state.built || []).map(e => e.k));
function unlockState(){
  const list = Isle.unlocks(), built = (Store.state.built || []).filter(e => !PORTK.has(e.k)).length, next = nextUp(), bal = balances();
  if (!next) return {list, next:null, nextI:-1, built, need:0, pct:100, parts:[], bal};
  const c = COSTS[next.k]; let have = 0;
  const parts = Store.RES.filter(r => c[r]).map(r => { const h = Math.max(0, Math.min(c[r], bal[r])); have += h; return {r, have:Math.max(0, Math.floor(bal[r])), cost:c[r]}; });
  return {list, next, nextI:built, built, need:costSum(c) - have, pct:have / costSum(c) * 100, parts, bal};
}
const priceChips = (parts, small) => `<span class="price${small ? ' small' : ''}">${parts.map(p => `<span class="pchip r-${p.r}${p.have >= p.cost ? ' ok' : ''}">${ic(p.r)}${RESN[p.r]} ${Math.min(p.have, p.cost)}/${p.cost}</span>`).join('')}</span>`;
const costParts = k => Store.RES.filter(r => (COSTS[k] || {})[r]).map(r => ({r, have:Math.max(0, Math.floor(balances()[r])), cost:COSTS[k][r]}));

/* ---------------- feedback ---------------- */
/* Haptics: Android has vibrate(). iPhone Safari (iOS 18+) gives a real tap when a switch-style
   checkbox toggles, so a hidden one is flipped from inside the user's tap. */
let hapticLabel = null;
function haptic(){
  try {
    if (navigator.vibrate && navigator.vibrate(8)) return;
    if (!hapticLabel){
      hapticLabel = document.createElement('label'); hapticLabel.setAttribute('aria-hidden', 'true');
      hapticLabel.style.cssText = 'position:fixed;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;left:-9px;top:0';
      hapticLabel.innerHTML = '<input type="checkbox" switch tabindex="-1">';
      document.body.appendChild(hapticLabel);
    }
    hapticLabel.click();
  } catch(e) {}
}

/* Sound cues for rest timers and kitchen timers. Mixes with music instead of stopping it. */
const PREFS_KEY = 'hearth.prefs';
const prefs = (() => { try { return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch(e) { return {}; } })();
const setPref = (k, v) => { prefs[k] = v; try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch(e) {} };
let actx = null;
function unlockAudio(){
  try {
    if (!actx){
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
      try { if (navigator.audioSession) navigator.audioSession.type = 'ambient'; } catch(e) {}
      actx = new C();
    }
    if (actx.state === 'suspended') actx.resume();
  } catch(e) {}
}
document.addEventListener('pointerup', unlockAudio, {passive:true});
function beep(freq = 880, dur = .12, when = 0, vol = .22){
  if (!actx || prefs.sound === false) return;
  try {
    const t = actx.currentTime + when, o = actx.createOscillator(), g = actx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .012); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
    o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + dur + .03);
  } catch(e) {}
}
const chime = () => { beep(784, .22, 0); beep(1047, .38, .17); };

/* Values that animate from where they were last time instead of snapping on re-render. */
const TWV = {};
function tw(id, v){ const from = id in TWV ? TWV[id] : 0; TWV[id] = v; return from; }
function playTw(root = view){
  requestAnimationFrame(() => requestAnimationFrame(() => $$('[data-tw]', root).forEach(el => {
    if (el.dataset.p === 'o') el.style.strokeDashoffset = el.dataset.v; else el.style.width = el.dataset.v + '%';
  })));
}
const twBar = (id, pct) => `<i data-tw data-v="${pct.toFixed(1)}" style="width:${tw(id, pct).toFixed(1)}%"></i>`;

function announce(title, sub, icon = 'house'){
  rewardQ = rewardQ.then(() => new Promise(done => {
    const r = document.createElement('div'); r.className = 'reward big';
    r.innerHTML = `<span class="tile r-gold">${ic(icon)}</span><span><small class="over gold">${esc(sub)}</small><b>${esc(title)}</b></span>`;
    document.body.appendChild(r); setTimeout(() => r.remove(), 3700); setTimeout(done, 1400);
  }));
}
function burst(el){
  if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (let i = 0; i < 12; i++){
    const s = document.createElement('i'); s.className = 'spark'; s.style.left = cx + 'px'; s.style.top = cy + 'px';
    document.body.appendChild(s);
    const a = Math.PI * 2 * i / 12 + Math.random() * .4, d = 22 + Math.random() * 18;
    s.animate([{transform:'translate(-50%,-50%) scale(1)', opacity:1}, {transform:`translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(.2)`, opacity:0}],
      {duration:620 + Math.random() * 200, easing:'cubic-bezier(.2,.8,.2,1)'}).onfinish = () => s.remove();
  }
}
let rewardQ = Promise.resolve();
let islandFx = [];
function reward(res, pts, sub, undo){
  const fx = {res, pts}; islandFx.push(fx); if (islandFx.length > 4) islandFx.shift();
  rewardQ = rewardQ.then(() => new Promise(done => {
    const r = document.createElement('div'); r.className = 'reward' + (undo ? ' canundo' : '');
    r.innerHTML = `<span class="tile r-${res}">${ic(res)}</span><span><b>+${pts} ${RESN[res]}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span>${undo ? '<i class="undo">Undo</i>' : ''}`;
    if (undo) r.addEventListener('click', () => { haptic(); islandFx = islandFx.filter(x => x !== fx); r.remove(); undo(); }, {once:true});
    document.body.appendChild(r); setTimeout(() => { r.remove(); }, undo ? 3600 : 2700); setTimeout(done, 1100);
  }));
}
function toast(txt){ const t = document.createElement('div'); t.className = 'toast'; t.textContent = txt; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); }
function celebrate(before){
  const added = settle(), s0 = 3 + Math.floor(before / 45), s1 = Store.settlers();
  if (added.length){
    const list = allBuilds(), n = (Store.state.built || []).length, u = list.find(x => x.k === added[added.length - 1].k), who = SETTLERS[(n - 1) % SETTLERS.length];
    buildFocus = true;
    if (/^g[123]$/.test(u.t)) gardensFest = true;
    announce(BUILD_T[u.t], u.t.startsWith('g') ? 'The settlers finished' : `${who} built`, u.t.startsWith('g') ? 'harvest' : 'house');
  }
  if (s1 > s0){
    newcomer = true;
    announce(`${SETTLERS[(s1 - 1) % SETTLERS.length]} arrived by boat`, `${s1} settlers now`, 'people');
  }
}
let buildFocus = false, newcomer = false, festival = false, gardensFest = false, lastGst = null;
function countUp(el, from, to){
  if (!el || from === to || from == null) return;
  const t0 = performance.now(), d = 900;
  const step = t => { const k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
async function keepAwake(on){
  try {
    if (on && 'wakeLock' in navigator && !wake) wake = await navigator.wakeLock.request('screen');
    if (!on && wake){ await wake.release(); wake = null; }
  } catch(e) {}
}

/* ---------------- chrome ---------------- */
function setBar(title, back){
  bar.innerHTML = `${back ? `<button class="backbtn" type="button" data-back aria-label="Back">${ic('back')}</button>` : '<span></span>'}<b>${esc(title)}</b><span></span>`;
  const b = $('[data-back]', bar); if (b) b.onclick = goBack;
}
function goBack(){ if (history.length > 1) history.back(); else location.hash = '#today'; }
function floatBack(){ return `<button class="backbtn floatback" type="button" data-back aria-label="Back">${ic('back')}</button>`; }
function wireBack(){ $$('[data-back]', view).forEach(b => b.onclick = goBack); }
function ring(done, total, size = 84, id = 'today'){
  const r = 36, C = 2 * Math.PI * r, f = total ? done / total : 0, from = tw('ring:' + id, f);
  return `<div class="ring${f >= 1 ? ' full' : ''}" style="width:${size}px;height:${size}px"><svg viewBox="0 0 84 84"><defs><linearGradient id="ringgrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd994"/><stop offset="1" stop-color="#de8c3a"/></linearGradient></defs>
    <circle class="bgc" cx="42" cy="42" r="${r}"/><circle class="fgc" cx="42" cy="42" r="${r}" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - from)).toFixed(1)}" data-tw data-p="o" data-v="${(C * (1 - f)).toFixed(1)}"/></svg>
    <div><span><b class="num" data-count="${done}">${done}</b><small>of ${total}</small></span></div></div>`;
}
function mini(f, rest){
  const r = 12, C = 2 * Math.PI * r;
  return `<svg class="mini" viewBox="0 0 30 30"><circle class="bgc" cx="15" cy="15" r="${r}"/>${f > 0 ? `<circle class="fgc" cx="15" cy="15" r="${r}" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - Math.min(1, f))).toFixed(1)}"/>` : ''}</svg>`;
}
function taskRow(t, opts = {}){
  const main = `<span class="tile r-${t.res}">${ic(t.icon)}</span><span class="tx"><b>${esc(t.label)}</b><small>${opts.time && t.at < '23:59' ? `<span class="at">${clock(t.at)}</span> · ` : ''}${t.pts ? `<em>+${t.pts} ${RESN[t.res].toLowerCase()}</em> · ` : ''}${esc(t.meta)}</small></span>`;
  return `<div class="row${t.done ? ' done' : ''}${opts.disabled ? '' : ' sw'}" data-key="${t.key}">
    ${t.go ? `<a class="main tap" href="${t.go}">${main}</a>` : `<div class="main" data-tick-row>${main}</div>`}
    ${t.meal && !opts.disabled ? `<button class="swapbtn" type="button" data-swap="${t.key}" aria-label="Swap ${esc(t.label)}">${ic('swap')}</button>` : ''}
    <button class="tick" type="button" data-task="${t.key}" aria-label="${t.done ? 'Undo' : 'Complete'} ${esc(t.label)}" ${opts.disabled ? 'disabled' : ''}>${ic('check', '')}</button></div>`;
}
function wireTicks(date = today()){
  $$('.tick[data-task]', view).forEach(b => b.addEventListener('click', () => toggleTask(b.dataset.task, b, date)));
  $$('[data-tick-row]', view).forEach(m => m.addEventListener('click', () => { const b = m.parentElement.querySelector('.tick'); if (b && !b.disabled) b.click(); }));
  wireSwipe('.row.sw[data-key]', row => { const b = $('.tick', row); if (b && !b.disabled) b.click(); });
  $$('[data-swap]', view).forEach(b => b.addEventListener('click', e => { e.stopPropagation(); haptic(); mealSheet(date, b.dataset.swap); }));
}
function toggleTask(key, btn, date = today()){
  const ds = Store.ymd(date), t = tasksFor(date).find(x => x.key === key); if (!t) return;
  // planning is earned in the planner: the checkbox opens it, or undoes this weekend's plan
  if (t.planTask){ const e = planDoneThisWeek(); if (e){ Store.undo(e.date, 'plan'); haptic(); setTimeout(rerender, 200); } else location.hash = '#plan'; return; }
  const before = Store.totals().all, dp0 = dayProgress(date);
  const rowEl = btn && btn.closest('.row');
  if (t.done){ Store.undo(ds, key); const sw = Store.getSwap(ds, key); if (sw && sw.type !== 'recipe') Store.setSwap(ds, key, null); if (rowEl) rowEl.classList.remove('done'); haptic(); }
  else {
    Store.complete(ds, key, t.label, t.type);
    if (rowEl) rowEl.classList.add('done');
    haptic(); burst(btn); reward(t.res, t.pts, t.label, () => { Store.undo(ds, key); toast('Undone.'); rerender(); }); celebrate(before);
    const dp1 = dayProgress(date);
    if (!weekend(dayKey(date)) && dp1.total && dp1.done === dp1.total && dp0.done < dp0.total){
      festival = true; announce('Day complete', 'The settlers are lighting lanterns', 'flame');
    }
  }
  setTimeout(rerender, 420);
}

/* Swipe a row to the right to check it off, like iOS Reminders. Tapping still works. */
function swallowClick(){
  const f = e => { e.preventDefault(); e.stopPropagation(); };
  document.addEventListener('click', f, {capture:true, once:true});
  setTimeout(() => document.removeEventListener('click', f, {capture:true}), 450);
}
function wireSwipe(sel, act, root = view){
  const TH = 72;
  $$(sel, root).forEach(row => {
    let x0 = null, y0 = 0, dx = 0, on = false, pid = null;
    const reset = () => { row.classList.remove('swiping', 'armed'); row.style.removeProperty('--sx'); x0 = null; on = false; pid = null; };
    row.addEventListener('pointerdown', e => { if (e.button) return; x0 = e.clientX; y0 = e.clientY; dx = 0; on = false; pid = e.pointerId; });
    row.addEventListener('pointermove', e => {
      if (x0 === null || e.pointerId !== pid) return;
      const mx = e.clientX - x0, my = e.clientY - y0;
      if (!on){
        if (Math.abs(my) > 10 && Math.abs(my) > Math.abs(mx)){ x0 = null; return; }
        if (mx > 12 && mx > Math.abs(my) * 1.4){ on = true; try { row.setPointerCapture(pid); } catch(err) {} row.classList.add('swiping'); }
        else return;
      }
      dx = Math.max(0, mx - 12);
      const d = dx < 96 ? dx : 96 + (dx - 96) * .3;
      row.style.setProperty('--sx', d.toFixed(1) + 'px');
      row.classList.toggle('armed', dx >= TH);
    });
    row.addEventListener('pointerup', e => {
      if (e.pointerId !== pid) return;
      const go = on && dx >= TH, was = on;
      reset();
      if (go) act(row);
      if (was) swallowClick();
    });
    row.addEventListener('pointercancel', reset);
  });
}
function rerender(){ const y = view.scrollTop; route(true); view.scrollTop = y; }

/* ---------------- island ---------------- */
function drawIsland(svg, prog = Store.progress(), anchor = .55, zoom = 1.12, id = 'h'){
  const live = id === 'h';
  if (live){ zoom = ISLE_ZOOM; anchor = ISLE_ANCHOR; }
  const ss = season(), r = Isle.isoScene(prog, Isle.PAL_B, id, {live, winter:ss.winter, holiday:ss.holiday, built:live ? builtSet() : null, crops:Store.state.crops});
  const box = svg.getBoundingClientRect();
  // the home island is framed from edge to edge with the dock and boat, centered on all of it
  // (the island stays big: the far west tip crops a little before the boat on the east side ever does)
  const w = live ? Math.max(2 * r.W * zoom, Math.min(r.ext[1] - r.ext[0] - 20, 2.12 * r.W * zoom)) : 2 * r.W * zoom, cx = live ? Math.max((r.ext[0] + r.ext[1]) / 2, r.ext[1] + 4 - w / 2) : 0, h = w * (box.height / Math.max(1, box.width));
  svg.setAttribute('viewBox', `${(cx - w / 2).toFixed(1)} ${(8 - anchor * h).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`);
  svg.innerHTML = r.svg;
  if (!live) return;
  baseVB = [cx - w / 2, 8 - anchor * h, w, h]; clampCam(); applyCam(svg);
  scene = r;
  const now = new Set(), delay = buildFocus ? .55 : 0;
  $$('.o', svg).forEach(g => {
    const k = g.dataset.k; now.add(k);
    if (seen && !seen.has(k) && k !== 'boat'){
      const o = r.vis.find(v => v.k === k); if (o) Life.construct(svg, g, o, delay);
    } else if (k === 'g' && lastGst !== null && r.gst > lastGst){
      const o = r.vis.find(v => v.k === 'g'); if (o) Life.construct(svg, g, o, delay);
    }
  });
  seen = now; lastGst = r.gst;
  if (newcomer) Life.boatIn(svg);
  const count = Math.min(16, Store.settlers());
  Life.start(svg, r, {count, newcomer:newcomer && Store.settlers() <= 16, winter:season().winter});
  newcomer = false;
}
let scene = null;
/* The island follows the real calendar: snow from December through February, the holiday tree
   from December 18 to 26, a winter festival on the weekend before Christmas, fireworks on New Year's Eve. */
function season(d = today()){
  const m = d.getMonth() + 1, day = d.getDate();
  const winter = m === 12 || m <= 2;
  const holiday = m === 12 && day >= 18 && day <= 26;
  const sat = new Date(d.getFullYear(), 11, 25); sat.setDate(25 - ((sat.getDay() + 1) % 7 || 7));
  const festival = m === 12 && (day === sat.getDate() || day === sat.getDate() + 1);
  const nye = m === 12 && day === 31;
  return {winter, holiday, festival, nye};
}
// The home island fits the screen with a little room around it, centered between the title and the Today card.
const ISLE_ZOOM = 1, ISLE_ANCHOR = .47;
function settlerStory(i, st, role){
  const ds = Store.ymd(today()), hour = today().getHours();
  const done = new Set(Store.state.log.filter(e => e.date === ds).map(e => e.res));
  const u = unlockState(), g = Store.gardens();
  const line = {
    storyteller: done.size ? 'You gave us a good day to talk about tonight.' : 'Every point you earn becomes a story we tell by this fire.',
    woodcutter: done.has('stone') ? 'Strong day. Your lifting keeps the woodpile high.' : 'A lifting session keeps the woodpile high.',
    scout: done.has('land') ? 'I walked the trail you opened today. It goes further now.' : 'New paths open when you walk. I will be by the shore.',
    farmer: done.has('harvest') ? 'The fields loved that home-cooked meal. Sprouts by morning.' : 'The fields are waiting on a home-cooked meal.',
    builder: u.next ? `Next up is ${BUILD[u.next.t]}. It takes ${u.parts.map(p => `${p.cost} ${RESN[p.r]}`).join(' and ')}, and we have ${u.parts.map(p => `${Math.min(p.have, p.cost)}`).join(' and ')} so far.` : 'Everything is built. I am drawing plans for season two.',
    gardener: `The Hanging Gardens are finished. ${Store.settlers()} of us live here now.`,
    merchant: done.has('harvest') ? 'Shelves are full today. Home cooking keeps the stall busy.' : 'The stall trades in what you cook. Cook at home and it fills up.',
    'water carrier': done.has('spirit') ? 'Fresh water and a rested village. Good sleep makes the hill easy.' : 'A good night of sleep makes the walk to the well easy.',
    lookout: `From up here I can count ${u.built} buildings. ${u.next ? `${BUILD_T[u.next.t]} is next.` : 'Nothing left to build.'}`,
    miller: done.has('harvest') ? 'The mill is turning. Your meals keep the grain coming.' : 'The mill grinds what the fields grow. Keep cooking at home.',
    lamplighter: hour >= 18 || hour < 5 ? 'Seven hours of sleep tonight and the lanterns burn brighter tomorrow.' : 'I light the lanterns at dusk. Sleep well and there is more oil.'
  }[role] || `The Hanging Gardens are at ${g.pct} percent.`;
  return {title:SETTLERS[i % SETTLERS.length], sub:`${role || 'settler'} · ${st || 'about'}`, line};
}
function buildingStory(k, t){
  if (t === 'gardens'){ const g = Store.gardens(); return {title:'Hanging Gardens', sub:`${g.label} · ${g.pct}%`, line:'The first Wonder. Every point you earn adds stone, soil and vines.'}; }
  if (t === 'longboat') return {title:'The lantern longboat', sub:'Moored at the dock', line:'Every time you finish something four settlers row it out and bring back cargo for the island.'};
  if (t === 'dock'){ const pn = portNext(); return {title:'The dock', sub:'Since day one', line:`Where the longboat ties up. ${pn ? `Pick ${BUILD_T[pn.t]} as a goal and it grows into a port.` : ''}`}; }
  if (PORTK.has(k)){ const e = (Store.state.built || []).find(x => x.k === k), pn = portNext(), paid = e ? Store.RES.filter(r => e.s[r]).map(r => `${Math.round(e.s[r])} ${RESN[r]}`).join(', ') : '';
    return {title:BUILD_T[t], sub:`Port · tier ${Isle.PORT.findIndex(u => u.k === k) + 1} of 3`, line:`${paid ? `Cost ${paid}. ` : ''}${pn ? `${BUILD_T[pn.t]} is the next tier, whenever you choose it.` : 'The port is finished.'}`}; }
  const base = {xmas:['The holiday tree', 'The settlers dragged it in from the pine grove and every one of them hung an ornament.'], fire:['The first campfire', 'Lit the night the settlers landed.'], tent:['The first tent', 'Where the first three settlers slept.'], tree:['Old tree', 'It was here before anyone arrived.']};
  const list = Isle.unlocks(), i = list.findIndex(u => u.k === k);
  if (i < 0){ const b = base[t] || ['Island', 'Part of the island.']; return {title:b[0], sub:'Since day one', line:b[1]}; }
  const e = (Store.state.built || []).find(x => x.k === k), paid = e ? Store.RES.filter(r => e.s[r]).map(r => `${Math.round(e.s[r])} ${RESN[r]}`).join(', ') : '';
  return {title:BUILD_T[t] || t, sub:`Built by ${SETTLERS[i % SETTLERS.length]}`, line:`${paid ? `Cost ${paid}. ` : ''}${i + 1} of ${list.length} things to build this season.`};
}
/* Tap on the island: meet a settler or a building in a pop-up that sits above everything,
   above the one you tapped if there is room under the title, otherwise below them. */
function closeBubble(){ $$('.bubble, .tapring').forEach(b => b.remove()); clearTimeout(worldTap.t); }
/* ---------------- island camera: pinch, pan, double-tap, glide ---------------- */
const cam = {s:1, cx:0, cy:0};
let baseVB = null, glideRAF = 0;
function applyCam(svg = $('#isl')){
  if (!svg || !baseVB) return;
  const [x, y, w, h] = baseVB, W = w / cam.s, Hh = h / cam.s, cx = x + w / 2 + cam.cx, cy = y + h / 2 + cam.cy;
  svg.setAttribute('viewBox', `${(cx - W / 2).toFixed(2)} ${(cy - Hh / 2).toFixed(2)} ${W.toFixed(2)} ${Hh.toFixed(2)}`);
  const world = svg.closest('.world');
  if (world){ world.classList.toggle('zoomed', cam.s > 1.02); world.style.touchAction = cam.s > 1.02 ? 'none' : 'pan-y'; }
}
function clampCam(){
  if (!baseVB) return;
  cam.s = Math.max(1, Math.min(3.4, cam.s));
  const [, , w, h] = baseVB, mx = w / 2 * (1 - 1 / cam.s) + w * .08 * (cam.s - 1), my = h / 2 * (1 - 1 / cam.s) + h * .08 * (cam.s - 1);
  cam.cx = Math.max(-mx, Math.min(mx, cam.cx)); cam.cy = Math.max(-my, Math.min(my, cam.cy));
}
/* svg point under a screen point, at the current camera */
function svgAt(svg, x, y){ const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; const r = pt.matrixTransform(svg.getScreenCTM().inverse()); return [r.x, r.y]; }
function glideTo(target, ms = 480){
  cancelAnimationFrame(glideRAF);
  const from = {...cam}, t0 = performance.now();
  const to = {s:target.s, cx:target.cx, cy:target.cy};
  { const keep = {...cam}; Object.assign(cam, to); clampCam(); Object.assign(to, cam); Object.assign(cam, keep); }
  return new Promise(done => {
    const step = t => {
      const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3);
      cam.s = from.s + (to.s - from.s) * e; cam.cx = from.cx + (to.cx - from.cx) * e; cam.cy = from.cy + (to.cy - from.cy) * e;
      applyCam();
      if (k < 1) glideRAF = requestAnimationFrame(step); else done();
    };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches){ Object.assign(cam, to); applyCam(); done(); } else glideRAF = requestAnimationFrame(step);
  });
}
/* Center the camera on an svg point at a zoom level, a little below the middle so a pop-up fits above it. */
function focusOn([x, y], s){ const [bx, by, w, h] = baseVB; return glideTo({s, cx:x - (bx + w / 2), cy:y - (by + h / 2) - h / s * .16}); }
function resetCam(){ return glideTo({s:1, cx:0, cy:0}); }
function wireCamera(world, svg){
  const pts = new Map(); let g = null, moved = false, lastTap = 0, tapTimer = 0;
  const upp = () => baseVB[2] / (cam.s * svg.getBoundingClientRect().width);
  const start = () => {
    const a = [...pts.values()];
    if (a.length === 2){ const mid = [(a[0].x + a[1].x) / 2, (a[0].y + a[1].y) / 2]; g = {pinch:true, d0:Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), s0:cam.s, p:svgAt(svg, ...mid)}; }
    else if (a.length === 1){ g = {pinch:false, x0:a[0].x, y0:a[0].y, cx0:cam.cx, cy0:cam.cy}; }
  };
  world.addEventListener('pointerdown', e => { pts.set(e.pointerId, {x:e.clientX, y:e.clientY}); moved = false; cancelAnimationFrame(glideRAF); start(); });
  world.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId) || !g) return;
    pts.set(e.pointerId, {x:e.clientX, y:e.clientY});
    const a = [...pts.values()];
    if (g.pinch && a.length === 2){
      const d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), mid = [(a[0].x + a[1].x) / 2, (a[0].y + a[1].y) / 2];
      cam.s = Math.max(1, Math.min(3.4, g.s0 * d / Math.max(1, g.d0)));
      // keep the point under the fingers where it was
      const r = svg.getBoundingClientRect(), u = baseVB[2] / (cam.s * r.width), [bx, by, w, h] = baseVB;
      cam.cx = g.p[0] - (mid[0] - (r.left + r.width / 2)) * u - (bx + w / 2);
      cam.cy = g.p[1] - (mid[1] - (r.top + r.height / 2)) * u - (by + h / 2);
      clampCam(); applyCam(svg); moved = true; closeBubble();
    } else if (!g.pinch && cam.s > 1.02){
      const dx = e.clientX - g.x0, dy = e.clientY - g.y0;
      if (!moved && Math.hypot(dx, dy) < 6) return;
      moved = true; closeBubble();
      const u = upp(); cam.cx = g.cx0 - dx * u; cam.cy = g.cy0 - dy * u; clampCam(); applyCam(svg);
    }
  });
  const end = e => { pts.delete(e.pointerId); if (moved) swallowClick(); if (pts.size) start(); else g = null; };
  world.addEventListener('pointerup', end); world.addEventListener('pointercancel', end);
  // single tap: meet whoever is there; double tap: zoom in there, or back out if already zoomed
  world.addEventListener('click', e => {
    const now = Date.now(), dbl = now - lastTap < 300; lastTap = now;
    clearTimeout(tapTimer);
    if (dbl){ closeBubble(); haptic(); if (cam.s > 1.3) resetCam(); else focusOn(svgAt(svg, e.clientX, e.clientY), 2.2); lastTap = 0; return; }
    const h = Life.hit(e.clientX, e.clientY, scene ? scene.vis : []);
    if (h){ worldTap(h); return; }
    closeBubble();
    if (cam.s <= 1.02) tapTimer = setTimeout(islandSheet, 300);
  });
}

/* Tap on the island: glide to the settler or building, then open a pop-up about them that sits
   above everything, above them if there is room under the title, otherwise below them. */
function closeBubble(){ $$('.bubble, .tapring').forEach(b => b.remove()); clearTimeout(worldTap.t); }
function worldTap(h){
  closeBubble(); haptic();
  const s = h.kind === 'settler' ? settlerStory(h.i, h.st, h.role) : buildingStory(h.k, h.t);
  focusOn(h.svg, Math.max(cam.s, h.kind === 'settler' ? 2.6 : 2)).then(() => {
    const at = Life.locate(h); if (!at) return;
    const ar = app.getBoundingClientRect();
    const ring = document.createElement('i'); ring.className = 'tapring';
    ring.style.left = (at.feet[0] - ar.left) + 'px'; ring.style.top = (at.feet[1] - ar.top) + 'px';
    if (h.kind === 'settler') ring.classList.add('big');
    app.appendChild(ring);
    const b = document.createElement('div');
    b.className = 'bubble'; b.setAttribute('role', 'status');
    b.innerHTML = `<b>${esc(s.title)}</b><span class="over gold">${esc(s.sub)}</span><p>${esc(s.line)}</p>`;
    app.appendChild(b);
    const bw = b.offsetWidth, bh = b.offsetHeight, ttl = $('.ttl', view), safeTop = ttl ? ttl.getBoundingClientRect().bottom + 8 : 80;
    const x = Math.max(12, Math.min(ar.width - bw - 12, at.x - ar.left - bw / 2));
    const above = at.y - bh - 10 >= safeTop;
    b.classList.toggle('below', !above);
    b.style.left = x + 'px';
    b.style.top = ((above ? at.y - bh - 10 : at.bottom + 12) - ar.top) + 'px';
    b.style.setProperty('--ax', Math.max(16, Math.min(bw - 16, at.x - ar.left - x)) + 'px');
    worldTap.t = setTimeout(() => { b.classList.add('out'); ring.remove(); setTimeout(() => b.remove(), 300); }, 5500);
  });
}
function islandSheet(){
  const t = Store.totals(), u = unlockState(), g = Store.gardens(), bal = u.bal;
  const upcoming = u.list.slice(u.built, u.built + 4);
  sheet(`<div class="grab"></div>
    <div><div class="over gold">Your island</div><h2 class="t2" style="margin-top:8px">Motley Island</h2></div>
    <div class="stats3"><div><span class="cap">Settlers</span><b>${Store.settlers()}</b></div><div><span class="cap">Built</span><b>${u.built}<span class="cap"> / ${u.list.length}</span></b></div><div><span class="cap">Points</span><b>${t.all}<span class="cap"> / ${Store.SEASON.total}</span></b></div></div>
    <div class="meters"><div class="gardens"><div class="meter2"><p>Hanging Gardens<b style="font-size:15px">${g.label}</b></p></div><div class="bar2"><i style="width:${g.pct}%"></i></div></div>
      ${Store.RES.map(k => `<div class="meter2" style="--c:var(--${k})"><p>${RESN[k]}<b class="num">${Math.max(0, Math.floor(bal[k]))}</b></p><span class="cap">${t[k]} earned this season</span></div>`).join('')}</div>
    ${upcoming.length ? `<div class="sect"><div class="sect-h"><span class="over">Coming next</span></div><div class="group">${upcoming.map(x => `<div class="row"><span class="tile r-gold">${ic(x.t.startsWith('g') ? 'harvest' : 'house')}</span><span class="tx"><b>${BUILD_T[x.t]}</b><small>${priceChips(costParts(x.k), true)}</small></span></div>`).join('')}</div></div>`
      : `<div class="callout">${ic('extra')}<span>Everything this season is built. Season two starts a new Wonder.</span></div>`}
    <p class="fine">Stone from strength work, Land from walks and pickleball, Harvest from meals, Spirit from sleep and mobility. Each building costs its own mix. Short on one? Settlers trade 2 of the others for it. Every 45 points earned brings a settler.</p>
    <a class="btn quiet wide" href="#chronicle">${ic('book')}The Island Chronicle</a>`);
}

/* ---------------- sheet ---------------- */
function sheet(html){
  layer.innerHTML = `<div class="scrim"></div><div class="sheet" role="dialog" aria-modal="true">${html}</div>`;
  $('.scrim', layer).onclick = () => closeLayer();
  const sh = $('.sheet', layer), grab = $('.grab', sh);
  if (grab){
    let g = null;
    grab.addEventListener('pointerdown', e => { g = {y0:e.clientY, id:e.pointerId, dy:0, t0:performance.now()}; try { grab.setPointerCapture(e.pointerId); } catch(err) {} sh.style.animation = 'none'; });
    grab.addEventListener('pointermove', e => { if (!g || e.pointerId !== g.id) return; g.dy = Math.max(0, e.clientY - g.y0); sh.style.transform = `translateY(${g.dy}px)`; });
    const end = e => {
      if (!g || e.pointerId !== g.id) return;
      const v = g.dy / Math.max(1, performance.now() - g.t0);
      if (g.dy > 110 || (v > .6 && g.dy > 30)) closeLayer(g.dy);
      else { sh.animate([{transform:`translateY(${g.dy}px)`}, {transform:'translateY(0)'}], {duration:260, easing:'cubic-bezier(.3,1.3,.5,1)'}); sh.style.transform = ''; }
      g = null;
    };
    grab.addEventListener('pointerup', end); grab.addEventListener('pointercancel', end);
  }
  return sh;
}
function closeLayer(fromY){
  const s = $('.sheet', layer);
  if (!s){ layer.innerHTML = ''; return; }
  s.animate([{transform:`translateY(${typeof fromY === 'number' ? fromY : 0}px)`}, {transform:'translateY(100%)'}], {duration:280, easing:'cubic-bezier(.4,0,1,1)', fill:'forwards'}).onfinish = () => { layer.innerHTML = ''; };
  const sc = $('.scrim', layer); if (sc) sc.animate([{opacity:1}, {opacity:0}], {duration:280, fill:'forwards'});
}

/* ---------------- Isle ---------------- */
function vToday(){
  const now = today(), d = dayKey(now), sw = Store.seasonWeek();
  const tasks = tasksFor(now), dp = dayProgress(now), menu = M.menu[d], fest = weekend(d);
  const hour = now.getHours(), greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const parts = dayParts(d), hm = `${String(hour).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const partOf = at => parts.reduce((k, p, i) => at >= p[2] ? i : k, 0);
  const nowPart = partOf(hm);
  const open = tasks.filter(x => !x.done && !x.optional);
  const next = open.find(x => partOf(x.at) >= nowPart) || open[0];
  let cta = '';
  if (next){
    if (next.session) cta = `<a class="btn wide" href="#play/${next.session}">${ic('play', 'i solid')}Start ${esc(next.label)}</a>`;
    else if (next.recipe) cta = `<a class="btn wide" href="${next.go}">${ic(next.icon)}Cook ${esc(next.label)}</a>`;
    else if (next.planTask) cta = `<a class="btn wide" href="#plan">${ic('calendar')}Plan next week</a>`;
    else cta = `<button class="btn wide" type="button" data-cta="${next.key}">${ic('check')}Mark ${esc(next.label.toLowerCase())} done</button>`;
  }
  const left = dp.total - dp.done;
  const line = fest ? 'Festival day. Nothing is required, and anything you do still builds.' :
    left === 0 ? 'Everything is done. The settlers are celebrating.' :
    `${greet}.${next && next.at < '23:59' ? (next.type === 'sleep' ? ' Start by logging last night\'s sleep.' : ` Next up: ${SLOT[next.type] ? SLOT[next.type].toLowerCase() : next.label} at ${clock(next.at)}.`) : ''}`;
  const mon = Store.parse(Store.mondayOf(now));
  const weekHTML = DAYS.map((dk, i) => {
    const dt = new Date(mon); dt.setDate(mon.getDate() + i);
    const future = dt > now && dk !== d, p = dayProgress(dt);
    return `<button type="button" data-off="${i - DAYS.indexOf(d)}" aria-label="See ${DAYN[dk]}" class="tap${dk === d ? ' today' : ''}${weekend(dk) ? ' rest' : ''}">${mini(future ? 0 : p.done / Math.max(1, p.total), weekend(dk))}${DAYN[dk][0]}</button>`;
  }).join('');
  const groups = parts.map((p, i) => [p[0], tasks.filter(x => partOf(x.at) === i), p[1], i === nowPart]);
  view.innerHTML = `<header class="lhead"><div class="row1"><div><span class="over gold">${DAYN[d]} · ${now.toLocaleDateString(undefined, {month:'short', day:'numeric'})} · week ${sw}</span><h1 class="lt" style="margin-top:6px">${fest ? 'Festival day' : left === 0 ? 'Day complete' : 'Today'}</h1></div>
      <a class="iconbtn tap" href="#settings" aria-label="Settings">${ic('gear')}</a></div></header>
    <div class="page stagger" style="margin-top:20px">
      <section class="card today">
        ${ring(dp.done, dp.total)}
        <div class="tx"><span class="cap" style="font-size:14px">${line}</span></div>
        ${cta}
      </section>
      ${recapDue() ? `<button class="harvest tap" type="button" id="harvest"><span class="over gold">${dayKey(today()) === 'sun' ? 'Sunday harvest' : 'Last week on the island'}</span><span class="hl">${esc(chapterTitle(weekSummary(recapDue())))}</span><span class="cap">See what your week built and read this week's chapter</span>${ic('chev', 'i chev')}</button>` : ''}
      ${showCodeCard() ? `<div class="callout savecode" id="savecode">${ic('upload')}<span><b>Your island backs up online.</b> Save your backup code to Notes once, so a new phone can bring everything back.<span class="sc-btns"><button class="btn small" type="button" id="scsave">Save to Notes</button><button class="linkbtn" type="button" id="sclater">Later</button></span></span></div>` : ''}
      ${menu && menu.heads ? `<div class="callout">${ic('info')}<span>${esc(menu.heads)}</span></div>` : ''}
      ${d === 'sun' ? `<a class="callout tap" href="#prep/sun/${nextW() || mealWeek()}">${ic('calendar')}<span>Prep day. Shop the Market list, then open Sunday prep.</span></a>` : ''}
      <div class="week" aria-label="This week">${weekHTML}</div>
      <section class="sect">
      <div class="timeline">${groups.map(([name, list, sub, isNow]) => list.length ? `<div class="part${isNow ? ' now' : ''}"><div class="part-h"><span class="over${isNow ? ' gold' : ''}">${name}${isNow ? ' · now' : ''}</span>${sub ? `<span class="cap">${sub}</span>` : ''}</div>
        <div class="group">${list.map(x => taskRow(x, {time:true})).join('')}</div></div>` : '').join('')}</div></section>
      <div class="group"><div class="row"><button class="main tap" type="button" id="extra" style="all:unset;cursor:pointer;flex:1;display:flex;align-items:center;gap:14px"><span class="tile r-gold">${ic('extra')}</span><span class="tx"><b>Log something extra</b><small>A hike, a bike ride, extra sets</small></span></button>${ic('plus', 'i chev')}</div></div>
    </div>`;
  scrollAt = 60; setBar('Today');
  const scs = $('#scsave'); if (scs) scs.onclick = () => saveCode();
  const hv = $('#harvest'); if (hv) hv.onclick = () => { haptic(); harvestSheet(recapDue()); };
  const scl = $('#sclater'); if (scl) scl.onclick = () => { codeLater = true; haptic(); const c = $('#savecode'); c.animate([{opacity:1}, {opacity:0, transform:'scale(.97)'}], {duration:220}); setTimeout(() => c.remove(), 230); };
  wireTicks();
  const c = $('[data-cta]'); if (c) c.onclick = () => toggleTask(c.dataset.cta, $(`.tick[data-task="${c.dataset.cta}"]`));
  $('#extra').onclick = openExtra;
  $$('.week button', view).forEach(b => b.onclick = () => { haptic(); daySheet(+b.dataset.off); });
  const rb = $('.ring b[data-count]', view); countUp(rb, lastDone, dp.done); lastDone = dp.done;
  playTw();
}
/* The island, full screen: balances and the next building on top of it. */
function vIsle(){
  const sw = Store.seasonWeek(), u = unlockState(), bal = u.bal;
  view.innerHTML = `<div class="isleful">
    <div class="world full" id="world" role="button" aria-label="Your island. Tap a settler or a building to meet them, or anywhere else for details."><svg id="isl" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet"></svg></div>
    <div class="topfade"></div>
    <header class="ttl"><div><div class="over">Season one · week ${sw} of 12</div><h1 class="lt">Motley Island</h1></div>
      <span class="hbtns"><a class="iconbtn tap" href="#chronicle" aria-label="The Island Chronicle">${ic('book')}</a><a class="iconbtn tap" href="#settings" aria-label="Settings">${ic('gear')}</a></span></header>
    <div class="hud">
      <div class="resbar">${Store.RES.map(r => `<span class="rchip r-${r}">${ic(r)}<b class="num">${Math.max(0, Math.floor(bal[r]))}</b></span>`).join('')}<span class="rchip r-gold">${ic('people')}<b class="num">${Store.settlers()}</b></span></div>
      ${u.next ? `<button class="nextup glassy tap" type="button" id="nextup">
        <span class="tile r-gold">${ic(u.next.t.startsWith('g') ? 'harvest' : 'house')}</span>
        <span class="tx"><span class="over gold">${Store.state.target ? 'Saving for' : 'Building next'} · tap to choose</span><span class="hl">${BUILD_T[u.next.t]}</span>
        ${priceChips(u.parts)}<span class="meter">${twBar('next', u.pct)}</span></span></button>` : `<div class="nextup glassy"><span class="tx"><span class="over gold">Season complete</span><span class="hl">Everything is built</span></span></div>`}
    </div></div>`;
  scrollAt = 99999; setBar('Motley Island');
  const world = $('#world');
  Life.sky(world, {winter:season().winter});
  drawIsland($('#isl'));
  wireCamera(world, $('#isl'));
  world.insertAdjacentHTML('beforeend', `<button class="camreset" type="button" aria-label="Show the whole island">${ic('isle')}Whole island</button>`);
  $('.camreset', world).addEventListener('click', e => { e.stopPropagation(); haptic(); closeBubble(); resetCam(); });
  const nu = $('#nextup'); if (nu && nu.tagName === 'BUTTON') nu.onclick = () => { haptic(); buildSheet(); };
  playTw();
  if (buildFocus || festival || gardensFest){
    const fest = festival, gf = gardensFest; buildFocus = false; festival = false; gardensFest = false;
    setTimeout(() => {
      if (fest) setTimeout(() => { Life.lanterns(world); Life.fireworks(world, 6); }, 350);
      if (gf) setTimeout(() => { Life.bunting($('#isl'), scene); Life.fireworks(world, 8); }, 2600);
    }, 40);
  }
  playIslandFx(world);
  seasonalMoment(world);
}
const CROPN = {greens:'Greens', wheat:'Wheat', pumpkins:'Pumpkins', berries:'Berries'};
/* Choose what the settlers build next, and what each farm plot grows. */
function buildSheet(){
  const b = builtSet(), choices = buildChoices(b), cur = nextUp(b), tgt = Store.state.target, pn = portNext(b);
  const farms = (Store.state.built || []).filter(e => Isle.unlocks().find(u => u.k === e.k && u.t === 'farm'));
  const sh = sheet(`<div class="grab"></div><div><div class="over gold">The settlers are ready</div><h2 class="t2" style="margin-top:8px">What should they build next?</h2></div>
    <div class="group">${choices.map(u => `<button type="button" class="row tap choice${cur && cur.k === u.k ? ' on' : ''}" data-k="${u.k}"><span class="tile r-gold">${ic(u.t.startsWith('g') ? 'harvest' : 'house')}</span><span class="tx"><b>${BUILD_T[u.t]}${cur && cur.k === u.k ? ' <span class="cap">· saving for this</span>' : ''}</b>${priceChips(costParts(u.k), true)}</span></button>`).join('')}</div>
    ${pn ? `<div class="sect"><div class="sect-h"><span class="over">Grow the port</span></div><div class="group"><button type="button" class="row tap choice${cur && cur.k === pn.k ? ' on' : ''}" data-k="${pn.k}"><span class="tile r-land">${ic('anchor')}</span><span class="tx"><b>${BUILD_T[pn.t]}${cur && cur.k === pn.k ? ' <span class="cap">· saving for this</span>' : ` <span class="cap">· tier ${Isle.PORT.indexOf(pn) + 1} of 3</span>`}</b>${priceChips(costParts(pn.k), true)}</span></button></div></div>` : ''}
    <p class="fine">Whatever you pick, resources go toward it first. ${tgt ? 'After it is built the settlers go back to the usual order.' : 'Right now they are following the usual order.'}</p>
    ${farms.length ? `<div class="sect"><div class="sect-h"><span class="over">What your fields grow</span></div><div class="group">${farms.map((e, i) => { const now = (Store.state.crops || {})[e.k] || ['greens', 'wheat', 'pumpkins'][i % 3];
      return `<div class="row fieldrow"><span class="tx"><b>Field ${i + 1}</b></span><span class="cropchips">${Object.keys(CROPN).map(c => `<button type="button" class="cropbtn c-${c}${now === c ? ' on' : ''}" data-f="${e.k}" data-c="${c}">${CROPN[c]}</button>`).join('')}</span></div>`; }).join('')}</div></div>` : ''}`);
  $$('.choice', sh).forEach(x => x.onclick = () => {
    const k = x.dataset.k, def = buildChoices(b, 1)[0];
    Store.setTarget(def && def.k === k ? null : k); haptic();
    const before = Store.totals().all; celebrate(before);
    closeLayer(); toast(`The settlers are saving for ${BUILD[allBuilds().find(u => u.k === k).t]}.`); setTimeout(rerender, 300);
  });
  $$('.cropbtn', sh).forEach(x => x.onclick = () => { Store.setCrop(x.dataset.f, x.dataset.c); haptic(); $$(`.cropbtn[data-f="${x.dataset.f}"]`, sh).forEach(y => y.classList.toggle('on', y === x)); const svg = $('#isl'); if (svg){ const keep = seen; drawIsland(svg); seen = keep; } });
}
function seasonalMoment(world){
  const ss = season(), ds = Store.ymd(today());
  if (ss.winter && !prefs.winterSeen){ setPref('winterSeen', ds); setTimeout(() => announce('Winter has come to the island', 'Snow on the rooftops', 'spirit'), 900); }
  if ((ss.festival || ss.nye) && prefs.festSeen !== ds){
    setPref('festSeen', ds);
    setTimeout(() => {
      announce(ss.nye ? 'Happy New Year' : 'The winter festival', ss.nye ? 'Fireworks over the island' : 'Lights, lanterns and a tree in the square', 'flame');
      Life.fireworks(world, ss.nye ? 10 : 7); Life.lanterns(world); if (ss.festival) Life.bunting($('#isl'), scene);
    }, 1200);
  }
}
/* Play queued task effects once the island is actually on screen. */
function playIslandFx(world){
  if (!islandFx.length) return;
  const io = new IntersectionObserver(entries => {
    if (!entries.some(e => e.isIntersecting)) return;
    io.disconnect();
    const list = islandFx.splice(0), svg = $('#isl');
    const nextT = (() => { const u = unlockState(); if (!u.next) return null; if (PORTK.has(u.next.k) && scene) return scene.dock.at; const o = Isle.OBJ.find(x => x.k === u.next.k) || Isle.OBJ.find(x => x.k === 'g'); return o ? Isle.P(o.x + (o.w || 1) / 2, o.y + (o.h || 1) / 2) : null; })();
    if (svg && svg.isConnected) Life.delivery(svg, scene, list.map(f => f.res));
    list.forEach((f, i) => setTimeout(() => { if (svg && svg.isConnected) Life.fx(svg, scene, f.res, f.pts, nextT); }, 500 + i * 1100));
  }, {threshold:.45});
  io.observe(world);
}
let lastDone = null;

/* ---------------- swapping meals ---------------- */
const loadWeek = n => MW[n] ? Promise.resolve(MW[n]) : fetch(`data/meals-week${n}.json`).then(r => r.json()).then(j => (MW[n] = j)).catch(() => null);
const loadAllWeeks = () => Promise.all(MEAL_WEEKS.map(loadWeek));
let DISHES = null;
const loadDishes = () => DISHES ? Promise.resolve(DISHES) : fetch('data/dishes.json').then(r => r.json()).then(j => (DISHES = j));
function dateOf(dk, near){ const mon = Store.parse(Store.mondayOf(near)); const d = new Date(mon); d.setDate(mon.getDate() + DAYS.indexOf(dk)); return d; }
function logMeal(ds, slot, label, pts, swap){
  const before = Store.totals().all;
  if (Store.isDone(ds, slot)) Store.undo(ds, slot);
  Store.setSwap(ds, slot, swap);
  Store.completeWith(ds, slot, label, 'harvest', pts);
  closeLayer(); haptic();
  if (pts > 0){ reward('harvest', pts, label, () => { Store.undo(ds, slot); Store.setSwap(ds, slot, null); toast('Undone.'); rerender(); }); celebrate(before); }
  else toast('Logged. No points, no guilt.');
  setTimeout(rerender, 320);
}
async function mealSheet(date, slot){
  const ds = Store.ymd(date), dk = dayKey(date), wn = mealWeekOf(date), D = MW[wn] || M, menu = D.menu[dk];
  if (!menu) return;
  const cur = mealTask(ds, slot, menu, D, wn), sw = Store.getSwap(ds, slot), plannedId = menu[slot];
  // leftovers: a dinner that feeds a later lunch, or a lunch that is an earlier dinner
  let chain = '';
  const order = DAYS.slice(0, 5);
  if (slot === 'dinner'){ const later = order.slice(order.indexOf(dk) + 1).find(x => D.menu[x] && D.menu[x].lunch === plannedId);
    if (later) chain = `<div class="callout">${ic('info')}<span>This dinner also makes ${DAYN[later]}'s lunch. <button class="linkbtn inline" type="button" id="chain" data-day="${later}">Swap that lunch too</button></span></div>`; }
  if (slot === 'lunch'){ const earlier = order.slice(0, order.indexOf(dk)).reverse().find(x => D.menu[x] && D.menu[x].dinner === plannedId);
    if (earlier) chain = `<div class="callout">${ic('info')}<span>This lunch is the leftovers from ${DAYN[earlier]}'s dinner.</span></div>`; }
  const sh = sheet(`<div class="grab"></div><div><div class="over gold">${SLOT[slot]} · ${DAYN[dk]}</div><h2 class="t2" style="margin-top:8px">${sw ? 'Change' : 'Swap'} ${esc(cur.label)}</h2></div>
    ${chain}
    <div class="swapacts">
      <button type="button" id="aout"><span class="tile r-gold">${ic('out')}</span><b>Ate out</b><small>Search a dish</small></button>
      <button type="button" id="ahome"><span class="tile r-harvest">${ic('kitchen')}</span><b>Made something else</b><small>Full points</small></button>
      <button type="button" id="askip"><span class="tile">${ic('minus')}</span><b>Skip it</b><small>No points, no guilt</small></button>
    </div>
    ${sw ? `<button class="btn quiet wide" type="button" id="aplan">Back to the plan: ${esc(D.recipes[plannedId] ? D.recipes[plannedId].name : 'planned meal')}</button>` : ''}
    <label class="field"><span class="cap">Or swap in another recipe</span><input id="rq" type="search" placeholder="Search every recipe" autocomplete="off"></label>
    <div id="rlist"><p class="fine">Loading recipes…</p></div>`);
  sh.classList.add('swapsheet');
  const ch = $('#chain', sh); if (ch) ch.onclick = () => { const d2 = dateOf(ch.dataset.day, date); closeLayer(); setTimeout(() => mealSheet(d2, 'lunch'), 300); };
  $('#aout', sh).onclick = () => outSheet(date, slot);
  $('#ahome', sh).onclick = () => homeSheet(date, slot);
  $('#askip', sh).onclick = () => logMeal(ds, slot, `Skipped ${SLOT[slot].toLowerCase()}`, 0, {type:'skip'});
  const ap = $('#aplan', sh); if (ap) ap.onclick = () => { if (sw.type !== 'recipe') Store.undo(ds, slot); Store.setSwap(ds, slot, null); closeLayer(); haptic(); toast('Back to the plan.'); setTimeout(rerender, 300); };
  await loadAllWeeks();
  if (!sh.isConnected) return;
  mountRecipePicker(sh, {slot, wn, plannedId, D, onPick:(n, id, r) => {
    if (sw && sw.type !== 'recipe') Store.undo(ds, slot);
    Store.setSwap(ds, slot, {type:'recipe', id, wk:n, name:r.name, minutes:r.minutes});
    closeLayer(); haptic(); toast(`Swapped in ${r.name}.`); setTimeout(rerender, 300);
  }});
}
/* A searchable list of every recipe from every week: fits-the-meal first, then favorites, this week, earlier weeks.
   Recipes from other weeks list the groceries you would still need. */
function mountRecipePicker(sh, {slot, wn, plannedId, D, onPick}){
  const have = new Set([...D.groceries.map(g => g.name.toLowerCase()), ...(D.have || []).map(h => h.name.toLowerCase())]);
  const all = [];
  MEAL_WEEKS.forEach(n => { const W2 = MW[n]; if (!W2) return; Object.entries(W2.recipes).forEach(([id, r]) => { if (r.component || r.cuisine === 'Snack' || (n === wn && id === plannedId)) return;
    const need = n === wn ? [] : (r.ingredients || []).filter(i => i.g).map(i => (W2.groceries.find(g => g.id === i.g) || {}).name).filter(x => x && !have.has(x.toLowerCase()));
    all.push({id, n, r, need, fav:Store.isFav(`${n}:${id}`)}); }); });
  const fits = x => (x.r.cuisine === 'Breakfast') === (slot === 'breakfast');
  const seenName = new Set(), uniq = all.sort((a, b) => (fits(b) - fits(a)) || (b.fav - a.fav) || ((b.n === wn) - (a.n === wn)) || (b.n - a.n)).filter(x => { const k = x.r.name.toLowerCase(); if (seenName.has(k)) return false; seenName.add(k); return true; });
  const rowH = x => `<button class="row tap" type="button" data-pick="${x.n}:${x.id}" style="all:unset;box-sizing:border-box;cursor:pointer;display:flex;align-items:center;gap:14px;padding:12px 14px;min-height:64px;position:relative;width:100%"><span class="tile ctile c-${x.r.cuisine}">${ic(x.r.cuisine)}</span><span class="tx"><b>${x.fav ? '<span class="favdot">♥</span> ' : ''}${esc(x.r.name)}</b><small>${x.n === wn ? 'This week' : `Week ${x.n}`} · ${x.r.minutes} min · ${x.r.protein}g protein${x.need.length ? ` · need ${esc(x.need.slice(0, 3).join(', ').toLowerCase())}${x.need.length > 3 ? '…' : ''}` : ''}</small></span></button>`;
  const paint = () => {
    const q = $('#rq', sh).value.trim().toLowerCase();
    const list = uniq.filter(x => !q || x.r.name.toLowerCase().includes(q) || x.r.cuisine.toLowerCase().includes(q));
    const fav = list.filter(x => x.fav), wk = list.filter(x => !x.fav && x.n === wn && (q || fits(x))), rest = list.filter(x => !x.fav && x.n !== wn && (q || fits(x))), other = q ? [] : list.filter(x => !x.fav && !fits(x));
    const grp = (t, a) => a.length ? `<div class="sect-h" style="margin-top:6px"><span class="over">${t}</span></div><div class="group">${a.slice(0, q ? 40 : 30).map(rowH).join('')}</div>` : '';
    $('#rlist', sh).innerHTML = (grp('Favorites', fav) + grp('This week', wk) + grp('Earlier weeks', rest) + grp(slot === 'breakfast' ? 'Lunch and dinner recipes' : 'Breakfast recipes', other)) || '<p class="fine">No recipes match.</p>';
    $$('[data-pick]', sh).forEach(b => b.onclick = () => { const [n, id] = b.dataset.pick.split(':'); onPick(+n, id, MW[+n].recipes[id]); });
  };
  $('#rq', sh).addEventListener('input', paint); paint();
}
async function outSheet(date, slot){
  const ds = Store.ymd(date), data = await loadDishes(), PT = data.points;
  const sh = sheet(`<div class="grab"></div><div><div class="over gold">Ate out · ${SLOT[slot]}</div><h2 class="t2" style="margin-top:8px">What did you have?</h2></div>
    <label class="field"><input id="dq" type="search" placeholder="Burger, burrito bowl, pad thai…" autocomplete="off"></label>
    <div class="tierkey"><span class="tier L">Light +${PT.L}</span><span class="tier B">Balanced +${PT.B}</span><span class="tier I">Indulgent +${PT.I}</span></div>
    <div id="dlist"></div>`);
  sh.classList.add('swapsheet');
  const pickTier = t => `<span class="tier ${t}">${TIERN[t]} · +${PT[t]}</span>`;
  const confirm = (name, tier, warn) => {
    let extra = false;
    sh.innerHTML = `<div class="grab"></div><div><div class="over gold">Ate out · ${SLOT[slot]}</div><h2 class="t2" style="margin-top:8px">${esc(name)}</h2></div>
      ${tier ? `<div>${pickTier(tier)}</div>` : `<div class="tierpick">${['L', 'B', 'I'].map(t => `<button type="button" data-t="${t}" class="tier ${t}">${cap1(TIERN[t])} +${PT[t]}</button>`).join('')}</div>`}
      ${warn ? `<div class="callout warn">${ic('info')}<span>${esc(warn)}</span></div>` : ''}
      <div class="group"><label class="row extra"><input type="checkbox" id="x1"><span class="tx"><b>Made a good call</b><small>Boxed half to go, swapped fries for a salad or veggies, or water instead of soda</small></span><em>+${PT.bonus}</em></label></div>
      <button class="btn wide" type="button" id="dlog" ${tier ? '' : 'disabled'}>Log it</button>`;
    let t = tier;
    const upd = () => { const b = $('#dlog', sh); b.disabled = !t; b.textContent = t ? `Log it · +${PT[t] + (extra ? PT.bonus : 0)} Harvest` : 'Pick how healthy it was'; };
    $$('.tierpick button', sh).forEach(b => b.onclick = () => { t = b.dataset.t; haptic(); $$('.tierpick button', sh).forEach(x => x.classList.toggle('on', x === b)); upd(); });
    $('#x1', sh).onchange = e => { extra = e.target.checked; haptic(); upd(); };
    $('#dlog', sh).onclick = () => { const pts = PT[t] + (extra ? PT.bonus : 0); logMeal(ds, slot, `Ate out: ${name}`, pts, {type:'out', dish:name, tier:t, pts}); };
    upd();
  };
  const paint = () => {
    const q = $('#dq', sh).value.trim().toLowerCase();
    const list = data.dishes.filter(x => !q || x.n.toLowerCase().includes(q) || x.c.toLowerCase().includes(q));
    $('#dlist', sh).innerHTML = `<div class="group">${list.slice(0, q ? 60 : 24).map((x, i) => `<button type="button" class="row tap dish" data-i="${data.dishes.indexOf(x)}"><span class="tx"><b>${esc(x.n)}</b><small>${esc(x.c)}${x.w ? ' · <span class="warnword">check first</span>' : ''}</small></span><span class="tier ${x.t}">+${PT[x.t]}</span></button>`).join('')}
      <button type="button" class="row tap dish" id="dcustom"><span class="tile r-gold">${ic('plus')}</span><span class="tx"><b>${q ? `Something else: "${esc($('#dq', sh).value.trim())}"` : 'Something else'}</b><small>Name it and pick how healthy it was</small></span></button></div>`;
    $$('.dish[data-i]', sh).forEach(b => b.onclick = () => { const x = data.dishes[+b.dataset.i]; haptic(); confirm(x.n, x.t, x.w); });
    $('#dcustom', sh).onclick = () => { const nm = $('#dq', sh).value.trim(); if (nm) { haptic(); confirm(nm, null, null); } else { $('#dq', sh).focus(); toast('Type what you had first.'); } };
  };
  $('#dq', sh).addEventListener('input', paint); paint();
}
function homeSheet(date, slot){
  const ds = Store.ymd(date);
  const sh = sheet(`<div class="grab"></div><div><div class="over gold">Made something else · ${SLOT[slot]}</div><h2 class="t2" style="margin-top:8px">What did you make?</h2></div>
    <label class="field"><input id="hq" type="text" maxlength="60" placeholder="Turkey sandwich, eggs and toast…" autocomplete="off"></label>
    <p class="fine">Home cooking earns the full ${Store.PTS[slot].pts} Harvest.</p>
    <button class="btn wide" type="button" id="hlog">Log it · +${Store.PTS[slot].pts} Harvest</button>`);
  $('#hlog', sh).onclick = () => { const nm = $('#hq', sh).value.trim() || 'Something homemade'; logMeal(ds, slot, nm, Store.PTS[slot].pts, {type:'home', name:nm}); };
}

/* ---------------- weekly planner ----------------
   A calendar week's plan is its meal file plus any recipe swaps on its dates. The grocery list is rebuilt
   from the recipes actually chosen: added recipes bring their groceries, items only dropped meals needed
   fall off, building blocks nothing uses anymore fall off, and anything already at home is not bought again. */
const nextMonday = () => { const m = Store.parse(Store.mondayOf(today())); m.setDate(m.getDate() + 7); return m; };
const monOfShown = wk => wk === mealWeek() ? Store.parse(Store.mondayOf(today())) : nextMonday();
function weekRefs(mon){
  const wn = mealWeekOf(mon), D = MW[wn] || M, refs = [];
  DAYS.slice(0, 5).forEach((dk, i) => {
    const menu = D.menu[dk]; if (!menu) return;
    const d = new Date(mon); d.setDate(mon.getDate() + i); const ds = Store.ymd(d);
    Object.keys(SLOT).forEach(slot => { const sw = Store.getSwap(ds, slot);
      if (sw && sw.type === 'recipe') refs.push({wk:sw.wk, id:sw.id, swapped:true});
      else refs.push({wk:wn, id:menu[slot]}); });
  });
  return {wn, D, refs};
}
function plannedGroceries(mon){
  const {wn, D, refs} = weekRefs(mon);
  const ready = refs.every(x => MW[x.wk]);
  if (!ready || !refs.some(x => x.swapped)) return {wn, D, list:D.groceries.map(g => Object.assign({uid:g.id, from:wn}, g)), added:[], dropped:[], swaps:0, ready};
  const seen = new Set(), need = [];
  // A swapped-in recipe that leans on its own week's building block uses this week's equivalent when there is one
  // (roasted vegetables, rice, a yogurt sauce), so the list does not grow a second tray of vegetables.
  const KIND = [['roast', 'vegetable', 'roots', 'tray'], ['rice'], ['yogurt', 'feta', 'ranch', 'tzatziki', 'crema'], ['marinara'], ['pickled']];
  const kindOf = name => KIND.findIndex(ws => ws.some(w => name.toLowerCase().includes(w)));
  const local = {}; Object.entries(D.recipes).forEach(([id, r]) => { if (r.component){ const k = kindOf(r.name); if (k >= 0 && !(k in local)) local[k] = id; } });
  const visit = (wk, id) => { const k = wk + ':' + id; if (seen.has(k)) return; seen.add(k); const r = MW[wk] && MW[wk].recipes[id]; if (!r) return; need.push({wk, id, r});
    (r.ingredients || []).forEach(i => { if (!i.r) return; const sub = MW[wk].recipes[i.r]; const kd = wk !== wn && sub && sub.component ? kindOf(sub.name) : -1; if (kd >= 0 && local[kd]) visit(wn, local[kd]); else visit(wk, i.r); }); };
  refs.forEach(x => visit(x.wk, x.id));
  const inRecipes = new Set(); Object.values(D.recipes).forEach(r => (r.ingredients || []).forEach(i => i.g && inRecipes.add(i.g)));
  const used = new Set(); need.filter(x => x.wk === wn).forEach(x => x.r.ingredients.forEach(i => i.g && used.add(i.g)));
  const haveN = new Set((D.have || []).map(h => h.name.toLowerCase())), byName = new Map();
  // keep this week's items still needed, plus snack items no recipe uses
  D.groceries.forEach(g => { if (used.has(g.id) || !inRecipes.has(g.id)) byName.set(g.name.toLowerCase(), Object.assign({uid:g.id, from:wn}, g)); });
  // add what swapped-in recipes from other weeks need
  need.filter(x => x.wk !== wn).forEach(x => x.r.ingredients.forEach(i => { if (!i.g) return; const g = MW[x.wk].groceries.find(y => y.id === i.g); if (!g) return;
    const k = g.name.toLowerCase(); if (byName.has(k) || haveN.has(k)) return; byName.set(k, Object.assign({}, g, {uid:`${x.wk}~${g.id}`, from:x.wk, forRecipe:x.r.name})); }));
  const list = [...byName.values()];
  return {wn, D, list, added:list.filter(g => g.from !== wn), dropped:D.groceries.filter(g => !byName.has(g.name.toLowerCase())), swaps:refs.filter(x => x.swapped).length, ready};
}
function planDoneThisWeek(){
  const mon = Store.ymd(Store.parse(Store.mondayOf(today()))), sunD = Store.parse(mon); sunD.setDate(sunD.getDate() + 6); const sun = Store.ymd(sunD);
  return Store.state.log.find(e => e.key === 'plan' && e.date >= mon && e.date <= sun) || null;
}
function lockPlan(){
  if (planDoneThisWeek()) return;
  const before = Store.totals().all, ds = Store.ymd(today());
  Store.complete(ds, 'plan', "Planned next week's meals", 'plan');
  haptic(); reward('harvest', Store.PTS.plan.pts, "Planned next week's meals", () => { Store.undo(ds, 'plan'); toast('Undone.'); rerender(); }); celebrate(before);
}
async function vPlan(){
  const mon = nextMonday(), wnPre = mealWeekOf(mon);
  view.innerHTML = `${floatBack()}<header class="lhead" style="padding-top:calc(var(--top) + 66px)"><span class="over gold">Weekly planner</span><h1 class="lt">Plan next week</h1></header><div class="page"><p class="fine">Loading every recipe…</p></div>`;
  scrollAt = 90; setBar('Plan next week', true); wireBack();
  await loadAllWeeks();
  if (location.hash !== '#plan') return;
  const G = plannedGroceries(mon), D = G.D, wn = G.wn, total = G.list.reduce((a, g) => a + g.price, 0), done = planDoneThisWeek();
  const fromDate = mon.toLocaleDateString(undefined, {month:'short', day:'numeric'}), fri = new Date(mon); fri.setDate(mon.getDate() + 4);
  const blocks = Object.entries(D.recipes).filter(([, r]) => r.component), refs = weekRefs(mon).refs;
  const usesBlock = id => { const seen = new Set(), stack = refs.filter(x => x.wk === wn).map(x => x.id); while (stack.length){ const k = stack.pop(); if (seen.has(k)) continue; seen.add(k); (D.recipes[k] && D.recipes[k].ingredients || []).forEach(i => i.r && stack.push(i.r)); } return seen.has(id); };
  const unused = blocks.filter(([id]) => !usesBlock(id)).map(([, r]) => r.name);
  const days = DAYS.slice(0, 5).map((dk, i) => {
    const d = new Date(mon); d.setDate(mon.getDate() + i); const ds = Store.ymd(d), menu = D.menu[dk];
    if (!menu) return '';
    return `<section class="sect"><div class="sect-h"><span class="over">${DAYN[dk]} · ${d.toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>${menu.shared ? `<span class="cap">${SLOT[menu.shared].toLowerCase()} for two</span>` : ''}</div><div class="group">${Object.keys(SLOT).map(slot => {
      const t = mealTask(ds, slot, menu, D, wn); if (!t) return '';
      const r = t.recipe && (MW[(Store.getSwap(ds, slot) || {}).wk || wn] || D).recipes[t.recipe];
      return `<div class="row${t.swapped ? ' swapped' : ''}"><span class="tile ctile c-${r ? r.cuisine : 'Prep'}">${ic(r ? r.cuisine : t.icon)}</span><span class="tx"><b>${esc(t.label)}</b><small>${SLOT[slot]}${t.swapped ? ' · swapped in' : ''}${r ? ` · ${r.minutes} min · ${r.protein}g protein` : ''}</small></span>
        <button class="btn quiet small" type="button" data-plan="${ds}|${slot}|${dk}">Swap</button></div>`; }).join('')}</div></section>`;
  }).join('');
  view.innerHTML = `${floatBack()}<header class="lhead" style="padding-top:calc(var(--top) + 66px)"><span class="over gold">Weekly planner · ${esc(D.title)}</span><h1 class="lt">Plan next week</h1>
    <span class="cap" style="font-size:14px;margin-top:4px">${fromDate} to ${fri.toLocaleDateString(undefined, {month:'short', day:'numeric'})}. Swap anything, and the grocery list follows.</span></header>
    <div class="page stagger" style="margin-top:22px">
      <a class="card planbudget tap" href="#market" id="pmkt"><div class="big"><b class="num">${money(total)}</b><span class="cap">${G.list.length} items · ${money(D.budget - total)} under budget</span></div>
        ${G.swaps ? `<span class="cap">${plural(G.swaps, 'swap')} · ${G.added.length ? `+${G.added.length} added` : 'nothing added'} · ${G.dropped.length ? `${G.dropped.length} dropped` : 'nothing dropped'}</span>` : `<span class="cap">The suggested plan, as written</span>`}
        <span class="over gold">Open the grocery list ${ic('chev')}</span></a>
      ${unused.length ? `<div class="callout">${ic('info')}<span>Nothing uses ${listify(unused.map(x => x.toLowerCase()))} anymore, so skip ${unused.length === 1 ? 'that' : 'those'} on Sunday. Its groceries are off the list.</span></div>` : ''}
      ${days}
      ${G.swaps ? `<button class="btn quiet wide" type="button" id="preset">Reset to the suggested plan</button>` : ''}
      <div style="height:84px"></div>
    </div>`;
  scrollAt = 90; setBar('Plan next week', true); wireBack();
  dock.innerHTML = done ? `<div class="btn wide planned">${ic('check')}Planned · +${done.pts} Harvest earned. Changes still update the list.</div>` : `<button class="btn wide" type="button" id="plock">${ic('check')}Lock in my plan · +${Store.PTS.plan.pts} Harvest</button>`;
  const lk = $('#plock'); if (lk) lk.onclick = () => { lockPlan(); setTimeout(() => location.hash = '#today', 500); };
  $('#pmkt').onclick = () => { shopWeek = wn; };
  const rs = $('#preset'); if (rs) rs.onclick = () => { DAYS.slice(0, 5).forEach((dk, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); Object.keys(SLOT).forEach(slot => { const sw = Store.getSwap(Store.ymd(d), slot); if (sw && sw.type === 'recipe') Store.setSwap(Store.ymd(d), slot, null); }); }); haptic(); toast('Back to the suggested plan.'); rerender(); };
  $$('[data-plan]', view).forEach(b => b.onclick = () => {
    const [ds, slot, dk] = b.dataset.plan.split('|'), menu = D.menu[dk], plannedId = menu[slot], sw = Store.getSwap(ds, slot);
    haptic();
    const sh = sheet(`<div class="grab"></div><div><div class="over gold">${SLOT[slot]} · ${DAYN[dk]}</div><h2 class="t2" style="margin-top:8px">Pick a recipe</h2></div>
      ${sw ? `<button class="btn quiet wide" type="button" id="pback">Use the suggested: ${esc(D.recipes[plannedId].name)}</button>` : ''}
      <label class="field"><input id="rq" type="search" placeholder="Search every recipe" autocomplete="off"></label><div id="rlist"></div>`);
    sh.classList.add('swapsheet');
    const pb = $('#pback', sh); if (pb) pb.onclick = () => { Store.setSwap(ds, slot, null); closeLayer(); haptic(); setTimeout(rerender, 280); };
    mountRecipePicker(sh, {slot, wn, plannedId, D, onPick:(n, id, r) => {
      Store.setSwap(ds, slot, n === wn && id === plannedId ? null : {type:'recipe', id, wk:n, name:r.name, minutes:r.minutes});
      closeLayer(); haptic(); toast(`${r.name} on ${DAYN[dk]}.`); setTimeout(rerender, 280);
    }});
  });
}

/* ---------------- day preview (tap a day in the week strip) ---------------- */
function mealWeekOf(date){ const w = Store.weekNo(date); return MEAL_WEEKS.filter(n => n <= w).pop() || MEAL_WEEKS[0]; }
function dayPlan(date){
  const d = dayKey(date), ds = Store.ymd(date), wn = mealWeekOf(date), D = MW[wn] || (wn === mealWeek() ? M : null);
  const times = (W.routine && W.routine.times[d]) || {}, isPast = ds < Store.ymd(today()), isToday = ds === Store.ymd(today());
  const rows = planItems(d).map(t => Object.assign(t, Store.PTS[t.type], {at:times[t.key] || '23:59'}));
  const menu = D && D.menu[d];
  if (menu) Object.keys(SLOT).forEach(slot => { const t = mealTask(ds, slot, menu, D, wn); if (t){ Object.assign(t, Store.PTS[slot], {at:times[slot] || '23:59'}); if (t.fixedPts != null) t.pts = t.fixedPts; rows.push(t); } });
  if (isPast || isToday) rows.push(Object.assign({key:'sleep', type:'sleep', icon:'sleep', label:'Slept 7+ hours', meta:'Last night', at:times.sleep || '06:45'}, Store.PTS.sleep));
  // Sunday prep belongs to the week that starts the next day.
  const nd = new Date(date); nd.setDate(nd.getDate() + 1);
  const pwn = d === 'sun' ? mealWeekOf(nd) : wn, PD = MW[pwn] || (pwn === mealWeek() ? M : null);
  const preps = PD ? PD.prep.filter(x => x.day === d).map(x => ({x, wn:pwn})) : [];
  rows.forEach(t => { t.done = (isPast || isToday) && Store.isDone(ds, t.key); });
  rows.sort((a, b) => a.at.localeCompare(b.at));
  return {d, ds, wn, D, menu, rows, preps, isPast, isToday, missingMenu:!D && !weekend(d)};
}
function daySheet(off){
  const base = Store.parse(Store.ymd(today())), date = new Date(base); date.setDate(base.getDate() + off);
  const P = dayPlan(date), when = off === 0 ? 'Today' : off === 1 ? 'Tomorrow' : off === -1 ? 'Yesterday' : off > 0 ? `In ${off} days` : `${-off} days ago`;
  const row = t => { const main = `<span class="tile r-${t.res}">${ic(t.icon)}</span><span class="tx"><b>${esc(t.label)}</b><small>${t.at < '23:59' ? `<span class="at">${clock(t.at)}</span> · ` : ''}${esc(t.meta)}</small></span>`;
    const end = (P.isPast || P.isToday) ? `<button class="tick${t.done ? ' on' : ''}" type="button" data-dtask="${t.key}" aria-label="${t.done ? 'Undo' : 'Complete'} ${esc(t.label)}">${ic('check', '')}</button>` : t.go ? ic('chev', 'i chev') : '';
    return t.go ? `<a class="row tap${t.done ? ' done' : ''}" href="${t.go}">${main}${end}</a>` : `<div class="row${t.done ? ' done' : ''}">${main}${end}</div>`; };
  const body = `${P.menu && P.menu.heads ? `<div class="callout">${ic('info')}<span>${esc(P.menu.heads)}</span></div>` : ''}
    ${P.rows.length ? `<div class="group">${P.rows.map(row).join('')}</div>` : `<div class="callout">${ic('extra')}<span>${weekend(P.d) ? 'Festival day. Nothing planned, and anything you do still builds the island.' : 'Nothing planned.'}</span></div>`}
    ${P.missingMenu ? `<p class="fine">That week's menu isn't written yet.</p>` : ''}
    ${P.preps.length ? `<div class="group">${P.preps.map(({x, wn}) => `<a class="row tap full" href="#prep/${x.id}/${wn}"><span class="tile r-harvest">${ic('calendar')}</span><span class="tx"><b>${esc(x.title)}</b><small>${x.minutes} min · ${esc(x.makes)}</small></span>${ic('chev', 'i chev')}</a>`).join('')}</div>` : ''}`;
  const sh = sheet(`<div class="grab"></div>
    <div class="dayhead"><button class="backbtn" type="button" data-step="-1" aria-label="Previous day" ${off <= -6 ? 'disabled' : ''}>${ic('back')}</button>
      <div><div class="over gold">${when}</div><h2 class="t2">${DAYN[P.d]} · ${date.toLocaleDateString(undefined, {month:'short', day:'numeric'})}</h2></div>
      <button class="backbtn" type="button" data-step="1" aria-label="Next day" ${off >= 13 ? 'disabled' : ''}>${ic('chev')}</button></div>
    <div class="daybody">${body}</div>`);
  sh.classList.add('daysheet');
  const go = n => { haptic(); const k = off + n; if (k < -6 || k > 13) return; layer.innerHTML = ''; daySheet(k); const s2 = $('.sheet', layer); s2.style.animation = 'none'; const b = $('.daybody', s2); b.classList.add(n > 0 ? 'from-r' : 'from-l'); };
  $$('[data-step]', sh).forEach(b => b.onclick = () => go(+b.dataset.step));
  $$('[data-dtask]', sh).forEach(b => b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); toggleTask(b.dataset.dtask, b, date); b.classList.toggle('on'); setTimeout(() => { daySheet(off); const s2 = $('.sheet', layer); if (s2) s2.style.animation = 'none'; }, 470); }));
  let sx = null, sy = 0;
  sh.addEventListener('pointerdown', e => { if (e.target.closest('button, .grab')) return; sx = e.clientX; sy = e.clientY; });
  sh.addEventListener('pointerup', e => { if (sx === null) return; const dx = e.clientX - sx, dy = e.clientY - sy; sx = null; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5){ swallowClick(); go(dx < 0 ? 1 : -1); } });
}

function openExtra(){
  let type = 'cardio', mins = 30;
  const s = sheet(`<div class="grab"></div><div><div class="over gold">Bonus</div><h2 class="t2" style="margin-top:8px">Log something extra</h2></div>
    <div class="opts">${Object.entries(Store.EXTRA).map(([k, x]) => `<button type="button" data-k="${k}"><span class="tile r-${x.res}">${ic(x.res)}</span><span><b class="hl" style="display:block">${x.label}</b><span class="cap">${RESN[x.res]}${x.flat ? ` · +${x.flat}` : ` · 1 per ${x.per} min`}</span></span></button>`).join('')}</div>
    <div class="stepper" id="mins"><button type="button" data-d="-5" aria-label="5 minutes less">${ic('minus')}</button><b class="num"><span id="mv">30</span><small>min</small></b><button type="button" data-d="5" aria-label="5 minutes more">${ic('plus')}</button></div>
    <label class="field"><span class="cap">What was it? (optional)</span><input id="xnote" type="text" maxlength="60" placeholder="Hike, bike ride, extra push-ups"></label>
    <button class="btn wide" type="button" id="xadd"></button>`);
  const upd = () => {
    const x = Store.EXTRA[type];
    $('#mins', s).hidden = !!x.flat; $('#mv', s).textContent = mins;
    $$('.opts button', s).forEach(b => b.classList.toggle('on', b.dataset.k === type));
    $('#xadd', s).textContent = `Add +${x.flat || Math.max(1, Math.round(mins / x.per))} ${RESN[x.res]}`;
  };
  $$('.opts button', s).forEach(b => b.onclick = () => { type = b.dataset.k; upd(); });
  $$('#mins button', s).forEach(b => b.onclick = () => { mins = Math.max(5, Math.min(300, mins + +b.dataset.d)); upd(); });
  $('#xadd', s).onclick = () => {
    const before = Store.totals().all, e = Store.addExtra(type, mins, $('#xnote', s).value.trim());
    closeLayer(); if (e){ haptic(); reward(e.res, e.pts, e.label); celebrate(before); } setTimeout(rerender, 300);
  };
  upd();
}

/* ---------------- Train ---------------- */
function vTrain(){
  const td = dayKey(today()); trainDay = trainDay || td;
  const ph = phase(), sw = Store.seasonWeek(), isToday = trainDay === td, ds = Store.ymd(today());
  const items = planItems(trainDay).map(t => Object.assign(t, Store.PTS[t.type], {done:isToday && Store.isDone(ds, t.key)}));
  const main = items.find(i => i.type === 'lift') || items.find(i => i.type === 'mobility');
  const court = items.find(i => i.type === 'pickleball');
  const others = items.filter(i => i !== main && !(i === court && !(main && main.type === 'lift')));
  const s = main && W.sessions[main.session];
  let hero;
  if (main && main.type === 'lift'){
    hero = `<section class="card hero-w"><div><span class="over gold">${isToday ? 'Today' : DAYN[trainDay]} · Session ${main.session}</span><h2 class="t2" style="margin-top:8px">${esc(s.title)}</h2></div>
      <div class="chips"><span class="chip">${ic('clock')}${s.minutes} min</span><span class="chip">${ic('layers')}${plural(s.blocks.length, 'move')}</span><span class="chip">${ic('lift')}${totalSets(s)} sets</span></div>
      <span class="cap">${esc(s.format)}</span>
      <div class="btns"><a class="btn" href="#play/${main.session}">${ic('play', 'i solid')}${main.done ? 'Do it again' : 'Start workout'}</a><a class="btn quiet" href="#session/${main.session}" style="flex:.6">Preview</a></div></section>`;
  } else if (court){
    hero = `<section class="card hero-w"><div><span class="over gold">${isToday ? 'Today' : DAYN[trainDay]} · Court day</span><h2 class="t2" style="margin-top:8px">Pickleball</h2></div>
      <div class="chips"><span class="chip">${ic('clock')}2 hours</span><span class="chip">${ic('land')}+18 land</span></div>
      <span class="cap">Warm up with 8 minutes of mobility first. It keeps hips and shoulders happy through two hours of play.</span>
      <a class="btn" href="#play/M">${ic('play', 'i solid')}Start warm-up</a></section>`;
  } else {
    hero = `<section class="card hero-w"><div><span class="over gold">${DAYN[trainDay]}</span><h2 class="t2" style="margin-top:8px">${trainDay === 'sun' ? 'Rest and prep' : 'Festival day'}</h2></div>
      <span class="cap">${trainDay === 'sun' ? 'Recovery is part of the program. Shop, prep, and stretch if you feel like it.' : 'Nothing is planned. A long walk downtown still builds your island.'}</span></section>`;
  }
  const total = 12, nowW = sw;
  view.innerHTML = `<header class="lhead"><span class="over gold">${ph.name} phase · week ${sw} of 12</span><h1 class="lt">Train</h1></header>
  <div class="page stagger" style="margin-top:20px">
    <div class="days">${DAYS.map(d => { const its = W.week[d] || [];
      const dots = its.map(i => `<u class="${i.type === 'lift' ? 'stone' : i.type === 'mobility' ? 'spirit' : 'land'}"></u>`).join('');
      return `<button type="button" data-d="${d}" class="${d === trainDay ? 'on' : ''}${d === td ? ' today' : ''}">${DAYN[d].slice(0, 3).toUpperCase()}<b>${DAYN[d][0]}</b><i>${dots}</i></button>`; }).join('')}</div>
    ${hero}
    ${others.length ? `<section class="sect"><div class="sect-h"><span class="over">${isToday ? 'Also today' : 'Also planned'}</span></div><div class="group">${others.map(t => taskRow(t, {disabled:!isToday})).join('')}</div></section>` : ''}
    <section class="sect"><div class="sect-h"><span class="over">All sessions</span></div><div class="group">
      ${Object.entries(W.sessions).map(([id, x]) => `<a class="row tap" href="#session/${id}"><span class="tile ${id === 'M' ? 'r-spirit' : 'r-stone'}">${ic(id === 'M' ? 'mobility' : 'lift')}</span><span class="tx"><b>${esc(x.title)}</b><small>${id === 'M' ? 'Before pickleball' : 'Session ' + id} · ${x.minutes} min · ${totalSets(x)} sets</small></span>${ic('chev', 'i chev')}</a>`).join('')}
    </div></section>
  </div>`;
  scrollAt = 50; setBar('Train');
  $$('.days button', view).forEach(b => b.onclick = () => { trainDay = b.dataset.d; rerender(); });
  wireTicks();
}

function vSession(id){
  const s = W.sessions[id]; if (!s) return vTrain();
  const ph = phase(), last = Store.lastSets(id, '9999') || [];
  const lastOf = bi => last.filter(x => x[0] === bi).sort((a, b) => a[1] - b[1]).map(x => x[2]);
  view.innerHTML = `${floatBack()}<header class="lhead" style="padding-top:calc(var(--top) + 66px)"><span class="over gold">${id === 'M' ? 'Mobility · before pickleball' : 'Session ' + id}</span><h1 class="lt">${esc(s.title)}</h1>
    <div class="chips" style="margin-top:8px"><span class="chip">${ic('clock')}${s.minutes} min</span><span class="chip">${ic('layers')}${plural(s.blocks.length, 'move')}</span><span class="chip">${ic('lift')}${totalSets(s)} sets</span></div></header>
  <div class="page stagger" style="margin-top:22px">
    <span class="cap" style="font-size:14px">${esc(s.format)}</span>
    ${id !== 'M' ? `<div class="callout">${ic('info')}<span><b>${esc(ph.name)} phase.</b> ${esc(ph.note)}</span></div>` : ''}
    <div class="group">${s.blocks.map((b, bi) => { const ex = W.exercises[b.ex], lw = lastOf(bi);
      return `<div class="move"><div class="move-h"><span class="tile r-stone">${esc(b.group)}</span><span class="tx" style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px"><b class="hl">${esc(ex.name)}</b><small class="cap">${b.sets} × ${esc(b.reps)}${b.rest ? ` · rest ${b.rest}s` : ''} · ${esc(ex.equip)}</small>${lw.length ? `<small class="cap lastline">Last time ${lw.join(' · ')}</small>` : ''}</span></div>
        <details><summary>${esc(ex.cue)} · How to</summary>${Demo.has(b.ex) ? `<div class="howmini">${Demo.svg(b.ex)}</div>` : ''}<ol>${ex.how.map(h => `<li>${esc(h)}</li>`).join('')}</ol></details></div>`; }).join('')}</div>
    <div style="height:70px"></div>
  </div>`;
  scrollAt = 90; setBar(s.title, true); wireBack();
  $$('.move details', view).forEach(d => d.addEventListener('toggle', () => { if (d.open) Demo.play(d); }));
  dock.innerHTML = `<a class="btn wide" href="#play/${id}">${ic('play', 'i solid')}Start workout</a>`;
}

/* ---------------- workout player ---------------- */
function buildSteps(s){
  const groups = [];
  if (s.circuit) groups.push(s.blocks.map((b, i) => ({b, i})));
  else { const m = new Map(); s.blocks.forEach((b, i) => { const g = b.group.replace(/[a-z]$/, ''); if (!m.has(g)) m.set(g, []); m.get(g).push({b, i}); }); groups.push(...m.values()); }
  const steps = [];
  groups.forEach(g => {
    const n = Math.max(...g.map(x => x.b.sets));
    for (let k = 0; k < n; k++) g.forEach((x, j) => { if (k < x.b.sets) steps.push({bi:x.i, set:k + 1, sets:x.b.sets, rest:j === g.length - 1 ? x.b.rest : 0, round:s.circuit}); });
  });
  if (steps.length) steps[steps.length - 1].rest = 0;
  return steps;
}
function vPlay(id){
  const s = W.sessions[id]; if (!s) return vTrain();
  if (!play || play.id !== id){
    const last = Store.lastSets(id, Store.ymd(today())) || [];
    play = {id, s, steps:buildSteps(s), i:0, mode:'work', t0:Date.now(), restEnd:0, restTotal:0, tick:null, log:[], last, reps:null, hold:null, beeped:0};
  }
  app.classList.add('immersive'); keepAwake(true);
  renderPlay();
  clearInterval(play.tick);
  play.tick = setInterval(playTick, 250);
}
const fmt = sec => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
const repTarget = b => +((b.reps.match(/^\d+/) || [])[0] || 0);
const isHold = b => /\bsec\b/i.test(b.reps);
const logsReps = (p, b) => p.id !== 'M' && !isHold(b);
function lastFor(p, bi){ return p.last.filter(x => x[0] === bi).sort((a, b) => a[1] - b[1]).map(x => x[2]); }
/* Coaching: what to aim for on this set, from the plan, the phase and what you did last time. */
const phaseAdd = (p, b) => p.id !== 'M' && !isHold(b) && repTarget(b) && phase().from >= 5 ? 2 : 0;
const targetOf = (p, b) => repTarget(b) ? repTarget(b) + phaseAdd(p, b) : 0;
function coachFor(p, st){
  const b = p.s.blocks[st.bi], ex = W.exercises[b.ex];
  if (!logsReps(p, b)) return null;
  const target = targetOf(p, b), was = lastFor(p, st.bi)[st.set - 1];
  if (was == null) return {aim:target || null, line:target ? `First time logging this. Aim for ${target}, with 1 to 2 left in the tank.` : 'First time logging this. Stop when your form slips.'};
  if (target && was >= target + 3 && ex.harder) return {aim:was, line:`Last time ${was}. That is getting easy, so make it harder:`, harder:ex.harder};
  return {aim:was + 1, line:`Last time ${was}. Go for ${was + 1}.`};
}
/* How to do a move: the demo, numbered steps, the form cue and a harder version. */
function howSheet(k){
  const ex = W.exercises[k];
  const sh = sheet(`<div class="grab"></div>${Demo.has(k) ? `<div class="howstage">${Demo.svg(k)}</div>` : ''}
    <div><span class="over gold">${esc(ex.equip)}</span><h2 class="t2" style="margin-top:6px">${esc(ex.name)}</h2></div>
    <ol class="howlist">${ex.how.map(h => `<li>${esc(h)}</li>`).join('')}</ol>
    <div class="callout">${ic('info')}<span><b>Form cue.</b> ${esc(ex.cue)}</span></div>
    ${ex.harder ? `<p class="fine" style="margin:0"><b>Too easy?</b> ${esc(ex.harder)}</p>` : ''}
    <button class="btn wide" type="button" id="hgot">Got it</button>`);
  Demo.play(sh); $('#hgot', sh).onclick = () => closeLayer();
}
function playTick(){
  const p = play; if (!p) return;
  const c = $('#pclock'); if (c) c.textContent = fmt((Date.now() - p.t0) / 1000);
  if (p.mode === 'rest'){
    const left = Math.ceil((p.restEnd - Date.now()) / 1000);
    if (left <= 3 && left >= 1 && p.beeped !== left){ p.beeped = left; beep(660, .09); }
    if (left <= 0){ chime(); p.mode = 'work'; p.i++; p.reps = null; renderPlay(); }
    else paintRest(left);
  }
  if (p.hold && p.mode === 'work'){
    const left = Math.ceil((p.hold.end - Date.now()) / 1000);
    if (left <= 3 && left >= 1 && p.beeped !== -left){ p.beeped = -left; beep(660, .09); }
    if (left <= 0){ p.hold = null; chime(); const d = $('#pdone'); if (d) d.classList.add('nudge'); paintHold(0); }
    else paintHold(left);
  }
}
function renderPlay(){
  const p = play, s = p.s, st = p.steps[p.i];
  const segs = `<div class="segs">${p.steps.map((_, k) => `<i class="${k < p.i || p.mode === 'done' ? 'on' : k === p.i ? 'cur' : ''}"></i>`).join('')}</div>`;
  const snd = prefs.sound !== false;
  const top = `<div class="ptop"><button class="backbtn" type="button" id="pclose" aria-label="End workout">${ic('close')}</button>${segs}<span class="clock" id="pclock">${fmt((Date.now() - p.t0) / 1000)}</span>
    <button class="backbtn snd${snd ? '' : ' off'}" type="button" id="psnd" aria-label="${snd ? 'Mute' : 'Unmute'} sound cues">${ic(snd ? 'sound' : 'mute')}</button></div>`;
  if (p.mode === 'done'){
    const plannedToday = (W.week[dayKey(today())] || []).find(i => i.session === p.id);
    const key = plannedToday ? plannedToday.type : null, already = key && Store.isDone(Store.ymd(today()), key);
    const pts = key ? Store.PTS[key] : {res:'stone', pts:Math.max(1, Math.round(s.minutes / Store.EXTRA.strength.per))};
    const total = p.log.reduce((a, x) => a + x[2], 0);
    const lastSame = p.last.filter(x => p.log.some(y => y[0] === x[0] && y[1] === x[1]));
    const lastTotal = lastSame.reduce((a, x) => a + x[2], 0), delta = total - lastTotal;
    const moves = s.blocks.map((b, bi) => ({b, bi, now:p.log.filter(x => x[0] === bi).map(x => x[2]), was:lastFor(p, bi)})).filter(m => m.now.length);
    const trend = m => { if (!m.was.length) return ''; const a = m.now.reduce((x, y) => x + y, 0), b = m.was.slice(0, m.now.length).reduce((x, y) => x + y, 0); return a > b ? `<em class="up">+${a - b}</em>` : a < b ? `<em class="down">${a - b}</em>` : '<em>same</em>'; };
    view.innerHTML = `<div class="player">${top}<div class="finish"><div class="medal">${ic('check')}</div><div><span class="over gold">Session complete</span><h1 class="lt" style="margin-top:10px">${esc(s.title)}</h1></div>
      <div class="stats"><div><span class="cap">Time</span><b>${fmt((p.end - p.t0) / 1000)}</b></div><div><span class="cap">Reps</span><b>${total || p.steps.length}</b>${total && p.last.length ? `<small class="${delta > 0 ? 'up' : delta < 0 ? 'down' : ''}">${delta > 0 ? '+' + delta : delta < 0 ? delta : 'same as'} ${delta ? 'vs last' : 'last time'}</small>` : total ? '<small>first log</small>' : ''}</div><div><span class="cap">${RESN[pts.res]}</span><b>+${already ? 0 : pts.pts}</b></div></div>
      ${(() => { const easy = moves.filter(m => { const t = targetOf(p, m.b), h = W.exercises[m.b.ex].harder; return t && h && m.now.every(r => r >= t + 3); });
        return easy.length ? `<div class="coach"><i class="cdot"></i><span>Next time, make it harder. ${easy.map(m => `<b>${esc(W.exercises[m.b.ex].name)}:</b> ${esc(W.exercises[m.b.ex].harder)}`).join(' ')}</span></div>` : ''; })()}
      ${moves.length ? `<div class="group movesum">${moves.map(m => `<div class="row"><span class="tx"><b>${esc(W.exercises[m.b.ex].name)}</b><small>${m.now.join(' · ')}${m.was.length ? ` <span class="faint">· last ${m.was.join(' · ')}</span>` : ''}</small></span>${trend(m)}</div>`).join('')}</div>` : ''}</div>
      <button class="btn wide" type="button" id="collect">${already ? 'Back to the island' : `Collect +${pts.pts} ${RESN[pts.res]}`}</button></div>`;
    $('#collect').onclick = () => {
      if (!already){ const before = Store.totals().all;
        if (key) Store.complete(Store.ymd(today()), key, s.title, key); else Store.addExtra('strength', s.minutes, s.title);
        haptic(); reward(pts.res, pts.pts, s.title); celebrate(before); }
      endPlay(); location.hash = '#isle';
    };
    $('#pclose').onclick = () => { endPlay(); location.hash = '#today'; };
    $('#psnd').onclick = toggleSound;
    return;
  }
  const b = s.blocks[st.bi], ex = W.exercises[b.ex];
  const nx = p.steps[p.i + 1], nex = nx && W.exercises[s.blocks[nx.bi].ex];
  if (p.mode === 'rest'){
    const nco = nx && coachFor(p, nx), nk = nx && s.blocks[nx.bi].ex;
    view.innerHTML = `<div class="player">${top}<div class="pbody rest"><span class="over gold">Rest</span><div class="bigring mid"><svg viewBox="0 0 120 120"><circle class="bgc" cx="60" cy="60" r="54"/><circle class="fgc" id="rring" cx="60" cy="60" r="54" stroke-dasharray="339.3" stroke-dashoffset="0"/></svg><div><b id="rleft" class="num">${Math.ceil((p.restEnd - Date.now()) / 1000)}</b></div></div>
      ${nex ? `<button type="button" class="upnext" id="phow">${Demo.has(nk) ? Demo.svg(nk) : ''}<span class="tx"><span class="over">Up next · ${esc(s.blocks[nx.bi].group)}</span><b>${esc(nex.name)}</b>${nco ? `<small>${esc(nco.line)}</small>` : ''}<i>${ic('info')}How to</i></span></button>` : ''}</div>
      <div class="btns"><button class="btn quiet" type="button" id="radd">+15 sec</button><button class="btn" type="button" id="rskip">Skip rest</button></div></div>`;
    paintRest(Math.ceil((p.restEnd - Date.now()) / 1000));
    Demo.play(view); if (nex) $('#phow').onclick = () => howSheet(nk);
    $('#radd').onclick = () => { p.restEnd += 15000; p.restTotal += 15; haptic(); paintRest(Math.ceil((p.restEnd - Date.now()) / 1000)); };
    $('#rskip').onclick = () => { haptic(); p.mode = 'work'; p.i++; p.reps = null; renderPlay(); };
  } else {
    const target = targetOf(p, b), logs = logsReps(p, b), co = coachFor(p, st);
    if (p.reps === null) p.reps = (co && co.aim) || target || 10;
    const unit = esc(b.reps.replace(/^\d+\s*/, '') || 'reps');
    let big;
    if (isHold(b)){
      const secs = repTarget(b) || 30;
      big = `<div class="hold"><div class="bigring sm"><svg viewBox="0 0 120 120"><circle class="bgc" cx="60" cy="60" r="54"/><circle class="fgc" id="hring" cx="60" cy="60" r="54" stroke-dasharray="339.3" stroke-dashoffset="${p.hold ? 0 : 339.3}"/></svg><div><b id="hleft" class="num">${p.hold ? Math.ceil((p.hold.end - Date.now()) / 1000) : secs}</b></div></div>
        ${p.hold ? '' : `<button class="btn quiet small" type="button" id="hstart">${ic('play', 'i solid')}Start ${secs} sec</button>`}</div>`;
    } else if (logs){
      big = `<div class="preps adj"><button type="button" class="adjb" data-d="-1" aria-label="One less">${ic('minus')}</button><span class="rv"><b id="rv">${p.reps}</b><span>${target ? unit : 'reps'}</span></span><button type="button" class="adjb" data-d="1" aria-label="One more">${ic('plus')}</button></div>`;
    } else {
      big = `<div class="preps">${target ? `<b>${target}</b><span>${unit}</span>` : `<b style="font-size:44px">${esc(b.reps)}</b>`}</div>`;
    }
    view.innerHTML = `<div class="player">${top}<div class="pbody">
      <button type="button" class="pstage" id="phow" aria-label="How to do ${esc(ex.name)}">${Demo.has(b.ex) ? Demo.svg(b.ex) : `<span class="nodemo">${esc(ex.how[0])}</span>`}<span class="ptag">${st.round ? `Round ${st.set} of ${st.sets}` : `${esc(b.group)} · Set ${st.set} of ${st.sets}`}</span><span class="phow">${ic('info')}How to</span></button>
      <div class="phead"><h1 class="pname">${esc(ex.name)}</h1><p class="pcue">${esc(ex.cue)}</p></div>
      ${co ? `<div class="coach"><i class="cdot"></i><span>${esc(co.line)}${co.harder ? ` <b>${esc(co.harder)}</b>` : ''}</span></div>` : ''}
      ${big}</div>
      ${nex ? `<p class="pthen"><span class="over">Then</span><b>${esc(nex.name)}</b>${st.rest ? `<span>after ${st.rest}s rest</span>` : ''}</p>` : ''}
      <button class="btn wide" type="button" id="pdone">${ic('check')}${nx ? 'Done' : 'Finish workout'}</button></div>`;
    Demo.play(view); $('#phow').onclick = () => howSheet(b.ex);
    $$('.adjb', view).forEach(x => x.onclick = () => {
      p.reps = Math.max(0, Math.min(99, p.reps + +x.dataset.d)); haptic();
      const v = $('#rv'); v.textContent = p.reps; v.animate([{transform:'scale(1.12)'}, {transform:'none'}], {duration:220, easing:'cubic-bezier(.3,1.4,.5,1)'});
    });
    const hs = $('#hstart'); if (hs) hs.onclick = () => { const secs = repTarget(b) || 30; p.hold = {end:Date.now() + secs * 1000, total:secs}; p.beeped = 0; haptic(); renderPlay(); };
    $('#pdone').onclick = e => {
      haptic(); burst(e.currentTarget);
      if (logs) p.log.push([st.bi, st.set, p.reps]);
      p.hold = null; p.reps = null; p.beeped = 0;
      if (!nx){ p.mode = 'done'; p.end = Date.now(); if (p.log.length) Store.saveSets(Store.ymd(today()), p.id, p.log); chime(); renderPlay(); return; }
      if (st.rest){ p.mode = 'rest'; p.restTotal = st.rest; p.restEnd = Date.now() + st.rest * 1000; renderPlay(); }
      else { p.i++; renderPlay(); }
    };
  }
  $('#psnd').onclick = toggleSound;
  $('#pclose').onclick = () => {
    const sh = sheet(`<div class="grab"></div><h2 class="t2">End this workout?</h2><span class="cap">${p.log.length ? 'The sets you logged so far are saved.' : 'Nothing is saved yet.'}</span>
      <div class="btns"><button class="btn quiet" type="button" id="keep">Keep going</button><button class="btn danger" type="button" id="quit">End workout</button></div>`);
    $('#keep', sh).onclick = () => closeLayer();
    $('#quit', sh).onclick = () => { if (p.log.length) Store.saveSets(Store.ymd(today()), p.id, p.log); closeLayer(); endPlay(); goBack(); };
  };
}
function toggleSound(){
  setPref('sound', prefs.sound === false); unlockAudio(); haptic();
  const b = $('#psnd'); if (!b) return;
  const on = prefs.sound !== false; b.classList.toggle('off', !on); b.innerHTML = ic(on ? 'sound' : 'mute');
  b.setAttribute('aria-label', `${on ? 'Mute' : 'Unmute'} sound cues`);
  if (on) beep(880, .1);
  toast(on ? 'Sound cues on' : 'Sound cues off');
}
function paintRest(left){
  const p = play, el = $('#rleft'), rr = $('#rring'); if (!el) return;
  el.textContent = Math.max(0, left);
  rr.style.strokeDashoffset = (339.3 * (1 - Math.max(0, (p.restEnd - Date.now()) / 1000) / Math.max(1, p.restTotal))).toFixed(1);
}
function paintHold(left){
  const p = play, el = $('#hleft'), rr = $('#hring'); if (!el) return;
  el.textContent = Math.max(0, left);
  rr.style.strokeDashoffset = p.hold ? (339.3 * (1 - Math.max(0, (p.hold.end - Date.now()) / 1000) / p.hold.total)).toFixed(1) : '339.3';
}
function endPlay(){ if (play) clearInterval(play.tick); play = null; keepAwake(false); }

/* ---------------- meal weeks ---------------- */
const nextW = () => MEAL_WEEKS.find(n => n > mealWeek());
function planWeek(){
  if (shopWeek && MW[shopWeek]) return shopWeek;
  const n = nextW();
  return weekend(dayKey(today())) && n && MW[n] ? n : mealWeek();
}
function weekSwitch(sel){
  const n = nextW(); if (!n || !MW[n]) return '';
  return `<div class="seg" role="tablist" data-weeksw>${[[mealWeek(), 'This week'], [n, 'Next week']].map(([w, l]) => `<button type="button" role="tab" data-w="${w}" class="${sel === w ? 'on' : ''}">${l} · ${MW[w].title}</button>`).join('')}</div>`;
}
function wireWeekSwitch(){ $$('[data-weeksw] button', view).forEach(b => b.onclick = () => { shopWeek = +b.dataset.w; rerender(); }); }
const wkOf = n => MW[n] || M;
function findRecipe(id, n){
  if (n && MW[n] && MW[n].recipes[id]) return [MW[n], +n];
  if (M.recipes[id]) return [M, mealWeek()];
  const w = Object.keys(MW).find(k => MW[k].recipes[id]);
  return w ? [MW[w], +w] : [null, null];
}

/* ---------------- Market ---------------- */
function vMarket(){
  const wk = planWeek(), D = wkOf(wk), pre = `w${wk}:`;
  const P = plannedGroceries(monOfShown(wk)), G = P.list;
  if (!P.ready) loadAllWeeks().then(() => { if (location.hash === '#market') rerender(); });
  const inCart = g => Store.flag('grocery', pre + g.uid);
  const total = G.reduce((a, g) => a + g.price, 0), got = G.filter(inCart), left = G.filter(g => !inCart(g));
  // Aldi walk order: produce at the door, shelf aisles, dairy and meat along the back, frozen by the registers.
  const order = ['Produce','Shelf','Dairy and eggs','Meat','Frozen'];
  const ahead = wk !== mealWeek(), over = total - D.budget;
  const item = g => `<div class="row item sw${inCart(g) ? ' done' : ''}" data-g="${g.uid}" role="button" aria-pressed="${inCart(g)}"><button class="tick" type="button" tabindex="-1" aria-hidden="true">${ic('check', '')}</button><span class="tx"><b>${esc(g.name)}</b><small>${esc(g.qty)}${g.forRecipe ? ` · for ${esc(g.forRecipe)}` : ''}</small></span><span class="trail">${money(g.price)}</span></div>`;
  const aisles = [...order.map(sec => [sec, left.filter(g => g.section === sec && g.store !== 'Publix')]), ['Publix', left.filter(g => g.store === 'Publix')]];
  view.innerHTML = `<header class="lhead"><span class="over gold">${esc(D.title)}${ahead ? ' · next week' : ''}</span><h1 class="lt">Market</h1></header>
  <div class="page stagger" style="margin-top:20px">
    ${weekSwitch(wk)}
    ${P.swaps ? `<a class="callout tap" href="#plan">${ic('swap')}<span>Follows your plan: ${P.added.length} added, ${P.dropped.length} dropped.</span></a>` : ahead ? `<a class="callout tap" href="#plan">${ic('calendar')}<span>Want different meals next week? Plan it and this list follows.</span></a>` : ''}
    <section class="card budget"><div class="big"><b class="num">${money(total)}</b><span class="cap">${over > 0 ? `<span style="color:var(--danger)">${money(over)} over budget</span>` : `${got.length} of ${G.length} in the cart`}</span></div>
      <div class="bar2">${twBar('cart' + wk, got.length / Math.max(1, G.length) * 100)}</div></section>
    ${!left.length ? `<div class="callout">${ic('check')}<span>Everything is in the cart.</span></div>` : ''}
    ${aisles.map(([sec, items]) => items.length ? `<section class="sect"><div class="sect-h"><span class="over">${sec}</span></div><div class="group">${items.map(item).join('')}</div></section>` : '').join('')}
    ${got.length ? `<details class="sect cartbox"${left.length ? '' : ' open'}><summary class="sect-h"><span class="over">In the cart · ${got.length}</span><span class="cap">${money(got.reduce((a, g) => a + g.price, 0))} ›</span></summary>
      <div class="group">${got.map(item).join('')}</div><button class="linkbtn" type="button" id="clr">Clear the cart and start over</button></details>` : ''}
    ${D.have && D.have.length ? `<p class="fine"><b style="color:var(--sub)">Already home:</b> ${D.have.map(h => esc(h.name.toLowerCase())).join(', ')}.</p>` : ''}
    <details class="pantry sect"><summary class="sect-h"><span class="over">Spices, oils and notes</span><span class="cap">not counted ›</span></summary><div class="pchips">${D.pantry.map(p => `<span>${esc(p.name)}</span>`).join('')}</div>
      <p class="fine" style="margin-top:12px">${esc(D.allergyNote)}</p><p class="fine" style="margin-top:8px">${esc(D.priceNote)}</p></details>
  </div>`;
  scrollAt = 50; setBar('Market'); playTw();
  wireWeekSwitch();
  $$('.item', view).forEach(r => r.onclick = () => {
    const k = pre + r.dataset.g, on = !Store.flag('grocery', k); Store.flag('grocery', k, on);
    r.classList.toggle('done', on); haptic(); if (on) burst($('.tick', r));
    r.style.maxHeight = r.offsetHeight + 'px'; requestAnimationFrame(() => r.classList.add('leaving'));
    setTimeout(rerender, 520);
  });
  wireSwipe('.item.sw', r => r.click());
  const c = $('#clr'); if (c) c.onclick = () => { Store.clearPrefix('grocery', pre); haptic(); rerender(); };
}

/* ---------------- Kitchen ---------------- */
function mealCard(D, n, slot, id, shared){
  const r = D.recipes[id];
  return `<a class="meal tap c-${r.cuisine}" href="#recipe/${id}/${n}"><div class="art"><span class="over">${SLOT[slot] || slot}</span>${shared ? '<span class="shared">For two</span>' : ''}${ic(r.cuisine)}</div>
    <div class="tx"><b>${esc(r.name)}</b><span class="cap">${r.minutes} min · ${r.protein}g protein</span></div></a>`;
}
function vKitchen(){
  const wk = planWeek(), D = wkOf(wk), ahead = wk !== mealWeek();
  const td = dayKey(today());
  if (!kitchenDay || !D.menu[kitchenDay] && D.menu[td]) kitchenDay = D.menu[td] && !ahead ? td : 'mon';
  const menu = D.menu[kitchenDay], tmenu = ahead ? null : D.menu[td];
  const byCuisine = {};
  Object.entries(D.recipes).filter(([, r]) => !r.component).forEach(([id, r]) => (byCuisine[r.cuisine] = byCuisine[r.cuisine] || []).push([id, r]));
  view.innerHTML = `<header class="lhead"><span class="over gold">${esc(D.title)}${ahead ? ' · next week' : ''}</span><h1 class="lt">Kitchen</h1></header>
  <div class="page stagger" style="margin-top:20px">
    ${weekSwitch(wk)}
    ${ahead ? '' : `<section class="sect"><div class="sect-h"><span class="over">${tmenu ? 'Today' : 'This weekend'}</span></div>
      ${tmenu ? `<div class="rail">${Object.keys(SLOT).map(s => mealCard(D, wk, s, tmenu[s], tmenu.shared === s)).join('')}</div>`
        : `<div class="card"><h2 class="t3">Festival days</h2><p class="cap" style="margin:8px 0 0">${esc(D.weekendNote)}</p></div>`}</section>`}
    <a class="harvest tap" href="#plan"><span class="over gold">${weekend(td) ? 'This weekend' : 'Weekly planner'}</span><span class="hl">Plan next week</span><span class="cap">Swap in any recipe and the grocery list follows${weekend(td) && !planDoneThisWeek() ? ` · +${Store.PTS.plan.pts} Harvest` : ''}</span>${ic('chev', 'i chev')}</a>
    ${blocksHTML(D, wk)}
    <section class="sect"><div class="sect-h"><span class="over">Prep sessions</span></div><div class="group">${D.prep.map(p => {
      const n = p.steps.filter((_, i) => Store.flag('prep', `w${wk}:${p.id}:${i}`)).length;
      return `<a class="row tap full" href="#prep/${p.id}/${wk}"><span class="tile r-harvest">${ic('calendar')}</span><span class="tx"><b>${esc(p.title)}</b><small>${p.minutes} min · ${n ? `${n} of ${p.steps.length} steps done` : esc(p.makes)}</small></span>${ic('chev', 'i chev')}</a>`; }).join('')}</div></section>
    <section class="sect"><div class="sect-h"><span class="over">The week</span></div>
      <div class="days">${DAYS.map(d => `<button type="button" data-d="${d}" class="${d === kitchenDay ? 'on' : ''}${d === td && !ahead ? ' today' : ''}">${DAYN[d].slice(0, 3).toUpperCase()}<b>${DAYN[d][0]}</b><i>${D.menu[d] ? '<u class="land"></u>' : ''}</i></button>`).join('')}</div>
      ${menu ? `<div class="group">${Object.keys(SLOT).map(s => { const kd = new Date(monOfShown(wk)); kd.setDate(kd.getDate() + DAYS.indexOf(kitchenDay));
          const t = mealTask(Store.ymd(kd), s, menu, D, wk), sw = Store.getSwap(Store.ymd(kd), s), r = t && t.recipe ? ((sw && sw.type === 'recipe' ? MW[sw.wk] : D) || D).recipes[t.recipe] : null;
          if (!t) return '';
          if (!r) return `<div class="row"><span class="tile">${ic(t.icon)}</span><span class="tx"><b>${esc(t.label)}</b><small>${esc(t.meta)}</small></span></div>`;
          return `<a class="row tap" href="${t.go}"><span class="tile ctile c-${r.cuisine}">${ic(r.cuisine)}</span><span class="tx"><b>${esc(r.name)}</b><small>${SLOT[s]}${t.swapped ? ' · swapped in' : menu.shared === s ? ' · for two' : ''} · ${r.minutes} min · ${r.protein}g protein</small></span>${ic('chev', 'i chev')}</a>`; }).join('')}
        <div class="row full"><span class="tile ctile c-Snack">${ic('Snack')}</span><span class="tx"><b>Snacks</b><small style="white-space:normal">${D.snacks.map(esc).join(' · ')}</small></span></div></div>`
        : `<p class="fine">${esc(D.weekendNote)}</p>`}</section>
    <details class="sect pantry"><summary class="sect-h"><span class="over">All recipes this week</span><span class="cap">${Object.values(byCuisine).flat().length} ›</span></summary>
      <div class="group">${Object.entries(byCuisine).map(([c, list]) => list.map(([id, r]) => `<a class="row tap" href="#recipe/${id}/${wk}"><span class="tile ctile c-${c}">${ic(c)}</span><span class="tx"><b>${esc(r.name)}</b><small>${c} · ${r.minutes} min${r.isNew ? ' · new this week' : ''}</small></span>${ic('chev', 'i chev')}</a>`).join('')).join('')}</div></details>
  </div>`;
  scrollAt = 50; setBar('Kitchen');
  wireWeekSwitch();
  $$('.days button', view).forEach(b => b.onclick = () => { kitchenDay = b.dataset.d; rerender(); });
}
function blocksHTML(D, wk){
  const blocks = Object.entries(D.recipes).filter(([, r]) => r.component);
  if (!blocks.length) return '';
  const meals = Object.values(D.menu).flatMap(m => Object.keys(SLOT).map(s => m[s]));
  const uses = id => meals.filter(mid => (D.recipes[mid].ingredients || []).some(i => i.r === id)).length;
  return `<section class="sect"><div class="sect-h"><span class="over">Sunday building blocks</span><span class="cap">cook once, eat all week</span></div><div class="group">${blocks.map(([id, r]) => {
    const n = uses(id);
    return `<a class="row tap" href="#recipe/${id}/${wk}"><span class="tile ctile c-Prep">${ic('Prep')}</span><span class="tx"><b>${esc(r.name)}</b><small>${esc(r.serves)}${n ? ` · feeds ${plural(n, 'meal')}` : ''}</small></span>${ic('chev', 'i chev')}</a>`; }).join('')}</div></section>`;
}
function ingName(D, i, n){
  if (i.g){ const g = D.groceries.find(x => x.id === i.g); return esc(g ? g.name : i.g); }
  if (i.p){ const p = D.pantry.find(x => x.id === i.p); return esc(p ? p.name : i.p); }
  if (i.h){ const h = (D.have || []).find(x => x.id === i.h); return `${esc(h ? h.name : i.h)} <span class="cap">· from last week</span>`; }
  const r = D.recipes[i.r];
  return n ? `<a href="#recipe/${i.r}/${n}" data-stop style="color:var(--gold2);text-decoration:underline;text-decoration-color:rgba(244,189,99,.35);text-underline-offset:3px">${esc(r ? r.name : i.r)}</a>${r && r.component ? ' <span class="cap">· from Sunday prep</span>' : ''}` : esc(r ? r.name : i.r);
}
function vRecipe(id, wn){
  const [D, n] = findRecipe(id, wn); if (!D) return vKitchen();
  const r = D.recipes[id];
  const fk = `${n}:${id}`;
  view.innerHTML = `${floatBack()}<button class="backbtn favbtn${Store.isFav(fk) ? ' on' : ''}" type="button" id="fav" aria-label="Favorite">${ic('heart')}</button><div class="hero-r c-${r.cuisine}">${ic(r.cuisine)}</div>
  <div class="page stagger" style="margin-top:-34px;position:relative">
    <div><span class="over gold">${esc(r.cuisine)}${r.isNew ? ' · new this week' : ''} · ${esc(D.title)}</span><h1 class="lt" style="margin-top:10px">${esc(r.name)}</h1></div>
    <div class="stats3"><div><span class="cap">Time</span><b>${r.minutes}<span class="cap"> min</span></b></div><div><span class="cap">Protein</span><b>${r.protein}<span class="cap"> g</span></b></div><div><span class="cap">Makes</span><b style="font-size:14px;font-family:var(--f-b);font-weight:600;line-height:1.3">${esc(r.serves)}</b></div></div>
    ${r.tip ? `<div class="callout">${ic('info')}<span>${esc(r.tip)}</span></div>` : ''}
    <a class="btn wide" href="#cook/${id}/${n}">${ic('kitchen')}Start cook mode</a>
    <section class="sect"><div class="sect-h"><span class="over">Ingredients</span><span class="cap">${esc(r.equip)}</span></div><div class="group">${r.ingredients.map((i, k) => {
      const on = Store.flag('ing', `${n}:${id}:${k}`);
      return `<div class="row ing${on ? ' done' : ''}" data-k="${k}" role="button" aria-pressed="${on}"><span class="tx"><b>${ingName(D, i, n)}</b></span><span class="q">${esc(i.qty)}</span></div>`; }).join('')}</div>
</section>
    <section class="sect"><div class="sect-h"><span class="over">Method</span><span class="cap">${plural(r.steps.length, 'step')}</span></div><ol class="steps">${r.steps.map((s, k) => `<li><span>${k + 1}</span><div>${stepText(s, `${r.name} · step ${k + 1}`)}</div></li>`).join('')}</ol></section>
  </div>`;
  scrollAt = 180; setBar(r.name, true); wireBack();
  $('#fav').onclick = e => { const on = !Store.isFav(fk); Store.setFav(fk, on ? {id, wk:n, name:r.name} : null); e.currentTarget.classList.toggle('on', on); haptic(); toast(on ? 'Saved to favorites. Swaps show it first.' : 'Removed from favorites.'); };
  $$('[data-stop]', view).forEach(a => a.addEventListener('click', e => e.stopPropagation()));
  wireTchips();
  $$('.ing', view).forEach(el => el.onclick = () => { const k = `${n}:${id}:${el.dataset.k}`, on = !Store.flag('ing', k); Store.flag('ing', k, on); el.classList.toggle('done', on); if (on) haptic(); });
}
function vCook(id, wn){
  const [D, n] = findRecipe(id, wn); if (!D) return vKitchen();
  const r = D.recipes[id];
  if (!cook || cook.id !== id) cook = {id, i:0};
  app.classList.add('immersive'); keepAwake(true);
  const i = cook.i, last = i === r.steps.length - 1, dir = cook.dir || 0; cook.dir = 0;
  view.innerHTML = `<div class="cook"><div class="ptop"><button class="backbtn" type="button" id="cclose" aria-label="Close cook mode">${ic('close')}</button>
      <div class="segs">${r.steps.map((_, k) => `<i class="${k <= i ? 'on' : ''}"></i>`).join('')}</div><button class="backbtn" type="button" id="cing" aria-label="Ingredients">${ic('list')}</button></div>
    <div class="stepbig${dir > 0 ? ' from-r' : dir < 0 ? ' from-l' : ''}"><span class="over gold">${esc(r.name)} · step ${i + 1} of ${r.steps.length}</span><p>${stepText(r.steps[i], `${r.name} · step ${i + 1}`)}</p></div>
    <div class="btns">${i ? `<button class="btn quiet" type="button" id="cprev" style="flex:.6">Back</button>` : ''}<button class="btn" type="button" id="cnext">${last ? 'Done cooking' : 'Next step'}</button></div></div>`;
  $('#cclose').onclick = () => { endCook(); goBack(); };
  $('#cing').onclick = () => sheet(`<div class="grab"></div><h2 class="t2">Ingredients</h2><div class="group">${r.ingredients.map(x => `<div class="row" style="min-height:48px"><span class="tx"><b>${ingName(D, x)}</b></span><span class="q cap">${esc(x.qty)}</span></div>`).join('')}</div>`);
  wireTchips();
  const prev = $('#cprev'); if (prev) prev.onclick = () => { cook.i--; cook.dir = -1; haptic(); vCook(id, n); };
  const ck = $('.cook', view); let sx = null, sy = 0;
  ck.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; sx = e.clientX; sy = e.clientY; });
  ck.addEventListener('pointerup', e => {
    if (sx === null) return; const dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0 && !last){ cook.i++; cook.dir = 1; haptic(); vCook(id, n); }
    else if (dx > 0 && i > 0){ cook.i--; cook.dir = -1; haptic(); vCook(id, n); }
  });
  $('#cnext').onclick = () => {
    if (!last){ cook.i++; cook.dir = 1; haptic(); vCook(id, n); return; }
    const d = dayKey(today()), menu = n === mealWeek() && M.menu[d], slot = menu && Object.keys(SLOT).find(s => menu[s] === id);
    endCook();
    if (slot && !Store.isDone(Store.ymd(today()), slot)){
      const before = Store.totals().all; Store.complete(Store.ymd(today()), slot, r.name, slot);
      reward(Store.PTS[slot].res, Store.PTS[slot].pts, r.name); celebrate(before); location.hash = '#isle';
    } else { toast('Enjoy it.'); goBack(); }
  };
}
function endCook(){ cook = null; keepAwake(false); }
function vPrep(id, wn){
  const n = +wn || planWeek(), D = wkOf(n);
  const p = D.prep.find(x => x.id === id); if (!p) return vKitchen();
  const pre = `w${n}:${id}:`, done = p.steps.filter((_, i) => Store.flag('prep', pre + i)).length;
  view.innerHTML = `${floatBack()}<header class="lhead" style="padding-top:calc(var(--top) + 66px)"><span class="over gold">${esc(D.title)} · ${p.minutes} min · ${DAYN[p.day]}</span><h1 class="lt">${esc(p.title)}</h1><span class="cap" style="font-size:14px;margin-top:4px">Makes ${esc(p.makes)}.</span></header>
  <div class="page stagger" style="margin-top:22px">
    <div class="meter2"><p>${done} of ${p.steps.length} steps<b></b></p><div class="bar2" style="--c:var(--harvest)"><i style="width:${(done / p.steps.length * 100).toFixed(1)}%"></i></div></div>
    <div class="group">${p.steps.map((s, i) => { const on = Store.flag('prep', pre + i);
      return `<div class="row item${on ? ' done' : ''}" data-i="${i}" role="button" aria-pressed="${on}" style="align-items:flex-start;padding-top:16px;padding-bottom:16px"><button class="tick" type="button" tabindex="-1" aria-hidden="true">${ic('check', '')}</button><span class="tx"><b style="-webkit-line-clamp:unset;font-weight:400;font-size:15px;line-height:1.5">${stepText(s, `${p.title} · step ${i + 1}`)}</b></span></div>`; }).join('')}</div>
    ${done ? `<button class="btn quiet wide" type="button" id="clr">Reset steps</button>` : ''}
  </div>`;
  scrollAt = 90; setBar(p.title, true); wireBack();
  $$('.item', view).forEach(r => { r.classList.add('sw'); r.onclick = () => { const k = pre + r.dataset.i, on = !Store.flag('prep', k); Store.flag('prep', k, on); r.classList.toggle('done', on); haptic(); if (on) burst($('.tick', r)); setTimeout(rerender, 300); }; });
  wireSwipe('.item.sw', r => r.click());
  wireTchips();
  const c = $('#clr'); if (c) c.onclick = () => { Store.clearPrefix('prep', pre); rerender(); };
}

/* ---------------- kitchen timers ----------------
   Any step that says "bake 16 to 18 minutes" gets a one-tap timer (the longer time).
   Timers live in their own storage key so they survive the app reloading, and show in a floating pill. */
const TIMERS_KEY = 'hearth.timers';
let timers = (() => { try { return (JSON.parse(localStorage.getItem(TIMERS_KEY)) || []).filter(t => t.end > Date.now() - 3600e3); } catch(e) { return []; } })();
let timerTick = 0;
const saveTimers = () => { try { localStorage.setItem(TIMERS_KEY, JSON.stringify(timers)); } catch(e) {} };
const DUR = /(\d+)(½)?(?:\s*(?:to|-)\s*(\d+)(½)?)?\s*(hours?|minutes?|mins?|seconds?|secs?)\b/gi;
function durations(text){
  const out = []; let m; DUR.lastIndex = 0;
  while ((m = DUR.exec(text))){
    const n = +(m[3] || m[1]) + ((m[3] ? m[4] : m[2]) ? .5 : 0), u = m[5].toLowerCase();
    const sec = Math.round(n * (u.startsWith('h') ? 3600 : u.startsWith('m') ? 60 : 1));
    if (sec >= 20 && !out.some(o => o.sec === sec)) out.push({sec, txt:m[0]});
  }
  return out;
}
const dlabel = sec => sec >= 3600 ? `${+(sec / 3600).toFixed(1)} hr` : sec >= 60 ? `${Math.round(sec / 60)} min` : `${sec} sec`;
/* A step's text with every time of a minute or more turned into a tap-to-start timer link. */
function stepText(text, label){
  return esc(text).replace(DUR, (m, a, ah, b, bh, u) => {
    const n = +(b || a) + ((b ? bh : ah) ? .5 : 0), un = u.toLowerCase();
    const sec = Math.round(n * (un.startsWith('h') ? 3600 : un.startsWith('m') ? 60 : 1));
    if (sec < 60) return m;
    const on = timers.some(t => !t.done && t.label === label);
    return `<button type="button" class="tlink${on ? ' on' : ''}" data-sec="${sec}" data-l="${esc(label)}" aria-label="Start a ${dlabel(sec)} timer">${ic('timer')}${m}</button>`;
  });
}
function wireTchips(){
  $$('.tlink', view).forEach(b => b.addEventListener('click', e => {
    e.stopPropagation(); e.preventDefault(); unlockAudio(); haptic();
    addTimer(+b.dataset.sec, b.dataset.l);
    $$(`.tlink[data-l="${CSS.escape(b.dataset.l)}"]`, view).forEach(x => x.classList.add('on'));
    b.animate([{transform:'scale(1)'}, {transform:'scale(1.08)'}, {transform:'scale(1)'}], {duration:300, easing:'cubic-bezier(.3,1.4,.5,1)'});
  }));
}
function addTimer(sec, label){
  timers.push({id:Date.now().toString(36), label, total:sec, end:Date.now() + sec * 1000, done:false});
  saveTimers(); toast(`Timer set: ${dlabel(sec)}`); paintTimers();
}
function paintTimers(){
  let pill = $('.tdock');
  if (!timers.length){ if (pill) pill.remove(); clearInterval(timerTick); timerTick = 0; return; }
  if (!pill){ pill = document.createElement('button'); pill.type = 'button'; pill.className = 'tdock'; app.appendChild(pill); pill.onclick = timerSheet; }
  if (!timerTick) timerTick = setInterval(paintTimers, 500);
  const now = Date.now();
  timers.forEach(t => { if (!t.done && t.end <= now){ t.done = true; saveTimers(); chime(); setTimeout(chime, 900); toast(`Timer done: ${t.label}`); } });
  const ring = timers.filter(t => t.done), live = timers.filter(t => !t.done).sort((a, b) => a.end - b.end);
  const t = ring[0] || live[0], left = Math.max(0, Math.ceil((t.end - now) / 1000));
  pill.classList.toggle('ringing', !!ring.length);
  pill.innerHTML = `${ic('timer')}<span class="tl">${esc(t.label)}</span><b class="num">${ring.length ? 'Done' : left >= 3600 ? `${Math.floor(left / 3600)}:${String(Math.floor(left % 3600 / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}` : fmt(left)}</b>${timers.length > 1 ? `<i>${timers.length}</i>` : ''}`;
  const tl = $('.tsheet'); if (tl) paintTimerSheet(tl);
}
function timerSheet(){
  haptic();
  const ring = timers.filter(t => t.done);
  if (ring.length === timers.length && ring.length === 1){ timers = []; saveTimers(); paintTimers(); return; }
  const sh = sheet(`<div class="grab"></div><div><div class="over gold">Kitchen</div><h2 class="t2" style="margin-top:8px">Timers</h2></div><div class="tsheet group"></div>`);
  paintTimerSheet($('.tsheet', sh));
}
function paintTimerSheet(el){
  const now = Date.now();
  if (!timers.length){ closeLayer(); return; }
  const sig = timers.map(t => t.id + t.done).join();
  const rows = timers.map(t => { const left = Math.max(0, Math.ceil((t.end - now) / 1000));
    return `<div class="row" data-id="${t.id}"><span class="tile ${t.done ? 'r-gold' : 'r-harvest'}">${ic('timer')}</span><span class="tx"><b>${esc(t.label)}</b><small>${t.done ? 'Done' : `${fmt(left)} left of ${dlabel(t.total)}`}</small></span>
      ${t.done ? '' : `<button class="btn quiet small" type="button" data-add="${t.id}">+1 min</button>`}<button class="backbtn" type="button" data-del="${t.id}" aria-label="Clear timer">${ic('close')}</button></div>`; }).join('');
  if (el.dataset.sig === sig){ $$('.row', el).forEach(r => { const t = timers.find(x => x.id === r.dataset.id); if (t && !t.done) $('small', r).textContent = `${fmt(Math.max(0, Math.ceil((t.end - now) / 1000)))} left of ${dlabel(t.total)}`; }); return; }
  el.dataset.sig = sig; el.innerHTML = rows;
  $$('[data-add]', el).forEach(b => b.onclick = () => { const t = timers.find(x => x.id === b.dataset.add); if (t){ t.end += 60000; t.total += 60; saveTimers(); haptic(); el.dataset.sig = ''; paintTimers(); } });
  $$('[data-del]', el).forEach(b => b.onclick = () => { timers = timers.filter(x => x.id !== b.dataset.del); saveTimers(); haptic(); el.dataset.sig = ''; paintTimers(); if (!timers.length) closeLayer(); });
}

/* ---------------- Sunday harvest and the Island Chronicle ----------------
   Everything here is written from the progress log on the phone: no network, no AI. */
const NUMW = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const numw = n => n <= 12 ? NUMW[n] : String(n);
const listify = a => a.length <= 1 ? (a[0] || '') : a.length === 2 ? `${a[0]} and ${a[1]}` : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`;
const cap1 = t => t.charAt(0).toUpperCase() + t.slice(1);
function weekSummary(mon){
  mon = Store.parse(Store.mondayOf(mon));
  const sunD = new Date(mon); sunD.setDate(mon.getDate() + 6);
  const start = Store.ymd(mon), end = Store.ymd(sunD), todayS = Store.ymd(today());
  const log = Store.state.log, inWk = log.filter(e => e.date >= start && e.date <= end);
  const before = log.filter(e => e.date < start).reduce((a, e) => a + e.pts, 0), gained = inWk.reduce((a, e) => a + e.pts, 0), after = before + gained;
  const res = {stone:0, land:0, harvest:0, spirit:0}; inWk.forEach(e => { res[e.res] = (res[e.res] || 0) + e.pts; });
  const count = k => inWk.filter(e => e.key === k).length;
  const isMeal = e => ['breakfast', 'lunch', 'dinner'].includes(e.key), meals = inWk.filter(e => isMeal(e) && e.pts > 0 && !/^Ate out/.test(e.label)).length;
  const list = allBuilds(), built = (Store.state.built || []).filter(e => !e.carried && e.d >= start && e.d <= end).map(e => list.find(u => u.k === e.k)).filter(Boolean);
  const s0 = 3 + Math.floor(before / 45), s1 = 3 + Math.floor(after / 45), arrived = [];
  for (let i = s0; i < s1; i++) arrived.push(SETTLERS[i % SETTLERS.length]);
  const sets = Store.state.sets || {};
  const lifted = Object.keys(sets).filter(k => { const d = k.split('|')[0]; return d >= start && d <= end && Array.isArray(sets[k]); }).map(k => {
    const [d, sid] = k.split('|'), now = sets[k].reduce((a, x) => a + x[2], 0), prev = Store.lastSets(sid, d);
    return {sid, title:(W.sessions[sid] || {}).title || sid, now, was:prev ? prev.reduce((a, x) => a + x[2], 0) : null};
  });
  const gains = lifted.filter(x => x.was != null).sort((a, b) => (b.now - b.was) - (a.now - a.was));
  const best = gains[0] || lifted.sort((a, b) => b.now - a.now)[0] || null;
  // the sleep streak running into the end of this week (or today)
  let streak = 0; const cur = Store.parse(end < todayS ? end : todayS);
  while (log.some(e => e.date === Store.ymd(cur) && e.key === 'sleep')){ streak++; cur.setDate(cur.getDate() - 1); }
  return {start, end, mon, wk:Store.weekNo(mon), gained, res, lifts:count('lift'), mobility:count('mobility'), court:count('pickleball'),
    walks:count('walk') + count('intervals'), meals, sleeps:count('sleep'), extras:inWk.filter(e => e.extra).length, built, arrived, best, streak,
    after, settlers:s1, entries:inWk.length, done:end < todayS};
}
const TITLE = {gfound:'The Gardens begin', g1:'The first tier', g2:'The second tier', g3:'The Hanging Gardens', windmill:'The windmill turns', tower:'The watchtower',
  well:'The village well', stall:'Market day', house:'A new cottage', farm:'New fields', tree:'The orchard', pine:'The pine grove', lantern:'Lanterns at dusk', flowers:'Flower beds', rock:'The standing stone',
  port1:'The cargo pier', port2:'The harbor opens', port3:'The lighthouse'};
const RANK = ['g3','port3','g2','g1','port2','gfound','windmill','port1','tower','well','stall','house','lantern','farm','tree','pine','flowers','rock'];
const PLURAL = {house:'cottages', farm:'farm plots', tree:'orchard trees', pine:'pine groves', lantern:'lanterns', flowers:'flower beds'};
/* "a farm plot, a farm plot" -> "two farm plots" */
function builtPhrases(built){
  const n = {}; built.forEach(u => { n[u.t] = (n[u.t] || 0) + 1; });
  return Object.keys(n).map(t => n[t] > 1 && PLURAL[t] ? `${numw(n[t])} ${PLURAL[t]}` : BUILD[t]);
}
function chapterTitle(s){
  if (!s.entries) return `Chapter ${s.wk}: A quiet week`;
  const top = RANK.find(t => s.built.some(u => u.t === t));
  if (top) return `Chapter ${s.wk}: ${TITLE[top]}`;
  if (s.arrived.length) return `Chapter ${s.wk}: ${s.arrived[0]} arrives`;
  return `Chapter ${s.wk}: ${['Stores for winter', 'Quiet fires', 'The long walk', 'Full baskets'][s.wk % 4]}`;
}
function chapterText(s){
  const pick = (arr, k = 0) => arr[(s.wk * 7 + k * 3) % arr.length];
  if (!s.entries) return 'The settlers kept the fire going and watched the boat for you. Nothing was built this week, and nothing was lost. Every point from here builds something new.';
  const deeds = [];
  if (s.lifts) deeds.push(s.lifts === 1 ? 'one lifting session' : `${numw(s.lifts)} lifting sessions`);
  if (s.court) deeds.push(`${numw(s.court)} ${s.court === 1 ? 'night' : 'nights'} of pickleball`);
  if (s.walks) deeds.push(`${numw(s.walks)} ${s.walks === 1 ? 'walk' : 'walks'}`);
  if (s.meals) deeds.push(`${numw(s.meals)} home-cooked ${s.meals === 1 ? 'meal' : 'meals'}`);
  const out = [];
  out.push(deeds.length ? `${pick(['This was the week of', `Week ${s.wk} brought`, 'You gave the island'])} ${listify(deeds)}.` : `It was a lighter week, but ${numw(s.entries)} small things still moved the island forward.`);
  if (s.built.length){
    const who = SETTLERS[Math.max(0, allBuilds().findIndex(u => u.k === s.built[0].k)) % SETTLERS.length];
    const phr = builtPhrases(s.built);
    out.push(phr.length === 1 && s.built.length === 1 ? `${who} finished ${BUILD[s.built[0].t]}${pick([', and the whole village came out to see it.', ' by lantern light on the last night.', ', and the island feels bigger for it.'], 1)}`
      : `The settlers raised ${listify(phr)}${pick([', working late by lantern light.', '. The village had never been busier.', ', and still asked what was next.'], 1)}`);
  } else {
    const u = unlockState();
    out.push(u.next ? `Nothing new went up, but the builders are gathering for ${BUILD[u.next.t]}: ${u.parts.map(p => `${Math.min(p.have, p.cost)} of ${p.cost} ${RESN[p.r]}`).join(', ')}.` : 'Everything on the island is built. The settlers spent the week admiring it.');
  }
  if (s.best){
    if (s.best.was != null && s.best.now > s.best.was) out.push(`${s.best.title} climbed from ${s.best.was} reps to ${s.best.now}. ${pick(['Tobi says the quarry has never been so full.', 'The stonemasons noticed.', 'Stone stacked high by the gardens.'], 2)}`);
    else if (s.best.was != null) out.push(`${s.best.title} held at ${s.best.now} reps, and steady is how quarries get dug.`);
    else out.push(`${s.best.title} went in the book at ${s.best.now} reps, the mark to beat next time.`);
  }
  if (s.sleeps >= 5) out.push(`You slept well ${numw(s.sleeps)} nights, and the lanterns burned bright all week.`);
  else if (s.sleeps) out.push(`${cap1(numw(s.sleeps))} good ${s.sleeps === 1 ? 'night' : 'nights'} of sleep kept the fire lit.`);
  if (s.arrived.length) out.push(`${listify(s.arrived)} ${pick(['rowed in on the evening boat', 'stepped off the boat with everything they owned', 'arrived with the tide'], 3)}. ${cap1(numw(s.settlers))} settlers call the island home now.`);
  return out.join(' ');
}
/* The recap is due on Sunday (this week) and on Monday (last week) until it has been opened. */
function recapDue(){
  const d = today(), dk = dayKey(d); let mon = null;
  if (dk === 'sun') mon = Store.parse(Store.mondayOf(d));
  else if (dk === 'mon'){ mon = Store.parse(Store.mondayOf(d)); mon.setDate(mon.getDate() - 7); }
  if (!mon || Store.ymd(mon) < Store.state.start) return null;
  return (prefs.recapSeen || '') === Store.ymd(mon) ? null : mon;
}
function recapCard(s, big){
  const tot = Math.max(1, s.gained);
  const bars = Store.RES.map(k => `<div class="hbar" style="--c:var(--${k});flex:${Math.max(.0001, s.res[k] / tot)}"></div>`).join('');
  const cnt = {}; s.built.forEach(u => { cnt[u.t] = (cnt[u.t] || 0) + 1; });
  const built = s.built.length ? `<div class="hbuilt">${Object.keys(cnt).map(t => `<span><i class="tile r-gold">${ic(t.startsWith('g') ? 'harvest' : 'house')}</i>${esc(BUILD_T[t])}${cnt[t] > 1 ? ` ×${cnt[t]}` : ''}</span>`).join('')}</div>` : '';
  const stat = (n, l) => `<div><b class="num">${n}</b><span class="cap">${l}</span></div>`;
  return `<article class="chapter${big ? ' big' : ''}">
    <span class="over gold">Week ${s.wk} · ${Store.parse(s.start).toLocaleDateString(undefined, {month:'short', day:'numeric'})} to ${Store.parse(s.end).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
    <h2 class="t2">${esc(chapterTitle(s))}</h2>
    ${s.entries ? `<div class="hstats">${stat('+' + s.gained, 'points')}${stat(s.built.length, s.built.length === 1 ? 'built' : 'built')}${stat(s.arrived.length, s.arrived.length === 1 ? 'arrived' : 'arrived')}${stat(s.streak, s.streak === 1 ? 'night slept' : 'nights in a row')}</div>
    <div class="hbars">${bars}</div>` : ''}
    ${built}
    ${s.best ? `<p class="hlift">${ic('lift')}<span><b>${esc(s.best.title)}</b> · ${s.best.now} reps${s.best.was != null ? ` <em class="${s.best.now >= s.best.was ? 'up' : 'down'}">${s.best.now - s.best.was >= 0 ? '+' : ''}${s.best.now - s.best.was} vs last time</em>` : ''}</span></p>` : ''}
    <p class="story">${esc(chapterText(s))}</p>
  </article>`;
}
function harvestSheet(mon){
  const s = weekSummary(mon);
  setPref('recapSeen', Store.ymd(Store.parse(Store.mondayOf(mon))));
  const sh = sheet(`<div class="grab"></div><div class="over gold" style="text-align:center">The Island Chronicle</div>${recapCard(s, true)}
    <a class="btn quiet wide" href="#chronicle">${ic('book')}Read every chapter</a>`);
  sh.classList.add('harvestsheet');
  const card = $('#harvest'); if (card) card.remove();
  if (s.built.length || s.arrived.length) setTimeout(() => { const w = $('#world'); if (w) Life.fireworks(w, 3); }, 500);
}
function vChronicle(){
  const first = Store.parse(Store.state.start), weeks = [];
  for (let m = new Date(first); Store.ymd(m) <= Store.ymd(today()); m.setDate(m.getDate() + 7)) weeks.push(weekSummary(new Date(m)));
  const shown = weeks.reverse().filter((s, i) => s.entries || s.done || i === 0);
  view.innerHTML = `${floatBack()}<header class="lhead" style="padding-top:calc(var(--top) + 66px)"><span class="over gold">Motley Island · season one</span><h1 class="lt">The Island Chronicle</h1>
    <span class="cap" style="font-size:14px;margin-top:4px">One chapter a week, written from what you actually did.</span></header>
    <div class="page stagger" style="margin-top:22px">${shown.map((s, i) => recapCard(s, false).replace('<article class="chapter', `<article class="chapter${i === 0 && !s.done ? ' current' : ''}`)).join('')}
    <p class="fine" style="text-align:center">${Store.settlers()} settlers · ${unlockState().built} of ${Isle.unlocks().length} built</p></div>`;
  scrollAt = 90; setBar('Chronicle', true); wireBack();
}

/* ---------------- Settings ---------------- */
function vSettings(){
  let armed = false;
  view.innerHTML = `${floatBack()}<header class="lhead" style="padding-top:calc(var(--top) + 66px)"><span class="over gold">Saved on this phone and backed up online</span><h1 class="lt">Settings</h1></header>
  <div class="page stagger" style="margin-top:22px">
    <section class="sect"><div class="sect-h"><span class="over">Program</span></div><div class="group">
      <label class="row" for="start"><span class="tile r-gold">${ic('calendar')}</span><span class="tx"><b>Week 1 started</b><small>You are in week ${Store.weekNo()} · season week ${Store.seasonWeek()}</small></span>
        <input id="start" type="date" value="${Store.state.start}" style="all:unset;font:500 14px var(--f-b);color:var(--gold2);max-width:130px;text-align:right"></label></div></section>
    <section class="sect"><div class="sect-h"><span class="over">Cloud backup</span><span class="cap" id="cstat"></span></div><div class="group">
      <div class="row"><span class="tile r-land">${ic('upload')}</span><span class="tx"><b>Automatic backup</b><small id="cline">Every change is saved online a few seconds later</small></span><button class="btn quiet small" type="button" id="cnow">Back up now</button></div>
      <button class="row tap" type="button" id="ccode" style="all:unset;cursor:pointer;display:flex;align-items:center;gap:14px;padding:12px 14px;min-height:64px;position:relative"><span class="tile r-gold">${ic('info')}</span><span class="tx"><b>Your backup code</b><small>The one thing you need to restore on a new phone</small></span>${ic('chev', 'i chev')}</button>
      <button class="row tap" type="button" id="crest" style="all:unset;cursor:pointer;display:flex;align-items:center;gap:14px;padding:12px 14px;min-height:64px;position:relative"><span class="tile r-land">${ic('download')}</span><span class="tx"><b>Restore from a backup code</b><small>Bring an island over from another phone</small></span>${ic('chev', 'i chev')}</button></div>
      <p class="fine">Save your backup code somewhere safe, like your Notes app or password manager. Anyone with the code can see your progress, and nobody without it can.</p></section>
    <section class="sect"><div class="sect-h"><span class="over">Backup file</span></div><div class="group">
      <button class="row tap" type="button" id="exp" style="all:unset;cursor:pointer;display:flex;align-items:center;gap:14px;padding:12px 14px;min-height:64px;position:relative"><span class="tile r-land">${ic('download')}</span><span class="tx"><b>Save a backup</b><small>Downloads a small file with your progress</small></span></button>
      <label class="row tap" for="imp" style="cursor:pointer"><span class="tile r-land">${ic('upload')}</span><span class="tx"><b>Restore a backup</b><small>Pick a Motley Island backup file</small></span></label><input id="imp" type="file" accept="application/json,.json" hidden></div>
      <p class="fine">An extra copy you can keep in iCloud Drive or Files.</p></section>
    <section class="sect"><div class="sect-h"><span class="over">Start over</span></div><button class="btn danger wide" type="button" id="rst">Erase my progress</button></section>
    <p class="fine" style="text-align:center">Motley Island · season one</p>
  </div>`;
  scrollAt = 90; setBar('Settings', true); wireBack();
  $('#start').onchange = e => { if (e.target.value){ Store.setStart(e.target.value); toast('Start date saved.'); rerender(); } };
  $('#exp').onclick = () => {
    const blob = new Blob([Store.exportJSON()], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `motley-island-${Store.ymd(today())}.json`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };
  $('#imp').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try { Store.importJSON(await f.text()); seen = null; lastAll = null; toast('Backup restored.'); location.hash = '#isle'; }
    catch(err){ toast(err.message || 'That file could not be read.'); }
  };
  $('#rst').onclick = e => {
    if (!armed){ armed = true; e.currentTarget.textContent = 'Tap again to erase everything'; return; }
    Store.reset(); Cloud.fresh(); seen = null; lastAll = null; toast('Progress erased. Your old cloud backup is untouched.'); location.hash = '#isle'; onboarding();
  };
  const paintCloud = i => {
    const st = $('#cstat'), ln = $('#cline'); if (!st) return;
    st.textContent = !i.on ? 'off' : i.status === 'saving' ? 'saving…' : i.status === 'offline' ? 'offline, will retry' : i.status === 'error' ? 'could not reach the server' : i.last ? 'on' : 'starting';
    ln.textContent = i.last ? `Last backed up ${ago(i.last)}` : 'Every change is saved online a few seconds later';
  };
  paintCloud(Cloud.info()); Cloud.onChange(paintCloud);
  $('#cnow').onclick = () => { haptic(); Cloud.push(); };
  $('#ccode').onclick = codeSheet;
  $('#crest').onclick = () => restoreSheet();
}
function ago(iso){
  const s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);
  return s < 60 ? 'just now' : s < 3600 ? `${Math.round(s / 60)} min ago` : s < 86400 ? `${Math.round(s / 3600)} hr ago` : new Date(iso).toLocaleDateString(undefined, {month:'short', day:'numeric'});
}
let codeLater = false;
function showCodeCard(){ const i = Cloud.info(); return i.on && i.code && i.last && !prefs.codeSaved && !codeLater; }
/* Hand the code to the iPhone share sheet (pick Notes); fall back to copying it. */
async function saveCode(){
  const code = Cloud.info().code; if (!code) return;
  const text = `Motley Island backup code: ${code}\n\nOn a new phone, open Motley Island, tap "Restore your island" and paste this code.`;
  haptic();
  const done = msg => { setPref('codeSaved', true); toast(msg); const c = $('#savecode'); if (c) c.animate([{opacity:1}, {opacity:0, transform:'scale(.97)'}], {duration:220}); setTimeout(() => c.remove(), 230); };
  if (navigator.share){
    try { await navigator.share({title:'Motley Island backup code', text}); done('Saved. You never need to do that again.'); }
    catch(e){ if (e && e.name !== 'AbortError') { try { await navigator.clipboard.writeText(text); done('Copied. Paste it into Notes.'); } catch(err) {} } }
    return;
  }
  try { await navigator.clipboard.writeText(text); done('Copied. Paste it into Notes.'); } catch(e) { codeSheet(); }
}
function codeSheet(){
  const code = Cloud.info().code;
  const sh = sheet(`<div class="grab"></div><div><div class="over gold">Cloud backup</div><h2 class="t2" style="margin-top:8px">Your backup code</h2></div>
    <div class="bcode num">${esc(code)}</div>
    <div class="btns"><button class="btn quiet" type="button" id="ccopy">Copy</button><button class="btn" type="button" id="cshare">${ic('upload')}Save to Notes</button></div>
    <p class="fine">Paste it into your Notes app or password manager. On a new phone, open Motley Island and choose Restore from a backup code.</p>`);
  $('#cshare', sh).onclick = () => saveCode();
  $('#ccopy', sh).onclick = async () => {
    haptic();
    try { await navigator.clipboard.writeText(code); toast('Code copied.'); } catch(e) { toast('Select the code and copy it.'); }
  };
}
function restoreSheet(after){
  const sh = sheet(`<div class="grab"></div><div><div class="over gold">Cloud backup</div><h2 class="t2" style="margin-top:8px">Restore your island</h2></div>
    <label class="field"><span class="cap">Backup code</span><input id="rcode" type="text" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"></label>
    <div id="rfound"></div>
    <button class="btn wide" type="button" id="rfind">Find my backup</button>`);
  let found = null;
  $('#rfind', sh).onclick = async () => {
    const b = $('#rfind', sh);
    if (found){
      b.disabled = true; b.textContent = 'Restoring…';
      try { await Cloud.restore($('#rcode', sh).value); seen = null; lastAll = null; closeLayer(); haptic(); toast('Your island is back.'); if (after) after(); location.hash = '#isle'; rerender(); }
      catch(e){ toast(e.message); b.disabled = false; b.textContent = 'Replace this phone with the backup'; }
      return;
    }
    b.disabled = true; b.textContent = 'Looking…';
    try {
      const p = await Cloud.peek($('#rcode', sh).value), pts = (p.data.log || []).reduce((a, e) => a + (e.pts || 0), 0);
      found = p;
      $('#rfound', sh).innerHTML = `<div class="callout">${ic('check')}<span>Found it: ${Math.round(pts)} points, ${(p.data.log || []).length} things logged, last saved ${ago(p.updated)}. Restoring replaces what is on this phone.</span></div>`;
      b.textContent = 'Replace this phone with the backup';
    } catch(e){ toast(e.message); b.textContent = 'Find my backup'; }
    b.disabled = false;
  };
}

/* ---------------- onboarding ---------------- */
function onboarding(){
  if (Store.state.onboarded) return;
  let step = 0;
  const thisMon = Store.mondayOf(today());
  const nm = Store.parse(thisMon); nm.setDate(nm.getDate() + 7); const nextMon = Store.ymd(nm);
  const label = s => Store.parse(s).toLocaleDateString(undefined, {weekday:'short', month:'short', day:'numeric'});
  let pick = thisMon;
  const el = document.createElement('div'); el.className = 'onb'; document.body.appendChild(el);
  const paint = () => {
    const prog = [.06, .45, .95][step];
    const body = [
      `<span class="over gold">Welcome</span><h1 class="lt">Build an island by building yourself.</h1><p>Every workout, walk, home-cooked meal and good night of sleep brings settlers and new buildings. Twelve weeks from now, the Hanging Gardens.</p>`,
      `<span class="over gold">How it grows</span><h1 class="lt">Four resources.</h1><div class="legend">${[['stone','Stone','Dumbbell sessions'],['land','Land','Walks, runs and pickleball'],['harvest','Harvest','Meals from your Kitchen plan'],['spirit','Spirit','Sleep and mobility']].map(([k, n, d]) => `<div class="row" style="min-height:56px"><span class="tile r-${k}">${ic(k)}</span><span class="tx"><b>${n}</b><small>${d}</small></span></div>`).join('')}</div>`,
      `<span class="over gold">Your plan</span><h1 class="lt">When does week one start?</h1><p>Shop the Market list and do Sunday prep first, if you can.</p><div class="opts">${[[thisMon, 'This week'], [nextMon, 'Next week']].map(([v, l]) => `<button type="button" data-v="${v}" class="${pick === v ? 'on' : ''}"><b class="hl">${l}</b><span class="cap">${label(v)}</span></button>`).join('')}</div>`
    ][step];
    el.innerHTML = `<div class="art"><svg id="onbisl" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet"></svg></div>
      <div class="panel"><div class="dots">${[0, 1, 2].map(i => `<i class="${i === step ? 'on' : ''}"></i>`).join('')}</div>${body}
      <button class="btn wide" type="button" id="onext">${step < 2 ? 'Continue' : 'Begin season one'}</button>${step === 0 ? `<button class="linkbtn" type="button" id="onrest">Coming from another phone? Restore your island</button>` : ''}</div>`;
    drawIsland($('#onbisl', el), prog, .5, 1.05, 'onb');
    $$('.opts button', el).forEach(b => b.onclick = () => { pick = b.dataset.v; paint(); });
    const rb = $('#onrest', el); if (rb) rb.onclick = () => { el.style.zIndex = '30'; restoreSheet(() => el.remove()); };
    $('#onext', el).onclick = () => {
      if (step < 2){ step++; paint(); return; }
      Store.setStart(pick); Store.setOnboarded();
      el.animate([{opacity:1}, {opacity:0}], {duration:350}).onfinish = () => el.remove();
      rerender();
    };
  };
  paint();
}

/* ---------------- router ---------------- */
const TABS = [['today','Today'],['train','Train'],['isle','Isle'],['market','Market'],['kitchen','Kitchen']];
nav.innerHTML = TABS.map(([k, l]) => `<a href="#${k}" data-tab="${k}" aria-label="${l}">${ic(k)}<span>${l}</span></a>`).join('');
const TAB_OF = {session:'train', play:'train', recipe:'kitchen', cook:'kitchen', prep:'kitchen', settings:'today', chronicle:'isle', plan:'kitchen'};
const DETAIL = new Set(['session','recipe','prep','settings','chronicle','plan']);
let lastName = null, lastTab = null, quiet = false;
const stack = [];
function route(keep){
  const hash = location.hash || '#today';
  const [name, arg, arg2] = (hash.slice(1) || 'today').split('/');
  if ((name === 'recipe' || name === 'cook') && arg2 && !MW[+arg2] && MEAL_WEEKS.includes(+arg2)){ loadWeek(+arg2).then(() => route(keep)); return; }
  const tab = TAB_OF[name] || name;
  let dir = 'enter';
  if (!keep){
    if (stack.length > 1 && stack[stack.length - 2] === hash){ stack.pop(); dir = 'pop'; }
    else if (DETAIL.has(name) || name === 'play' || name === 'cook'){ stack.push(hash); dir = 'push'; }
    else { stack.length = 0; stack.push(hash); const a = TABS.findIndex(t => t[0] === lastTab), b = TABS.findIndex(t => t[0] === tab); dir = a < 0 || a === b ? 'enter' : b > a ? 'tab-r' : 'tab-l'; }
    if (quiet){ dir = 'fade'; quiet = false; }
  }
  $$('a', nav).forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
  if (name !== 'play' && play) endPlay();
  if (name !== 'cook' && cook) endCook();
  if (name !== 'play' && name !== 'cook') app.classList.remove('immersive');
  app.classList.toggle('detail', DETAIL.has(name));
  Life.stop(); closeBubble();
  if (name !== 'isle'){ cam.s = 1; cam.cx = 0; cam.cy = 0; }
  dock.innerHTML = ''; layer.innerHTML = '';
  view.style.transform = '';
  ({today:vToday, isle:vIsle, train:vTrain, session:() => vSession(arg), play:() => vPlay(arg), market:vMarket, kitchen:vKitchen, recipe:() => vRecipe(arg, arg2), cook:() => vCook(arg, arg2), prep:() => vPrep(arg, arg2), settings:vSettings, chronicle:vChronicle, plan:vPlan}[name] || vToday)();
  if (!keep){
    view.scrollTop = 0; app.classList.remove('scrolled');
    const first = view.firstElementChild;
    if (first && lastName !== null) first.classList.add(dir);
  } else $$('.stagger', view).forEach(s => s.classList.remove('stagger'));
  lastName = name; lastTab = tab;
  paintTimers();
}

/* Swipe in from the left edge to go back on detail screens, like any iPhone app. */
(function edgeBack(){
  let g = null;
  view.addEventListener('pointerdown', e => {
    if (!app.classList.contains('detail') || e.button) return;
    const left = app.getBoundingClientRect().left;
    if (e.clientX - left > 28) return;
    g = {x0:e.clientX, y0:e.clientY, id:e.pointerId, on:false, dx:0, t0:performance.now()};
  });
  view.addEventListener('pointermove', e => {
    if (!g || e.pointerId !== g.id) return;
    const dx = e.clientX - g.x0, dy = e.clientY - g.y0;
    if (!g.on){
      if (Math.abs(dy) > 12 && Math.abs(dy) > dx){ g = null; return; }
      if (dx > 10){ g.on = true; try { view.setPointerCapture(g.id); } catch(err) {} view.classList.add('dragging'); } else return;
    }
    g.dx = Math.max(0, dx);
    view.style.transform = `translateX(${g.dx}px)`;
  });
  const end = e => {
    if (!g || e.pointerId !== g.id) return;
    const w = view.clientWidth, v = g.dx / Math.max(1, performance.now() - g.t0), was = g.on, go = g.on && (g.dx > w * .33 || (v > .5 && g.dx > 40));
    view.classList.remove('dragging');
    if (go){
      const a = view.animate([{transform:`translateX(${g.dx}px)`}, {transform:`translateX(${w}px)`, opacity:.4}], {duration:200, easing:'cubic-bezier(.3,.6,.4,1)', fill:'forwards'});
      a.onfinish = () => { quiet = true; goBack(); setTimeout(() => a.cancel(), 30); };
    } else if (was){
      view.animate([{transform:`translateX(${g.dx}px)`}, {transform:'translateX(0)'}], {duration:260, easing:'cubic-bezier(.3,1.3,.5,1)'});
      view.style.transform = '';
    }
    if (was) swallowClick();
    g = null;
  };
  view.addEventListener('pointerup', end);
  view.addEventListener('pointercancel', e => { if (g && e.pointerId === g.id){ view.classList.remove('dragging'); view.style.transform = ''; g = null; } });
})();
view.addEventListener('scroll', () => { app.classList.toggle('scrolled', view.scrollTop > scrollAt); if (worldTap.t) closeBubble(); }, {passive:true});

async function boot(){
  try {
    const cw = mealWeek(), nw = MEAL_WEEKS.find(n => n > cw);
    const get = n => fetch(`data/meals-week${n}.json`).then(r => r.json());
    const [w, m, m2] = await Promise.all([fetch('data/workouts.json').then(r => r.json()), get(cw), nw ? get(nw).catch(() => null) : null]);
    W = w; M = m; MW[cw] = m; if (m2) MW[nw] = m2;
  } catch(e) {
    view.innerHTML = `<header class="lhead"><h1 class="lt">Motley Island</h1><p class="cap">The plan did not load. Check your connection and open the app again.</p></header>`;
    return;
  }
  window.addEventListener('hashchange', () => route());
  window.addEventListener('resize', () => { const s = $('#isl'); if (s){ const keep = seen; drawIsland(s); seen = keep; } });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && (play || cook)) keepAwake(true); });
  migrateBuilt(); settle();
  route();
  onboarding();
  Cloud.start();
  setTimeout(loadAllWeeks, 4000);
  Cloud.onChange(i => { if (i.status === 'ok' && showCodeCard() && /^(today)?$/.test(location.hash.replace('#', '')) && !$('#savecode')) rerender(); });
  const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  if ('serviceWorker' in navigator && location.protocol === 'https:' && !local){
    // When an update installs, swap to it right away, unless a workout or cook mode is open.
    const hadController = !!navigator.serviceWorker.controller;
    let pending = false;
    const apply = () => { if (!play && !cook){ location.reload(); } else pending = true; };
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) apply(); });
    window.addEventListener('hashchange', () => { if (pending && !play && !cook) location.reload(); });
    navigator.serviceWorker.register('sw.js').then(r => r.update()).catch(() => {});
  }
}
boot();
})();
