/* How much of each grocery a week's meals need, so the grocery list can change amounts, not just items.
   Every grocery has a pack {unit, size, label, n, each}: n packs of `size` units at `each` dollars. Every
   recipe ingredient bought from the list has `amt` in that unit, for one full cooking of the recipe.
   A recipe on the menu more than once is cooked ceil(appearances / meals) times (`meals`: how many menu
   slots one cooking covers, default 1). Sunday blocks and other sub-recipes are cooked once. Recipes that are
   in neither the menu nor any other recipe (hard-boiled eggs, snacks) are made once every week.
   The app (grocery list) and scripts/check_amounts.js (the gate) both use this file. */
(function(){
// Words that mean "this week already has one of these" when a recipe from another week leans on its own block.
const KIND = [['roast', 'vegetable', 'roots', 'tray'], ['rice'], ['yogurt', 'feta', 'ranch', 'tzatziki', 'crema'], ['marinara'], ['pickled']];
const kindOf = name => KIND.findIndex(ws => ws.some(w => name.toLowerCase().includes(w)));
// "Lemons" and "Lemon" are the same thing on a list.
const key = name => String(name).toLowerCase().trim().replace(/s$/, '');

/* The week's own extras: recipes neither on the written menu nor used by another recipe. */
function extras(D){
  const onMenu = new Set(Object.values(D.menu).flatMap(m => ['breakfast', 'lunch', 'dinner'].map(s => m[s])));
  const sub = new Set(Object.values(D.recipes).flatMap(r => (r.ingredients || []).filter(i => i.r).map(i => i.r)));
  return Object.keys(D.recipes).filter(id => !D.recipes[id].component && !onMenu.has(id) && !sub.has(id));
}

/* Recipes cooked for week wn. refs: menu appearances [{wk, id, frozen}] (frozen ones cost nothing: last
   week bought them). Returns [{wk, id, r, times}]. */
function cooked(MW, wn, refs){
  const D = MW[wn], out = new Map(), local = {};
  Object.entries(D.recipes).forEach(([id, r]) => { if (r.component){ const k = kindOf(r.name); if (k >= 0 && !(k in local)) local[k] = id; } });
  const add = (wk, id, times) => {
    const k = wk + ':' + id, r = MW[wk] && MW[wk].recipes[id]; if (!r) return;
    const cur = out.get(k); if (cur){ cur.times = Math.max(cur.times, times); return; }
    out.set(k, {wk, id, r, times});
    (r.ingredients || []).forEach(i => { if (!i.r) return; const sub = MW[wk].recipes[i.r];
      const kd = wk !== wn && sub && sub.component ? kindOf(sub.name) : -1;
      if (kd >= 0 && local[kd]) add(wn, local[kd], 1); else add(wk, i.r, 1); });
  };
  const apps = new Map();
  refs.forEach(x => { if (x.frozen) return; const k = x.wk + ':' + x.id; apps.set(k, (apps.get(k) || 0) + 1); });
  apps.forEach((n, k) => { const [wk, id] = [+k.split(':')[0], k.slice(k.indexOf(':') + 1)], r = MW[wk] && MW[wk].recipes[id];
    if (r) add(wk, id, Math.ceil(n / (r.meals || 1))); });
  extras(D).forEach(id => add(wn, id, 1));
  return [...out.values()];
}

/* Total need per grocery (by name), with the first grocery entry seen for it:
   Map key -> {amt, g, wk, recipe, unknown}. unknown: some use had no amt. */
function tally(MW, list){
  const m = new Map();
  list.forEach(x => (x.r.ingredients || []).forEach(i => {
    if (!i.g) return;
    const g = MW[x.wk].groceries.find(y => y.id === i.g); if (!g) return;
    const k = key(g.name); let t = m.get(k);
    if (!t){ t = {amt:0, g, wk:x.wk, recipe:x.r.name, unknown:false}; m.set(k, t); }
    if (typeof i.amt === 'number' && g.pack && t.g.pack && g.pack.unit === t.g.pack.unit) t.amt += i.amt * x.times;
    else t.unknown = true;
  }));
  return m;
}

window.Amt = {key, kindOf, extras, cooked, tally};
})();
