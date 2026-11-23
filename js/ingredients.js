/* Which ingredients a recipe step uses, found by name in the step's text.
   Cook mode lists them (with amounts) under each step, and the gate runs the same code to fail any recipe
   whose steps never name one of its ingredients, so nothing on the list is left out of the method. */
(function(){
const words = name => String(name).toLowerCase().replace(/\(.*?\)/g, '').replace(/-/g, ' ').match(/[a-zñé%0-9']+/g) || [];
const sing = s => s.length <= 3 || /(ss|us)$/.test(s) ? s : s.replace(/(ies|es|s)$/, '');
// Keys are word stems with plural endings cut off, so "berr" matches berry and berries.
// GENERIC: last words too vague alone, so the word before counts ("chili powder" or "chili", "bread loaf" or "bread").
// LOOSE: generic words that also count on their own ("the oil", "the cheese", "breadcrumbs").
const GENERIC = new Set(['powder', 'sauce', 'seasoning', 'flakes', 'paste', 'mix', 'leaves', 'juice', 'oil', 'blend', 'cheese', 'milk', 'beans', 'onions', 'peppers',
  'crumbles', 'chips', 'loaf', 'crowns', 'hearts', 'breadcrumbs'].map(w => sing(w)));
const LOOSE = new Set(['oil', 'cheese', 'milk', 'beans', 'onions', 'peppers', 'crumbles', 'breadcrumbs'].map(w => sing(w)));
const MEAT = ['chicken', 'turkey', 'pork', 'beef', 'sausage', 'steak'], NOT_MEAT = new Set(['broth', 'stock', 'bouillon']);
const STOP = new Set(['with', 'and', 'the', 'from', 'for', 'quick', 'roasted', 'two', 'tray', 'sheet', 'pan', 'big', 'batch', 'style', 'plain', 'fresh', 'frozen', 'sauce', 'mixed', 'your', 'over', 'into', 'crock', 'pot', 'spicy', 'easy']);


/* The words that count as naming this ingredient in a step. */
function keys(name, isRecipe){
  const w = words(name);
  if (!w.length) return [];
  if (isRecipe) return w.filter(x => x.length >= 4 && !STOP.has(x));
  const last = sing(w[w.length - 1]), out = [];
  if (GENERIC.has(last) && w.length > 1){
    const prev = sing(w[w.length - 2]);
    out.push(prev + ' ' + last, prev);
    if (LOOSE.has(last) && !(last === 'pepper' && prev === 'black')) out.push(last);
  } else out.push(last);
  if (!NOT_MEAT.has(last)) MEAT.forEach(m => { if (w.includes(m) && !out.includes(m)) out.push(m); });
  return out;
}
const norm = t => ' ' + String(t).toLowerCase().replace(/-/g, ' ');
const said = (text, ks) => ks.some(k => new RegExp("[^a-zñé%0-9']" + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(norm(text)));

/* An ingredient's display name in its meal file (D is a week file or the library). */
function nameOf(D, i){
  if (i.g){ const g = D.groceries.find(x => x.id === i.g); return g ? g.name : i.g; }
  if (i.p){ const p = D.pantry.find(x => x.id === i.p); return p ? p.name : i.p; }
  if (i.h){ const h = (D.have || []).find(x => x.id === i.h); return h ? h.name : i.h; }
  const r = D.recipes[i.r]; return r ? r.name : i.r;
}
const keysOf = (D, i) => keys(nameOf(D, i), !!i.r);

/* For each step, the indexes of the ingredients it names. */
function perStep(D, r){
  return r.steps.map(s => r.ingredients.map((i, k) => said(s, keysOf(D, i)) ? k : -1).filter(k => k >= 0));
}
/* Ingredients no step names (the gate wants this empty for every recipe). */
function unnamed(D, r){
  const all = r.steps.join(' \n ');
  return r.ingredients.filter(i => !said(all, keysOf(D, i))).map(i => nameOf(D, i));
}

window.Ingr = {keys, nameOf, perStep, unnamed};
})();
