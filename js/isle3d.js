/* Motley Island in 3D (three.js r160, vendored in vendor/three; Kenney CC0 models in models3d/).
   Reads the same build table as the SVG island (Isle.OBJ, Isle.WALK) and the same state (built list, crops,
   gardens tier, port tier, settlers, season), so the economy and pacing do not change.
   window.Isle3D.create(container, hooks) -> api: setState, pause, resume, resetView, delivery, fx, focusKey.
   hooks: onTap({kind:'settler'|'building', ...story keys, x, y}), onEmpty(). The DOM sky shows through the canvas. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

const MODELS = 'models3d/';
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const loader = new GLTFLoader(), cache = new Map();
const load = p => { if (!cache.has(p)) cache.set(p, loader.loadAsync(MODELS + p + '.glb')); return cache.get(p); };
const shadows = o => { o.traverse(m => { if (m.isMesh){ m.castShadow = true; m.receiveShadow = true; } }); return o; };
const hash = s => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

/* ---------- shared textures ---------- */
const glowTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.55)'); gr.addColorStop(.6, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const glowSprite = (color, size, opacity = 1) => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex, color, transparent:true, opacity, blending:THREE.AdditiveBlending, depthWrite:false}));
  s.scale.setScalar(size); s.userData.base = opacity; return s;
};

/* ---------- island shape: the same outline formula as the SVG island, in tile units ---------- */
const R = [2.6, 3.6, 4.6, 5.5, 6.3];
const rAt = f => { const a = Math.floor(f), b = Math.min(4, a + 1); return R[a] + (R[Math.min(4, b)] - R[a]) * (f - a); };
const wob = th => 1 + .13 * Math.sin(3 * th + .6) + .07 * Math.cos(5 * th + 1.3);

/* ---------- time of day ---------- */
function phase(h = new Date().getHours() + new Date().getMinutes() / 60){ return h < 5.5 || h >= 20 ? 'night' : h < 8 ? 'dawn' : h < 17 ? 'day' : 'dusk'; }
const LIGHT = {
  night:{sky:0x6f8fcc, gnd:0x2a2018, hemi:1.05, sun:0xb4c8ff, sunI:1.3, sunPos:[9, 17, 13], lamps:1, win:1, water:[.008, .025, .07], shallow:[.03, .11, .17]},
  dawn: {sky:0xffc7a6, gnd:0x3a2a22, hemi:1.15, sun:0xffb27a, sunI:2.0, sunPos:[14, 7, 6], lamps:.55, win:.7, water:[.05, .08, .16], shallow:[.12, .2, .26]},
  day:  {sky:0xd6e9ff, gnd:0x6b5a3e, hemi:1.5, sun:0xfff1d8, sunI:2.8, sunPos:[8, 16, 10], lamps:.06, win:.08, water:[.03, .16, .3], shallow:[.1, .36, .44]},
  dusk: {sky:0xf6a37a, gnd:0x3a2722, hemi:1.1, sun:0xff9a5e, sunI:1.9, sunPos:[-6, 6, 14], lamps:.75, win:.85, water:[.05, .06, .14], shallow:[.13, .16, .24]}
};

/* Settler spots: same roles and places as the SVG island (life.js SPOTS), in tile coordinates. */
const SPOTS = [
  {k:'fire', x:.05, y:1.2, a:'sit', role:'storyteller', doing:'warming up by the fire'},
  {k:'tent', x:2.3, y:-.3, a:'work', role:'woodcutter', doing:'chopping firewood'},
  {walk:0, role:'scout', doing:'out for a walk'},
  {k:'f1', x:2.5, y:.55, a:'work', role:'farmer', doing:'tending the crops'},
  {k:'g', x:-.75, y:-1.65, a:'work', role:'builder', doing:'building the Hanging Gardens', done:'tending the Gardens'},
  {k:'fire', x:1.35, y:.6, a:'sit', role:'storyteller', doing:'warming up by the fire'},
  {k:'f2', x:2.5, y:1.55, a:'work', role:'farmer', doing:'tending the crops'},
  {k:'stall', x:-.35, y:1.0, a:'idle', role:'merchant', doing:'minding the market stall'},
  {k:'well', x:3.15, y:2.5, a:'work', role:'water carrier', doing:'drawing water at the well'},
  {walk:3, role:'scout', doing:'out for a walk'},
  {k:'f3', x:3.5, y:.55, a:'work', role:'farmer', doing:'tending the crops'},
  {k:'tw', x:-3.15, y:-.3, a:'wave', role:'lookout', doing:'on lookout at the watchtower'},
  {k:'wm', x:4.55, y:3.2, a:'idle', role:'miller', doing:'running the windmill'},
  {walk:5, role:'scout', doing:'out for a walk'},
  {k:'l1', x:1.55, y:2.35, a:'idle', role:'lamplighter', doing:'lighting the lanterns'},
  {k:'fire', x:-.2, y:.45, a:'sit', role:'storyteller', doing:'warming up by the fire'}
];
const CHARS = ['character-female-b', 'character-male-c', 'character-female-d', 'character-male-a', 'character-female-f', 'character-male-e'];
const ANIM = {sit:'sit', work:'pick-up', idle:'idle', wave:'emote-yes'};
const RESCOL = {stone:0x9fb2c8, land:0x63c3a8, harvest:0x9ad06a, spirit:0xf0b05a};

function create(container, hooks = {}){
  const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true, powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const cv = renderer.domElement; cv.className = 'isle3d'; container.appendChild(cv);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, .1, 200);
  const hemi = new THREE.HemisphereLight(0x6f8fcc, 0x2a2018, 1); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 1); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, {left:-9, right:9, top:9, bottom:-9, near:1, far:50});
  sun.shadow.bias = -.0006; sun.shadow.normalBias = .02; scene.add(sun);
  // a fixed pool of point lights (changing the count would recompile every shader), handed to the most important lamps
  const POOL = Array.from({length:8}, () => { const L = new THREE.PointLight(0xffb75a, 0, 5, 2); scene.add(L); return L; });

  const world = new THREE.Group(); scene.add(world);     // island ground
  const things = new THREE.Group(); scene.add(things);   // buildings and props, one group per build key
  const people = new THREE.Group(); scene.add(people);
  const fxg = new THREE.Group(); scene.add(fxg);
  const winMat = new THREE.MeshBasicMaterial({color:0xffc56b});
  const S = {f:-1, radius:5, built:new Set(), objs:new Map(), lamps:[], settlers:[], mixers:[], walkers:[], phase:null, ready:false, first:true, key:''};
  let water = null, boat = null, sails = [], beams = [], tweens = [], paused = false, lastFrame = 0, interacting = false;

  /* ---------- camera ---------- */
  const controls = new OrbitControls(camera, cv);
  controls.enableDamping = true; controls.dampingFactor = .08; controls.enablePan = false;
  controls.rotateSpeed = .55; controls.zoomSpeed = .8; controls.minPolarAngle = .4; controls.maxPolarAngle = 1.2;
  controls.autoRotateSpeed = .22;
  const fitDist = () => { const v = THREE.MathUtils.degToRad(camera.fov) / 2, h = Math.atan(Math.tan(v) * camera.aspect); return (S.radius * 1.12 + 1.6) / Math.sin(Math.min(v, h)) * .9; };
  const HOME_DIR = new THREE.Vector3(1, 1.3, 1.1).normalize();
  const home = () => ({pos:HOME_DIR.clone().multiplyScalar(fitDist()).add(new THREE.Vector3(0, 0, .4)), target:new THREE.Vector3(0, 0, .4)});
  function setLimits(){ controls.minDistance = 4; controls.maxDistance = fitDist() * 1.2; }
  function glide(pos, target, ms = 650){
    const p0 = camera.position.clone(), t0 = controls.target.clone(), start = performance.now();
    return new Promise(done => tweens.push({run:t => { const k = Math.min(1, (t - start) / ms), e = 1 - Math.pow(1 - k, 3);
      camera.position.lerpVectors(p0, pos, e); controls.target.lerpVectors(t0, target, e); if (k >= 1){ done(); return false; } return true; }}));
  }
  function resetView(){ const h = home(); return glide(h.pos, h.target); }
  function focusAt(v, dist = 6.5){ const dir = camera.position.clone().sub(controls.target).normalize(); return glide(v.clone().add(dir.multiplyScalar(dist)), v.clone()); }
  controls.addEventListener('start', () => { interacting = true; controls.autoRotate = false; clearTimeout(controls.idle); });
  controls.addEventListener('end', () => { interacting = false; clearTimeout(controls.idle); controls.idle = setTimeout(() => { controls.autoRotate = !reduce(); }, 12000); });

  function resize(){
    const r = container.getBoundingClientRect(); if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false); cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px';
    camera.aspect = r.width / r.height; camera.fov = camera.aspect < 1 ? 40 : 30; camera.updateProjectionMatrix(); setLimits();
  }
  const ro = new ResizeObserver(resize); ro.observe(container);

  /* ---------- ground ---------- */
  function buildGround(){
    world.clear();
    const shore = th => Math.max(S.radius * wob(th), 2.2);
    const blob = (off, depth, top, side) => {
      const sh = new THREE.Shape();
      for (let i = 0; i <= 120; i++){ const th = i / 120 * Math.PI * 2, r = shore(th) + off; const x = Math.cos(th) * r, y = Math.sin(th) * r; i ? sh.lineTo(x, y) : sh.moveTo(x, y); }
      const geo = new THREE.ExtrudeGeometry(sh, {depth, bevelEnabled:true, bevelThickness:.18, bevelSize:.22, bevelSegments:3, curveSegments:4});
      geo.rotateX(Math.PI / 2);   // shape (x, y) -> world (x, z), extruded downward from y = 0
      const m = new THREE.Mesh(geo, [new THREE.MeshStandardMaterial({color:top, roughness:.95}), new THREE.MeshStandardMaterial({color:side, roughness:1})]);
      m.receiveShadow = true; m.castShadow = true; return m;
    };
    const land = blob(0, 1.25, S.winter ? 0x6f8f72 : 0x55864c, 0x7d5d43); world.add(land);
    const beach = blob(.75, .5, 0xcbb68d, 0xa08b66); beach.position.y = -.45; world.add(beach);
    // dirt paths between the buildings (same tiles as the SVG island)
    const pm = new THREE.MeshStandardMaterial({color:0x7a6248, roughness:1});
    for (const [x, y, s] of [[0, 1, 1], [0, 2, 1], [0, 3, 2], [-1, 1, 2], [1, 0, 2], [0, 4, 3], [1, 3, 3], [-1, 3, 4], [0, 5, 4]]){
      if (s - .5 > S.f) continue;
      const p = new THREE.Mesh(new THREE.CircleGeometry(.62, 18), pm); p.rotation.x = -Math.PI / 2; p.position.set(x + .5, .015, y + .5); p.receiveShadow = true; world.add(p);
    }
    if (S.winter){
      const sm = new THREE.MeshStandardMaterial({color:0xe8eef6, roughness:.9, transparent:true, opacity:.6});
      let seed = 3; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
      for (let i = 0; i < 34; i++){ const th = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * (shore(th) - .5); const p = new THREE.Mesh(new THREE.CircleGeometry(.2 + rnd() * .45, 14), sm); p.rotation.x = -Math.PI / 2; p.position.set(Math.cos(th) * r, .02 + i * .0003, Math.sin(th) * r); p.receiveShadow = true; world.add(p); }
    }
    if (!water){
      water = new THREE.Mesh(new THREE.PlaneGeometry(90, 90, 120, 120), new THREE.ShaderMaterial({
        transparent:true, depthWrite:false,
        uniforms:{t:{value:0}, R:{value:S.radius}, deep:{value:new THREE.Vector3()}, shallow:{value:new THREE.Vector3()}, sunDir:{value:new THREE.Vector3(0, 1, 0)}, glint:{value:1}},
        vertexShader:`uniform float t; varying vec3 vW; varying vec3 vN;
          void main(){ vec3 p = position; float a = p.x*.55+t*.8, b = p.y*.7-t*1.05, c = (p.x+p.y)*1.3+t*1.6;
            p.z += sin(a)*.045 + sin(b)*.035 + sin(c)*.015;
            vN = normalize(vec3(-(cos(a)*.0248 + cos(c)*.0195), 1., cos(b)*.0245 + cos(c)*.0195));
            vec4 w = modelMatrix*vec4(p,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
        fragmentShader:`uniform float t; uniform float R; uniform vec3 deep; uniform vec3 shallow; uniform vec3 sunDir; uniform float glint; varying vec3 vW; varying vec3 vN;
          void main(){
            float a = atan(vW.z, vW.x), r = length(vW.xz), d = r - max(R*(1. + .13*sin(3.*a+.6) + .07*cos(5.*a+1.3)), 2.2) - .75;
            vec3 c = mix(shallow, deep, smoothstep(0., 7., d));
            float foam = smoothstep(.28, 0., abs(d - .08 - .1*sin(t*1.3 + a*7.))) * .45 + smoothstep(.18, 0., d) * .25;
            vec3 n = normalize(vN), V = normalize(cameraPosition - vW), H = normalize(V + sunDir);
            c += foam*vec3(.75,.85,.95) + pow(max(dot(n,H),0.),1800.)*.55*glint*vec3(1.,.95,.85) + pow(1.-max(dot(n,V),0.),5.)*.18*vec3(.25,.35,.55);
            gl_FragColor = vec4(c, 1. - smoothstep(14., 34., r));
            #include <colorspace_fragment>
          }`
      }));
      water.rotation.x = -Math.PI / 2; water.position.y = -.98; water.renderOrder = -1; scene.add(water);
    }
    water.material.uniforms.R.value = S.radius;
  }

  /* ---------- props ---------- */
  async function put(path, x, z, {y = 0, rot = 0, s = 1, parent} = {}){
    const g = await load(path), o = shadows(g.scene.clone(true));
    o.position.set(x, y, z); o.rotation.y = rot; o.scale.setScalar(s); parent.add(o); return o;
  }
  const lamp = (g, x, y, z, pri, opts = {}) => {
    const gl = glowSprite(opts.color || 0xffb75a, opts.size || 1.3, .9); gl.position.set(x, y, z); g.add(gl);
    S.lamps.push({g, gl, local:new THREE.Vector3(x, y, z), pri, color:opts.color || 0xffb75a, I:opts.I || 5, dist:opts.dist || 4.5, flicker:opts.flicker ?? .08, ph:Math.random() * 10});
  };
  function windows(g, ys, faces = [[.505, 0, Math.PI / 2], [-.505, 0, -Math.PI / 2]]){
    for (const y of ys) for (const [x, z, r] of faces){ const p = new THREE.Mesh(new THREE.PlaneGeometry(.2, .36), winMat); p.position.set(x, y + .52, z); p.rotation.y = r; g.add(p); }
  }
  async function cottage(g, o){
    const v = o.roof || 0, wood = v === 1, floors = v === 2 ? 2 : 1, W = wood ? 'wall-wood' : 'wall', win = wood ? 'wall-wood-window-shutters' : 'wall-window-glass';
    const h = new THREE.Group(); h.rotation.y = (hash(o.k) % 4) * Math.PI / 2 + Math.PI / 4; g.add(h);
    for (let f = 0; f < floors; f++){
      await put(`town/${f ? win : W + '-door'}`, 0, 0, {y:f, rot:-Math.PI / 2, parent:h});
      await put(`town/${win}`, 0, 0, {y:f, rot:0, parent:h});
      await put(`town/${win}`, 0, 0, {y:f, rot:Math.PI, parent:h});
      await put(`town/${W}`, 0, 0, {y:f, rot:Math.PI / 2, parent:h});
      windows(h, [f]);
    }
    await put(`town/${v === 2 ? 'roof-high-point' : v === 1 ? 'roof-gable' : 'roof-high-gable'}`, 0, 0, {y:floors, parent:h});
    if (v !== 2) await put('town/chimney', .28, -.22, {y:floors + .1, s:.8, parent:h});
    lamp(g, 0, .5, 0, 5, {I:2.4, dist:2.6, size:1.1, flicker:.03});
  }
  async function well(g){
    const stone = new THREE.MeshStandardMaterial({color:0x8f8778, roughness:.95});
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(.32, .34, .38, 16, 1, true), stone); ring.position.y = .19; ring.castShadow = ring.receiveShadow = true; g.add(ring);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(.32, .05, 8, 20), stone); lip.rotation.x = Math.PI / 2; lip.position.y = .38; g.add(lip);
    const wtr = new THREE.Mesh(new THREE.CircleGeometry(.29, 16), new THREE.MeshStandardMaterial({color:0x2f5f86, roughness:.2})); wtr.rotation.x = -Math.PI / 2; wtr.position.y = .3; g.add(wtr);
    for (const x of [-.3, .3]) await put('town/pillar-wood', x, 0, {s:.9, parent:g});
    await put('town/roof-point', 0, 0, {y:.88, s:.62, parent:g});
  }
  async function farm(g, o){
    const crop = (S.crops || {})[o.k] || ['greens', 'wheat', 'pumpkins'][(['f1', 'f2', 'f3', 'f4'].indexOf(o.k) + 3) % 3];
    await put('nature/crops_dirtDoubleRow', 0, 0, {s:.95, parent:g});
    const spots = [[-.22, -.2], [.22, -.2], [-.22, .2], [.22, .2]];
    for (const [x, z] of spots){
      if (crop === 'pumpkins') await put('nature/crop_pumpkin', x, z, {s:1.1, rot:x * 9, parent:g});
      else if (crop === 'wheat'){ const gold = new THREE.MeshStandardMaterial({color:0xd9b25a, roughness:.8});
        for (let i = 0; i < 7; i++){ const a = i * 2.4, r = .05 + (i % 3) * .04; const st = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .34, 4), gold); st.position.set(x + Math.cos(a) * r, .17, z + Math.sin(a) * r); st.rotation.z = Math.cos(a) * .12; g.add(st);
          const head = new THREE.Mesh(new THREE.CapsuleGeometry(.025, .07, 2, 6), gold); head.position.set(st.position.x, .37, st.position.z); g.add(head); } }
      else if (crop === 'berries'){ await put('nature/plant_bushSmall', x, z, {s:1.4, parent:g}); for (let i = 0; i < 3; i++){ const b = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), new THREE.MeshStandardMaterial({color:0xb03a5c, roughness:.5})); b.position.set(x + (i - 1) * .06, .18, z + .05); g.add(b); } }
      else await put('nature/crops_leafsStageB', x, z, {s:.8, parent:g});
    }
  }
  async function windmill(g){
    const m = new THREE.Group(); m.rotation.y = .74; g.add(m);
    for (const [w, r] of [['wall-door', -Math.PI / 2], ['wall', 0], ['wall', Math.PI], ['wall', Math.PI / 2]]) await put('town/' + w, 0, 0, {rot:r, parent:m});
    for (const r of [-Math.PI / 2, 0, Math.PI, Math.PI / 2]) await put('town/wall-window-shutters', 0, 0, {y:1, rot:r, parent:m});
    await put('town/roof-point', 0, 0, {y:2, parent:m});
    const s = await put('town/windmill', 0, 0, {y:1.75, rot:Math.PI / 2, s:.8, parent:m}); s.position.z = .62; s.rotation.order = 'YXZ'; sails.push(s);
    lamp(g, 0, .5, 0, 4, {I:2, dist:2.4, size:1, flicker:.03});
  }
  async function flowers(g, o){ const fl = ['flower_redA', 'flower_yellowB', 'flower_purpleA']; for (let i = 0; i < 6; i++){ const a = i * 2.4 + hash(o.k); await put('nature/' + fl[i % 3], Math.cos(a) * .3, Math.sin(a) * .3, {s:2, rot:a, parent:g}); } }
  async function xmas(g){
    await put('nature/tree_pineDefaultA', 0, 0, {s:2.4, parent:g});
    const cols = [0xff6b6b, 0xffd166, 0x7bd389, 0x6ec1ff];
    for (let i = 0; i < 14; i++){ const a = i * 1.3, y = .3 + (i / 14) * 1.5, r = .5 * (1 - i / 16); const b = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), new THREE.MeshBasicMaterial({color:cols[i % 4]})); b.position.set(Math.cos(a) * r, y, Math.sin(a) * r); g.add(b); }
    lamp(g, 0, 2.05, 0, 3, {color:0xffe08a, I:2, dist:3, size:.8, flicker:.15});
  }
  async function gardens(g, gst){
    if (gst <= 0) return;
    const stone = new THREE.MeshStandardMaterial({color:0xb3a58c, roughness:.95}), grass = new THREE.MeshStandardMaterial({color:0x5c9154, roughness:.9});
    const tiers = Math.min(4, gst), sizes = [2.1, 1.6, 1.15, .72];
    let y = 0;
    for (let i = 0; i < tiers; i++){
      const s = sizes[i], h = i === 0 ? .18 : .42;
      const b = new THREE.Mesh(new THREE.BoxGeometry(s, h, s), [stone, stone, grass, stone, stone, stone]); b.position.y = y + h / 2; b.castShadow = b.receiveShadow = true; g.add(b);
      if (i > 0 || tiers === 1) for (let k = 0; k < 4; k++){ const a = k * Math.PI / 2 + Math.PI / 4; await put('nature/' + ['flower_redA', 'flower_yellowB', 'flower_purpleA', 'flower_redA'][k], Math.cos(a) * s * .38, Math.sin(a) * s * .38, {y:y + h, s:1.6, parent:g}); }
      // hanging vines down the front faces
      if (i > 0) for (let k = 0; k < 6; k++){ const v = new THREE.Mesh(new THREE.BoxGeometry(.05, h * .8, .02), new THREE.MeshStandardMaterial({color:0x3f7a46})); v.position.set(-s / 2 + .15 + k * (s - .3) / 5, y + h * .55, s / 2 + .01); g.add(v); }
      y += h;
    }
    if (tiers >= 4){ await put('nature/tree_default', 0, 0, {y, s:1.3, parent:g}); lamp(g, 0, y + 1.4, 0, 6, {color:0xffe3a0, I:3, dist:4, size:1.6, flicker:.05}); }
    else lamp(g, .9, .4, .9, 2, {I:1.5, dist:2, size:.8});
  }
  async function dock(g, tier){
    const ang = 0, sr = S.radius * wob(ang), dx = sr + 1.4;
    await put('pirate/structure-platform-dock', dx, 0, {y:-1, rot:-Math.PI / 2, s:.7, parent:g});
    lamp(g, dx + .6, -.1, .7, 4, {I:2.6, dist:3, size:1});
    if (tier >= 1){ await put('pirate/crate', dx - .2, -.6, {y:-.1, s:.4, parent:g}); await put('pirate/barrel', dx + .2, -.7, {y:-.1, s:.4, parent:g}); await put('pirate/crate', dx, .55, {y:-.1, s:.35, rot:.5, parent:g}); }
    if (tier >= 2){ await put('pirate/structure', dx - 1.3, -1.6, {y:0, s:.42, rot:.4, parent:g}); await put('pirate/flag-high-pennant', dx + .8, -.8, {y:-.1, s:.35, parent:g}); }
    if (tier >= 3){
      const lh = await put('pirate/tower-complete-large', dx + 2.3, -2.1, {y:-1, s:.3, parent:g});
      const beam = new THREE.Mesh(new THREE.ConeGeometry(.9, 6, 20, 1, true), new THREE.MeshBasicMaterial({color:0xfff0b0, transparent:true, opacity:.12, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide}));
      beam.geometry.translate(0, -3, 0); beam.rotation.z = Math.PI / 2; const pivot = new THREE.Group(); pivot.position.set(dx + 2.3, 2.0, -2.1); pivot.add(beam); g.add(pivot); beams.push(pivot);
      lamp(g, dx + 2.3, 2.0, -2.1, 7, {color:0xfff0b0, I:4, dist:5, size:1.8, flicker:.02});
    }
    boat = await put('pirate/boat-row-large', dx + 1.7, 1.0, {y:-1.02, rot:-.3, s:.55, parent:g});
    boat.userData.home = boat.position.clone();
    S.dockAt = new THREE.Vector3(dx, -.3, 0);
  }

  async function makeThing(o){
    const g = new THREE.Group(), w = o.w || 1, h = o.h || 1;
    g.position.set(o.x + w / 2, 0, o.y + h / 2); g.userData = {k:o.k, t:o.t};
    const r = (hash(o.k) % 628) / 100;
    switch (o.t){
      case 'fire': await put('nature/campfire_stones', 0, 0, {s:1.4, parent:g}); await put('nature/campfire_logs', 0, 0, {s:1.2, parent:g});
        lamp(g, 0, .35, 0, 10, {color:0xff9a3c, I:9, dist:6, size:1.8, flicker:.35});
        for (let i = 0; i < 3; i++){ const f = glowSprite(0xffb347, .45 - i * .08, .9); f.position.set((i - 1) * .06, .2 + i * .08, 0); f.userData.flame = i; g.add(f); } break;
      case 'tent': await put('nature/tent_detailedOpen', 0, 0, {s:1.5, rot:.9, parent:g}); break;
      case 'tree': if (o.fruit){ await put('nature/tree_default', 0, 0, {s:1.5, rot:r, parent:g}); for (let i = 0; i < 6; i++){ const b = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), new THREE.MeshStandardMaterial({color:0xd8443c, roughness:.5})); b.position.set(Math.cos(i * 2.1) * .3, 1.35 + (i % 3) * .2, Math.sin(i * 2.1) * .3); g.add(b); } }
        else await put(hash(o.k) % 2 ? 'nature/tree_oak' : 'town/tree', 0, 0, {s:hash(o.k) % 2 ? 1.9 : .95, rot:r, parent:g}); break;
      case 'pine': await put(hash(o.k) % 2 ? 'nature/tree_pineRoundA' : 'nature/tree_pineRoundC', 0, 0, {s:1.8, rot:r, parent:g}); break;
      case 'house': await cottage(g, o); break;
      case 'farm': await farm(g, o); break;
      case 'well': await well(g); break;
      case 'stall': await put(hash(o.k) % 2 ? 'town/stall-green' : 'town/stall-red', 0, 0, {rot:.3, s:.9, parent:g}); await put('pirate/barrel', .45, .4, {s:.35, parent:g}); break;
      case 'windmill': await windmill(g); break;
      case 'tower': await put('pirate/tower-complete-small', 0, 0, {s:.34, rot:r, parent:g}); lamp(g, 0, 2.1, 0, 3, {I:2, dist:3, size:1}); break;
      case 'lantern': await put('town/lantern', 0, 0, {parent:g}); lamp(g, 0, 1.38, 0, 6); break;
      case 'flowers': await flowers(g, o); break;
      case 'rock': await put('nature/rock_largeA', 0, 0, {s:1.6, rot:r, parent:g}); break;
      case 'gardens': await gardens(g, S.gst); break;
      case 'xmas': await xmas(g); break;
    }
    return g;
  }

  /* ---------- settlers ---------- */
  async function addSettler(i, spot, pos, from){
    const file = CHARS[i % CHARS.length], gl = await load('chars/' + file), o = shadows(SkeletonUtils.clone(gl.scene));
    o.scale.setScalar(1.05); o.position.copy(from || pos); people.add(o);
    const mx = new THREE.AnimationMixer(o); S.mixers.push(mx);
    const act = n => mx.clipAction(THREE.AnimationClip.findByName(gl.animations, n) || THREE.AnimationClip.findByName(gl.animations, 'idle'));
    const p = {o, i, role:spot.role, doing:spot.doing, mx, act, spot};
    if (spot.walk !== undefined){
      const w = Isle.WALK[spot.walk];
      p.path = [new THREE.Vector3(w.f[0], 0, w.f[1]), new THREE.Vector3(w.t[0], 0, w.t[1])];
      p.walk = act('walk'); p.idle = act('idle'); p.walk.play(); p.wi = 1; p.wait = 0; S.walkers.push(p);
    } else if (from){
      p.path = [pos.clone()]; p.walk = act('walk'); p.idle = act(ANIM[spot.a]); p.walk.play(); p.wi = 0; p.arriving = true; S.walkers.push(p);
    } else {
      const a = act(ANIM[spot.a] || 'idle'); a.time = Math.random() * 2; a.play();
      o.lookAt(spot.a === 'sit' ? new THREE.Vector3(.5, 0, .5) : new THREE.Vector3(pos.x + 1, 0, pos.z + 1));
    }
    S.settlers.push(p); return p;
  }
  async function placeSettlers(count, newcomer){
    people.clear(); S.mixers.length = 0; S.walkers.length = 0; S.settlers.length = 0;
    const h = new Date().getHours(), late = h >= 23 || h < 5;
    const ok = [];
    for (const s of SPOTS){
      if (s.walk !== undefined){ const w = Isle.WALK[s.walk]; if (!w || !w.d || w.th > S.f) continue; }
      else if (!S.objs.has(s.k)) continue;
      if (late && !['sit'].includes(s.a) && s.role !== 'lamplighter') continue;
      ok.push(s);
    }
    const n = Math.min(count, ok.length, 12);
    for (let i = 0; i < n; i++){
      const s = ok[i], pos = s.walk !== undefined ? new THREE.Vector3(Isle.WALK[s.walk].f[0], 0, Isle.WALK[s.walk].f[1]) : new THREE.Vector3(s.x, 0, s.y);
      if (s.k === 'g' && S.gst >= 4) s.doing = s.done;
      const from = newcomer && i === n - 1 && S.dockAt ? S.dockAt.clone().setY(0).add(new THREE.Vector3(-.8, 0, 0)) : null;
      await addSettler(i, s, pos, from);
    }
  }

  /* ---------- state ---------- */
  async function setState(st){
    const key = JSON.stringify([+st.f.toFixed(3), [...st.built].sort(), st.gst, st.crops, st.winter, st.holiday, st.dockTier, Math.min(12, st.settlers), new Date().getHours() >= 23 || new Date().getHours() < 5]);
    if (key === S.key && !st.newcomer){ applyPhase(); return; }
    S.key = key;
    const regrow = Math.abs(st.f - S.f) > .02 || st.winter !== S.winter;
    Object.assign(S, {f:st.f, gst:st.gst, crops:st.crops || {}, winter:!!st.winter});
    const rad = rAt(Math.max(0, st.f));
    // the land must reach every visible building
    const vis = Isle.OBJ.filter(o => o.th === 0 || (o.t === 'gardens' ? st.built.has('gfound') : st.built.has(o.k)));
    if (st.holiday) vis.push({k:'xmas', t:'xmas', x:-2, y:-1, s:0, th:0});
    // just enough land under every building: the outline wobbles, so check each one against the wobble at its angle
    const need = Math.max(0, ...vis.map(o => { const x = o.x + (o.w || 1) / 2, z = o.y + (o.h || 1) / 2; return (Math.hypot(x, z) + .75) / wob(Math.atan2(z, x)); }));
    S.radius = Math.max(rad * .86, need);
    if (regrow || S.first) buildGround();
    // add new things, rebuild changed ones (crops, gardens tier), drop removed ones
    const want = new Map(vis.map(o => [o.k, o]));
    const sig = o => o.t === 'farm' ? (S.crops[o.k] || '') : o.t === 'gardens' ? 'g' + S.gst : '';
    const fresh = [];
    for (const [k, g] of S.objs){ if (!want.has(k) || g.userData.sig !== sig(want.get(k))){ things.remove(g); S.lamps = S.lamps.filter(l => l.g !== g); S.objs.delete(k); } }
    for (const [k, o] of want){
      if (S.objs.has(k)) continue;
      const g = await makeThing(o); g.userData.sig = sig(o); things.add(g); S.objs.set(k, g);
      if (!S.first && !S.prevKeys.has(k)) fresh.push(g);
    }
    S.prevKeys = new Set(want.keys());
    const dockKey = 'dock' + (st.dockTier || 0);
    if (S.dockKey !== dockKey || regrow){ const old = things.getObjectByName('dock'); if (old){ things.remove(old); S.lamps = S.lamps.filter(l => l.g !== old); } beams.length = 0;
      const dg = new THREE.Group(); dg.name = 'dock'; dg.userData = {k:'dock', t:st.dockTier ? 'port' + st.dockTier : 'dock'}; await dock(dg, st.dockTier || 0); things.add(dg); S.dockKey = dockKey; }
    await placeSettlers(st.settlers, st.newcomer);
    applyPhase(true);
    setLimits();
    if (S.first){ const h = home(); camera.position.copy(h.pos); controls.target.copy(h.target); controls.update(); S.first = false; }
    for (const g of fresh) construct(g, st.focus ? 600 : 0);
    if (fresh.length && st.focus && !reduce()) focusAt(fresh[fresh.length - 1].position.clone().setY(.5), fitDist() * .6);
    S.ready = true;
  }
  function construct(g, delay){
    if (reduce()) return;
    g.scale.setScalar(.001);
    const t0 = performance.now() + delay;
    tweens.push({run:t => { const k = (t - t0) / 900; if (k < 0) return true; const e = k >= 1 ? 1 : 1 - Math.pow(1 - k, 3) * Math.cos(k * 4.5);
      g.scale.setScalar(Math.max(.001, e)); if (k >= 1){ g.scale.setScalar(1); return false; } return true; }});
    setTimeout(() => puff(g.position), delay);
  }
  function puff(at){
    for (let i = 0; i < 10; i++){
      const s = glowSprite(0xd9cdb8, .4, .55); s.material.blending = THREE.NormalBlending; s.position.copy(at).add(new THREE.Vector3((Math.random() - .5) * .8, .1, (Math.random() - .5) * .8)); fxg.add(s);
      const v = new THREE.Vector3((Math.random() - .5) * .9, .5 + Math.random() * .5, (Math.random() - .5) * .9), t0 = performance.now();
      tweens.push({run:t => { const k = (t - t0) / 1100; s.position.addScaledVector(v, .016); s.scale.setScalar(.4 + k * .9); s.material.opacity = .55 * (1 - k); if (k >= 1){ fxg.remove(s); return false; } return true; }});
    }
  }

  /* ---------- lighting by time of day ---------- */
  function applyPhase(force){
    const ph = phase(); if (ph === S.phase && !force) return; S.phase = ph;
    const L = LIGHT[ph];
    hemi.color.setHex(L.sky); hemi.groundColor.setHex(L.gnd); hemi.intensity = L.hemi;
    sun.color.setHex(L.sun); sun.intensity = L.sunI; sun.position.set(...L.sunPos);
    winMat.color.setHex(0xffc56b).multiplyScalar(.15 + .85 * L.win);
    S.lampK = L.lamps;
    if (water){ water.material.uniforms.deep.value.set(...L.water); water.material.uniforms.shallow.value.set(...L.shallow); water.material.uniforms.sunDir.value.copy(sun.position).normalize(); water.material.uniforms.glint.value = ph === 'day' ? .5 : 1; }
    // hand the light pool to the most important lamps
    const ls = [...S.lamps].sort((a, b) => b.pri - a.pri);
    POOL.forEach((P, i) => { const l = ls[i]; P.userData.lamp = l || null; if (l){ P.color.setHex(l.color); P.distance = l.dist; } else P.intensity = 0; });
  }

  /* ---------- taps ---------- */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let down = null;
  cv.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY, performance.now()]; });
  cv.addEventListener('pointerup', async e => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 8 || performance.now() - down[2] > 450) return;
    const r = cv.getBoundingClientRect();
    ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
    let best = null, bd = .55;
    for (const p of S.settlers){ const d = ray.ray.distanceToPoint(p.o.position.clone().add(new THREE.Vector3(0, .4, 0))); if (d < bd){ bd = d; best = p; } }
    if (best){ const at = best.o.position.clone().setY(.4); await focusAt(at, fitDist() * .42); const s = toScreen(at.clone().setY(.9)); hooks.onTap && hooks.onTap({kind:'settler', i:best.i, role:best.role, doing:best.doing, x:s.x, y:s.y}); return; }
    const hit = ray.intersectObjects(things.children, true)[0];
    if (hit){ let g = hit.object; while (g && g.parent !== things) g = g.parent; if (g && g.userData.k){
      const at = g.getWorldPosition(new THREE.Vector3()).setY(.6); if (g.name === 'dock' && S.dockAt) at.copy(S.dockAt);
      await focusAt(at, fitDist() * .55); const s = toScreen(at.clone().setY(1.6)); hooks.onTap && hooks.onTap({kind:'building', k:g.userData.k, t:g.userData.t, x:s.x, y:s.y}); return; } }
    hooks.onEmpty && hooks.onEmpty();
  });
  function toScreen(v){ const p = v.clone().project(camera), r = cv.getBoundingClientRect(); return {x:r.left + (p.x * .5 + .5) * r.width, y:r.top + (-p.y * .5 + .5) * r.height}; }

  /* ---------- deliveries and points ---------- */
  function delivery(resList){
    if (!boat || reduce()) return;
    const home = boat.userData.home.clone(), out = home.clone().add(new THREE.Vector3(7, 0, 2.5)), t0 = performance.now();
    const crates = resList.slice(0, 4).map((res, i) => { const c = new THREE.Mesh(new THREE.BoxGeometry(.16, .16, .16), new THREE.MeshStandardMaterial({color:RESCOL[res] || 0xc9a35a, roughness:.7})); c.castShadow = true; boat.add(c); c.position.set(-.5 + i * .35, .45, 0); c.scale.setScalar(1 / .55); return c; });
    boat.position.copy(out);
    tweens.push({run:t => { const k = Math.min(1, (t - t0) / 2600), e = 1 - Math.pow(1 - k, 3); boat.position.lerpVectors(out, home, e); if (k >= 1){ unload(); return false; } return true; }});
    function unload(){
      const dockAt = S.dockAt || home;
      crates.forEach((c, i) => setTimeout(() => {
        const w0 = c.getWorldPosition(new THREE.Vector3()); boat.remove(c); c.scale.setScalar(1); fxg.add(c); c.position.copy(w0);
        const w1 = dockAt.clone().add(new THREE.Vector3(-.3 + i * .2, .3, -.2 + (i % 2) * .3)), t1 = performance.now();
        tweens.push({run:t => { const k = Math.min(1, (t - t1) / 600); c.position.lerpVectors(w0, w1, k); c.position.y += Math.sin(k * Math.PI) * .6; if (k >= 1){ setTimeout(() => fxg.remove(c), 2600); return false; } return true; }});
      }, 250 + i * 320));
      setTimeout(() => label(dockAt.clone().setY(.9), resList.length > 1 ? 'Cargo in' : 'Delivered'), 300);
    }
  }
  function label(at, text, cls = ''){
    const s = toScreen(at), el = document.createElement('div'); el.className = 'isle3d-label ' + cls; el.textContent = text;
    el.style.left = s.x + 'px'; el.style.top = s.y + 'px'; document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('go')); setTimeout(() => el.remove(), 2200);
  }
  function fx(res, pts, k){
    const from = (S.dockAt || new THREE.Vector3()).clone().setY(.8), g = k && S.objs.get(k), to = g ? g.position.clone().setY(1.2) : new THREE.Vector3(0, 1.2, 0);
    const a = toScreen(from), b = toScreen(to), el = document.createElement('div');
    el.className = `isle3d-chip r-${res}`; el.textContent = `+${pts}`; el.style.left = a.x + 'px'; el.style.top = a.y + 'px'; document.body.appendChild(el);
    requestAnimationFrame(() => { el.style.transform = `translate(${b.x - a.x}px, ${b.y - a.y}px) translate(-50%,-50%) scale(.9)`; el.style.opacity = '0'; });
    setTimeout(() => el.remove(), 1400);
  }

  /* ---------- loop: 60 fps while touched or animating, 30 fps at rest, nothing while hidden ---------- */
  const clock = new THREE.Clock(), tmp = new THREE.Vector3();
  function frame(now){
    if (paused) return;
    const busy = interacting || tweens.length || controls.autoRotate;
    if (!busy && now - lastFrame < 31) return;
    lastFrame = now;
    const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
    tweens = tweens.filter(tw => tw.run(now));
    if (water) water.material.uniforms.t.value = t;
    for (const m of S.mixers) m.update(dt);
    for (const w of S.walkers){
      if (w.wait > 0){ w.wait -= dt; if (w.wait <= 0){ w.idle.fadeOut(.3); w.walk.reset().fadeIn(.3).play(); } continue; }
      const tgt = w.path[w.wi % w.path.length]; tmp.subVectors(tgt, w.o.position); tmp.y = 0; const d = tmp.length();
      if (d < .04){
        if (w.arriving){ w.arriving = false; w.walk.fadeOut(.3); w.idle.reset().fadeIn(.3).play(); S.walkers = S.walkers.filter(x => x !== w); continue; }
        w.wi = (w.wi + 1) % w.path.length; w.wait = 1.2 + Math.random() * 2.4; w.walk.fadeOut(.3); w.idle.reset().fadeIn(.3).play(); continue;
      }
      tmp.normalize(); w.o.position.addScaledVector(tmp, Math.min(d, .5 * dt));
      const want = Math.atan2(tmp.x, tmp.z); let da = want - w.o.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da)); w.o.rotation.y += da * Math.min(1, dt * 8);
    }
    const k = S.lampK ?? 1;
    for (const l of S.lamps){ const n = Math.sin(t * 7.3 + l.ph) * .5 + Math.sin(t * 13.1 + l.ph * 2) * .3 + Math.sin(t * 2.1 + l.ph) * .2; l.n = n; l.gl.material.opacity = Math.max(0, (l.gl.userData.base) * k * (1 + n * l.flicker * .6)); }
    for (const P of POOL){ const l = P.userData.lamp; if (!l) continue; l.g.localToWorld(P.position.copy(l.local)); P.intensity = l.I * k * (1 + (l.n || 0) * l.flicker); }
    things.traverse(o => { if (o.isSprite && o.userData.flame !== undefined) o.scale.setScalar((.38 + Math.sin(t * 9 + o.userData.flame * 2) * .06) * (1 - o.userData.flame * .15)); });
    for (const s of sails) s.rotation.x = t * .6;
    for (const b of beams) b.rotation.y = t * .8;
    if (boat && !tweens.length){ const h = boat.userData.home; boat.position.y = h.y + Math.sin(t * 1.2) * .03; boat.rotation.z = Math.sin(t * .9) * .04; }
    if (S.phaseCheck === undefined || t - S.phaseCheck > 60){ S.phaseCheck = t; applyPhase(); }
    controls.update();
    renderer.render(scene, camera);
  }
  renderer.setAnimationLoop(frame);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') renderer.setAnimationLoop(null); else if (!paused) renderer.setAnimationLoop(frame); });

  resize();
  return {
    setState, resetView, delivery, fx, canvas:cv,
    attach(c){ if (c === container){ resize(); return; } ro.disconnect(); container = c; c.appendChild(cv); ro.observe(c); resize(); },
    focusKey(k){ const g = S.objs.get(k); return g ? focusAt(g.position.clone().setY(.6), fitDist() * .6) : Promise.resolve(); },
    pause(){ paused = true; renderer.setAnimationLoop(null); controls.autoRotate = false; },
    resume(){ paused = false; clock.getDelta(); resize(); renderer.setAnimationLoop(frame); },
    render(n = 1){ for (let i = 0; i < n; i++){ lastFrame = 0; frame(performance.now() + i * 40); } },   // for tests
    get ready(){ return S.ready; }
  };
}

function supported(){ try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch(e) { return false; } }
window.Isle3D = {create, supported:supported(), phase};
window.dispatchEvent(new Event('isle3d-ready'));
