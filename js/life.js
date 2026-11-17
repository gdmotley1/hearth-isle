/* Hearth Isle island life: a calm diorama. Each settler has a spot and one simple loop
   (sitting by the fire, chopping wood, tending crops, hammering at the Gardens, strolling a path),
   drawn once with SVG animation so nothing jitters. Also the sky, dust when a building rises,
   and sky lanterns. Life.start(svg, scene, opts) after each island draw. */
(function(){
const P = (x, y, z = 0) => [(x - y) * 16, (x + y) * 8 - z];
const SHIRTS = ['#c05f3a','#4f7fae','#c79a3a','#7a63ab','#3b8a6a','#b0527a'];
const SKIN = '#d8a985', NS = 'http://www.w3.org/2000/svg';
const SKINS = ['#e0b08c','#c98f68','#a8714d','#e8c3a0'], HAIR = ['#3a2a20','#6b4428','#1f1a17','#a8743c','#d9c08a'], PANTS = ['#3a3f52','#4a3b30','#2f3d38'];
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const f1 = n => (+n).toFixed(1);

/* Where settlers spend their day, in the order new settlers take them. A spot is used only once
   its building exists. front: drawn in front of that building, otherwise behind it. */
const SPOTS = [
  {k:'fire', x:.05, y:1.2, a:'sit', face:1, front:true, role:'storyteller', doing:'warming up by the fire'},
  {k:'tent', x:2.3, y:-.3, a:'chop', face:-1, front:true, role:'woodcutter', doing:'chopping firewood'},
  {walk:0, role:'scout', doing:'out for a walk'},
  {k:'f1', x:2.5, y:.55, a:'tend', front:true, role:'farmer', doing:'tending the crops'},
  {k:'g', x:-.75, y:-1.65, a:'hammer', face:-1, front:true, role:'builder', doing:'building the Hanging Gardens', done:'tending the Gardens'},
  {k:'fire', x:1.35, y:.6, a:'sit', face:-1, front:true, role:'storyteller', doing:'warming up by the fire'},
  {k:'f2', x:2.5, y:1.55, a:'tend', face:-1, front:true, role:'farmer', doing:'tending the crops'},
  {k:'stall', x:-.35, y:1.0, a:'idle', front:true, role:'merchant', doing:'minding the market stall'},
  {k:'well', x:3.15, y:2.5, a:'draw', face:-1, front:true, role:'water carrier', doing:'drawing water at the well'},
  {walk:3, role:'scout', doing:'out for a walk'},
  {k:'f3', x:3.5, y:.55, a:'tend', front:true, role:'farmer', doing:'tending the crops'},
  {k:'tw', x:-3.15, y:-.3, a:'wave', front:true, role:'lookout', doing:'on lookout at the watchtower'},
  {k:'wm', x:4.55, y:3.2, a:'idle', front:true, role:'miller', doing:'running the windmill'},
  {walk:5, role:'scout', doing:'out for a walk'},
  {k:'l1', x:1.55, y:2.35, a:'lamp', front:true, role:'lamplighter', doing:'lighting the lanterns'},
  {k:'fire', x:-.2, y:.45, a:'sit', face:1, front:false, role:'storyteller', doing:'warming up by the fire'},
  {walk:7, role:'scout', doing:'out for a walk'}, {walk:8, role:'scout', doing:'out for a walk'}, {walk:12, role:'scout', doing:'out for a walk'}, {walk:13, role:'scout', doing:'out for a walk'}
];
/* Loops, in the settler's own coordinates (feet at 0,0). */
const anim = (attr, type, values, dur, begin, extra = '') => reduce() ? '' :
  `<animateTransform attributeName="${attr}" type="${type}" values="${values}" dur="${dur}s" begin="-${f1(begin)}s" repeatCount="indefinite"${extra}/>`;
const ARM = {
  chop:   (d, sk = SKIN) => `<g><path d="M.9 -5.1 L3.4 -6.6" stroke="${sk}" stroke-width="1.2" stroke-linecap="round"/><path d="M3.4 -6.6 L4.6 -9.6" stroke="#6b4a2f" stroke-width="1"/><path d="M4.1 -9.9 l1.9 .5 -.4 1.6 -1.9 -.4z" fill="#9aa4ae"/>${anim('transform','rotate','-35 .9 -5.1;45 .9 -5.1;-35 .9 -5.1',1.1,d,' keyTimes="0;.35;1" calcMode="spline" keySplines=".5 0 .9 .5;.3 .2 .4 1"')}</g>`,
  hammer: (d, sk = SKIN) => `<g><path d="M.9 -5.1 L3.2 -6.2" stroke="${sk}" stroke-width="1.2" stroke-linecap="round"/><path d="M3.2 -6.2 L4.2 -8.2" stroke="#6b4a2f" stroke-width=".9"/><rect x="3.4" y="-9.3" width="2" height="1.1" rx=".3" fill="#7d8790"/>${anim('transform','rotate','-40 .9 -5.1;35 .9 -5.1;-40 .9 -5.1',.7,d,' keyTimes="0;.3;1"')}</g>`,
  wave:   (d, sk = SKIN) => `<g><path d="M.9 -5.4 L2.6 -8.6" stroke="${sk}" stroke-width="1.2" stroke-linecap="round"/>${anim('transform','rotate','-20 .9 -5.4;20 .9 -5.4;-20 .9 -5.4',1,d)}</g>`,
  lamp:   (d, sk = SKIN) => `<g><path d="M.9 -5.1 L3 -6.3" stroke="${sk}" stroke-width="1.2" stroke-linecap="round"/><path d="M3 -6.3 L4.4 -12" stroke="#6b4a2f" stroke-width=".8"/><circle cx="4.5" cy="-12.4" r="1.3" fill="#ffd77e"><animate attributeName="opacity" values=".5;1;.5" dur="1.6s" begin="-${f1(d)}s" repeatCount="indefinite"/></circle></g>`,
  draw:   (d, sk = SKIN) => `<path d="M.9 -5.1 L3.2 -3.8" stroke="${sk}" stroke-width="1.2" stroke-linecap="round"/>`,
  tend:   (d, sk = SKIN) => `<path d="M.9 -5.1 L2.8 -2.6" stroke="${sk}" stroke-width="1.2" stroke-linecap="round"/><path d="M2.8 -2.6 L4 -.2" stroke="#6b4a2f" stroke-width=".8"/>`
};
const BODY = {
  sit:    d => anim('transform','rotate','-3 0 0;3 0 0;-3 0 0',3.4,d),
  tend:   d => anim('transform','rotate','0 0 0;22 0 0;22 0 0;0 0 0',2.2,d,' keyTimes="0;.35;.6;1"'),
  draw:   d => anim('transform','rotate','0 0 0;16 0 0;0 0 0',2.6,d),
  idle:   d => anim('transform','rotate','-2 0 0;2 0 0;-2 0 0',3,d),
  hammer: d => anim('transform','translate','0 0;0 .4;0 0',.7,d),
  chop:   d => anim('transform','translate','0 0;0 .5;0 0',1.1,d),
  wave:   () => '', lamp: () => ''
};
/* A settler: legs, a shaded shirt, a head with hair and an eye that faces where they look.
   Walkers step and swing their arms; everyone else does their job's loop. */
function person(i, a, d){
  const sk = SKINS[i % SKINS.length], hair = HAIR[(i * 3) % HAIR.length], shirt = SHIRTS[i % SHIRTS.length], pants = PANTS[i % PANTS.length];
  const walk = a === 'walk', sit = a === 'sit', st = reduce();
  const leg = (x, ph) => `<rect x="${x}" y="-2.5" width="1.15" height="2.5" rx=".5" fill="${pants}">${walk && !st ? `<animateTransform attributeName="transform" type="rotate" values="${ph ? '24' : '-24'} ${x + .55} -2.4;${ph ? '-24' : '24'} ${x + .55} -2.4;${ph ? '24' : '-24'} ${x + .55} -2.4" dur=".72s" repeatCount="indefinite"/>` : ''}</rect>`;
  const legs = sit
    ? `<rect x="-1.3" y="-2.6" width="3.4" height="1.2" rx=".55" fill="${pants}"/><rect x="1.2" y="-2" width="1.1" height="2" rx=".5" fill="${pants}"/>`
    : leg(-1.3, 0) + leg(.15, 1);
  const top = sit ? 2 : 0;
  const torso = `<rect x="-1.75" y="${-7 + top}" width="3.5" height="4.9" rx="1.45" fill="${shirt}"/><rect x=".2" y="${-6.7 + top}" width="1.5" height="4.4" rx=".9" fill="rgba(0,0,0,.18)"/>`;
  const head = `<circle cx="0" cy="${-8.9 + top}" r="2.05" fill="${sk}"/><path d="M-2.1 ${-8.8 + top}a2.1 2.1 0 0 1 4.2 0q-.9 -.7 -2.1 -.45q-1.2 .2 -2.1 .45z" fill="${hair}"/><circle cx=".95" cy="${-8.7 + top}" r=".3" fill="#2a1d16"/>`;
  const swing = walk && !st ? `<path d="M.2 -6.2 L.5 -3.3" stroke="${sk}" stroke-width="1.15" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" values="-26 .2 -6.2;26 .2 -6.2;-26 .2 -6.2" dur=".72s" repeatCount="indefinite"/></path>` : '';
  const seat = sit ? '<rect x="-2.4" y="-1.5" width="4.8" height="1.5" rx=".6" fill="#5f4532"/>' : '';
  return `<ellipse cx="0" cy="0" rx="2.8" ry="1.25" fill="rgba(0,0,0,.3)"/>${seat}<g>${legs}${torso}${head}${swing}${ARM[a] ? ARM[a](d, sk) : ''}${(BODY[a] || (() => ''))(d)}</g>${a === 'chop' ? '<rect x="2.6" y="-1.2" width="3.2" height="1.4" rx=".5" fill="#6b4a2f"/>' : ''}`;
}

let state = null;
function night(){ const h = new Date().getHours(); return h >= 23 || h < 5; }

function start(svg, scene, opts = {}){
  stop();
  const vis = new Map(scene.vis.map(o => [o.k, o]));
  const zOf = o => o.x + o.y + (o.w || 1) + (o.h || 1) - (o.t === 'farm' || o.t === 'flowers' ? 1.5 : 0);
  const walks = Isle.WALK || [];
  const spots = SPOTS.filter(s => s.walk !== undefined ? walks[s.walk] && walks[s.walk].d && walks[s.walk].th <= scene.f : vis.has(s.k));
  const count = Math.min(opts.count || 3, spots.length);
  const items = [...svg.querySelectorAll('.o')].map(g => ({g, z:+g.dataset.z}));
  const t = Date.now() / 1000, n = night();
  const people = [];
  for (let i = 0; i < count; i++){
    const s = spots[i];
    // Late at night only the fire-sitters and the lamplighter stay out.
    if (n && !['sit', 'lamp'].includes(s.a)) continue;
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'st'); g.dataset.s = i; g.dataset.doing = s.k === 'g' && scene.gst >= 4 ? s.done : s.doing;
    g.dataset.role = s.k === 'g' && scene.gst >= 4 ? 'gardener' : s.role;
    let z;
    if (s.walk !== undefined){
      const w = walks[s.walk], [ax, ay] = P(w.f[0], w.f[1]), [bx, by] = P(w.t[0], w.t[1]), d = w.d + 4, ph = (t + i * 1.7) % d;
      const face = bx < ax ? -1 : 1;
      z = w.f[0] + w.f[1] + .3;
      g.innerHTML = reduce()
        ? `<g transform="translate(${f1(ax)} ${f1(ay)})">${person(i, 'walk', 0)}</g>`
        : `<g transform="translate(${f1(ax)} ${f1(ay)})"><animateTransform attributeName="transform" type="translate" values="${f1(ax)} ${f1(ay)};${f1(ax)} ${f1(ay)};${f1(bx)} ${f1(by)};${f1(bx)} ${f1(by)};${f1(ax)} ${f1(ay)}" keyTimes="0;.1;.48;.6;1" dur="${d}s" begin="-${f1(ph)}s" repeatCount="indefinite"/>
            <g><animateTransform attributeName="transform" type="scale" values="${face} 1;${-face} 1" keyTimes="0;.54" calcMode="discrete" dur="${d}s" begin="-${f1(ph)}s" repeatCount="indefinite"/>
            <g>${person(i, 'walk', 0)}<animateTransform attributeName="transform" type="translate" values="0 0;0 -.5;0 0" dur=".36s" repeatCount="indefinite"/></g></g></g>`;
    } else {
      const o = vis.get(s.k), [sx, sy] = P(s.x + (s.k === 'g' ? 0 : 0), s.y);
      z = zOf(o) + (s.front ? .05 : -.05);
      const act = s.k === 'g' && scene.gst >= 4 ? 'tend' : s.a;
      g.innerHTML = `<g transform="translate(${f1(sx)} ${f1(sy)}) scale(${s.face || 1} 1)">${person(i, act, (t + i * 1.3) % 7)}</g>`;
    }
    if (opts.newcomer && i === count - 1) g.insertAdjacentHTML('beforeend', `<path class="newstar" transform="translate(${f1(P(s.walk !== undefined ? walks[s.walk].f[0] : s.x, s.walk !== undefined ? walks[s.walk].f[1] : s.y)[0])} ${f1(P(s.walk !== undefined ? walks[s.walk].f[0] : s.x, s.walk !== undefined ? walks[s.walk].f[1] : s.y)[1])})" d="M0 -16l1.2 2.6 2.8.3-2.1 1.9.6 2.8L0 -9.9l-2.5 1.5.6-2.8-2.1-1.9 2.8-.3z" fill="#ffd994"/>`);
    const before = items.find(it => it.z > z + 1e-6);
    if (before) svg.insertBefore(g, before.g); else svg.appendChild(g);
    people.push({i, g, doing:g.dataset.doing, role:g.dataset.role});
  }
  state = {svg, people};
}
function stop(){ state = null; }

/* Find what is under a tap: the nearest settler (generous radius) or building. */
function hit(cx, cy, objs){
  if (!state || !state.svg.isConnected) return null;
  const svg = state.svg, ctm = svg.getScreenCTM(); if (!ctm) return null;
  let best = null;
  state.people.forEach(p => {
    const r = p.g.getBoundingClientRect(), px = r.left + r.width / 2, py = r.top + r.height * .45, d = Math.hypot(px - cx, py - cy);
    if (d < 40 && (!best || d < best.d)) best = {kind:'settler', i:p.i, st:p.doing, role:p.role, d, x:px, y:r.top - 4, bottom:r.bottom, feet:[px, r.bottom - 2], svg:(() => { const b = p.g.getBBox(); return [b.x + b.width / 2, b.y + b.height * .6]; })()};
  });
  if (best) return best;
  const toScreen = (x, y) => { const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; const r = pt.matrixTransform(ctm); return [r.x, r.y]; };
  (objs || []).forEach(o => {
    const w = o.w || 1, h = o.h || 1, tall = {house:12, tree:12, pine:12, windmill:20, tower:24, gardens:20, well:6, stall:8, tent:6, fire:4}[o.t] || 3;
    const [x, y] = P(o.x + w / 2, o.y + h / 2, tall), [px, py] = toScreen(x, y), d = Math.hypot(px - cx, py - cy);
    const r = o.t === 'gardens' ? 50 : 32;
    if (d < r && (!best || d < best.d)) best = {kind:'obj', k:o.k, t:o.t, d, o, tall, x:px, y:toScreen(...P(o.x + w / 2, o.y + h / 2, tall + 14))[1], bottom:toScreen(...P(o.x + w / 2, o.y + h / 2))[1], feet:toScreen(...P(o.x + w / 2, o.y + h / 2)), svg:P(o.x + w / 2, o.y + h / 2, tall / 2)};
  });
  return best;
}

/* Where a hit is on screen now (after the camera moved). */
function locate(h){
  if (!state || !state.svg.isConnected) return null;
  const svg = state.svg, ctm = svg.getScreenCTM(); if (!ctm) return null;
  const toScreen = (x, y) => { const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; const r = pt.matrixTransform(ctm); return [r.x, r.y]; };
  if (h.kind === 'settler'){
    const p = state.people.find(q => q.i === h.i); if (!p) return null;
    const r = p.g.getBoundingClientRect(), px = r.left + r.width / 2;
    return {x:px, y:r.top - 4, bottom:r.bottom, feet:[px, r.bottom - 2]};
  }
  const o = h.o, w = o.w || 1, hh = o.h || 1, [px] = toScreen(...P(o.x + w / 2, o.y + hh / 2));
  return {x:px, y:toScreen(...P(o.x + w / 2, o.y + hh / 2, h.tall + 14))[1], bottom:toScreen(...P(o.x + w / 2, o.y + hh / 2))[1], feet:toScreen(...P(o.x + w / 2, o.y + hh / 2))};
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

/* ---------------- construction: scaffold, rise floor by floor, lights on ---------------- */
let cpN = 0;
function construct(svg, g, o, delay = 0){
  if (reduce()) return;
  const b = g.getBBox(); if (!b.width) return;
  const id = 'cp' + (++cpN), x = b.x - 4, w = b.width + 8, top = b.y - 6, bot = b.y + b.height + 2, H = bot - top;
  const defs = svg.querySelector('defs') || svg.insertBefore(document.createElementNS(NS, 'defs'), svg.firstChild);
  const cp = document.createElementNS(NS, 'clipPath'); cp.id = id;
  cp.innerHTML = `<rect x="${f1(x)}" y="${f1(bot)}" width="${f1(w)}" height="0"><animate attributeName="y" from="${f1(bot)}" to="${f1(top)}" dur="1.5s" begin="indefinite" fill="freeze" calcMode="spline" keySplines=".45 0 .35 1"/><animate attributeName="height" from="0" to="${f1(H)}" dur="1.5s" begin="indefinite" fill="freeze" calcMode="spline" keySplines=".45 0 .35 1"/></rect>`;
  defs.appendChild(cp);
  g.setAttribute('clip-path', `url(#${id})`);
  // wooden scaffold around the footprint, a builder hammering beside it
  const sc = document.createElementNS(NS, 'g'); sc.setAttribute('class', 'scaffold');
  const L = b.x + 2, R = b.x + b.width - 2, Y0 = bot - 1, Y1 = top + 4, mid = (L + R) / 2;
  let lines = '';
  [L, mid, R].forEach(px => { lines += `M${f1(px)} ${f1(Y0)}V${f1(Y1)}`; });
  [.33, .66].forEach(f => { const yy = Y0 - (Y0 - Y1) * f; lines += `M${f1(L - 1)} ${f1(yy)}H${f1(R + 1)}`; });
  lines += `M${f1(L)} ${f1(Y0)}L${f1(mid)} ${f1(Y0 - (Y0 - Y1) * .33)}M${f1(mid)} ${f1(Y0)}L${f1(R)} ${f1(Y0 - (Y0 - Y1) * .33)}`;
  sc.innerHTML = `<path d="${lines}" stroke="#8a6a46" stroke-width="1" stroke-linecap="round" fill="none"/><g transform="translate(${f1(R + 5)} ${f1(Y0 + 1)}) scale(-1 1)">${person(7, 'hammer', 0)}</g>`;
  g.after(sc);
  sc.animate([{opacity:0}, {opacity:1}], {duration:300, delay:delay * 1000, fill:'both'});
  setTimeout(() => {
    cp.querySelectorAll('animate').forEach(a => a.beginElement());
    setTimeout(() => {
      dust(svg, o, 0);
      sc.animate([{opacity:1}, {opacity:0}], {duration:500, fill:'forwards'});
      const fl = document.createElementNS(NS, 'ellipse'), [cx, cy] = P(o.x + (o.w || 1) / 2, o.y + (o.h || 1) / 2);
      fl.setAttribute('cx', f1(cx)); fl.setAttribute('cy', f1(cy - b.height / 3)); fl.setAttribute('rx', f1(b.width * .8)); fl.setAttribute('ry', f1(b.height * .6)); fl.setAttribute('fill', '#ffd27a');
      fl.style.mixBlendMode = 'screen'; svg.appendChild(fl);
      fl.animate([{opacity:0}, {opacity:.55}, {opacity:0}], {duration:900, easing:'ease-out', fill:'forwards'}).onfinish = () => fl.remove();
      setTimeout(() => { g.removeAttribute('clip-path'); cp.remove(); sc.remove(); }, 600);
    }, 1550);
  }, (delay + .45) * 1000);
}

/* ---------------- your work shows up on the island ---------------- */
const RESC = {stone:'#a9bde0', land:'#62c9b9', harvest:'#93d47e', spirit:'#f4bd63'};
const RESN = {stone:'Stone', land:'Land', harvest:'Harvest', spirit:'Spirit'};
function floatText(svg, x, y, txt, color){
  const tx = document.createElementNS(NS, 'text');
  tx.setAttribute('x', f1(x)); tx.setAttribute('y', f1(y)); tx.setAttribute('text-anchor', 'middle'); tx.setAttribute('class', 'fxtext');
  tx.setAttribute('fill', color); tx.textContent = txt; svg.appendChild(tx);
  tx.animate([{opacity:0, transform:'translateY(4px)'}, {opacity:1, transform:'translateY(0)', offset:.15}, {opacity:1, offset:.7}, {opacity:0, transform:'translateY(-14px)'}], {duration:2200, easing:'ease-out', fill:'forwards'}).onfinish = () => tx.remove();
}
function sparkle(svg, x, y, color, n = 8, spread = 10){
  for (let i = 0; i < n; i++){
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', f1(x + (Math.random() - .5) * spread)); c.setAttribute('cy', f1(y + (Math.random() - .5) * spread * .5)); c.setAttribute('r', (.6 + Math.random() * .7).toFixed(2)); c.setAttribute('fill', color);
    svg.appendChild(c);
    c.animate([{opacity:0, transform:'translateY(0)'}, {opacity:1, offset:.25}, {opacity:0, transform:`translateY(-${8 + Math.random() * 8}px)`}], {duration:1200 + Math.random() * 600, delay:Math.random() * 500, easing:'ease-out', fill:'both'}).onfinish = () => c.remove();
  }
}
/* One effect per completed task, anchored where that resource lives. */
function fx(svg, scene, res, pts, target){
  if (!svg.isConnected || reduce()) return;
  const vis = scene.vis, find = t => vis.filter(o => o.t === t), color = RESC[res] || '#ffd994', label = `+${pts} ${RESN[res] || ''}`;
  const fire = vis.find(o => o.t === 'fire'), [fx0, fy0] = P(fire.x + .5, fire.y + .5);
  if (res === 'stone'){
    // a stone block drops onto the build site
    const [x, y] = target || P(-1.5, -1.5);
    const blk = document.createElementNS(NS, 'g');
    blk.innerHTML = `<path d="M${f1(x - 4)} ${f1(y - 3)}l4 -2 4 2 -4 2z" fill="#a49a86"/><path d="M${f1(x - 4)} ${f1(y - 3)}v3l4 2v-3z" fill="#857c6b"/><path d="M${f1(x + 4)} ${f1(y - 3)}v3l-4 2v-3z" fill="#6f675a"/>`;
    svg.appendChild(blk);
    blk.animate([{transform:'translateY(-40px)', opacity:0}, {transform:'translateY(0)', opacity:1, offset:.55, easing:'cubic-bezier(.5,0,.8,.4)'}, {transform:'translateY(-3px)', offset:.7}, {transform:'translateY(0)', opacity:1, offset:.82}, {opacity:0}], {duration:2400, fill:'forwards'}).onfinish = () => blk.remove();
    setTimeout(() => { dust(svg, {x:(x / 16 + y / 8) / 2, y:(y / 8 - x / 16) / 2, w:0, h:0}, 0); }, 1300);
    floatText(svg, x, y - 16, label, color);
  } else if (res === 'land'){
    // glowing footsteps from the shore to the fire
    const [bx, by] = P(scene.boat[0] + .6, .6);
    for (let i = 0; i < 9; i++){
      const f = i / 8, c = document.createElementNS(NS, 'ellipse');
      c.setAttribute('cx', f1(bx + (fx0 - bx) * f + (i % 2 ? 1.2 : -1.2))); c.setAttribute('cy', f1(by + (fy0 + 6 - by) * f)); c.setAttribute('rx', '1.3'); c.setAttribute('ry', '.7'); c.setAttribute('fill', color);
      svg.appendChild(c);
      c.animate([{opacity:0}, {opacity:.95, offset:.2}, {opacity:0}], {duration:1600, delay:i * 140, fill:'both'}).onfinish = () => c.remove();
    }
    floatText(svg, fx0, fy0 - 18, label, color);
  } else if (res === 'harvest'){
    // crops sparkle and every chimney puffs
    const farms = find('farm');
    (farms.length ? farms : [fire]).forEach(o => { const [x, y] = P(o.x + .5, o.y + .5); sparkle(svg, x, y - 2, color, 7, 14); });
    find('house').forEach(o => { const [x, y] = P(o.x + .37, o.y + .41, 26); sparkle(svg, x, y, '#cdd6e4', 4, 4); });
    const o = farms[0] || fire, [x, y] = P(o.x + .5, o.y + .5); floatText(svg, x, y - 14, label, color);
  } else {
    // the fire and lanterns flare
    const pool = [fire, ...find('lantern')];
    pool.forEach(o => {
      const [x, y] = P(o.x + .5, o.y + .5), e = document.createElementNS(NS, 'ellipse');
      e.setAttribute('cx', f1(x)); e.setAttribute('cy', f1(y - 4)); e.setAttribute('rx', '34'); e.setAttribute('ry', '20'); e.setAttribute('fill', '#ffcf80'); e.style.mixBlendMode = 'screen';
      svg.appendChild(e);
      e.animate([{opacity:0}, {opacity:.4, offset:.3}, {opacity:0}], {duration:1800, fill:'both'}).onfinish = () => e.remove();
      sparkle(svg, x, y - 8, '#ffe08a', 6, 8);
    });
    floatText(svg, fx0, fy0 - 20, label, color);
  }
}

/* ---------------- celebrations ---------------- */
function fireworks(world, bursts = 6){
  if (reduce()) return;
  const box = document.createElement('div'); box.className = 'fireworks'; world.appendChild(box);
  const COL = ['#ffd994', '#f4bd63', '#62c9b9', '#e07a8c', '#a98ad6', '#93d47e'];
  for (let b = 0; b < bursts; b++){
    setTimeout(() => {
      const cx = 15 + Math.random() * 70, cy = 12 + Math.random() * 30, col = COL[b % COL.length];
      const trail = document.createElement('i'); trail.className = 'fw-trail'; trail.style.left = cx + '%'; trail.style.top = cy + '%'; trail.style.background = col; box.appendChild(trail);
      trail.animate([{transform:'translateY(160px)', opacity:.9}, {transform:'translateY(0)', opacity:1}], {duration:600, easing:'cubic-bezier(.2,.7,.3,1)', fill:'forwards'}).onfinish = () => {
        trail.remove();
        for (let i = 0; i < 22; i++){
          const s = document.createElement('i'), a = Math.PI * 2 * i / 22, d = 34 + Math.random() * 22;
          s.className = 'fw-spark'; s.style.left = cx + '%'; s.style.top = cy + '%'; s.style.background = col; s.style.boxShadow = `0 0 6px ${col}`;
          box.appendChild(s);
          s.animate([{transform:'translate(-50%,-50%) scale(1)', opacity:1}, {transform:`translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d + 18}px)) scale(.3)`, opacity:0}], {duration:1300 + Math.random() * 400, easing:'cubic-bezier(.15,.7,.3,1)', fill:'forwards'}).onfinish = () => s.remove();
        }
      };
    }, b * 520 + Math.random() * 200);
  }
  setTimeout(() => box.remove(), bursts * 520 + 2600);
}
/* Festival bunting strung across the village square when a Gardens tier is done. */
function bunting(svg, scene){
  if (!svg.isConnected) return;
  const COL = ['#e07a8c', '#f2b33d', '#62c9b9', '#a98ad6', '#f3efe6'];
  const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'bunting');
  const lines = [[P(-2, .5, 16), P(1.5, -1.5, 16)], [P(-1.5, 2.5, 14), P(2.5, 1, 14)]];
  let html = '';
  lines.forEach(([a, b]) => {
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + 8;
    html += `<path d="M${f1(a[0])} ${f1(a[1])}Q${f1(mx)} ${f1(my)} ${f1(b[0])} ${f1(b[1])}" stroke="#5f4532" stroke-width=".6" fill="none"/>`;
    for (let i = 1; i < 12; i++){
      const t = i / 12, x = (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * mx + t * t * b[0], y = (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * my + t * t * b[1];
      html += `<path class="flag" style="transform-origin:${f1(x)}px ${f1(y)}px;animation-delay:-${(i * .23).toFixed(2)}s" d="M${f1(x - 1.4)} ${f1(y)}h2.8l-1.4 3.2z" fill="${COL[i % COL.length]}"/>`;
    }
  });
  g.innerHTML = html; svg.appendChild(g);
  g.animate([{opacity:0}, {opacity:1}], {duration:600, fill:'forwards'});
  setTimeout(() => g.animate([{opacity:1}, {opacity:0}], {duration:800, fill:'forwards'}).onfinish = () => g.remove(), 14000);
}
/* The boat sails in with a new settler. */
function boatIn(svg){
  const b = svg.querySelector('.o[data-k="boat"]'); if (!b || reduce()) return;
  b.animate([{transform:'translate(90px,40px)', opacity:0}, {opacity:1, offset:.15}, {transform:'translate(0,0)', opacity:1}], {duration:3200, easing:'cubic-bezier(.2,.6,.3,1)', fill:'both'});
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
    // the moon crosses the open sky on the right, below the title, from 6 pm to 6 am
    const t = ((h - 18 + 24) % 24) / 12;
    el.style.setProperty('--moon', t <= 1 ? 1 : 0);
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

window.Life = {start, stop, hit, locate, construct, fx, fireworks, bunting, boatIn, dust, sky, lanterns, get settlers(){ return state ? state.people.map(p => ({i:p.i, st:p.doing})) : []; }};
})();
