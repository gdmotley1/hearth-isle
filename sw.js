/* Motley Island service worker: the app works offline after the first visit.
   Bump VERSION whenever a file below changes so phones pick up the update. */
const VERSION = 'hearth-v45';
const SHELL = [
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/island.js',
  './js/life.js',
  './js/store.js',
  './js/cloud.js',
  './js/remind.js',
  './js/demo.js',
  './js/app.js',
  './data/workouts.json',
  './data/dishes.json',
  './data/meals-week1.json',
  './data/meals-week2.json',
  './data/meals-week3.json',
  './data/meals-week4.json',
  './data/meals-week5.json',
  './data/meals-week6.json',
  './data/meals-week7.json',
  './data/meals-week8.json',
  './data/meals-week9.json',
  './data/meals-week10.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './js/isle3d.js'
];
/* The 3D island's engine and models (about 3.6 MB) live in their own cache that app updates leave alone,
   so they download once rather than with every version bump. */
const ASSETS_CACHE = 'hearth-assets-1';   // bump only when a file below changes
const ASSETS = [
  './models3d/chars/Textures/colormap.png',
  './models3d/chars/character-female-b.glb',
  './models3d/chars/character-female-d.glb',
  './models3d/chars/character-female-f.glb',
  './models3d/chars/character-male-a.glb',
  './models3d/chars/character-male-c.glb',
  './models3d/chars/character-male-e.glb',
  './models3d/nature/campfire_logs.glb',
  './models3d/nature/campfire_stones.glb',
  './models3d/nature/crop_pumpkin.glb',
  './models3d/nature/crops_dirtDoubleRow.glb',
  './models3d/nature/crops_leafsStageB.glb',
  './models3d/nature/crops_wheatStageA.glb',
  './models3d/nature/crops_wheatStageB.glb',
  './models3d/nature/flower_purpleA.glb',
  './models3d/nature/flower_redA.glb',
  './models3d/nature/flower_yellowB.glb',
  './models3d/nature/log_stack.glb',
  './models3d/nature/plant_bush.glb',
  './models3d/nature/plant_bushLarge.glb',
  './models3d/nature/plant_bushSmall.glb',
  './models3d/nature/rock_largeA.glb',
  './models3d/nature/rock_smallC.glb',
  './models3d/nature/tent_detailedOpen.glb',
  './models3d/nature/tree_default.glb',
  './models3d/nature/tree_fat.glb',
  './models3d/nature/tree_oak.glb',
  './models3d/nature/tree_pineDefaultA.glb',
  './models3d/nature/tree_pineRoundA.glb',
  './models3d/nature/tree_pineRoundC.glb',
  './models3d/pirate/Textures/colormap.png',
  './models3d/pirate/barrel.glb',
  './models3d/pirate/boat-row-large.glb',
  './models3d/pirate/crate.glb',
  './models3d/pirate/flag-high-pennant.glb',
  './models3d/pirate/flag-pennant.glb',
  './models3d/pirate/structure-platform-dock.glb',
  './models3d/pirate/structure-roof.glb',
  './models3d/pirate/structure.glb',
  './models3d/pirate/tower-complete-large.glb',
  './models3d/pirate/tower-complete-small.glb',
  './models3d/town/Textures/colormap.png',
  './models3d/town/banner-red.glb',
  './models3d/town/cart.glb',
  './models3d/town/chimney.glb',
  './models3d/town/fence.glb',
  './models3d/town/fountain-round.glb',
  './models3d/town/hedge-large.glb',
  './models3d/town/hedge.glb',
  './models3d/town/lantern.glb',
  './models3d/town/pillar-wood.glb',
  './models3d/town/rock-large.glb',
  './models3d/town/roof-gable.glb',
  './models3d/town/roof-high-gable.glb',
  './models3d/town/roof-high-point.glb',
  './models3d/town/roof-point.glb',
  './models3d/town/stall-green.glb',
  './models3d/town/stall-red.glb',
  './models3d/town/tree-high-round.glb',
  './models3d/town/tree.glb',
  './models3d/town/wall-block.glb',
  './models3d/town/wall-door.glb',
  './models3d/town/wall-window-glass.glb',
  './models3d/town/wall-window-shutters.glb',
  './models3d/town/wall-wood-door.glb',
  './models3d/town/wall-wood-window-glass.glb',
  './models3d/town/wall-wood-window-shutters.glb',
  './models3d/town/wall-wood.glb',
  './models3d/town/wall.glb',
  './models3d/town/watermill.glb',
  './models3d/town/windmill.glb',
  './vendor/three/addons/controls/OrbitControls.js',
  './vendor/three/addons/loaders/GLTFLoader.js',
  './vendor/three/addons/utils/BufferGeometryUtils.js',
  './vendor/three/addons/utils/SkeletonUtils.js',
  './vendor/three/three.module.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(Promise.all([caches.open(VERSION).then(c => c.addAll(SHELL)),
    caches.open(ASSETS_CACHE).then(async c => { const have = await c.keys(); if (have.length < ASSETS.length) await c.addAll(ASSETS).catch(() => {}); })]).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== ASSETS_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Serve from cache right away, refresh the cache in the background.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (/\/(vendor|models3d)\//.test(new URL(e.request.url).pathname)){
    // the engine and models never change under the same name: cache first, the network only if one is missing
    e.respondWith(caches.open(ASSETS_CACHE).then(async c => (await c.match(e.request, {ignoreSearch: true})) || fetch(e.request).then(res => { if (res.ok) c.put(e.request, res.clone()); return res; })));
    return;
  }
  e.respondWith(caches.open(VERSION).then(async cache => {
    const hit = await cache.match(e.request, {ignoreSearch: true});
    const net = fetch(e.request).then(res => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(e.request, res.clone());
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});

/* Reminders from the hearth-push function: {title, body, url, tag}. Tapping one opens the app there. */
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch(x) { d = {body:e.data ? e.data.text() : ''}; }
  e.waitUntil(self.registration.showNotification(d.title || 'Motley Island', {
    body:d.body || '', tag:d.tag, icon:'./icons/icon-192.png', badge:'./icons/icon-192.png', data:{url:d.url || '#today'}}));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const hash = (e.notification.data && e.notification.data.url) || '#today';
  e.waitUntil(clients.matchAll({type:'window', includeUncontrolled:true}).then(ws => {
    const w = ws[0];
    if (w){ w.postMessage({go:hash}); return w.focus(); }
    return clients.openWindow(new URL('./' + hash, self.registration.scope).href);
  }));
});
