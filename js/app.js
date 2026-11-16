/* Hearth Isle app: hash router + four tabs (Isle, Train, Market, Kitchen) and their detail screens. */
(function(){
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const view = $('#view'), nav = $('#nav'), layer = $('#layer');
const DAYS = ['mon','tue','wed','thu','fri','sat','sun'];
const DAYN = {mon:'Monday',tue:'Tuesday',wed:'Wednesday',thu:'Thursday',fri:'Friday',sat:'Saturday',sun:'Sunday'};
const SLOT = {breakfast:'Breakfast',lunch:'Lunch',dinner:'Dinner'};
const RESN = {stone:'Stone',land:'Land',harvest:'Harvest',spirit:'Spirit'};
const MEAL_WEEKS = [1];               // weeks that have their own meal plan file
const I = {
  isle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18c2 1.3 4 1.3 6 0s4-1.3 6 0 4 1.3 6 0"/><path d="M5 14.5c2-3 12-3 14 0"/><path d="M12 13V6m0 0c-1.5-2-4-2.2-5.5-1M12 6c1.5-2 4-2.2 5.5-1M12 6c-.5-1.8.3-3 1.5-3.6"/></svg>',
  train:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M7 8v8M4 10v4M17 8v8M20 10v4M7 12h10"/></svg>',
  market:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h16l-1.6 9.2a2 2 0 0 1-2 1.8H7.6a2 2 0 0 1-2-1.8z"/><path d="M8.5 9 11 4M15.5 9 13 4"/></svg>',
  kitchen:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11h16v3a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z"/><path d="M2 11h2M20 11h2M9 7.5c0-1.3 1-1.3 1-2.6M13 7.5c0-1.3 1-1.3 1-2.6"/></svg>',
  gear:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/></svg>',
  back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  check:'<svg viewBox="0 0 12 12"><path d="M2.5 6.2 5 8.6 9.6 3.6"/></svg>'
};
let W = null, M = null, seen = null, trainDay = null, kitchenDay = null, timer = null;

/* ---------------- data ---------------- */
const today = () => new Date();
const dayKey = d => DAYS[(d.getDay() + 6) % 7];
const mealWeek = () => { const w = Store.weekNo(); return MEAL_WEEKS.filter(n => n <= w).pop() || MEAL_WEEKS[0]; };
const phase = () => { const sw = Store.seasonWeek(); return W.phases.find(p => sw >= p.from && sw <= p.to) || W.phases[0]; };
const gro = id => M.groceries.find(g => g.id === id);
const pan = id => M.pantry.find(p => p.id === id);

function planItems(d){
  const out = [];
  (W.week[d] || []).forEach(it => {
    if (it.type === 'lift' || it.type === 'mobility'){
      const s = W.sessions[it.session];
      out.push({key: it.type, type: it.type, label: s.title, meta: `${s.minutes} min · ${s.blocks.length} moves`, go: '#workout/' + it.session});
    } else if (it.type === 'pickleball'){
      out.push({key:'pickleball', type:'pickleball', label:'Pickleball', meta:`${it.minutes/60} hr`});
    } else if (it.type === 'intervals'){
      out.push({key:'intervals', type:'intervals', label:'Walk-jog intervals', meta:`${it.minutes} min · ${it.note}`});
    } else if (it.type === 'walk'){
      out.push({key:'walk', type:'walk', label: it.optional ? 'Long walk' : 'Walk', meta:`${it.minutes} min · ${it.note}`, optional: !!it.optional});
    }
  });
  return out;
}
function tasksFor(date){
  const d = dayKey(date), ds = Store.ymd(date);
  const out = planItems(d);
  const menu = M.menu[d];
  if (menu) Object.keys(SLOT).forEach(slot => {
    const r = M.recipes[menu[slot]]; if (!r) return;
    out.push({key: slot, type: slot, label: r.name, meta: SLOT[slot] + (menu.shared === slot ? ' · for two' : ''), go: '#recipe/' + menu[slot]});
  });
  out.push({key:'sleep', type:'sleep', label:'Slept 7+ hours', meta:'Last night'});
  return out.map(t => Object.assign(t, Store.PTS[t.type], {done: Store.isDone(ds, t.key)}));
}

/* ---------------- shared bits ---------------- */
function row(t, opts = {}){
  const label = `<b>${esc(t.label)}</b><span>${esc(t.meta)}</span>`;
  const body = t.go ? `<a class="t" href="${t.go}">${label}</a>` : `<div class="t">${label}</div>`;
  const ck = opts.noCheck ? '' : `<button class="ck" type="button" data-task="${t.key}" aria-label="Mark ${esc(t.label)} done" ${opts.disabled ? 'disabled' : ''}>${I.check}</button>`;
  return `<div class="row${t.done ? ' done' : ''}${t.optional ? ' opt' : ''}">${ck}${body}<small>+${t.pts} ${RESN[t.res].toLowerCase()}</small></div>`;
}
function reward(txt){
  const r = document.createElement('div'); r.className = 'reward'; r.textContent = txt;
  document.body.appendChild(r); setTimeout(() => r.remove(), 1800);
}
function toast(txt){
  const t = document.createElement('div'); t.className = 'toast glass'; t.textContent = txt;
  document.body.appendChild(t); setTimeout(() => t.remove(), 2400);
}
function rerender(){ const y = view.scrollTop; route(true); view.scrollTop = y; }
function toggleTask(key, date = today()){
  const ds = Store.ymd(date), t = tasksFor(date).find(x => x.key === key); if (!t) return;
  if (t.done) Store.undo(ds, key);
  else { Store.complete(ds, key, t.label, t.type); reward(`+${t.pts} ${RESN[t.res].toLowerCase()}`); }
  rerender();
}

/* ---------------- island ---------------- */
function drawIsland(svg){
  const r = Isle.isoScene(Store.progress(), Isle.PAL_B, 'h');
  const box = svg.getBoundingClientRect();
  const w = 2 * r.W * 1.12, h = w * (box.height / Math.max(1, box.width));
  svg.setAttribute('viewBox', `${(-w/2).toFixed(1)} ${(8 - .55*h).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`);
  svg.innerHTML = r.svg;
  const now = new Set();
  $$('.o', svg).forEach(g => { const k = g.dataset.k; now.add(k); if (seen && !seen.has(k)) g.classList.add('pop'); });
  seen = now;
}

/* ---------------- Isle ---------------- */
function vIsle(){
  const now = today(), d = dayKey(now), t = Store.totals(), g = Store.gardens(), sw = Store.seasonWeek();
  const tasks = tasksFor(now), req = tasks.filter(x => !x.optional), done = req.filter(x => x.done).length;
  const weekend = d === 'sat' || d === 'sun';
  const menu = M.menu[d];
  const recent = Store.state.log.slice(-5).reverse();
  view.innerHTML = `<div class="isle">
    <div class="world"><svg id="isl" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Your island"></svg></div>
    <div class="topfade"></div>
    <header class="ttl"><div><h1>Hearth Isle</h1><p><span>Week ${sw} of 12</span><i></i><span>${Store.settlers()} settlers</span></p></div>
      <a class="iconbtn" href="#settings" aria-label="Settings">${I.gear}</a></header>
    <section class="body">
      <div><h2 class="day">${DAYN[d]}</h2><div class="sub">${weekend ? 'Festival day. Nothing required, and extras still count.' : `${req.length} things today · ${done} done`}</div></div>
      ${menu && menu.heads ? `<div class="heads">${esc(menu.heads)}</div>` : ''}
      ${d === 'sun' ? `<a class="heads" href="#prep/sun">Prep day. Shop the Market list, then open Sunday prep ›</a>` : ''}
      <div class="list">${tasks.map(x => row(x)).join('')}</div>
      <button class="ghost" type="button" id="extra">+ Log something extra</button>
      <div class="sec"><div class="sec-h"><b>Hanging Gardens</b><span>${g.label} · ${g.pct}%</span></div><div class="line"><i style="width:${g.pct}%"></i></div></div>
      <div class="sec"><div class="sec-h"><b>This season</b><span>${t.all} of ${Store.SEASON.total}</span></div>
        <div class="bars">${Store.RES.map(k => `<div style="--c:var(--${k})"><p>${RESN[k]}<b>${t[k]}</b></p><div class="line"><i style="width:${Math.min(100, t[k] / Store.SEASON[k] * 100).toFixed(1)}%"></i></div></div>`).join('')}</div></div>
      ${recent.length ? `<div class="sec"><div class="sec-h"><b>Recent</b></div><div class="recent">${recent.map(e => `<div><b>${esc(e.label)}</b><span>+${e.pts} ${e.res}</span></div>`).join('')}</div></div>` : ''}
    </section></div>`;
  drawIsland($('#isl'));
  $$('.ck', view).forEach(b => b.addEventListener('click', () => toggleTask(b.dataset.task)));
  $('#extra').addEventListener('click', openExtra);
}

function openExtra(){
  let type = 'cardio';
  layer.innerHTML = `<div class="scrim"></div><form class="sheet glass" id="xf">
    <div class="grab"></div><h3>Log something extra</h3>
    <div class="seg">${Object.entries(Store.EXTRA).map(([k, x]) => `<button type="button" data-k="${k}" class="${k === type ? 'on' : ''}"><b>${x.label}</b><span>${RESN[x.res]}${x.flat ? ` · +${x.flat}` : ` · 1 per ${x.per} min`}</span></button>`).join('')}</div>
    <label class="field" id="minf">Minutes<input id="xmin" type="number" inputmode="numeric" min="1" max="600" value="30"></label>
    <label class="field">What was it? (optional)<input id="xnote" type="text" maxlength="60" placeholder="Hike, bike ride, extra set of push-ups..."></label>
    <div class="preview" id="xprev"></div>
    <button class="btn" type="submit">Add to my island</button></form>`;
  const f = $('#xf');
  const upd = () => {
    const x = Store.EXTRA[type], m = +$('#xmin').value || 0;
    $('#minf').hidden = !!x.flat;
    $('#xprev').textContent = `Earns +${x.flat || Math.max(1, Math.round(m / x.per))} ${RESN[x.res].toLowerCase()}`;
    $$('.seg button', f).forEach(b => b.classList.toggle('on', b.dataset.k === type));
  };
  $$('.seg button', f).forEach(b => b.addEventListener('click', () => { type = b.dataset.k; upd(); }));
  $('#xmin').addEventListener('input', upd);
  $('.scrim').addEventListener('click', closeLayer);
  f.addEventListener('submit', e => {
    e.preventDefault();
    const en = Store.addExtra(type, +$('#xmin').value || 0, $('#xnote').value.trim());
    closeLayer(); if (en) reward(`+${en.pts} ${en.res}`); rerender();
  });
  upd();
}
function closeLayer(){ layer.innerHTML = ''; }

/* ---------------- Train ---------------- */
function vTrain(){
  const td = dayKey(today()); trainDay = trainDay || td;
  const ph = phase(), items = planItems(trainDay), isToday = trainDay === td;
  const ds = Store.ymd(today());
  items.forEach(t => Object.assign(t, Store.PTS[t.type], {done: isToday && Store.isDone(ds, t.key)}));
  view.innerHTML = `<header class="head"><h1>Train</h1><p>Week ${Store.seasonWeek()} · ${ph.name} phase</p></header>
  <section class="body" style="margin-top:14px">
    <div class="strip">${DAYS.map(d => { const its = W.week[d] || [];
      const dots = its.map(i => `<u class="${i.type === 'lift' ? 'lift' : (i.type === 'mobility' ? '' : 'land')}"></u>`).join('');
      return `<button type="button" data-d="${d}" class="${d === trainDay ? 'on' : ''}${d === td ? ' today' : ''}">${DAYN[d].slice(0,3)}<em>${DAYN[d][0]}</em><i>${dots}</i></button>`; }).join('')}</div>
    <div><h2 class="day">${DAYN[trainDay]}</h2><div class="sub">${items.length ? (isToday ? 'Today' : 'Plan') : (trainDay === 'sun' ? 'Rest and prep day' : 'Rest day')}</div></div>
    ${items.length ? `<div class="list">${items.map(t => row(t, {disabled: !isToday})).join('')}</div>` : `<p class="note">Nothing planned. A walk always counts as an extra.</p>`}
    <div class="sec"><div class="sec-h"><b>${ph.name} phase</b><span>weeks ${ph.from}–${ph.to}</span></div><p class="note" style="margin:0">${esc(ph.note)}</p></div>
    <div class="sec"><div class="sec-h"><b>All sessions</b></div>
      <div class="cards">${Object.entries(W.sessions).map(([id, s]) => `<a class="card" href="#workout/${id}"><span>${id === 'M' ? 'Before pickleball' : 'Session ' + id}</span><b>${esc(s.title)}</b><span>${s.minutes} min · ${s.blocks.length} moves</span></a>`).join('')}</div></div>
    <p class="note">Gear: ${W.equipment.join(', ')}.</p>
  </section>`;
  $$('.strip button', view).forEach(b => b.addEventListener('click', () => { trainDay = b.dataset.d; rerender(); }));
  $$('.ck', view).forEach(b => b.addEventListener('click', () => toggleTask(b.dataset.task)));
}

function vWorkout(id){
  const s = W.sessions[id]; if (!s) return vTrain();
  const ds = Store.ymd(today()), ph = phase();
  const plannedToday = (W.week[dayKey(today())] || []).find(i => i.session === id);
  const key = plannedToday ? plannedToday.type : null;
  const finished = key && Store.isDone(ds, key);
  view.innerHTML = `<button class="back" type="button" onclick="history.back()">${I.back}Train</button>
  <header class="head" style="padding-top:6px"><span class="eyebrow">${id === 'M' ? 'Mobility' : 'Session ' + id} · ${s.minutes} min</span><h1>${esc(s.title)}</h1><p>${esc(s.format)}</p></header>
  <section class="body" style="margin-top:14px;gap:6px">
    ${id !== 'M' ? `<div class="heads">${esc(ph.name)} phase: ${esc(ph.note)}</div>` : ''}
    <div>${s.blocks.map((b, bi) => { const ex = W.exercises[b.ex];
      return `<div class="block"><div class="block-h"><span class="g">${b.group}</span><div><b>${esc(ex.name)}</b><span>${b.sets} × ${esc(b.reps)}${b.rest ? ` · rest ${b.rest}s` : ''} · ${esc(ex.equip)}</span></div></div>
        <div class="cue">${esc(ex.cue)}</div>
        <div class="sets">${Array.from({length: b.sets}, (_, si) => `<button type="button" class="set${Store.flag('sets', `${ds}:${id}:${bi}:${si}`) ? ' on' : ''}" data-b="${bi}" data-s="${si}">${b.sets > 1 ? 'Set ' + (si + 1) : 'Done'}</button>`).join('')}</div>
        <details class="how"><summary>How to do it</summary><ol>${ex.how.map(h => `<li>${esc(h)}</li>`).join('')}</ol></details></div>`; }).join('')}</div>
    <button class="btn${finished ? ' quiet' : ''}" type="button" id="finish" style="margin-top:10px">${finished ? 'Logged for today ✓' : plannedToday ? `Finish · +${Store.PTS[key].pts} ${RESN[Store.PTS[key].res].toLowerCase()}` : 'Finish · log as an extra'}</button>
  </section>`;
  $$('.set', view).forEach(b => b.addEventListener('click', () => {
    const bi = +b.dataset.b, on = !b.classList.contains('on');
    Store.flag('sets', `${ds}:${id}:${bi}:${b.dataset.s}`, on); b.classList.toggle('on', on);
    if (on && s.blocks[bi].rest) startTimer(s.blocks[bi].rest);
  }));
  $('#finish').addEventListener('click', () => {
    if (finished) return;
    if (plannedToday){ Store.complete(ds, key, s.title, key); reward(`+${Store.PTS[key].pts} ${Store.PTS[key].res}`); }
    else { const e = Store.addExtra('strength', s.minutes, s.title); reward(`+${e.pts} ${e.res}`); }
    stopTimer(); location.hash = '#isle';
  });
}
function startTimer(sec){
  stopTimer();
  const el = document.createElement('div'); el.className = 'timer glass';
  let left = sec;
  const paint = () => { el.innerHTML = `<span>Rest ${Math.floor(left/60)}:${String(left%60).padStart(2,'0')}</span><button type="button">Skip</button>`; $('button', el).onclick = stopTimer; };
  paint(); document.body.appendChild(el);
  timer = {el, id: setInterval(() => { left--; if (left <= 0){ stopTimer(); toast('Rest done. Next set.'); } else paint(); }, 1000)};
}
function stopTimer(){ if (timer){ clearInterval(timer.id); timer.el.remove(); timer = null; } }

/* ---------------- Market ---------------- */
function vMarket(){
  const wk = mealWeek(), pre = `w${wk}:`;
  const total = M.groceries.reduce((a, g) => a + g.price, 0);
  const got = M.groceries.filter(g => Store.flag('grocery', pre + g.id));
  const inCart = got.reduce((a, g) => a + g.price, 0);
  const order = ['Produce','Meat','Dairy and eggs','Frozen','Shelf'];
  const used = {};
  Object.values(M.recipes).forEach(r => r.ingredients.forEach(i => { if (i.g) (used[i.g] = used[i.g] || new Set()).add(r.name); }));
  const publix = M.groceries.filter(g => g.store === 'Publix');
  view.innerHTML = `<header class="head"><h1>Market</h1><p>${esc(M.title)} · Aldi first${publix.length ? `, Publix for ${publix.length === 1 ? 'one item' : publix.length + ' items'}` : ''}</p></header>
  <section class="body" style="margin-top:14px">
    <div class="total"><div class="total-h"><b>$${total.toFixed(2)}</b><span>of your $${M.budget} budget</span></div>
      <div class="line"><i style="width:${Math.min(100, total / M.budget * 100).toFixed(1)}%"></i></div>
      <div class="sub" style="margin:0">${got.length} of ${M.groceries.length} in the cart · $${inCart.toFixed(2)}</div></div>
    ${order.map(sec => { const items = M.groceries.filter(g => g.section === sec); if (!items.length) return '';
      return `<div class="sec"><div class="sec-h"><b>${sec}</b><span>$${items.reduce((a, g) => a + g.price, 0).toFixed(2)}</span></div><div class="list">${items.map(g => {
        const on = Store.flag('grocery', pre + g.id);
        return `<div class="row${on ? ' done' : ''}"><button class="ck" type="button" data-g="${g.id}" aria-label="Got ${esc(g.name)}">${I.check}</button><div class="t"><b>${esc(g.name)}${g.store === 'Publix' ? '<span class="tag">Publix</span>' : ''}</b><span>${esc(g.qty)} · ${used[g.id] ? `${used[g.id].size} recipe${used[g.id].size === 1 ? '' : 's'}` : 'snacks'}</span></div><small style="color:var(--sub)">$${g.price.toFixed(2)}</small></div>`; }).join('')}</div></div>`; }).join('')}
    <div class="sec"><div class="sec-h"><b>Already in your kitchen</b><span>not counted</span></div><div class="pantry">${M.pantry.map(p => `<span>${esc(p.name)}</span>`).join('')}</div></div>
    <p class="note">${esc(M.priceNote)}</p>
    <p class="note">${esc(M.allergyNote)}</p>
    ${got.length ? `<button class="btn quiet" type="button" id="clr">Clear checkmarks</button>` : ''}
  </section>`;
  $$('.ck', view).forEach(b => b.addEventListener('click', () => { Store.flag('grocery', pre + b.dataset.g, !Store.flag('grocery', pre + b.dataset.g)); rerender(); }));
  const c = $('#clr'); if (c) c.addEventListener('click', () => { Store.clearPrefix('grocery', pre); rerender(); });
}

/* ---------------- Kitchen ---------------- */
function vKitchen(){
  const td = dayKey(today()); kitchenDay = kitchenDay || (M.menu[td] ? td : 'mon');
  const menu = M.menu[kitchenDay];
  const nRec = Object.keys(M.recipes).length;
  view.innerHTML = `<header class="head"><h1>Kitchen</h1><p>${esc(M.title)} · ${M.prep.length} prep sessions · ${nRec} recipes</p></header>
  <section class="body" style="margin-top:14px">
    <div class="sec"><div class="sec-h"><b>Prep sessions</b></div>
      <div class="cards">${M.prep.map((p, i) => `<a class="card${i === 0 ? ' wide' : ''}" href="#prep/${p.id}"><span>${p.minutes} min</span><b>${esc(p.title)}</b><span>${esc(p.makes)}</span></a>`).join('')}</div></div>
    <div class="strip">${DAYS.map(d => `<button type="button" data-d="${d}" class="${d === kitchenDay ? 'on' : ''}${d === td ? ' today' : ''}">${DAYN[d].slice(0,3)}<em>${DAYN[d][0]}</em><i>${M.menu[d] ? '<u class="land"></u>' : ''}</i></button>`).join('')}</div>
    <div><h2 class="day">${DAYN[kitchenDay]}</h2><div class="sub">${menu ? (menu.shared ? `${SLOT[menu.shared]} is for two` : 'Cooking for one') : 'Festival day'}</div></div>
    ${menu ? `<div class="list">${Object.keys(SLOT).map(s => { const r = M.recipes[menu[s]];
        return `<div class="row"><div class="t" style="flex:none;width:76px"><span>${SLOT[s]}</span></div><a class="t" href="#recipe/${menu[s]}"><b>${esc(r.name)}</b><span>${r.minutes} min · ~${r.protein}g protein${r.isNew ? ' · new this week' : ''}</span></a></div>`; }).join('')}
      <div class="row"><div class="t" style="flex:none;width:76px"><span>Snacks</span></div><div class="t"><b style="font-weight:400;font-size:14px">${M.snacks.map(esc).join(' · ')}</b></div></div></div>`
      : `<p class="note">${esc(M.weekendNote)}</p>`}
    <div class="sec"><div class="sec-h"><b>All recipes</b><span>${nRec}</span></div>
      <div class="list">${Object.entries(M.recipes).map(([id, r]) => `<div class="row"><a class="t" href="#recipe/${id}"><b>${esc(r.name)}</b><span>${esc(r.cuisine)} · ${r.minutes} min · ${esc(r.equip)}</span></a></div>`).join('')}</div></div>
  </section>`;
  $$('.strip button', view).forEach(b => b.addEventListener('click', () => { kitchenDay = b.dataset.d; rerender(); }));
}
function ingName(i){
  if (i.g){ const g = gro(i.g); return esc(g ? g.name : i.g); }
  if (i.p){ const p = pan(i.p); return esc(p ? p.name : i.p); }
  const r = M.recipes[i.r]; return `<a href="#recipe/${i.r}" style="color:var(--gold2)">${esc(r ? r.name : i.r)}</a>`;
}
function vRecipe(id){
  const r = M.recipes[id]; if (!r) return vKitchen();
  view.innerHTML = `<button class="back" type="button" onclick="history.back()">${I.back}Back</button>
  <header class="head" style="padding-top:6px"><span class="eyebrow">${esc(r.cuisine)}${r.isNew ? ' · new this week' : ''}</span><h1>${esc(r.name)}</h1></header>
  <section class="body" style="margin-top:12px">
    <div class="meta"><span><b>${r.minutes} min</b></span><span>Serves <b>${esc(r.serves)}</b></span><span>~<b>${r.protein}g</b> protein per serving</span><span>${esc(r.equip)}</span></div>
    ${r.tip ? `<div class="heads">${esc(r.tip)}</div>` : ''}
    <div class="sec"><div class="sec-h"><b>Ingredients</b></div><div class="ing">${r.ingredients.map(i => `<div><b style="font-weight:500">${ingName(i)}</b><span>${esc(i.qty)}</span></div>`).join('')}</div></div>
    <div class="sec"><div class="sec-h"><b>Steps</b></div><ol class="steps">${r.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol></div>
  </section>`;
}
function vPrep(id){
  const p = M.prep.find(x => x.id === id); if (!p) return vKitchen();
  const pre = `w${mealWeek()}:${id}:`;
  view.innerHTML = `<button class="back" type="button" onclick="history.back()">${I.back}Kitchen</button>
  <header class="head" style="padding-top:6px"><span class="eyebrow">${p.minutes} min</span><h1>${esc(p.title)}</h1><p>Makes ${esc(p.makes)}.</p></header>
  <section class="body" style="margin-top:12px"><div class="list">${p.steps.map((s, i) => { const on = Store.flag('prep', pre + i);
    return `<div class="row${on ? ' done' : ''}"><button class="ck" type="button" data-i="${i}" aria-label="Step ${i + 1} done">${I.check}</button><div class="t"><b style="font-weight:400;font-size:14.5px;line-height:1.45">${esc(s)}</b></div></div>`; }).join('')}</div>
  <button class="btn quiet" type="button" id="clr">Reset steps</button></section>`;
  $$('.ck', view).forEach(b => b.addEventListener('click', () => { Store.flag('prep', pre + b.dataset.i, !Store.flag('prep', pre + b.dataset.i)); rerender(); }));
  $('#clr').addEventListener('click', () => { Store.clearPrefix('prep', pre); rerender(); });
}

/* ---------------- Settings ---------------- */
function vSettings(){
  let armed = false;
  view.innerHTML = `<button class="back" type="button" onclick="history.back()">${I.back}Isle</button>
  <header class="head" style="padding-top:6px"><h1>Settings</h1><p>Everything is saved on this phone.</p></header>
  <section class="body" style="margin-top:12px">
    <label class="field">Week 1 started on<input id="start" type="date" value="${Store.state.start}"></label>
    <p class="note" style="margin:-16px 0 0">You are in week ${Store.weekNo()} (week ${Store.seasonWeek()} of the season).</p>
    <div class="sec"><div class="sec-h"><b>Backup</b></div>
      <p class="note" style="margin:0">Save a copy of your progress now and then, so a new phone or a cleared browser never costs you your island.</p>
      <button class="btn quiet" type="button" id="exp">Save a backup file</button>
      <label class="btn quiet" for="imp">Restore from a backup</label><input id="imp" type="file" accept="application/json,.json" hidden></div>
    <div class="sec"><div class="sec-h"><b>Start over</b></div><button class="btn quiet" type="button" id="rst" style="color:#f19c86">Erase my progress</button></div>
  </section>`;
  $('#start').addEventListener('change', e => { if (e.target.value){ Store.setStart(e.target.value); toast('Start date saved.'); rerender(); } });
  $('#exp').addEventListener('click', () => {
    const blob = new Blob([Store.exportJSON()], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `hearth-isle-${Store.ymd(today())}.json`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  });
  $('#imp').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    try { Store.importJSON(await f.text()); seen = null; toast('Backup restored.'); location.hash = '#isle'; }
    catch(err){ toast(err.message || 'That file could not be read.'); }
  });
  $('#rst').addEventListener('click', e => {
    if (!armed){ armed = true; e.target.textContent = 'Tap again to erase everything'; return; }
    Store.reset(); seen = null; toast('Progress erased.'); location.hash = '#isle';
  });
}

/* ---------------- router ---------------- */
const TABS = [['isle','Isle'],['train','Train'],['market','Market'],['kitchen','Kitchen']];
nav.innerHTML = TABS.map(([k, l]) => `<a href="#${k}" data-tab="${k}" aria-label="${l}">${I[k]}<span>${l}</span></a>`).join('');
const TAB_OF = {workout:'train', recipe:'kitchen', prep:'kitchen', settings:'isle'};
function route(keep){
  const [name, arg] = (location.hash.slice(1) || 'isle').split('/');
  const tab = TAB_OF[name] || name;
  $$('a', nav).forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
  if (name !== 'workout') stopTimer();
  closeLayer();
  ({isle:vIsle, train:vTrain, workout:() => vWorkout(arg), market:vMarket, kitchen:vKitchen, recipe:() => vRecipe(arg), prep:() => vPrep(arg), settings:vSettings}[name] || vIsle)();
  if (!keep){ view.scrollTop = 0; view.classList.remove('view-in'); void view.offsetWidth; view.classList.add('view-in'); }
}

async function boot(){
  try {
    const wk = mealWeek();
    [W, M] = await Promise.all([fetch('data/workouts.json').then(r => r.json()), fetch(`data/meals-week${wk}.json`).then(r => r.json())]);
  } catch(e) {
    view.innerHTML = `<header class="head"><h1>Hearth Isle</h1><p>The plan files did not load. Check your connection and reopen the app.</p></header>`;
    return;
  }
  window.addEventListener('hashchange', () => route());
  window.addEventListener('resize', () => { const s = $('#isl'); if (s){ const keep = seen; drawIsland(s); seen = keep; } });
  route();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
}
boot();
})();
