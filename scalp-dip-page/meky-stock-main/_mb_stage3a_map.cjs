/** STAGE 3a — headline → symbol mapping (variant-based, ambiguity-excluded). Writes _mb_symbol_map.json + _mb_stage3a.out. */
const fs = require('fs');
const esc = (s) => String(s).replace(/[^\x20-\x7E]/g, (c) => '\\u' + c.codePointAt(0).toString(16).padStart(4, '0'));
const names = JSON.parse(fs.readFileSync('_mb_names_stock.json', 'utf8'));
const T0 = new Set(['AALR','ABUK','ACAMD','ADIB','ADRI','AFMC','AIFI','AJWA','AMES','AMOC','ARCC','ARVA','ATLC','ATQA','AXPH','BIOC','CAED','CLHO','COPR','CPCI','CRST','EALR','EDFM','EFID','EGAL','EGAS','EHDR','FAITA','GIHD','GPIM','ICFC','IEEC','IFAP','INEG','INFI','ISMA','ISMQ','JUFO','KABO','MBSC','MCQE','MCRO','MFPC','MICH','MILS','MOED','MOSC','MPCI','MPCO','MTIE','NCCW','OBRI','OCPH','POUL','PRCL','RREI','RUBX','SAUD','SCEM','SIPC','SKPC','SMFR','SPIN','SPMD','TANM','UEFM','WKOL','ZEOT']);
const MANUAL = {
  ABUK: ['أبو قير', 'ابو قير'], SCEM: ['أسمنت سيناء', 'اسمنت سيناء'], POUL: ['القاهرة للدواجن'],
  ATQA: ['العطاونة'], CAED: ['القاهرة للخدمات التعليمية'], MCRO: ['المركز الطبي الجديد'], SPMD: ['سبيد ميدكا'],
  SMFR: ['سماد مصر'], ADIB: ['أبوظبي الإسلامي', 'ابوظبي الاسلامي'], SAUD: ['البركة'], KABO: ['كابو'],
  MOED: ['مودرن'], SKPC: ['سيدى كرير', 'سيدي كرير'], RREI: ['العقارى'], MFPC: ['مطاحن مصر العليا'],
};
function variants(name) {
  const out = new Set();
  const toks = String(name || '').split(/\s+/).filter(Boolean);
  const clean = (arr) => arr.join(' ').replace(/\s*[-–]?\s*مصر$/, '').trim();
  const full = clean(toks);
  out.add(full);
  const noLead = clean(toks.filter((t) => !['الشركة', 'شركة'].includes(t)));
  if (noLead.split(' ').length >= 2) out.add(noLead);
  for (let i = 0; i < toks.length; i++) {
    if (/^ل/.test(toks[i]) && toks[i].length >= 3) {
      const tail = clean(toks.slice(i));
      if (tail.split(' ').length >= 2) out.add(tail);
      const noL = clean(toks.slice(i).slice(1));
      if (noL.split(' ').length >= 2) out.add(noL);
    }
  }
  return [...out].filter((v) => v.split(' ').length >= 2 || v.length >= 5);
}
const var2syms = new Map();
for (const r of names.filter((r) => T0.has(r.symbol))) {
  const vs = new Set([...variants(r.name_ar), ...(MANUAL[r.symbol] || [])]);
  for (const v of vs) { if (!var2syms.has(v)) var2syms.set(v, new Set()); var2syms.get(v).add(r.symbol); }
}
const sortedVars = [...var2syms.keys()].sort((a, b) => b.length - a.length);
const usable = sortedVars.filter((v) => var2syms.get(v).size === 1);
const rows = fs.readFileSync('_mb_archive_cache.jsonl', 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
const symMap = {};
const st = { one: 0, zero: 0, multi: 0 };
const samples = { one: [], multi: [], zero: [] };
for (const r of rows) {
  const hits = new Set();
  for (const v of usable) if (r.title.includes(v)) { for (const s of var2syms.get(v)) hits.add(s); }
  let k;
  if (hits.size === 1) { k = 'one'; symMap[r.id] = [...hits][0]; }
  else if (hits.size > 1) k = 'multi';
  else k = 'zero';
  st[k]++;
  if (samples[k].length < 25) samples[k].push(r.id + ' ' + (k === 'one' ? '-> ' + symMap[r.id] : '') + '| ' + esc(r.title.slice(0, 85)));
}
const out = [
  'T0 symbols mapped: ' + names.filter((r) => T0.has(r.symbol)).length + ' | variants: ' + sortedVars.length + ' | usable(unique): ' + usable.length + ' | ambiguous-variants excluded: ' + (sortedVars.length - usable.length),
  'MATCH: exactly-one=' + st.one + ' (' + (100 * st.one / rows.length).toFixed(1) + '%) | zero=' + st.zero + ' (' + (100 * st.zero / rows.length).toFixed(1) + '%) | ambiguous-excluded=' + st.multi + ' (' + (100 * st.multi / rows.length).toFixed(1) + '%)',
  '--- one samples ---', ...samples.one, '--- multi samples ---', ...samples.multi, '--- zero samples ---', ...samples.zero,
];
fs.writeFileSync('_mb_symbol_map.json', JSON.stringify(symMap), 'utf8');
fs.writeFileSync('_mb_stage3a.out', out.join('\n') + '\n', 'utf8');
console.log('STAGE3a: one=' + st.one + ' (' + (100 * st.one / rows.length).toFixed(1) + '%) zero=' + st.zero + ' multi=' + st.multi);