/* Motley Island service worker: the app works offline after the first visit.
   Bump VERSION whenever a file below changes so phones pick up the update. */
const VERSION = 'hearth-v39';
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
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Serve from cache right away, refresh the cache in the background.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
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
