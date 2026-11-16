/* Hearth Isle island life: a calm diorama. Each settler has a spot and one simple loop
   (sitting by the fire, chopping wood, tending crops, hammering at the Gardens, strolling a path),
   drawn once with SVG animation so nothing jitters. Also the sky, dust when a building rises,
   and sky lanterns. Life.start(svg, scene, opts) after each island draw. */
(function(){
const P = (x, y, z = 0) => [(x - y) * 16, (x + y) * 8 - z];
const SHIRTS = ['#c05f3a','#4f7fae','#c79a3a','#7a63ab','#3b8a6a','#b0527a'];
const SKIN = '#d8a985', NS = 'http://www.w3.org/2000/svg';
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
  chop:   d => `<g><path d="M.9 -5.1 L3.4 -6.6" stroke="${SKIN}" stroke-width="1.2" stroke-linecap="round"/><path d="M3.4 -6.6 L4.6 -9.6" stroke="#6b4a2f" stroke-width="1"/><path d="M4.1 -9.9 l1.9 .5 -.4 1.6 -1.9 -.4z" fill="#9aa4ae"/>${anim('transform','rotate','-35 .9 -5.1;45 .9 -5.1;-35 .9 -5.1',1.1,d,' keyTimes="0;.35;1" calcMode="spline" keySplines=".5 0 .9 .5;.3 .2 .4 1"')}</g>`,
  hammer: d => `<g><path d="M.9 -5.1 L3.2 -6.2" stroke="${SKIN}" stroke-width="1.2" stroke-linecap="round"/><path d="M3.2 -6.2 L4.2 -8.2" stroke="#6b4a2f" stroke-width=".9"/><rect x="3.4" y="-9.3" width="2" height="1.1" rx=".3" fill="#7d8790"/>${anim('transform','rotate','-40 .9 -5.1;35 .9 -5.1;-40 .9 -5.1',.7,d,' keyTimes="0;.3;1"')}</g>`,
  wave:   d => `<g><path d="M.9 -5.4 L2.6 -8.6" stroke="${SKIN}" stroke-width="1.2" stroke-linecap="round"/>${anim('transform','rotate','-20 .9 -5.4;20 .9 -5.4;-20 .9 -5.4',1,d)}</g>`,
  lamp:   d => `<g><path d="M.9 -5.1 L3 -6.3" stroke="${SKIN}" stroke-width="1.2" stroke-linecap="round"/><path d="M3 -6.3 L4.4 -12" stroke="#6b4a2f" stroke-width=".8"/><circle cx="4.5" cy="-12.4" r="1.3" fill="#ffd77e"><animate attributeName="opacity" values=".5;1;.5" dur="1.6s" begin="-${f1(d)}s" repeatCount="indefinite"/></circle></g>`,
  draw:   d => `<path d="M.9 -5.1 L3.2 -3.8" stroke="${SKIN}" stroke-width="1.2" stroke-linecap="round"/>`,
  tend:   d => `<path d="M.9 -5.1 L2.8 -2.6" stroke="${SKIN}" stroke-width="1.2" stroke-linecap="round"/><path d="M2.8 -2.6 L4 -.2" stroke="#6b4a2f" stroke-width=".8"/>`
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
function person(i, a, d){
  const torso = a === 'sit'
    ? `<rect x="-1.6" y="-4.6" width="3.2" height="4.2" rx="1.3" fill="${SHIRTS[i % SHIRTS.length]}"/><circle cx="0" cy="-6.2" r="1.8" fill="${SKIN}"/>`
    : `<rect x="-1.6" y="-6.2" width="3.2" height="5.6" rx="1.3" fill="${SHIRTS[i % SHIRTS.length]}"/><circle cx="0" cy="-7.8" r="1.8" fill="${SKIN}"/>`;
  return `<ellipse cx="0" cy="0" rx="2.6" ry="1.2" fill="rgba(0,0,0,.28)"/>${a === 'sit' ? '<rect x="-2.2" y="-1.6" width="4.4" height="1.6" rx=".6" fill="#5f4532"/>' : ''}<g>${torso}${ARM[a] ? ARM[a](d) : ''}${(BODY[a] || (() => ''))(d)}</g>${a === 'chop' ? '<rect x="2.6" y="-1.2" width="3.2" height="1.4" rx=".5" fill="#6b4a2f"/>' : ''}`;
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
            <g>${person(i, 'walk', 0)}<animateTransform attributeName="transform" type="translate" values="0 0;0 -.8;0 0" dur=".36s" repeatCount="indefinite"/></g></g></g>`;
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
    if (d < 40 && (!best || d < best.d)) best = {kind:'settler', i:p.i, st:p.doing, role:p.role, d, x:px, y:r.top - 4, bottom:r.bottom, feet:[px, r.bottom - 2]};
  });
  if (best) return best;
  const toScreen = (x, y) => { const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; const r = pt.matrixTransform(ctm); return [r.x, r.y]; };
  (objs || []).forEach(o => {
    const w = o.w || 1, h = o.h || 1, tall = {house:12, tree:12, pine:12, windmill:20, tower:24, gardens:20, well:6, stall:8, tent:6, fire:4}[o.t] || 3;
    const [x, y] = P(o.x + w / 2, o.y + h / 2, tall), [px, py] = toScreen(x, y), d = Math.hypot(px - cx, py - cy);
    const r = o.t === 'gardens' ? 50 : 32;
    if (d < r && (!best || d < best.d)) best = {kind:'obj', k:o.k, t:o.t, d, x:px, y:toScreen(...P(o.x + w / 2, o.y + h / 2, tall + 14))[1], bottom:toScreen(...P(o.x + w / 2, o.y + h / 2))[1], feet:toScreen(...P(o.x + w / 2, o.y + h / 2))};
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

window.Life = {start, stop, hit, dust, sky, lanterns, get settlers(){ return state ? state.people.map(p => ({i:p.i, st:p.doing})) : []; }};
})();
