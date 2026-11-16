/* Hearth Isle app: hash router, four tabs (Isle, Train, Market, Kitchen), detail screens,
   a guided workout player, cook mode and first-run onboarding. */
(function(){
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const app = $('#app'), view = $('#view'), nav = $('#nav'), layer = $('#layer');
const bar = document.createElement('div'); bar.className = 'bar'; app.appendChild(bar);
const dock = document.createElement('div'); dock.className = 'dock'; app.appendChild(dock);

const DAYS = ['mon','tue','wed','thu','fri','sat','sun'];
const DAYN = {mon:'Monday',tue:'Tuesday',wed:'Wednesday',thu:'Thursday',fri:'Friday',sat:'Saturday',sun:'Sunday'};
const SLOT = {breakfast:'Breakfast',lunch:'Lunch',dinner:'Dinner'};
const RESN = {stone:'Stone',land:'Land',harvest:'Harvest',spirit:'Spirit'};
const MEAL_WEEKS = [1, 2, 3, 4, 5];
const PTS_PER_STAGE = Store.SEASON.total / 4;
const SETTLERS = ['Juno','Mira','Tobi','Pell','Wren','Ansel','Ivy','Corin','Bea','Otto','Lark','Fen','Rhea','Sol','Nell','Arlo','Hale','Tess'];
const BUILD = {house:'a cottage',farm:'a farm plot',tree:'an orchard tree',pine:'a pine grove',well:'the village well',stall:'a market stall',windmill:'the windmill',tower:'the watchtower',
  lantern:'a lantern',flowers:'a flower bed',rock:'a standing stone',gfound:'the Gardens foundation',g1:'the first Gardens tier',g2:'the second Gardens tier',g3:'the Hanging Gardens'};
const BUILD_T = {house:'Cottage',farm:'Farm plot',tree:'Orchard tree',pine:'Pine grove',well:'Village well',stall:'Market stall',windmill:'Windmill',tower:'Watchtower',
  lantern:'Lantern',flowers:'Flower bed',rock:'Standing stone',gfound:'Gardens foundation',g1:'Gardens · tier one',g2:'Gardens · tier two',g3:'Hanging Gardens'};

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
  isle:'<path d="M3 18c2 1.3 4 1.3 6 0s4-1.3 6 0 4 1.3 6 0"/><path d="M5 14.5c2-3 12-3 14 0"/><path d="M12 13V6m0 0c-1.5-2-4-2.2-5.5-1M12 6c1.5-2 4-2.2 5.5-1M12 6c-.5-1.8.3-3 1.5-3.6"/>',
  train:'<path d="M6.5 7v10M3.5 9.5v5M17.5 7v10M20.5 9.5v5M6.5 12h11"/>',
  market:'<path d="M4 9h16l-1.6 9.2a2 2 0 0 1-2 1.8H7.6a2 2 0 0 1-2-1.8z"/><path d="M8.5 9 11 4M15.5 9 13 4"/>',
  kitchen:'<path d="M4 11h16v3a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z"/><path d="M2 11h2M20 11h2M9 7.5c0-1.3 1-1.3 1-2.6M13 7.5c0-1.3 1-1.3 1-2.6"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  back:'<path d="M15 5l-7 7 7 7"/>', close:'<path d="M6 6l12 12M18 6 6 18"/>', chev:'<path d="M9 5l7 7-7 7"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>', play:'<path d="M7 4.5v15l12.5-7.5z" fill="currentColor"/>',
  clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', flame:'<path d="M12 3c1.3 3.2 5 5 5 9.5a5 5 0 0 1-10 0c0-2.4 1.2-3.8 2-4.8.4 1.6 1.3 2.6 2.4 2.8C10.9 7.8 11.3 5.3 12 3z"/>',
  layers:'<path d="M12 3.5 21 8l-9 4.5L3 8z"/><path d="M3 12.5l9 4.5 9-4.5M3 16.5l9 4.5 9-4.5"/>', people:'<circle cx="9" cy="8" r="3"/><path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5M16 5.5a3 3 0 0 1 0 5.6M17.5 14.6c1.8.6 3 2.4 3 4.9"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', minus:'<path d="M5 12h14"/>', info:'<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
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
function tasksFor(date){
  const d = dayKey(date), ds = Store.ymd(date), out = planItems(d), menu = M.menu[d];
  if (menu) Object.keys(SLOT).forEach(slot => {
    const r = M.recipes[menu[slot]]; if (!r) return;
    out.push({key:slot, type:slot, icon:slot, label:r.name, meta:`${SLOT[slot]}${menu.shared === slot ? ' · for two' : ''} · ${r.minutes} min`, go:'#recipe/' + menu[slot], recipe:menu[slot]});
  });
  out.push({key:'sleep', type:'sleep', icon:'sleep', label:'Slept 7+ hours', meta:'Last night'});
  return out.map(t => Object.assign(t, Store.PTS[t.type], {done:Store.isDone(ds, t.key), optional:t.optional || weekend(d)}));
}
function dayProgress(date){
  const t = tasksFor(date), req = t.filter(x => !x.optional);
  const base = req.length ? req : t;
  return {done:base.filter(x => x.done).length, total:base.length};
}
function unlockState(all = Store.totals().all){
  const list = Isle.unlocks();
  const nextI = list.findIndex(u => u.th * PTS_PER_STAGE > all + 1e-9);
  const next = nextI < 0 ? null : list[nextI];
  const prevPts = nextI > 0 ? list[nextI - 1].th * PTS_PER_STAGE : 0;
  return {list, next, nextI, built:(nextI < 0 ? list.length : nextI), prevPts, need:next ? Math.ceil(next.th * PTS_PER_STAGE - all) : 0,
    pct:next ? Math.max(0, Math.min(100, (all - prevPts) / (next.th * PTS_PER_STAGE - prevPts) * 100)) : 100};
}

/* ---------------- feedback ---------------- */
function haptic(){ try { navigator.vibrate && navigator.vibrate(8); } catch(e) {} }
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
function reward(res, pts, sub){
  rewardQ = rewardQ.then(() => new Promise(done => {
    const r = document.createElement('div'); r.className = 'reward';
    r.innerHTML = `<span class="tile r-${res}">${ic(res)}</span><span><b>+${pts} ${RESN[res]}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span>`;
    document.body.appendChild(r); setTimeout(() => { r.remove(); }, 2700); setTimeout(done, 1100);
  }));
}
function toast(txt){ const t = document.createElement('div'); t.className = 'toast'; t.textContent = txt; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); }
function celebrate(before){
  const after = Store.totals().all, u0 = unlockState(before), u1 = unlockState(after);
  const s0 = 3 + Math.floor(before / 45), s1 = Store.settlers();
  if (u1.built > u0.built){
    const u = u1.list[u1.built - 1], who = SETTLERS[(u1.built - 1) % SETTLERS.length];
    setTimeout(() => toast(u.t.startsWith('g') ? `The settlers finished ${BUILD[u.t]}.` : `${who} built ${BUILD[u.t]}.`), 900);
  } else if (s1 > s0){
    setTimeout(() => toast(`${SETTLERS[(s1 + 3) % SETTLERS.length]} arrived by boat. ${s1} settlers now.`), 900);
  }
}
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
function goBack(){ if (history.length > 1) history.back(); else location.hash = '#isle'; }
function floatBack(){ return `<button class="backbtn floatback" type="button" data-back aria-label="Back">${ic('back')}</button>`; }
function wireBack(){ $$('[data-back]', view).forEach(b => b.onclick = goBack); }
function ring(done, total, size = 84){
  const r = 36, C = 2 * Math.PI * r, f = total ? done / total : 0;
  return `<div class="ring" style="width:${size}px;height:${size}px"><svg viewBox="0 0 84 84"><defs><linearGradient id="ringgrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd994"/><stop offset="1" stop-color="#de8c3a"/></linearGradient></defs>
    <circle class="bgc" cx="42" cy="42" r="${r}"/><circle class="fgc" cx="42" cy="42" r="${r}" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - f)).toFixed(1)}"/></svg>
    <div><span><b class="num">${done}</b><small>of ${total}</small></span></div></div>`;
}
function mini(f, rest){
  const r = 12, C = 2 * Math.PI * r;
  return `<svg class="mini" viewBox="0 0 30 30"><circle class="bgc" cx="15" cy="15" r="${r}"/>${f > 0 ? `<circle class="fgc" cx="15" cy="15" r="${r}" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - Math.min(1, f))).toFixed(1)}"/>` : ''}</svg>`;
}
function taskRow(t, opts = {}){
  const main = `<span class="tile r-${t.res}">${ic(t.icon)}</span><span class="tx"><b>${esc(t.label)}</b><small><em>+${t.pts} ${RESN[t.res].toLowerCase()}</em> · ${esc(t.meta)}</small></span>`;
  return `<div class="row${t.done ? ' done' : ''}" data-key="${t.key}">
    ${t.go ? `<a class="main tap" href="${t.go}">${main}</a>` : `<div class="main" data-tick-row>${main}</div>`}
    <button class="tick" type="button" data-task="${t.key}" aria-label="${t.done ? 'Undo' : 'Complete'} ${esc(t.label)}" ${opts.disabled ? 'disabled' : ''}>${ic('check', '')}</button></div>`;
}
function wireTicks(date = today()){
  $$('.tick[data-task]', view).forEach(b => b.addEventListener('click', () => toggleTask(b.dataset.task, b, date)));
  $$('[data-tick-row]', view).forEach(m => m.addEventListener('click', () => { const b = m.parentElement.querySelector('.tick'); if (b && !b.disabled) b.click(); }));
}
function toggleTask(key, btn, date = today()){
  const ds = Store.ymd(date), t = tasksFor(date).find(x => x.key === key); if (!t) return;
  const before = Store.totals().all;
  const rowEl = btn && btn.closest('.row');
  if (t.done){ Store.undo(ds, key); if (rowEl) rowEl.classList.remove('done'); }
  else {
    Store.complete(ds, key, t.label, t.type);
    if (rowEl) rowEl.classList.add('done');
    haptic(); burst(btn); reward(t.res, t.pts, t.label); celebrate(before);
  }
  setTimeout(rerender, 420);
}
function rerender(){ const y = view.scrollTop; route(true); view.scrollTop = y; }

/* ---------------- island ---------------- */
function drawIsland(svg, prog = Store.progress(), anchor = .55, zoom = 1.12, id = 'h'){
  const r = Isle.isoScene(prog, Isle.PAL_B, id);
  const box = svg.getBoundingClientRect();
  const w = 2 * r.W * zoom, h = w * (box.height / Math.max(1, box.width));
  svg.setAttribute('viewBox', `${(-w / 2).toFixed(1)} ${(8 - anchor * h).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`);
  svg.innerHTML = r.svg;
  if (id !== 'h') return;
  const now = new Set();
  $$('.o', svg).forEach(g => { const k = g.dataset.k; now.add(k); if (seen && !seen.has(k)) g.classList.add('pop'); });
  seen = now;
}
function islandSheet(){
  const t = Store.totals(), u = unlockState(t.all), g = Store.gardens();
  const upcoming = u.list.slice(u.built, u.built + 4);
  sheet(`<div class="grab"></div>
    <div><div class="over gold">Your island</div><h2 class="t2" style="margin-top:8px">Hearth Isle</h2></div>
    <div class="stats3"><div><span class="cap">Settlers</span><b>${Store.settlers()}</b></div><div><span class="cap">Built</span><b>${u.built}<span class="cap"> / ${u.list.length}</span></b></div><div><span class="cap">Gardens</span><b>${g.pct}%</b></div></div>
    ${upcoming.length ? `<div class="sect"><div class="sect-h"><span class="over">Coming next</span></div><div class="group">${upcoming.map(x => `<div class="row"><span class="tile r-gold">${ic(x.t.startsWith('g') ? 'harvest' : 'house')}</span><span class="tx"><b>${BUILD_T[x.t]}</b><small>${Math.max(0, Math.ceil(x.th * PTS_PER_STAGE - t.all))} points away</small></span></div>`).join('')}</div></div>`
      : `<div class="callout">${ic('extra')}<span>Everything this season is built. Season two starts a new Wonder.</span></div>`}
    <p class="fine">Every 45 points brings a new settler. Points come from the four resources: Stone from strength work, Land from walks, runs and pickleball, Harvest from home-cooked meals, and Spirit from sleep and mobility.</p>`);
}

/* ---------------- sheet ---------------- */
function sheet(html){
  layer.innerHTML = `<div class="scrim"></div><div class="sheet" role="dialog" aria-modal="true">${html}</div>`;
  $('.scrim', layer).onclick = closeLayer;
  return $('.sheet', layer);
}
function closeLayer(){
  const s = $('.sheet', layer);
  if (!s){ layer.innerHTML = ''; return; }
  s.animate([{transform:'translateY(0)'}, {transform:'translateY(100%)'}], {duration:280, easing:'cubic-bezier(.4,0,1,1)'}).onfinish = () => { layer.innerHTML = ''; };
  const sc = $('.scrim', layer); if (sc) sc.animate([{opacity:1}, {opacity:0}], {duration:280, fill:'forwards'});
}

/* ---------------- Isle ---------------- */
function vIsle(){
  const now = today(), d = dayKey(now), t = Store.totals(), g = Store.gardens(), sw = Store.seasonWeek(), u = unlockState(t.all);
  const tasks = tasksFor(now), dp = dayProgress(now), menu = M.menu[d], fest = weekend(d);
  const hour = now.getHours(), greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const next = tasks.find(x => !x.done && !x.optional);
  let cta = '';
  if (next){
    if (next.session) cta = `<a class="btn wide" href="#play/${next.session}">${ic('play', 'i solid')}Start ${esc(next.label)}</a>`;
    else if (next.recipe) cta = `<a class="btn wide" href="#recipe/${next.recipe}">${ic(next.icon)}Cook ${esc(M.recipes[next.recipe].name)}</a>`;
    else cta = `<button class="btn wide" type="button" data-cta="${next.key}">${ic('check')}Mark ${esc(next.label.toLowerCase())} done</button>`;
  }
  const left = dp.total - dp.done;
  const line = fest ? 'Festival day. Nothing is required, and anything you do still builds.' :
    left === 0 ? 'Everything is done. The settlers are celebrating.' :
    `${greet}. ${left === 1 ? 'One thing left' : `${left} things left`} to finish the day.`;
  const mon = Store.parse(Store.mondayOf(now));
  const weekHTML = DAYS.map((dk, i) => {
    const dt = new Date(mon); dt.setDate(mon.getDate() + i);
    const future = dt > now && dk !== d, p = dayProgress(dt);
    return `<a class="${dk === d ? 'today' : ''}${weekend(dk) ? ' rest' : ''}">${mini(future ? 0 : p.done / Math.max(1, p.total), weekend(dk))}${DAYN[dk][0]}</a>`;
  }).join('');
  const groups = [
    ['Move', tasks.filter(x => ['lift','mobility','walk','intervals','pickleball'].includes(x.type))],
    ['Eat', tasks.filter(x => SLOT[x.type])],
    ['Recover', tasks.filter(x => x.type === 'sleep')]
  ];
  const recent = Store.state.log.slice(-5).reverse();
  const when = e => { const diff = Math.round((Store.parse(Store.ymd(now)) - Store.parse(e.date)) / 864e5); return diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : DAYN[dayKey(Store.parse(e.date))]; };
  view.innerHTML = `<div class="isle">
    <div class="world" id="world" role="button" aria-label="Open island details"><svg id="isl" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet"></svg></div>
    <div class="topfade"></div>
    <header class="ttl"><div><div class="over">Season one · week ${sw} of 12</div><h1 class="lt">Hearth Isle</h1></div>
      <a class="iconbtn tap" href="#settings" aria-label="Settings">${ic('gear')}</a></header>
    <div class="page stagger">
      <section class="card today">
        ${ring(dp.done, dp.total)}
        <div class="tx"><span class="over gold">${DAYN[d]} · ${now.toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span><h2 class="t2">${fest ? 'Festival day' : left === 0 ? 'Day complete' : 'Today'}</h2><span class="cap">${line}</span></div>
        ${cta}
      </section>
      ${u.next ? `<button class="nextup tap" type="button" id="nextup" style="all:unset;cursor:pointer;display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:18px;background:linear-gradient(90deg,rgba(244,189,99,.10),rgba(244,189,99,.03));box-shadow:inset 0 0 0 1px rgba(244,189,99,.16)">
        <span class="tile r-gold">${ic(u.next.t.startsWith('g') ? 'harvest' : 'house')}</span>
        <span class="tx" style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px"><span class="over gold">Next on the island</span><span class="hl">${BUILD_T[u.next.t]}</span>
        <span class="cap">${plural(u.need, 'point')} away · ${Store.settlers()} settlers</span><span class="meter" style="height:4px;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden;margin-top:6px;display:block"><i style="display:block;height:100%;width:${u.pct.toFixed(1)}%;border-radius:4px;background:linear-gradient(90deg,#de8c3a,#ffd994)"></i></span></span></button>` : ''}
      ${menu && menu.heads ? `<div class="callout">${ic('info')}<span>${esc(menu.heads)}</span></div>` : ''}
      ${d === 'sun' ? `<a class="callout tap" href="#prep/sun/${nextW() || mealWeek()}">${ic('calendar')}<span>Prep day. Shop the Market list, then open Sunday prep.</span></a>` : ''}
      <div class="week" aria-label="This week">${weekHTML}</div>
      ${groups.map(([name, list]) => list.length ? `<section class="sect"><div class="sect-h"><span class="over">${name}</span><span class="cap">${list.filter(x => x.done).length} of ${list.length}</span></div>
        <div class="group">${list.map(x => taskRow(x)).join('')}${name === 'Recover' ? `<div class="row"><button class="main tap" type="button" id="extra" style="all:unset;cursor:pointer;flex:1;display:flex;align-items:center;gap:14px"><span class="tile r-gold">${ic('extra')}</span><span class="tx"><b>Log something extra</b><small>A hike, a bike ride, extra sets</small></span></button>${ic('plus', 'i chev')}</div>` : ''}</div></section>` : '').join('')}
      <section class="sect"><div class="sect-h"><span class="over">This season</span><span class="cap"><span id="tot" class="num">${t.all}</span> of ${Store.SEASON.total}</span></div>
        <div class="meters"><div class="gardens"><div class="meter2"><p>Hanging Gardens<b style="font-size:15px">${g.label}</b></p></div><div class="bar2"><i style="width:${g.pct}%"></i></div></div>
        ${Store.RES.map(k => `<div class="meter2" style="--c:var(--${k})"><p>${RESN[k]}<b class="num">${t[k]}</b></p><div class="bar2"><i style="width:${Math.min(100, t[k] / Store.SEASON[k] * 100).toFixed(1)}%"></i></div></div>`).join('')}</div></section>
      ${recent.length ? `<section class="sect"><div class="sect-h"><span class="over">Island log</span></div><div class="group">${recent.map(e => `<div class="row"><span class="tile r-${e.res}">${ic(e.res)}</span><span class="tx"><b>${esc(e.label)}</b><small>${when(e)}</small></span><span class="trail" style="color:var(--${e.res})">+${e.pts}</span></div>`).join('')}</div></section>` : ''}
    </div></div>`;
  scrollAt = 330; setBar('Hearth Isle');
  drawIsland($('#isl'));
  $('#world').onclick = islandSheet;
  const nu = $('#nextup'); if (nu) nu.onclick = islandSheet;
  wireTicks();
  const c = $('[data-cta]'); if (c) c.onclick = () => toggleTask(c.dataset.cta, $(`.tick[data-task="${c.dataset.cta}"]`));
  $('#extra').onclick = openExtra;
  countUp($('#tot'), lastAll, t.all); lastAll = t.all;
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
  const others = items.filter(i => i !== main);
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
    <section class="sect"><div class="sect-h"><span class="over">12-week program</span><span class="cap">Week ${sw}</span></div>
      <div class="card" style="padding:18px;display:flex;flex-direction:column;gap:12px">
        <div class="phasebar">${Array.from({length:total}, (_, i) => `<i class="${i + 1 < nowW ? 'past' : i + 1 === nowW ? 'now' : ''}"></i>`).join('')}</div>
        <div class="phaselbl">${W.phases.map(p => `<span class="${p === ph ? 'on' : ''}">${p.name}</span>`).join('')}</div>
        <span class="cap" style="color:var(--ink);opacity:.85">${esc(ph.note)}</span></div></section>
    <section class="sect"><div class="sect-h"><span class="over">Session library</span></div><div class="group">
      ${Object.entries(W.sessions).map(([id, x]) => `<a class="row tap" href="#session/${id}"><span class="tile ${id === 'M' ? 'r-spirit' : 'r-stone'}">${ic(id === 'M' ? 'mobility' : 'lift')}</span><span class="tx"><b>${esc(x.title)}</b><small>${id === 'M' ? 'Before pickleball' : 'Session ' + id} · ${x.minutes} min · ${totalSets(x)} sets</small></span>${ic('chev', 'i chev')}</a>`).join('')}
    </div></section>
    <p class="fine">Built for ${W.equipment.join(', ')}. When a set feels easy, slow the lowering down before adding reps.</p>
  </div>`;
  scrollAt = 50; setBar('Train');
  $$('.days button', view).forEach(b => b.onclick = () => { trainDay = b.dataset.d; rerender(); });
  wireTicks();
}

function vSession(id){
  const s = W.sessions[id]; if (!s) return vTrain();
  const ph = phase();
  view.innerHTML = `${floatBack()}<header class="lhead" style="padding-top:calc(var(--top) + 66px)"><span class="over gold">${id === 'M' ? 'Mobility · before pickleball' : 'Session ' + id}</span><h1 class="lt">${esc(s.title)}</h1>
    <div class="chips" style="margin-top:8px"><span class="chip">${ic('clock')}${s.minutes} min</span><span class="chip">${ic('layers')}${plural(s.blocks.length, 'move')}</span><span class="chip">${ic('lift')}${totalSets(s)} sets</span></div></header>
  <div class="page stagger" style="margin-top:22px">
    <span class="cap" style="font-size:14px">${esc(s.format)}</span>
    ${id !== 'M' ? `<div class="callout">${ic('info')}<span><b>${esc(ph.name)} phase.</b> ${esc(ph.note)}</span></div>` : ''}
    <div class="group">${s.blocks.map(b => { const ex = W.exercises[b.ex];
      return `<div class="move"><div class="move-h"><span class="tile r-stone">${esc(b.group)}</span><span class="tx" style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px"><b class="hl">${esc(ex.name)}</b><small class="cap">${b.sets} × ${esc(b.reps)}${b.rest ? ` · rest ${b.rest}s` : ''} · ${esc(ex.equip)}</small></span></div>
        <details><summary>${esc(ex.cue)} · How to</summary><ol>${ex.how.map(h => `<li>${esc(h)}</li>`).join('')}</ol></details></div>`; }).join('')}</div>
    <div style="height:70px"></div>
  </div>`;
  scrollAt = 90; setBar(s.title, true); wireBack();
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
  if (!play || play.id !== id) play = {id, s, steps:buildSteps(s), i:0, mode:'work', t0:Date.now(), restLeft:0, restTotal:0, tick:null};
  app.classList.add('immersive'); keepAwake(true);
  renderPlay();
  clearInterval(play.tick);
  play.tick = setInterval(() => {
    const c = $('#pclock'); if (c) c.textContent = fmt((Date.now() - play.t0) / 1000);
    if (play.mode === 'rest'){ play.restLeft--; if (play.restLeft <= 0){ haptic(); play.mode = 'work'; play.i++; renderPlay(); } else paintRest(); }
  }, 1000);
}
const fmt = sec => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
function renderPlay(){
  const p = play, s = p.s, st = p.steps[p.i];
  const segs = `<div class="segs">${p.steps.map((_, k) => `<i class="${k < p.i || p.mode === 'done' ? 'on' : ''}"></i>`).join('')}</div>`;
  const top = `<div class="ptop"><button class="backbtn" type="button" id="pclose" aria-label="End workout">${ic('close')}</button>${segs}<span class="clock" id="pclock">${fmt((Date.now() - p.t0) / 1000)}</span></div>`;
  if (p.mode === 'done'){
    const plannedToday = (W.week[dayKey(today())] || []).find(i => i.session === p.id);
    const key = plannedToday ? plannedToday.type : null, already = key && Store.isDone(Store.ymd(today()), key);
    const pts = key ? Store.PTS[key] : {res:'stone', pts:Math.max(1, Math.round(s.minutes / Store.EXTRA.strength.per))};
    view.innerHTML = `<div class="player">${top}<div class="finish"><div class="medal">${ic('check')}</div><div><span class="over gold">Session complete</span><h1 class="lt" style="margin-top:10px">${esc(s.title)}</h1></div>
      <div class="stats"><div><span class="cap">Time</span><b>${fmt((p.end - p.t0) / 1000)}</b></div><div><span class="cap">Sets</span><b>${p.steps.length}</b></div><div><span class="cap">${RESN[pts.res]}</span><b>+${already ? 0 : pts.pts}</b></div></div></div>
      <button class="btn wide" type="button" id="collect">${already ? 'Back to the island' : `Collect +${pts.pts} ${RESN[pts.res]}`}</button></div>`;
    $('#collect').onclick = () => {
      if (!already){ const before = Store.totals().all;
        if (key) Store.complete(Store.ymd(today()), key, s.title, key); else Store.addExtra('strength', s.minutes, s.title);
        reward(pts.res, pts.pts, s.title); celebrate(before); }
      endPlay(); location.hash = '#isle';
    };
    $('#pclose').onclick = () => { endPlay(); location.hash = '#isle'; };
    return;
  }
  const b = s.blocks[st.bi], ex = W.exercises[b.ex];
  const nx = p.steps[p.i + 1], nex = nx && W.exercises[s.blocks[nx.bi].ex];
  const repsN = (b.reps.match(/^\d+/) || [])[0];
  if (p.mode === 'rest'){
    view.innerHTML = `<div class="player">${top}<div class="pbody rest"><span class="over gold">Rest</span><div class="bigring"><svg viewBox="0 0 120 120"><circle class="bgc" cx="60" cy="60" r="54"/><circle class="fgc" id="rring" cx="60" cy="60" r="54" stroke-dasharray="339.3" stroke-dashoffset="0"/></svg><div><b id="rleft" class="num">${p.restLeft}</b></div></div>
      ${nex ? `<div class="pnext" style="width:100%"><span class="tile r-stone">${esc(s.blocks[nx.bi].group)}</span><span class="tx"><span class="over">Up next</span><b class="hl" style="display:block;margin-top:4px">${esc(nex.name)}</b></span></div>` : ''}</div>
      <div class="btns"><button class="btn quiet" type="button" id="radd">+15 sec</button><button class="btn" type="button" id="rskip">Skip rest</button></div></div>`;
    paintRest();
    $('#radd').onclick = () => { p.restLeft += 15; p.restTotal += 15; paintRest(); };
    $('#rskip').onclick = () => { p.mode = 'work'; p.i++; renderPlay(); };
  } else {
    view.innerHTML = `<div class="player">${top}<div class="pbody"><span class="over gold">${st.round ? `Round ${st.set} of ${st.sets}` : `${esc(b.group)} · Set ${st.set} of ${st.sets}`}</span>
      <h1 class="pname">${esc(ex.name)}</h1>
      <div class="preps">${repsN ? `<b>${repsN}</b><span>${esc(b.reps.replace(/^\d+\s*/, '') || 'reps')}</span>` : `<b style="font-size:44px">${esc(b.reps)}</b>`}</div>
      <p class="pcue" style="margin:0">${esc(ex.cue)}</p>
      <details class="move" style="padding:0"><summary style="padding-left:0">How to do it</summary><ol>${ex.how.map(h => `<li>${esc(h)}</li>`).join('')}</ol></details></div>
      ${nex ? `<div class="pnext"><span class="tile r-stone">${esc(s.blocks[nx.bi].group)}</span><span class="tx"><span class="over">Then</span><b class="hl" style="display:block;margin-top:4px">${esc(nex.name)}${st.rest ? ` · after ${st.rest}s rest` : ''}</b></span></div>` : ''}
      <button class="btn wide" type="button" id="pdone">${ic('check')}${nx ? 'Done' : 'Finish workout'}</button></div>`;
    $('#pdone').onclick = e => {
      haptic(); burst(e.currentTarget);
      if (!nx){ p.mode = 'done'; p.end = Date.now(); renderPlay(); return; }
      if (st.rest){ p.mode = 'rest'; p.restLeft = p.restTotal = st.rest; renderPlay(); }
      else { p.i++; renderPlay(); }
    };
  }
  $('#pclose').onclick = () => {
    const sh = sheet(`<div class="grab"></div><h2 class="t2">End this workout?</h2><span class="cap">Your sets so far will not be saved.</span>
      <div class="btns"><button class="btn quiet" type="button" id="keep">Keep going</button><button class="btn danger" type="button" id="quit">End workout</button></div>`);
    $('#keep', sh).onclick = closeLayer;
    $('#quit', sh).onclick = () => { closeLayer(); endPlay(); goBack(); };
  };
}
function paintRest(){
  const p = play, el = $('#rleft'), rr = $('#rring'); if (!el) return;
  el.textContent = Math.max(0, p.restLeft);
  rr.style.strokeDashoffset = (339.3 * (1 - p.restLeft / Math.max(1, p.restTotal))).toFixed(1);
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
  const total = D.groceries.reduce((a, g) => a + g.price, 0);
  const got = D.groceries.filter(g => Store.flag('grocery', pre + g.id));
  const order = ['Produce','Meat','Dairy and eggs','Frozen','Shelf'];
  const publix = D.groceries.filter(g => g.store === 'Publix').length;
  const show = g => { const on = Store.flag('grocery', pre + g.id); return mkFilter === 'all' || (mkFilter === 'need' ? !on : on); };
  const ahead = wk !== mealWeek();
  view.innerHTML = `<header class="lhead"><span class="over gold">${esc(D.title)} · Aldi${publix ? ' + Publix' : ''}</span><h1 class="lt">Market</h1></header>
  <div class="page stagger" style="margin-top:20px">
    ${weekSwitch(wk)}
    ${ahead ? `<div class="callout">${ic('calendar')}<span>This is next week's list. Shop it this weekend so Sunday prep is ready.</span></div>` : ''}
    <section class="card budget"><div class="big"><b>${money(total)}</b><span class="cap">${money(D.budget - total)} under your ${money(D.budget)} budget</span></div>
      <div class="bar2"><i style="width:${(got.length / D.groceries.length * 100).toFixed(1)}%"></i></div>
      <span class="cap">${got.length} of ${D.groceries.length} in the cart · ${money(got.reduce((a, g) => a + g.price, 0))}</span></section>
    <div class="seg" role="tablist" data-filter>${[['all','All'],['need','To buy'],['got','In cart']].map(([k, l]) => `<button type="button" role="tab" data-f="${k}" class="${mkFilter === k ? 'on' : ''}">${l}</button>`).join('')}</div>
    ${order.map(sec => { const items = D.groceries.filter(g => g.section === sec && show(g)); if (!items.length) return '';
      return `<section class="sect"><div class="sect-h"><span class="over">${sec}</span><span class="cap">${money(items.reduce((a, g) => a + g.price, 0))}</span></div><div class="group">${items.map(g => {
        const on = Store.flag('grocery', pre + g.id);
        return `<div class="row item${on ? ' done' : ''}" data-g="${g.id}" role="button" aria-pressed="${on}"><button class="tick" type="button" tabindex="-1" aria-hidden="true">${ic('check', '')}</button><span class="tx"><b>${esc(g.name)}${g.store === 'Publix' ? '<span class="badge">Publix</span>' : ''}</b><small>${esc(g.qty)}</small></span><span class="trail">${money(g.price)}</span></div>`; }).join('')}</div></section>`; }).join('')}
    ${mkFilter === 'got' && !got.length ? `<p class="fine" style="text-align:center;padding:24px 0">Nothing in the cart yet. Tap items as they go in.</p>` : ''}
    ${mkFilter === 'need' && got.length === D.groceries.length ? `<div class="callout">${ic('check')}<span>Everything is in the cart. Nice work.</span></div>` : ''}
    ${D.have && D.have.length ? `<section class="sect"><div class="sect-h"><span class="over">Already home from last week</span><span class="cap">not bought again</span></div><div class="group">${D.have.map(h => `<div class="row" style="min-height:54px"><span class="tile r-land">${ic('check')}</span><span class="tx"><b>${esc(h.name)}</b>${h.note ? `<small>${esc(h.note)}</small>` : ''}</span></div>`).join('')}</div></section>` : ''}
    <details class="pantry sect"><summary class="sect-h"><span class="over">Spices and oils</span><span class="cap">${D.pantry.length} items · not counted ›</span></summary><div class="pchips">${D.pantry.map(p => `<span>${esc(p.name)}</span>`).join('')}</div></details>
    <p class="fine">${esc(D.priceNote)}</p>
    <p class="fine">${esc(D.allergyNote)}</p>
    ${got.length ? `<button class="btn quiet wide" type="button" id="clr">Start a fresh list</button>` : ''}
  </div>`;
  scrollAt = 50; setBar('Market');
  wireWeekSwitch();
  $$('[data-filter] button', view).forEach(b => b.onclick = () => { mkFilter = b.dataset.f; rerender(); });
  $$('.item', view).forEach(r => r.onclick = () => {
    const k = pre + r.dataset.g, on = !Store.flag('grocery', k); Store.flag('grocery', k, on);
    r.classList.toggle('done', on); if (on){ haptic(); burst($('.tick', r)); }
    setTimeout(rerender, mkFilter === 'all' ? 260 : 420);
  });
  const c = $('#clr'); if (c) c.onclick = () => { Store.clearPrefix('grocery', pre); mkFilter = 'all'; rerender(); };
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
  view.innerHTML = `<header class="lhead"><span class="over gold">${esc(D.title)} menu · ${Object.keys(D.recipes).length} recipes</span><h1 class="lt">Kitchen</h1></header>
  <div class="page stagger" style="margin-top:20px">
    ${weekSwitch(wk)}
    ${ahead ? '' : `<section class="sect"><div class="sect-h"><span class="over">${tmenu ? 'Today' : 'This weekend'}</span></div>
      ${tmenu ? `<div class="rail">${Object.keys(SLOT).map(s => mealCard(D, wk, s, tmenu[s], tmenu.shared === s)).join('')}</div>`
        : `<div class="card"><h2 class="t3">Festival days</h2><p class="cap" style="margin:8px 0 0">${esc(D.weekendNote)}</p></div>`}</section>`}
    ${blocksHTML(D, wk)}
    <section class="sect"><div class="sect-h"><span class="over">Prep sessions</span></div><div class="group">${D.prep.map(p => {
      const n = p.steps.filter((_, i) => Store.flag('prep', `w${wk}:${p.id}:${i}`)).length;
      return `<a class="row tap" href="#prep/${p.id}/${wk}"><span class="tile r-harvest">${ic('calendar')}</span><span class="tx"><b>${esc(p.title)}</b><small>${p.minutes} min · ${n ? `${n} of ${p.steps.length} steps done` : esc(p.makes)}</small></span>${ic('chev', 'i chev')}</a>`; }).join('')}</div></section>
    <section class="sect"><div class="sect-h"><span class="over">The week</span></div>
      <div class="days">${DAYS.map(d => `<button type="button" data-d="${d}" class="${d === kitchenDay ? 'on' : ''}${d === td && !ahead ? ' today' : ''}">${DAYN[d].slice(0, 3).toUpperCase()}<b>${DAYN[d][0]}</b><i>${D.menu[d] ? '<u class="land"></u>' : ''}</i></button>`).join('')}</div>
      ${menu ? `<div class="group">${Object.keys(SLOT).map(s => { const r = D.recipes[menu[s]];
          return `<a class="row tap" href="#recipe/${menu[s]}/${wk}"><span class="tile ctile c-${r.cuisine}">${ic(r.cuisine)}</span><span class="tx"><b>${esc(r.name)}</b><small>${SLOT[s]}${menu.shared === s ? ' · for two' : ''} · ${r.minutes} min · ${r.protein}g protein</small></span>${ic('chev', 'i chev')}</a>`; }).join('')}
        <div class="row"><span class="tile ctile c-Snack">${ic('Snack')}</span><span class="tx"><b>Snacks</b><small style="white-space:normal">${D.snacks.map(esc).join(' · ')}</small></span></div></div>`
        : `<p class="fine">${esc(D.weekendNote)}</p>`}</section>
    <section class="sect"><div class="sect-h"><span class="over">Recipe library</span></div>
      ${Object.entries(byCuisine).map(([c, list]) => `<div class="group">${list.map(([id, r]) => `<a class="row tap" href="#recipe/${id}/${wk}"><span class="tile ctile c-${c}">${ic(c)}</span><span class="tx"><b>${esc(r.name)}</b><small>${c} · ${r.minutes} min${r.isNew ? ' · new this week' : ''}</small></span>${ic('chev', 'i chev')}</a>`).join('')}</div>`).join('')}</section>
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
  view.innerHTML = `${floatBack()}<div class="hero-r c-${r.cuisine}">${ic(r.cuisine)}</div>
  <div class="page stagger" style="margin-top:-34px;position:relative">
    <div><span class="over gold">${esc(r.cuisine)}${r.isNew ? ' · new this week' : ''} · ${esc(D.title)}</span><h1 class="lt" style="margin-top:10px">${esc(r.name)}</h1></div>
    <div class="stats3"><div><span class="cap">Time</span><b>${r.minutes}<span class="cap"> min</span></b></div><div><span class="cap">Protein</span><b>${r.protein}<span class="cap"> g</span></b></div><div><span class="cap">Makes</span><b style="font-size:14px;font-family:var(--f-b);font-weight:600;line-height:1.3">${esc(r.serves)}</b></div></div>
    ${r.tip ? `<div class="callout">${ic('info')}<span>${esc(r.tip)}</span></div>` : ''}
    <a class="btn wide" href="#cook/${id}/${n}">${ic('kitchen')}Start cook mode</a>
    <section class="sect"><div class="sect-h"><span class="over">Ingredients</span><span class="cap">${esc(r.equip)}</span></div><div class="group">${r.ingredients.map((i, k) => {
      const on = Store.flag('ing', `${n}:${id}:${k}`);
      return `<div class="row ing${on ? ' done' : ''}" data-k="${k}" role="button" aria-pressed="${on}"><span class="tx"><b>${ingName(D, i, n)}</b></span><span class="q">${esc(i.qty)}</span></div>`; }).join('')}</div>
      <p class="fine">Tap an ingredient once it is out on the counter.</p></section>
    <section class="sect"><div class="sect-h"><span class="over">Method</span><span class="cap">${plural(r.steps.length, 'step')}</span></div><ol class="steps">${r.steps.map((s, k) => `<li><span>${k + 1}</span><div>${esc(s)}</div></li>`).join('')}</ol></section>
  </div>`;
  scrollAt = 180; setBar(r.name, true); wireBack();
  $$('[data-stop]', view).forEach(a => a.addEventListener('click', e => e.stopPropagation()));
  $$('.ing', view).forEach(el => el.onclick = () => { const k = `${n}:${id}:${el.dataset.k}`, on = !Store.flag('ing', k); Store.flag('ing', k, on); el.classList.toggle('done', on); if (on) haptic(); });
}
function vCook(id, wn){
  const [D, n] = findRecipe(id, wn); if (!D) return vKitchen();
  const r = D.recipes[id];
  if (!cook || cook.id !== id) cook = {id, i:0};
  app.classList.add('immersive'); keepAwake(true);
  const i = cook.i, last = i === r.steps.length - 1;
  view.innerHTML = `<div class="cook"><div class="ptop"><button class="backbtn" type="button" id="cclose" aria-label="Close cook mode">${ic('close')}</button>
      <div class="segs">${r.steps.map((_, k) => `<i class="${k <= i ? 'on' : ''}"></i>`).join('')}</div><button class="backbtn" type="button" id="cing" aria-label="Ingredients">${ic('list')}</button></div>
    <div class="stepbig"><span class="over gold">${esc(r.name)} · step ${i + 1} of ${r.steps.length}</span><p>${esc(r.steps[i])}</p></div>
    <div class="btns">${i ? `<button class="btn quiet" type="button" id="cprev" style="flex:.6">Back</button>` : ''}<button class="btn" type="button" id="cnext">${last ? 'Done cooking' : 'Next step'}</button></div></div>`;
  $('#cclose').onclick = () => { endCook(); goBack(); };
  $('#cing').onclick = () => sheet(`<div class="grab"></div><h2 class="t2">Ingredients</h2><div class="group">${r.ingredients.map(x => `<div class="row" style="min-height:48px"><span class="tx"><b>${ingName(D, x)}</b></span><span class="q cap">${esc(x.qty)}</span></div>`).join('')}</div>`);
  const prev = $('#cprev'); if (prev) prev.onclick = () => { cook.i--; vCook(id, n); };
  $('#cnext').onclick = () => {
    if (!last){ cook.i++; haptic(); vCook(id, n); return; }
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
      return `<div class="row item${on ? ' done' : ''}" data-i="${i}" role="button" aria-pressed="${on}" style="align-items:flex-start;padding-top:16px;padding-bottom:16px"><button class="tick" type="button" tabindex="-1" aria-hidden="true">${ic('check', '')}</button><span class="tx"><b style="-webkit-line-clamp:unset;font-weight:400;font-size:15px;line-height:1.5">${esc(s)}</b></span></div>`; }).join('')}</div>
    ${done ? `<button class="btn quiet wide" type="button" id="clr">Reset steps</button>` : ''}
  </div>`;
  scrollAt = 90; setBar(p.title, true); wireBack();
  $$('.item', view).forEach(r => r.onclick = () => { const k = pre + r.dataset.i, on = !Store.flag('prep', k); Store.flag('prep', k, on); r.classList.toggle('done', on); if (on){ haptic(); burst($('.tick', r)); } setTimeout(rerender, 300); });
  const c = $('#clr'); if (c) c.onclick = () => { Store.clearPrefix('prep', pre); rerender(); };
}

/* ---------------- Settings ---------------- */
function vSettings(){
  let armed = false;
  view.innerHTML = `${floatBack()}<header class="lhead" style="padding-top:calc(var(--top) + 66px)"><span class="over gold">Saved on this phone</span><h1 class="lt">Settings</h1></header>
  <div class="page stagger" style="margin-top:22px">
    <section class="sect"><div class="sect-h"><span class="over">Program</span></div><div class="group">
      <label class="row" for="start"><span class="tile r-gold">${ic('calendar')}</span><span class="tx"><b>Week 1 started</b><small>You are in week ${Store.weekNo()} · season week ${Store.seasonWeek()}</small></span>
        <input id="start" type="date" value="${Store.state.start}" style="all:unset;font:500 14px var(--f-b);color:var(--gold2);max-width:130px;text-align:right"></label></div></section>
    <section class="sect"><div class="sect-h"><span class="over">Your data</span></div><div class="group">
      <button class="row tap" type="button" id="exp" style="all:unset;cursor:pointer;display:flex;align-items:center;gap:14px;padding:12px 14px;min-height:64px;position:relative"><span class="tile r-land">${ic('download')}</span><span class="tx"><b>Save a backup</b><small>Downloads a small file with your progress</small></span></button>
      <label class="row tap" for="imp" style="cursor:pointer"><span class="tile r-land">${ic('upload')}</span><span class="tx"><b>Restore a backup</b><small>Pick a Hearth Isle backup file</small></span></label><input id="imp" type="file" accept="application/json,.json" hidden></div>
      <p class="fine">Progress lives only on this phone. Save a backup now and then so a new phone never costs you your island.</p></section>
    <section class="sect"><div class="sect-h"><span class="over">Start over</span></div><button class="btn danger wide" type="button" id="rst">Erase my progress</button></section>
    <p class="fine" style="text-align:center">Hearth Isle · season one</p>
  </div>`;
  scrollAt = 90; setBar('Settings', true); wireBack();
  $('#start').onchange = e => { if (e.target.value){ Store.setStart(e.target.value); toast('Start date saved.'); rerender(); } };
  $('#exp').onclick = () => {
    const blob = new Blob([Store.exportJSON()], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `hearth-isle-${Store.ymd(today())}.json`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };
  $('#imp').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try { Store.importJSON(await f.text()); seen = null; lastAll = null; toast('Backup restored.'); location.hash = '#isle'; }
    catch(err){ toast(err.message || 'That file could not be read.'); }
  };
  $('#rst').onclick = e => {
    if (!armed){ armed = true; e.currentTarget.textContent = 'Tap again to erase everything'; return; }
    Store.reset(); seen = null; lastAll = null; toast('Progress erased.'); location.hash = '#isle'; onboarding();
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
      <button class="btn wide" type="button" id="onext">${step < 2 ? 'Continue' : 'Begin season one'}</button></div>`;
    drawIsland($('#onbisl', el), prog, .5, 1.05, 'onb');
    $$('.opts button', el).forEach(b => b.onclick = () => { pick = b.dataset.v; paint(); });
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
const TABS = [['isle','Isle'],['train','Train'],['market','Market'],['kitchen','Kitchen']];
nav.innerHTML = TABS.map(([k, l]) => `<a href="#${k}" data-tab="${k}" aria-label="${l}">${ic(k)}<span>${l}</span></a>`).join('');
const TAB_OF = {session:'train', play:'train', recipe:'kitchen', cook:'kitchen', prep:'kitchen', settings:'isle'};
const DETAIL = new Set(['session','recipe','prep','settings']);
let lastName = null;
function route(keep){
  const [name, arg, arg2] = (location.hash.slice(1) || 'isle').split('/');
  const tab = TAB_OF[name] || name;
  $$('a', nav).forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
  if (name !== 'play' && play) endPlay();
  if (name !== 'cook' && cook) endCook();
  if (name !== 'play' && name !== 'cook') app.classList.remove('immersive');
  dock.innerHTML = ''; layer.innerHTML = '';
  ({isle:vIsle, train:vTrain, session:() => vSession(arg), play:() => vPlay(arg), market:vMarket, kitchen:vKitchen, recipe:() => vRecipe(arg, arg2), cook:() => vCook(arg, arg2), prep:() => vPrep(arg, arg2), settings:vSettings}[name] || vIsle)();
  if (!keep){
    view.scrollTop = 0; app.classList.remove('scrolled');
    const first = view.firstElementChild;
    if (first && lastName !== null) first.classList.add(DETAIL.has(name) ? 'push' : 'enter');
  } else $$('.stagger', view).forEach(s => s.classList.remove('stagger'));
  lastName = name;
}
view.addEventListener('scroll', () => app.classList.toggle('scrolled', view.scrollTop > scrollAt), {passive:true});

async function boot(){
  try {
    const cw = mealWeek(), nw = MEAL_WEEKS.find(n => n > cw);
    const get = n => fetch(`data/meals-week${n}.json`).then(r => r.json());
    const [w, m, m2] = await Promise.all([fetch('data/workouts.json').then(r => r.json()), get(cw), nw ? get(nw).catch(() => null) : null]);
    W = w; M = m; MW[cw] = m; if (m2) MW[nw] = m2;
  } catch(e) {
    view.innerHTML = `<header class="lhead"><h1 class="lt">Hearth Isle</h1><p class="cap">The plan did not load. Check your connection and open the app again.</p></header>`;
    return;
  }
  window.addEventListener('hashchange', () => route());
  window.addEventListener('resize', () => { const s = $('#isl'); if (s){ const keep = seen; drawIsland(s); seen = keep; } });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && (play || cook)) keepAwake(true); });
  route();
  onboarding();
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
