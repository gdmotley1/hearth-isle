/* Motley Island in 3D: a prototype to compare with the SVG island.
   Models are Kenney's free CC0 kits (Fantasy Town, Nature, Pirate, Mini Characters) in models/.
   Night lighting: a cool moon that casts soft shadows, warm lanterns, windows and a campfire that light
   the ground, animated water with foam at the shore, falling snow, and settlers with real walk cycles. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const $ = s => document.querySelector(s);
const DPR = Math.min(devicePixelRatio || 1, 2);
const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
renderer.setPixelRatio(DPR);
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
const FOG = new THREE.Color(0x0a1424);
scene.fog = new THREE.Fog(FOG, 30, 70);

/* ---------- sky: gradient dome, stars and a moon ---------- */
{
  const c = document.createElement('canvas'); c.width = 2; c.height = 256;
  const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#04070f'); gr.addColorStop(.45, '#0d1b33'); gr.addColorStop(.75, '#1d3557'); gr.addColorStop(1, '#0a1424');
  g.fillStyle = gr; g.fillRect(0, 0, 2, 256);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(80, 32, 16), new THREE.MeshBasicMaterial({map:tex, side:THREE.BackSide, fog:false, depthWrite:false}));
  scene.add(dome);
  const N = 700, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++){
    const th = Math.random() * Math.PI * 2, ph = Math.acos(Math.random() * .92 + .08), r = 75;
    pos.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th)], i * 3);
  }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({color:0xdbe6ff, size:.32, fog:false, transparent:true, opacity:.85})));
}
const glowTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.55)'); gr.addColorStop(.6, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const glow = (color, size, opacity = 1) => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex, color, transparent:true, opacity, blending:THREE.AdditiveBlending, depthWrite:false}));
  s.scale.setScalar(size); return s;
};
const MOON = new THREE.Vector3(-14, 22, -26);
{
  const m = new THREE.Mesh(new THREE.CircleGeometry(2.2, 48), new THREE.MeshBasicMaterial({color:0xf6e7c1, fog:false}));
  m.position.copy(MOON).normalize().multiplyScalar(62); m.lookAt(0, 0, 0); scene.add(m);
  const h = glow(0xf6e7c1, 22, .35); h.material.fog = false; h.position.copy(m.position); scene.add(h);
}

/* ---------- lights ---------- */
scene.add(new THREE.HemisphereLight(0x6f8fcc, 0x2a2018, 1.05));
const moon = new THREE.DirectionalLight(0xb4c8ff, 1.35);
moon.position.set(9, 17, 13);   // lit from the viewer's side so the cliffs read; the moon you see sits behind the island
moon.castShadow = true;
moon.shadow.mapSize.set(1024, 1024);
Object.assign(moon.shadow.camera, {left:-10, right:10, top:10, bottom:-10, near:1, far:50});
moon.shadow.bias = -.0006; moon.shadow.normalBias = .02;
scene.add(moon);

/* ---------- the island: an organic plateau with a beach ring ---------- */
const shoreR = th => 6.2 + .55 * Math.sin(3 * th + 1) + .35 * Math.sin(5 * th + .4);
function blob(rOff, depth, top, side){
  const sh = new THREE.Shape();
  for (let i = 0; i <= 96; i++){ const th = i / 96 * Math.PI * 2, r = shoreR(th) + rOff; const x = Math.cos(th) * r, y = Math.sin(th) * r; i ? sh.lineTo(x, y) : sh.moveTo(x, y); }
  const geo = new THREE.ExtrudeGeometry(sh, {depth, bevelEnabled:true, bevelThickness:.18, bevelSize:.22, bevelSegments:3, curveSegments:4});
  geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, [new THREE.MeshStandardMaterial({color:top, roughness:.95}), new THREE.MeshStandardMaterial({color:side, roughness:1})]);
  m.receiveShadow = true; m.castShadow = true; return m;
}
const land = blob(0, 1.25, 0x55864c, 0x7d5d43); land.position.y = -1.25; scene.add(land);
const beach = blob(.75, .5, 0xcbb68d, 0xa08b66); beach.position.y = -.95; scene.add(beach);
// dusting of snow: pale patches on the grass
for (let i = 0; i < 26; i++){
  const th = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * (shoreR(th) - .6);
  const p = new THREE.Mesh(new THREE.CircleGeometry(.25 + Math.random() * .45, 14), new THREE.MeshStandardMaterial({color:0xdfe7f2, roughness:.9, transparent:true, opacity:.55}));
  p.rotation.x = -Math.PI / 2; p.position.set(Math.cos(th) * r, .012 + i * .0004, Math.sin(th) * r); p.receiveShadow = true; scene.add(p);
}

/* ---------- water: waves, depth tint, shore foam, moon glint ---------- */
const water = new THREE.Mesh(new THREE.PlaneGeometry(120, 120, 160, 160), new THREE.ShaderMaterial({
  uniforms:{t:{value:0}, moonDir:{value:MOON.clone().normalize()}, fogC:{value:FOG}},
  vertexShader:`uniform float t; varying vec3 vW;
    varying vec3 vN;
    void main(){ vec3 p = position; float h = sin(p.x*.55+t*.8)*.045 + sin(p.y*.7-t*1.05)*.035 + sin((p.x+p.y)*1.3+t*1.6)*.015;
      float dx = cos(p.x*.55+t*.8)*.55*.045 + cos((p.x+p.y)*1.3+t*1.6)*1.3*.015, dy = cos(p.y*.7-t*1.05)*.7*.035 + cos((p.x+p.y)*1.3+t*1.6)*1.3*.015;
      vN = normalize(vec3(-dx, 1., dy));
      p.z += h; vec4 w = modelMatrix*vec4(p,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
  fragmentShader:`uniform float t; uniform vec3 moonDir; uniform vec3 fogC; varying vec3 vW; varying vec3 vN;
    float shore(float a){ return 6.2 + .55*sin(3.*a+1.) + .35*sin(5.*a+.4); }
    void main(){
      vec3 n = normalize(vN);
      float a = atan(vW.z, vW.x), d = length(vW.xz) - shore(a) - .75;
      vec3 deep = vec3(.008,.025,.07), shallow = vec3(.03,.11,.17);
      vec3 c = mix(shallow, deep, smoothstep(0., 7., d));
      float foam = smoothstep(.28, 0., abs(d - .08 - .1*sin(t*1.3 + a*7.))) * .45 + smoothstep(.18, 0., d) * .25;
      vec3 V = normalize(cameraPosition - vW), H = normalize(V + moonDir);
      float spec = pow(max(dot(n, H), 0.), 1800.) * .55;
      float fres = pow(1. - max(dot(n, V), 0.), 5.) * .18;
      c += foam * vec3(.75,.85,.95) + spec * vec3(1.,.95,.85) + fres * vec3(.25,.35,.55);
      float fd = smoothstep(30., 70., length(cameraPosition - vW));
      gl_FragColor = vec4(mix(c, fogC, fd), 1.);
      #include <colorspace_fragment>
    }`
}));
water.rotation.x = -Math.PI / 2; water.position.y = -.98; scene.add(water);

/* ---------- models ---------- */
const loader = new GLTFLoader(), cache = new Map();
const load = path => { if (!cache.has(path)) cache.set(path, loader.loadAsync('models/' + path + '.glb')); return cache.get(path); };
function shadows(o){ o.traverse(m => { if (m.isMesh){ m.castShadow = true; m.receiveShadow = true; } }); return o; }
async function put(path, x, z, {y = 0, rot = 0, s = 1, parent = scene} = {}){
  const g = await load(path), o = shadows(g.scene.clone(true));
  o.position.set(x, y, z); o.rotation.y = rot; o.scale.setScalar(s); parent.add(o); return o;
}
const winMat = new THREE.MeshBasicMaterial({color:0xffc56b});
const lights = [];
function lamp(x, y, z, {color = 0xffb75a, intensity = 6, dist = 5, size = 1.4, flicker = .08} = {}){
  const L = new THREE.PointLight(color, intensity, dist, 2); L.position.set(x, y, z); scene.add(L);
  const gl = glow(color, size, .9); gl.position.set(x, y, z); scene.add(gl);
  lights.push({L, gl, base:intensity, flicker, ph:Math.random() * 10}); return L;
}
/* A cottage from modular walls: a door on the front, windows that glow, a gable roof (and a chimney). */
async function cottage(x, z, rot, {wood = false, floors = 1, roof = 'roof-gable', chimney = true} = {}){
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; scene.add(g);
  const W = wood ? 'wall-wood' : 'wall', win = wood ? 'wall-wood-window-shutters' : 'wall-window-glass';
  for (let f = 0; f < floors; f++){
    const y = f;
    await put(f === 0 ? `town/${W}-door` : `town/${win}`, 0, 0, {y, rot:-Math.PI / 2, parent:g});   // front (+z)
    await put(`town/${win}`, 0, 0, {y, rot:0, parent:g});                                        // +x
    await put(`town/${win}`, 0, 0, {y, rot:Math.PI, parent:g});                                  // -x
    await put(`town/${W}`, 0, 0, {y, rot:Math.PI / 2, parent:g});                                // back
    // warm window panes on the three window walls
    for (const [r, dx, dz] of [[0, .505, 0], [Math.PI, -.505, 0]]){
      const p = new THREE.Mesh(new THREE.PlaneGeometry(.2, .36), winMat); p.position.set(dx, y + .52, dz); p.rotation.y = r + Math.PI / 2; g.add(p);
    }
  }
  await put(`town/${roof}`, 0, 0, {y:floors, parent:g});
  if (chimney) await put('town/chimney', .28, -.22, {y:floors + .1, s:.8, parent:g});
  const wp = new THREE.Vector3(.75, .55, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), rot).add(g.position);
  lamp(wp.x, .55, wp.z, {intensity:2.2, dist:2.6, size:.9, flicker:.03});
  return g;
}

/* ---------- settlers: Kenney mini characters with real animations ---------- */
const mixers = [], walkers = [], people = [];
const NAMES = ['Ada', 'Bea', 'Cass', 'Dov', 'Elin', 'Finn'];
async function settler(file, pos, {clip = 'idle', path = null, speed = .55, face = 0, name, line} = {}){
  const g = await load('chars/' + file), o = shadows(SkeletonUtils.clone(g.scene));
  o.position.copy(pos); o.rotation.y = face; o.scale.setScalar(1.1); scene.add(o);
  const mx = new THREE.AnimationMixer(o); mixers.push(mx);
  const act = name => mx.clipAction(THREE.AnimationClip.findByName(g.animations, name));
  const a = act(path ? 'walk' : clip); a.time = Math.random() * 2; a.play();
  if (path) walkers.push({o, path, i:0, speed, wait:0, mx, walk:a, idle:act('idle')});
  people.push({o, name, line}); return o;
}

/* ---------- build the island ---------- */
async function build(){
  // ground details first: a dirt path ring around the campfire
  const path = new THREE.Mesh(new THREE.RingGeometry(1.45, 2.1, 48), new THREE.MeshStandardMaterial({color:0x7a6248, roughness:1}));
  path.rotation.x = -Math.PI / 2; path.position.y = .02; path.receiveShadow = true; scene.add(path);

  await Promise.all([
    cottage(-2.6, -1.6, .5), cottage(-.6, -3.3, -.15, {wood:true}), cottage(2.2, -2.6, -.6, {floors:2, roof:'roof-high-point', chimney:false}),
    cottage(-3.8, 1.3, 1.3, {wood:true}),
  ]);
  // windmill: a two-floor stone tower with turning sails
  const mill = new THREE.Group(); mill.position.set(3.7, 0, .6); mill.rotation.y = .74; scene.add(mill);   // sails toward the viewer
  for (const [w, r] of [['wall-door', -Math.PI / 2], ['wall', 0], ['wall', Math.PI], ['wall', Math.PI / 2]]) await put('town/' + w, 0, 0, {rot:r, parent:mill});
  for (const r of [-Math.PI / 2, 0, Math.PI, Math.PI / 2]) await put('town/wall-window-shutters', 0, 0, {y:1, rot:r, parent:mill});
  await put('town/roof-point', 0, 0, {y:2, parent:mill});
  const sails = await put('town/windmill', 0, 0, {y:1.75, rot:Math.PI / 2, s:.8, parent:mill}); sails.position.z = .62; sails.rotation.order = 'YXZ';
  // the campfire in the middle of the village
  await put('nature/campfire_stones', 0, 0, {s:1.4}); await put('nature/campfire_logs', 0, 0, {s:1.2});
  const fire = lamp(0, .35, 0, {color:0xff9a3c, intensity:10, dist:6, size:1.8, flicker:.35});
  for (let i = 0; i < 3; i++){ const f = glow(0xffb347, .5 - i * .1, .9); f.position.set((i - 1) * .06, .22 + i * .08, 0); scene.add(f); lights.push({gl:f, base:0, flicker:.4, ph:i * 2, flame:true}); }
  // lanterns along the path, a market stall, a cart, the fountain beginnings of the Gardens
  for (const [x, z] of [[1.4, 1.5], [-1.8, .2], [.4, -1.9], [2.6, -.6]]){ await put('town/lantern', x, z); lamp(x, 1.38, z); }
  await put('town/stall-red', -1.2, 2.6, {rot:.3}); await put('town/cart', 1.9, 2.6, {rot:-.6});
  await put('pirate/barrel', -.6, 3.0, {s:.45}); await put('pirate/crate', -.2, 3.25, {s:.45, rot:.4});
  // the Hanging Gardens, tier one: hedged stone terraces with flowers
  const gd = new THREE.Group(); gd.position.set(-.4, 0, 4.4); gd.rotation.y = .2; scene.add(gd);
  await put('town/fountain-round', 0, 0, {s:1.1, parent:gd});
  for (let i = 0; i < 10; i++){ const a = i / 10 * Math.PI * 2; await put('nature/' + ['flower_redA', 'flower_yellowB', 'flower_purpleA'][i % 3], Math.cos(a) * 1.35, Math.sin(a) * 1.35, {s:2.6, rot:a, parent:gd}); }
  await put('nature/plant_bush', -1.1, .5, {s:1.4, parent:gd}); await put('nature/plant_bush', 1.1, .4, {s:1.3, parent:gd});
  // trees, bushes, rocks and a field
  for (const [m, x, z, s] of [['nature/tree_pineRoundA', -4.6, -1.8, 2.2], ['nature/tree_pineRoundC', -4.9, -.4, 1.9], ['nature/tree_oak', 4.4, -2.9, 2.2], ['town/tree', -2.2, -4.6, 1.1], ['town/tree-high-round', 1.2, -4.9, 1.1], ['nature/tree_fat', -4.6, -3.2, 2], ['nature/tree_default', -5.2, 2.9, 2.1], ['nature/tree_pineRoundA', 0, -5.9, 1.8]])
    await put(m, x, z, {s, rot:Math.random() * 6});
  for (const [m, x, z, s] of [['nature/plant_bushLarge', -4.4, 3.6, 1.3], ['nature/rock_largeA', 5.6, -1.2, 1.6], ['nature/rock_smallC', -5.7, 1.3, 2], ['nature/log_stack', -3.3, -.2, 1.4]])
    await put(m, x, z, {s, rot:Math.random() * 6});
  for (let i = 0; i < 6; i++) await put('nature/crop_pumpkin', 2.3 + (i % 3) * .6, 3.1 + Math.floor(i / 3) * .6, {s:1.5, rot:i});
  await put('nature/crop_pumpkin', 3.9, 3.9, {s:1.6}); await put('nature/crop_pumpkin', 3.5, 4.4, {s:1.4});
  await put('nature/tent_detailedOpen', -1.5, -.95, {s:1.6, rot:.9});
  // the dock and the lantern longboat on the east shore
  const ang = .05, sr = shoreR(ang), dx = Math.cos(ang) * (sr + .9), dz = Math.sin(ang) * (sr + .9);
  await put('pirate/structure-platform-dock', dx, dz, {y:-1, rot:-Math.PI / 2 - ang, s:.7});
  const boat = await put('pirate/boat-row-large', dx + 1.6, dz + 1.1, {y:-1.02, rot:-.3, s:.55});
  lamp(dx + 2.25, -.2, dz + .9, {intensity:3, dist:3, size:1});
  boat.userData.bob = true;

  // settlers: two sit by the fire, one tends the field, three walk the path
  const ring = n => Array.from({length:n}, (_, i) => { const a = i / n * Math.PI * 2; return new THREE.Vector3(Math.cos(a) * 1.78, 0, Math.sin(a) * 1.78); });
  await Promise.all([
    settler('character-female-b', new THREE.Vector3(-.75, 0, .35), {clip:'sit', face:2.1, name:'Ada', line:'Every point you earn becomes a story we tell by this fire.'}),
    settler('character-male-c', new THREE.Vector3(.7, 0, -.45), {clip:'sit', face:-1.0, name:'Bea', line:'You gave us a good day to talk about tonight.'}),
    settler('character-female-d', new THREE.Vector3(2.7, 0, 3.0), {clip:'pick-up', face:.4, name:'Cass', line:'The fields are waiting on a home-cooked meal.'}),
    settler('character-male-a', ring(1)[0], {path:ring(12), name:'Dov', line:'A lifting session keeps the woodpile high.'}),
    settler('character-female-f', ring(1)[0], {path:ring(12).reverse(), speed:.48, name:'Elin', line:'New paths open when you walk.'}),
    settler('character-male-e', new THREE.Vector3(-2.2, 0, 2.2), {path:[new THREE.Vector3(-2.2, 0, 2.2), new THREE.Vector3(-1.2, 0, 2.2), new THREE.Vector3(-.5, 0, 3.6), new THREE.Vector3(-2.6, 0, 3.4)], speed:.42, name:'Finn', line:'Shelves are full today. Home cooking keeps the stall busy.'}),
  ]);
  // the two ring walkers start on opposite sides (found by name: settlers finish loading in any order)
  const elin = walkers.find(w => people.find(p => p.o === w.o && p.name === 'Elin')); if (elin){ elin.i = 6; elin.o.position.copy(elin.path[6]); }
  scene.userData.sails = sails; scene.userData.boat = boat; scene.userData.fire = fire;
}

/* ---------- snow ---------- */
const FL = 900, fpos = new Float32Array(FL * 3), fvel = new Float32Array(FL);
for (let i = 0; i < FL; i++){ fpos.set([(Math.random() - .5) * 24, Math.random() * 14, (Math.random() - .5) * 24], i * 3); fvel[i] = .35 + Math.random() * .5; }
const fgeo = new THREE.BufferGeometry(); fgeo.setAttribute('position', new THREE.BufferAttribute(fpos, 3));
scene.add(new THREE.Points(fgeo, new THREE.PointsMaterial({color:0xffffff, size:.06, transparent:true, opacity:.8, depthWrite:false})));

/* ---------- camera: turn, pinch, glide, with soft damping ---------- */
const camera = new THREE.PerspectiveCamera(innerHeight > innerWidth ? 40 : 30, innerWidth / innerHeight, .1, 200);
// back off until the whole island (radius about 7.6) fits the narrower side of the screen
function fitDistance(){ const v = THREE.MathUtils.degToRad(camera.fov) / 2, h = Math.atan(Math.tan(v) * camera.aspect); return 7.6 / Math.sin(Math.min(v, h)) * .9; }
camera.position.set(1, 1.3, 1.1).normalize().multiplyScalar(fitDistance());
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, .5);
controls.enableDamping = true; controls.dampingFactor = .07;
controls.minDistance = 7; controls.maxDistance = fitDistance() * 1.15;
controls.minPolarAngle = .45; controls.maxPolarAngle = 1.2;
controls.enablePan = false; controls.rotateSpeed = .55; controls.zoomSpeed = .8;
controls.autoRotate = true; controls.autoRotateSpeed = .25;
controls.addEventListener('start', () => { controls.autoRotate = false; $('#hint').style.opacity = 0; clearTimeout(controls.idle); });
controls.addEventListener('end', () => { controls.idle = setTimeout(() => controls.autoRotate = true, 8000); });

/* tap a settler: a little speech bubble */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let tapAt = null, talking = null;
renderer.domElement.addEventListener('pointerdown', e => { tapAt = [e.clientX, e.clientY, performance.now()]; });
renderer.domElement.addEventListener('pointerup', e => {
  if (!tapAt || Math.hypot(e.clientX - tapAt[0], e.clientY - tapAt[1]) > 8 || performance.now() - tapAt[2] > 400) return;
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  let best = null, bd = .9;
  for (const p of people){ const c = p.o.position.clone().add(new THREE.Vector3(0, .35, 0)); const d = ray.ray.distanceToPoint(c); if (d < bd){ bd = d; best = p; } }
  const b = $('#bubble');
  if (!best){ b.classList.remove('on'); talking = null; return; }
  talking = best; b.innerHTML = `<b>${best.name}</b>${best.line}`; b.classList.add('on');
  clearTimeout(b.t); b.t = setTimeout(() => { b.classList.remove('on'); talking = null; }, 5000);
});

/* ---------- loop ---------- */
const clock = new THREE.Clock(), tmp = new THREE.Vector3();
function frame(){
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
  water.material.uniforms.t.value = t;
  for (const m of mixers) m.update(dt);
  for (const w of walkers){
    if (w.wait > 0){ w.wait -= dt; if (w.wait <= 0){ w.idle.fadeOut(.3); w.walk.reset().fadeIn(.3).play(); } continue; }
    w.i %= w.path.length; const tgt = w.path[w.i]; tmp.subVectors(tgt, w.o.position); tmp.y = 0;
    const d = tmp.length();
    if (d < .05){ w.i = (w.i + 1) % w.path.length; if (Math.random() < .12){ w.wait = 1.5 + Math.random() * 2.5; w.walk.fadeOut(.3); w.idle.reset().fadeIn(.3).play(); } continue; }
    tmp.normalize(); w.o.position.addScaledVector(tmp, Math.min(d, w.speed * dt));
    const want = Math.atan2(tmp.x, tmp.z); let da = want - w.o.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da)); w.o.rotation.y += da * Math.min(1, dt * 8);
  }
  for (const l of lights){
    const n = Math.sin(t * 7.3 + l.ph) * .5 + Math.sin(t * 13.1 + l.ph * 2) * .3 + Math.sin(t * 2.1 + l.ph) * .2;
    if (l.L) l.L.intensity = l.base * (1 + n * l.flicker);
    if (l.gl) l.gl.material.opacity = (l.flame ? .75 : .85) + n * l.flicker * .6;
    if (l.flame) l.gl.scale.setScalar((.38 + n * .07) * (1 + l.ph * .02));
  }
  const ud = scene.userData;
  if (ud.sails) ud.sails.rotation.x = t * .6;
  if (ud.boat){ ud.boat.position.y = -1.02 + Math.sin(t * 1.2) * .03; ud.boat.rotation.z = Math.sin(t * .9) * .04; }
  const p = fgeo.attributes.position.array;
  for (let i = 0; i < FL; i++){ p[i * 3 + 1] -= fvel[i] * dt; p[i * 3] += Math.sin(t * .7 + i) * .002; if (p[i * 3 + 1] < -1) p[i * 3 + 1] = 13; }
  fgeo.attributes.position.needsUpdate = true;
  controls.update();
  renderer.render(scene, camera);
  if (talking){ const v = talking.o.position.clone().add(new THREE.Vector3(0, .8, 0)).project(camera); const b = $('#bubble'); b.style.left = (v.x * .5 + .5) * innerWidth + 'px'; b.style.top = (-v.y * .5 + .5) * innerHeight + 'px'; }
}
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.fov = innerHeight > innerWidth ? 40 : 30; camera.updateProjectionMatrix(); controls.maxDistance = fitDistance() * 1.15; renderer.setSize(innerWidth, innerHeight); });
renderer.setAnimationLoop(frame);
window.__frame = (n = 1) => { for (let i = 0; i < n; i++) frame(); };   // render on demand (for screenshots)
window.__dbg = {scene, camera};
build().then(() => { $('#load').style.opacity = 0; setTimeout(() => $('#load').remove(), 900); window.__ready = true; })
  .catch(e => { $('#load').textContent = 'Could not load the island: ' + e.message; console.error(e); });
