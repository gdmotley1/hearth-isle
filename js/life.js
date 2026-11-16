/* Hearth Isle island life: settlers who wander, work, sit by the fire and go home at night,
   a sky that follows the real time of day, and hit-testing so a tap can find a settler or a building.
   Life.start(svg, scene, opts) after each island draw; Life.stop() when the Isle tab goes away. */
(function(){
const P = (x, y, z = 0) => [(x - y) * 16, (x + y) * 8 - z];
const BLOCK = new Set(['house','tree','pine','well','stall','windmill','tower','tent','rock','fire','lantern']);
const SHIRTS = ['#c05f3a','#4f7fae','#c79a3a','#7a63ab','#3b8a6a','#b0527a'];
const NS = 'http://www.w3.org/2000/svg';
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const rnd = (a, b) => a + Math.random() * (b - a);
const key = (x, y) => x + ',' + y;

let eng = null;           // the running engine
const mem = {};           // settler state that survives redraws, by index

function person(c){
  return `<ellipse cx="0" cy="0" rx="2.6" ry="1.2" fill="rgba(0,0,0,.28)"/><g class="body"><rect x="-1.6" y="-6.2" width="3.2" height="5.6" rx="1.3" fill="${SHIRTS[c % SHIRTS.length]}"/><circle cx="0" cy="-7.8" r="1.8" fill="#d8a985"/></g>`;
}

function build(scene){
  const land = new Set(scene.tiles.map(([x, y]) => key(x, y)));
  const walk = new Set(land);
  const pois = [];
  scene.vis.forEach(o => {
    const w = o.w || 1, h = o.h || 1;
    if (o.t === 'gardens' || BLOCK.has(o.t)) for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) walk.delete(key(o.x + i, o.y + j));
  });
  const add = (x, y, kind, ref) => { if (walk.has(key(x, y))) pois.push({x, y, kind, ref}); };
  scene.vis.forEach(o => {
    if (o.t === 'fire') [[1,0],[0,1],[-1,0],[0,-1],[1,1]].forEach(([a, b]) => add(o.x + a, o.y + b, 'sit', o.k));
    else if (o.t === 'house') add(o.x, o.y + 1, 'home', o.k);
    else if (o.t === 'farm') add(o.x, o.y, 'tend', o.k);
    else if (o.t === 'well') add(o.x + 1, o.y, 'well', o.k);
    else if (o.t === 'stall') add(o.x, o.y + 1, 'shop', o.k);
    else if (o.t === 'flowers') add(o.x, o.y, 'look', o.k);
    else if (o.t === 'windmill') add(o.x, o.y + 1, 'look', o.k);
    else if (o.t === 'gardens' && scene.gst >= 1) { add(o.x + 2, o.y + 1, 'look', o.k); add(o.x + 1, o.y + 2, 'look', o.k); }
  });
  return {land, walk, pois, list:[...walk].map(k => k.split(',').map(Number))};
}

function bfs(map, from, to){
  const start = key(...from), goal = key(...to);
  if (start === goal) return [];
  const prev = new Map([[start, null]]), q = [from];
  while (q.length){
    const [x, y] = q.shift();
    for (const [a, b] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const n = [x + a, y + b], k = key(...n);
      if (prev.has(k) || !map.walk.has(k)) continue;
      prev.set(k, key(x, y));
      if (k === goal){ const path = []; let c = k; while (c && c !== start){ path.unshift(c.split(',').map(Number)); c = prev.get(c); } return path; }
      q.push(n);
    }
  }
  return null;
}

function night(){ const h = new Date().getHours(); return h >= 23 || h < 5; }

function pickGoal(s, map){
  const r = Math.random();
  const homes = map.pois.filter(p => p.kind === 'home');
  if (night() && homes.length && r < .6) return homes[s.i % homes.length];
  if (map.pois.length && r < .62) return map.pois[Math.floor(Math.random() * map.pois.length)];
  const near = map.list.filter(([x, y]) => Math.abs(x - s.tx) + Math.abs(y - s.ty) <= 5);
  const t = near[Math.floor(Math.random() * near.length)];
  return t ? {x:t[0], y:t[1], kind:'idle'} : null;
}

function start(svg, scene, opts = {}){
  stop();
  const map = build(scene);
  if (!map.list.length) return;
  const count = Math.max(0, Math.min(opts.count || 3, 16));
  const layerItems = [...svg.querySelectorAll('.o')].map(g => ({g, z:+g.dataset.z}));
  const boat = scene.boat;
  const shore = map.list.slice().sort((a, b) => (Math.abs(a[0] - boat[0]) + Math.abs(a[1] - boat[1])) - (Math.abs(b[0] - boat[0]) + Math.abs(b[1] - boat[1])))[0];
  const settlers = [];
  for (let i = 0; i < count; i++){
    let m = mem[i];
    const fresh = !m || !map.walk.has(key(m.tx, m.ty));
    if (fresh){
      const spawn = (opts.newcomer && i === count - 1) ? shore : map.list[(i * 7 + 3) % map.list.length];
      m = mem[i] = {i, tx:spawn[0], ty:spawn[1], x:spawn[0] + .5, y:spawn[1] + .5, path:[], st:'idle', t:rnd(.4, 2.5), face:1, goal:null};
      if (opts.newcomer && i === count - 1){ const fire = map.pois.find(p => p.kind === 'sit'); if (fire){ m.path = bfs(map, [m.tx, m.ty], [fire.x, fire.y]) || []; m.goal = fire; m.st = 'walk'; m.star = 7; } }
    }
    if (m.st === 'home' && !map.pois.some(p => p.kind === 'home')) m.st = 'idle';
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'st'); g.dataset.s = i;
    g.innerHTML = `<g class="sp">${person(i)}</g>${m.star ? '<path class="newstar" d="M0 -16l1.2 2.6 2.8.3-2.1 1.9.6 2.8L0 -9.9l-2.5 1.5.6-2.8-2.1-1.9 2.8-.3z" fill="#ffd994"/>' : ''}`;
    settlers.push({m, g, z:null});
  }
  eng = {svg, map, settlers, layerItems, last:performance.now(), raf:0, names:opts.names || []};
  settlers.forEach(s => place(s, true));
  if (reduce()) return;
  const loop = t => {
    if (!eng || !svg.isConnected){ stop(); return; }
    const dt = Math.min(.1, (t - eng.last) / 1000); eng.last = t;
    if (document.visibilityState === 'visible') settlers.forEach(s => step(s, dt));
    eng.raf = requestAnimationFrame(loop);
  };
  eng.raf = requestAnimationFrame(loop);
}

function step(s, dt){
  const m = s.m, map = eng.map;
  if (m.star){ m.star -= dt; if (m.star <= 0){ m.star = 0; const st = s.g.querySelector('.newstar'); if (st) st.remove(); } }
  if (m.st === 'walk'){
    const nxt = m.path[0];
    if (!nxt){ arrive(s); return; }
    const tx = nxt[0] + .5, ty = nxt[1] + .5, dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy), v = .62 * dt;
    if (d <= v){ m.x = tx; m.y = ty; m.tx = nxt[0]; m.ty = nxt[1]; m.path.shift(); }
    else { m.x += dx / d * v; m.y += dy / d * v; }
    const sdx = (dx - dy);
    if (Math.abs(sdx) > .01) m.face = sdx < 0 ? -1 : 1;
    place(s);
    return;
  }
  m.t -= dt;
  if (m.t > 0) return;
  if (m.st === 'home'){ m.st = 'idle'; m.t = rnd(.5, 1.5); place(s); return; }
  const goal = pickGoal(m, map);
  if (!goal){ m.t = rnd(1, 3); return; }
  const path = bfs(map, [m.tx, m.ty], [goal.x, goal.y]);
  if (!path){ m.t = rnd(1, 3); return; }
  m.path = path; m.goal = goal; m.st = 'walk'; place(s);
}

function arrive(s){
  const m = s.m, k = m.goal ? m.goal.kind : 'idle', n = night();
  m.st = {sit:'sit', home:'home', tend:'tend', well:'idle', shop:'idle', look:'idle'}[k] || 'idle';
  m.t = m.st === 'home' ? (n ? rnd(30, 90) : rnd(5, 14)) : m.st === 'sit' ? rnd(5, 12) : m.st === 'tend' ? rnd(4, 8) : rnd(1.2, 4);
  place(s);
}

function place(s, init){
  const m = s.m, [sx, sy] = P(m.x, m.y);
  s.g.setAttribute('transform', `translate(${sx.toFixed(2)} ${sy.toFixed(2)})`);
  s.g.setAttribute('class', `st ${m.st}${m.face < 0 ? ' left' : ''}`);
  const z = Math.round((m.x + m.y + .35) * 4) / 4;
  if (z !== s.z || init){
    s.z = z;
    const before = eng.layerItems.find(it => it.z > z + 1e-6);
    if (before) eng.svg.insertBefore(s.g, before.g); else eng.svg.appendChild(s.g);
  }
}

function stop(){ if (eng){ cancelAnimationFrame(eng.raf); eng = null; } }

/* Find what is under a tap: the nearest settler (generous radius) or building. Returns screen coords too. */
function hit(cx, cy, objs){
  if (!eng || !eng.svg.isConnected) return null;
  const svg = eng.svg, ctm = svg.getScreenCTM(); if (!ctm) return null;
  const toScreen = (x, y) => { const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; const r = pt.matrixTransform(ctm); return [r.x, r.y]; };
  let best = null;
  eng.settlers.forEach(s => {
    if (s.m.st === 'home') return;
    const [x, y] = P(s.m.x, s.m.y), [px, py] = toScreen(x, y - 5), d = Math.hypot(px - cx, py - cy);
    if (d < 30 && (!best || d < best.d)) best = {kind:'settler', i:s.m.i, st:s.m.st, d, x:px, y:toScreen(x, y - 12)[1]};
  });
  if (best) return best;
  (objs || []).forEach(o => {
    const w = o.w || 1, h = o.h || 1, tall = {house:12, tree:12, pine:12, windmill:20, tower:24, gardens:20, well:6, stall:8, tent:6, fire:4}[o.t] || 3;
    const [x, y] = P(o.x + w / 2, o.y + h / 2, tall), [px, py] = toScreen(x, y), d = Math.hypot(px - cx, py - cy);
    const r = o.t === 'gardens' ? 46 : 26;
    if (d < r && (!best || d < best.d)) best = {kind:'obj', k:o.k, t:o.t, d, x:px, y:toScreen(...P(o.x + w / 2, o.y + h / 2, tall + 14))[1]};
  });
  return best;
}

/* Dust puffs at the base of a building that just went up. */
function dust(svg, o, delay = 0){
  const w = o.w || 1, h = o.h || 1, [x, y] = P(o.x + w / 2, o.y + h / 2);
  for (let i = 0; i < 7; i++){
    const c = document.createElementNS(NS, 'circle');
    const a = Math.PI * 2 * i / 7, r = 3 + Math.random() * 2;
    c.setAttribute('cx', x.toFixed(1)); c.setAttribute('cy', y.toFixed(1)); c.setAttribute('r', r.toFixed(1));
    c.setAttribute('class', 'dust'); c.setAttribute('fill', '#c9bfa6');
    c.style.setProperty('--dx', (Math.cos(a) * (10 + w * 6)).toFixed(1) + 'px');
    c.style.setProperty('--dy', (Math.sin(a) * (5 + h * 3) - 3).toFixed(1) + 'px');
    c.style.animationDelay = (delay + Math.random() * .12).toFixed(2) + 's';
    svg.appendChild(c);
    setTimeout(() => c.remove(), (delay + 1.6) * 1000);
  }
}

/* ---------------- sky ---------------- */
function phase(h){ return h >= 5 && h < 8 ? 'dawn' : h >= 8 && h < 17 ? 'day' : h >= 17 && h < 20 ? 'dusk' : 'night'; }
const SKY = {
  night:{w1:'#1c3654', w2:'#11213a', glow:'rgba(120,150,220,.10)', stars:1},
  dawn: {w1:'#2c3f5e', w2:'#1a2742', glow:'rgba(255,170,120,.20)', stars:.35},
  day:  {w1:'#245079', w2:'#15304f', glow:'rgba(150,205,255,.14)', stars:0},
  dusk: {w1:'#2d3462', w2:'#1b1e3f', glow:'rgba(236,128,146,.18)', stars:.6}
};
let skyTimer = 0, shootTimer = 0;
function sky(world){
  clearInterval(skyTimer); clearTimeout(shootTimer);
  let el = world.querySelector('.sky');
  if (!el){ el = document.createElement('div'); el.className = 'sky'; world.prepend(el); }
  let seed = 7; const r = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  el.innerHTML = `<i class="glow"></i><i class="moon"></i><i class="cloud c1"></i><i class="cloud c2"></i>` +
    Array.from({length:42}, () => `<i class="star" style="left:${(r() * 100).toFixed(1)}%;top:${(r() * 44).toFixed(1)}%;--s:${(1 + r() * 1.6).toFixed(1)}px;animation-delay:-${(r() * 5).toFixed(1)}s;animation-duration:${(3 + r() * 4).toFixed(1)}s"></i>`).join('');
  const paint = () => {
    const now = new Date(), h = now.getHours() + now.getMinutes() / 60, ph = SKY[phase(Math.floor(h))];
    world.style.setProperty('--w1', ph.w1); world.style.setProperty('--w2', ph.w2);
    el.style.setProperty('--glow', ph.glow); el.style.setProperty('--stars', ph.stars);
    // the moon crosses the sky from 6 pm to 6 am
    const t = ((h - 18 + 24) % 24) / 12;
    const up = t <= 1;
    el.style.setProperty('--moon', up ? 1 : 0);
    el.style.setProperty('--mx', (60 + 26 * Math.min(1, t)).toFixed(1) + '%');
    el.style.setProperty('--my', (24 + 9 * Math.pow(2 * Math.min(1, t) - 1, 2)).toFixed(1) + '%');
  };
  paint(); skyTimer = setInterval(paint, 5 * 60 * 1000);
  const shoot = () => {
    shootTimer = setTimeout(() => {
      if (!el.isConnected) return;
      const ph = phase(new Date().getHours());
      if ((ph === 'night' || ph === 'dusk') && !reduce()){
        const s = document.createElement('i'); s.className = 'shoot';
        s.style.left = (15 + Math.random() * 55) + '%'; s.style.top = (4 + Math.random() * 18) + '%';
        el.appendChild(s); setTimeout(() => s.remove(), 1400);
      }
      shoot();
    }, 9000 + Math.random() * 22000);
  };
  shoot();
}

/* Sky lanterns rising over the island when the day's plan is complete. */
function lanterns(world){
  if (reduce()) return;
  const box = document.createElement('div'); box.className = 'lanterns';
  for (let i = 0; i < 16; i++){
    const l = document.createElement('i');
    l.style.left = (10 + Math.random() * 80) + '%';
    l.style.animationDelay = (Math.random() * 2.2).toFixed(2) + 's';
    l.style.animationDuration = (5 + Math.random() * 3).toFixed(2) + 's';
    l.style.setProperty('--drift', ((Math.random() - .5) * 60).toFixed(0) + 'px');
    box.appendChild(l);
  }
  world.appendChild(box);
  setTimeout(() => box.remove(), 11000);
}

window.Life = {start, stop, hit, dust, sky, lanterns, get settlers(){ return eng ? eng.settlers.map(s => s.m) : []; }};
})();
