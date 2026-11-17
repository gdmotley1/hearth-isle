/* Exercise demos: a side-view figure that performs each move on a loop. Poses are key points (hip,
   torso angle, ankles, hands); knees and elbows come from two-bone IK, so feet stay planted and
   joints bend the right way between poses. Demo.svg(key) returns markup; Demo.play(svg, key) animates it. */
(function(){
const TH = 20, SH = 20, UA = 14, FA = 14, TOR = 24, NECK = 8.5, HEAD = 5.2, FLOOR = 90;
const dir = (a, l) => [Math.cos(a * Math.PI / 180) * l, Math.sin(a * Math.PI / 180) * l];
const add = (p, v) => [p[0] + v[0], p[1] + v[1]];
function ik(base, target, L1, L2, s){
  const dx = target[0] - base[0], dy = target[1] - base[1], d0 = Math.hypot(dx, dy);
  const d = Math.max(Math.abs(L1 - L2) + .01, Math.min(L1 + L2 - .01, d0)), a = Math.atan2(dy, dx) * 180 / Math.PI;
  const off = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)))) * 180 / Math.PI;
  const mid = add(base, dir(a + s * off, L1));
  const end = d0 > L1 + L2 - .01 ? add(mid, dir(Math.atan2(target[1] - mid[1], target[0] - mid[0]) * 180 / Math.PI, L2)) : target;
  return [mid, end];
}
/* Pose fields: h hip, t torso angle (deg, 0 = right, -90 = up), n head tilt, a/b near/far ankle,
   fa/fb toe angles, w/v near/far hand. Exercise fields: p poses (ping-pong), d seconds per segment,
   k/kb knee bend sign near/far, e/eb elbow bend sign, db dumbbells ('two' | 'one' | 'goblet' | 'swing'),
   g grip ('h' handle front-to-back, 'x' end-on), prop. */
const STAND = {h:[56, 48], t:-90, a:[59, 87], b:[56, 87]};
const P = (o) => Object.assign({}, STAND, o);
const EX = {
  goblet_squat:{db:'goblet', d:[2, 1.2], p:[P({w:[63, 33], v:[63, 33]}), P({h:[45, 70], t:-60, w:[64, 55], v:[64, 55]})]},
  floor_press:{db:'two', g:'x', prop:'mat', d:[2, 1.1], e:-1, eb:-1,
    p:[{h:[74, 84], t:181, a:[92, 87], b:[95, 87], w:[52, 59], v:[55, 58]}, {h:[74, 84], t:181, a:[92, 87], b:[95, 87], w:[60, 70], v:[63, 69]}]},
  split_squat:{db:'two', prop:'chair-l', d:[2, 1.2], fb:172,
    p:[{h:[61, 51], t:-86, a:[73, 87], b:[33, 64], w:[61, 76], v:[64, 75]}, {h:[56, 66], t:-80, a:[73, 87], b:[33, 64], w:[58, 90], v:[61, 89]}]},
  shoulder_press:{db:'two', g:'x', prop:'seat', d:[1.1, 1.8], e:-1, eb:-1,
    p:[{h:[50, 66], t:-90, a:[72, 87], b:[69, 87], w:[57, 40], v:[59, 39]}, {h:[50, 66], t:-90, a:[72, 87], b:[69, 87], w:[53, 17], v:[56, 16]}]},
  pushup:{d:[1.8, 1], fa:70, fb:70,
    p:[{h:[59, 71], t:-23, a:[18, 84], b:[20, 84], w:[82, 88], v:[84, 88]}, {h:[55, 81], t:-9, a:[18, 84], b:[20, 84], w:[82, 88], v:[84, 88]}]},
  db_rdl:{db:'two', d:[2, 1.2], p:[P({w:[60, 74], v:[62, 73]}), P({h:[43, 52], t:-18, w:[66, 76], v:[68, 75]})]},
  row:{db:'one', prop:'couch', d:[1, 1.8], kb:-1, fb:180,
    p:[{h:[50, 49], t:-8, a:[50, 87], b:[30, 63], w:[74, 73], v:[76, 62]}, {h:[50, 49], t:-8, a:[50, 87], b:[30, 63], w:[60, 52], v:[76, 62]}]},
  reverse_lunge:{db:'two', d:[1.8, 1.2], p:[P({w:[59, 74], v:[61, 73]}), {h:[48, 66], t:-87, a:[59, 87], b:[22, 85], fb:35, w:[50, 90], v:[52, 89]}]},
  rear_fly:{db:'two', g:'x', d:[1, 1.8], e:1, eb:1,
    p:[{h:[42, 52], t:-14, a:[54, 87], b:[51, 87], w:[66, 73], v:[68, 72]}, {h:[42, 52], t:-14, a:[54, 87], b:[51, 87], w:[58, 41], v:[63, 39]}]},
  hammer_curl:{db:'two', g:'v', d:[1, 1.8], p:[P({w:[60, 74], v:[62, 73]}), P({w:[66, 34], v:[68, 33]})]},
  plank:{d:[2.5, 2.5], fa:70, fb:70, e:1, eb:1,
    p:[{h:[55, 78], t:-14, a:[14, 84], b:[16, 84], w:[94, 87], v:[96, 87]}, {h:[55, 77], t:-15, a:[14, 84], b:[16, 84], w:[94, 87], v:[96, 87]}]},
  thruster:{db:'two', g:'x', d:[1.4, 1], e:-1, eb:-1,
    p:[P({h:[45, 70], t:-60, w:[63, 49], v:[65, 48]}), P({w:[59, -3], v:[62, -4]})]},
  renegade_row:{db:'two', d:[1, 1.4], fa:70, fb:70,
    p:[{h:[59, 70], t:-22, a:[18, 84], b:[21, 84], w:[82, 86], v:[85, 86]}, {h:[59, 70], t:-22, a:[18, 84], b:[21, 84], w:[68, 67], v:[85, 86]}]},
  sl_rdl:{db:'one', d:[2, 1.2], fb:100, p:[P({w:[60, 74], v:[62, 73]}), {h:[52, 52], t:-8, a:[59, 87], b:[15, 58], w:[75, 76], v:[77, 75]}]},
  db_swing:{db:'swing', d:[.55, .55], e:1, eb:1,
    p:[{h:[41, 55], t:-32, a:[56, 87], b:[53, 87], w:[50, 71], v:[50, 71]}, P({t:-92, w:[80, 30], v:[80, 30]})]},
  dead_bug:{prop:'mat', d:[1.8, 1.4], e:1, eb:1,
    p:[{h:[70, 84], t:181, a:[90, 64], b:[92, 63], w:[47, 58], v:[49, 57]}, {h:[70, 84], t:181, a:[90, 64], b:[108, 82], w:[25, 79], v:[49, 57]}]},
  worlds_greatest:{prop:'mat', d:[1.6, 1.4], fb:30, e:1, eb:1,
    p:[{h:[50, 70], t:-28, a:[76, 87], b:[20, 86], w:[71, 87], v:[73, 87], n:20}, {h:[50, 70], t:-34, a:[76, 87], b:[20, 86], w:[74, 21], v:[73, 87], n:-55}]},
  ankle_rock:{prop:'mat', d:[1.2, 1.2], fb:180, p:[{h:[46, 62], t:-90, a:[72, 87], b:[24, 86], w:[66, 66], v:[68, 66]}, {h:[54, 62], t:-84, a:[72, 87], b:[24, 86], w:[74, 66], v:[76, 66]}]},
  glute_bridge:{prop:'mat', d:[1, 1.6], e:1, eb:1,
    p:[{h:[70, 84], t:181, a:[88, 87], b:[91, 87], w:[64, 88], v:[66, 88]}, {h:[68, 70], t:151, a:[88, 87], b:[91, 87], w:[64, 88], v:[66, 88]}]}
};
const lerp = (a, b, t) => a + (b - a) * t, lp = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
function mix(A, B, t){
  const o = {};
  ['h', 'a', 'b', 'w', 'v'].forEach(k => { o[k] = lp(A[k], B[k], t); });
  ['t', 'n', 'fa', 'fb'].forEach(k => { o[k] = lerp(A[k] || 0, B[k] || 0, t); });
  return o;
}
/* Joint positions for a pose. */
function solve(ex, q){
  const sh = add(q.h, dir(q.t, TOR)), hd = add(sh, dir(q.t + (q.n || 0), NECK));
  const [k1, a1] = ik(q.h, q.a, TH, SH, ex.k || -1), [k2, a2] = ik(q.h, q.b, TH, SH, ex.kb || ex.k || -1);
  const [e1, w1] = ik(sh, q.w, UA, FA, ex.e || 1), [e2, w2] = ik(sh, q.v, UA, FA, ex.eb || ex.e || 1);
  const fa = q.fa != null && q.fa !== 0 ? q.fa : (ex.fa || 0), fb = q.fb != null && q.fb !== 0 ? q.fb : (ex.fb || 0);
  return {sh, hd, k1, a1, t1:add(a1, dir(fa, 7)), k2, a2, t2:add(a2, dir(fb, 7)), e1, w1, e2, w2, hip:q.h, t:q.t};
}
const f = n => n.toFixed(1);
const NEAR = '#e8edf5', FAR = '#7f8ea8', GOLD = '#f0bd62', GOLDD = '#a77a2c';
function dumbbell(p, g, c){
  const [x, y] = p;
  if (g === 'x') return `<circle cx="${f(x)}" cy="${f(y)}" r="4.1" fill="${c}"/><circle cx="${f(x)}" cy="${f(y)}" r="1.6" fill="rgba(0,0,0,.25)"/>`;
  if (g === 'v') return `<path d="M${f(x)} ${f(y - 5)}V${f(y + 5)}" stroke="${c}" stroke-width="1.8"/><rect x="${f(x - 3.6)}" y="${f(y - 7.2)}" width="7.2" height="3" rx="1" fill="${c}"/><rect x="${f(x - 3.6)}" y="${f(y + 4.2)}" width="7.2" height="3" rx="1" fill="${c}"/>`;
  return `<path d="M${f(x - 5)} ${f(y)}H${f(x + 5)}" stroke="${c}" stroke-width="1.8"/><rect x="${f(x - 7.2)}" y="${f(y - 3.6)}" width="3" height="7.2" rx="1" fill="${c}"/><rect x="${f(x + 4.2)}" y="${f(y - 3.6)}" width="3" height="7.2" rx="1" fill="${c}"/>`;
}
const seg = (a, b, w, c) => `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
function figure(ex, j){
  const g = ex.g || 'h';
  let s = '';
  // far limbs, darker and behind
  s += seg(j.hip, j.k2, 6.6, FAR) + seg(j.k2, j.a2, 5.6, FAR) + seg(j.a2, j.t2, 4.2, FAR);
  s += seg(j.sh, j.e2, 5.2, FAR) + seg(j.e2, j.w2, 4.6, FAR);
  if (ex.db === 'two') s += dumbbell(j.w2, g, GOLDD);
  // torso and head
  s += seg(j.hip, j.sh, 9.5, NEAR) + `<circle cx="${f(j.hd[0])}" cy="${f(j.hd[1])}" r="${HEAD}" fill="${NEAR}"/>`;
  // near limbs
  s += seg(j.hip, j.k1, 7, NEAR) + seg(j.k1, j.a1, 6, NEAR) + seg(j.a1, j.t1, 4.4, NEAR);
  if (ex.db === 'goblet' || ex.db === 'swing') s += dumbbell(lp(j.w1, j.w2, .5), 'v', GOLD);
  s += seg(j.sh, j.e1, 5.6, NEAR) + seg(j.e1, j.w1, 5, NEAR);
  if (ex.db === 'two' || ex.db === 'one') s += dumbbell(j.w1, g, GOLD);
  return s;
}
function props(ex){
  let s = '';
  const wood = '#4a5873', woodD = '#36425a';
  s += `<path d="M6 ${FLOOR}H114" stroke="rgba(255,255,255,.14)" stroke-width="1"/>`;
  if (ex.prop === 'mat') s += `<rect x="18" y="${FLOOR - 1.6}" width="88" height="2.4" rx="1.2" fill="#3f5e82"/>`;
  if (ex.prop === 'chair-l') s += `<rect x="16" y="68" width="22" height="4" rx="1.2" fill="${wood}"/><path d="M18 72V${FLOOR}M36 72V${FLOOR}" stroke="${woodD}" stroke-width="2.4"/><path d="M17 68V44" stroke="${woodD}" stroke-width="3" stroke-linecap="round"/>`;
  if (ex.prop === 'seat') s += `<rect x="34" y="71" width="26" height="4" rx="1.2" fill="${wood}"/><path d="M36 75V${FLOOR}M58 75V${FLOOR}" stroke="${woodD}" stroke-width="2.4"/><path d="M35 71V42" stroke="${woodD}" stroke-width="3" stroke-linecap="round"/>`;
  if (ex.prop === 'couch') s += `<rect x="14" y="67" width="72" height="9" rx="3" fill="${wood}"/><rect x="14" y="76" width="72" height="9" rx="2" fill="${woodD}"/><path d="M18 85v5M82 85v5" stroke="${woodD}" stroke-width="2.4"/>`;
  return s;
}
const ease = t => .5 - Math.cos(Math.PI * t) / 2, HOLD = .35;
/* Timeline: ping-pong through the poses with a short hold at each end. */
function at(ex, time){
  const n = ex.p.length, d = ex.d || [1.5], fwd = [], back = [];
  for (let i = 0; i < n - 1; i++) fwd.push(d[i] != null ? d[i] : d[0]);
  for (let i = n - 2; i >= 0; i--) back.push(n === 2 ? (d[1] != null ? d[1] : d[0]) : fwd[i]);
  const segs = [...fwd.map((x, i) => [i, i + 1, x]), ...back.map((x, k) => [n - 1 - k, n - 2 - k, x])];
  const total = segs.reduce((a, s) => a + s[2] + HOLD, 0);
  let t = time % total;
  for (const [from, to, dur] of segs){
    if (t < HOLD) return ex.p[from];
    t -= HOLD;
    if (t < dur) return mix(Object.assign({}, ex.p[from]), ex.p[to], ease(t / dur));
    t -= dur;
  }
  return ex.p[0];
}
const norm = q => Object.assign({n:0, fa:0, fb:0}, q);
function frame(key, time){ const ex = EX[key]; return figure(ex, solve(ex, norm(at(ex, time)))); }
function svg(key, cls = ''){
  const ex = EX[key]; if (!ex) return '';
  return `<svg class="demo ${cls}" viewBox="0 -12 120 106" data-ex="${key}" aria-label="Animated demo"><g class="dprops">${props(ex)}</g><ellipse cx="60" cy="${FLOOR + .5}" rx="34" ry="2.2" fill="rgba(0,0,0,.28)"/><g class="dfig">${frame(key, 0)}</g></svg>`;
}
const live = new Set();
let raf = 0, t0 = 0;
function loop(now){
  if (!t0) t0 = now;
  live.forEach(el => { if (!el.isConnected){ live.delete(el); return; } const g = el.querySelector('.dfig'); if (g) g.innerHTML = frame(el.dataset.ex, (now - t0) / 1000); });
  raf = live.size ? requestAnimationFrame(loop) : 0;
}
function play(root){
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  (root.matches && root.matches('svg.demo') ? [root] : [...root.querySelectorAll('svg.demo')]).forEach(el => {
    if (reduce){ const ex = EX[el.dataset.ex]; el.querySelector('.dfig').innerHTML = figure(ex, solve(ex, norm(ex.p[ex.p.length - 1]))); return; }
    live.add(el);
  });
  if (live.size && !raf) raf = requestAnimationFrame(loop);
}
window.Demo = {svg, play, has:k => !!EX[k], EX, pose:(k, i) => figure(EX[k], solve(EX[k], norm(EX[k].p[i])))};
})();
