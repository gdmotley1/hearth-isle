/* Motley Island reminders. The phone works out the next 7 days of reminders (app.js buildReminders) and
   uploads them with its push subscription to Supabase, signed with the backup code. A Supabase function
   sends each one when it is due (supabase/functions/hearth-push). Settings live in hearth.remind. */
(function(){
const PUB = 'BDfbkmO64PDpWnZ0i_edfGV_KbNJZBO5l1b2MQ1opKvNOdL6j8eVMvQmBArLozlkSS3uN4Bv_woq1gLRxzPuhJY';
const RK = 'hearth.remind';
const KINDS = {workout:'Workout time', prep:'Prep and thaw nights', dinner:'Dinner heads-up', evening:'Evening check-in'};
let conf = (() => { try { return JSON.parse(localStorage.getItem(RK)) || null; } catch(e) { return null; } })()
  || {on:false, kinds:{workout:true, prep:true, dinner:true, evening:true}, last:'', at:0};
const saveConf = () => { try { localStorage.setItem(RK, JSON.stringify(conf)); } catch(e) {} };
let builder = null, timer = 0, lastError = '';

const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const installed = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
const keyBytes = b64 => { const s = atob(b64.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - b64.length % 4) % 4)); return Uint8Array.from(s, c => c.charCodeAt(0)); };
const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = (h * 33 ^ s.charCodeAt(i)) >>> 0; return h.toString(36); };
async function subscription(create){
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  return sub || (create ? reg.pushManager.subscribe({userVisibleOnly:true, applicationServerKey:keyBytes(PUB)}) : null);
}

/* Upload the next 7 days of reminders if anything changed (or every 6 hours, so the window rolls forward). */
async function sync(force){
  if (!conf.on || !builder) return;
  try {
    const sub = await subscription(false); if (!sub) { conf.on = false; saveConf(); return; }
    const items = await builder(conf.kinds), h = hash(sub.endpoint + JSON.stringify(items));
    if (!force && h === conf.last && Date.now() - conf.at < 6 * 3600e3) return;
    const a = await Cloud.auth(); if (!a) throw new Error('Turn on cloud backup first.');
    await Cloud.rpc('hearth_push_set', {p_id:a.id, p_secret:a.code, p_sub:sub.toJSON(), p_items:items});
    conf.last = h; conf.at = Date.now(); saveConf(); lastError = '';
  } catch(e) { lastError = e.message || 'Could not update reminders'; }
}
const schedule = (ms = 6000) => { clearTimeout(timer); timer = setTimeout(() => sync(false), ms); };

/* Ask for permission (must come from a tap), subscribe, and upload. */
async function enable(){
  if (!supported()) throw new Error(installed() ? 'This phone cannot show notifications from web apps. iOS 16.4 or later is needed.' : 'Open Motley Island from your Home Screen to turn on reminders.');
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Notifications are off for Motley Island. Turn them on in iPhone Settings, Notifications.');
  await subscription(true);
  await Cloud.push();
  conf.on = true; conf.last = ''; saveConf();
  await sync(true);
  if (lastError) { conf.on = false; saveConf(); throw new Error(lastError); }
}
async function disable(){
  conf.on = false; conf.last = ''; saveConf();
  try { const a = await Cloud.auth(); if (a) await Cloud.rpc('hearth_push_set', {p_id:a.id, p_secret:a.code, p_sub:null, p_items:[]}); } catch(e) {}
  try { const sub = await subscription(false); if (sub) await sub.unsubscribe(); } catch(e) {}
}
function setKind(k, on){ conf.kinds[k] = !!on; saveConf(); schedule(500); }

function start(build){
  builder = build;
  const prev = window.onHearthSave;
  window.onHearthSave = () => { if (prev) prev(); if (conf.on) schedule(); };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && conf.on) schedule(1500); });
  if (conf.on) schedule(3000);
}

window.Remind = {start, enable, disable, setKind, sync:() => sync(true), KINDS, supported, installed,
  preview:() => builder ? builder(conf.kinds) : Promise.resolve([]),
  info:() => ({on:conf.on, kinds:Object.assign({}, conf.kinds), at:conf.at, error:lastError})};
})();
