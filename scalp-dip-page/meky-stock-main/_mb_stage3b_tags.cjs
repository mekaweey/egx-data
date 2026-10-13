/** STAGE 3b — keyword tags from headline text (actual phrasing from archive freq analysis). Writes _mb_tags.json + _mb_stage3b.out. */
const fs = require('fs');
const esc = (s) => String(s).replace(/[^\x20-\x7E]/g, (c) => '\\u' + c.codePointAt(0).toString(16).padStart(4, '0'));
const symMap = JSON.parse(fs.readFileSync('_mb_symbol_map.json', 'utf8'));
const TAGS = {
  profit_positive: (h) => (/أرباح|الربح/.test(h) && /نمو|ترتفع|ارتفاع|تتضاعف|قفز|قفزة|زيادة|تحسن|يرتفع|تقفز|ترتفع /.test(h)) || /تحقق أرباح|أرباحاً قياسية|أرباح قياسية|تتحول للربحية|تتحول للربحية|تتحول إلى الربحية/.test(h),
  profit_negative: (h) => (/أرباح|الربح/.test(h) && /تهبط|هبوط|تراجع|انخفاض|تتراجع|تقلص|تنهار|يهبط|تنخفض|أدنى/.test(h)) || /خسائر|تحول للخسائر|تتحول للخسائر|تتحول للخسارة|تتحول إلى الخسارة/.test(h),
  dividends: (h) => /توزيعات|كوبون|نهاية وموعد توزيع/.test(h) || (/توزيع أرباح|توزيع نقدية|توزيع كوبون|عدم توزيع أرباح/.test(h) && !/مجانية/.test(h)),
  dividends_bonus: (h) => /أسهم مجانية|أسهم مَجانية|توزيع أسهم مجانية|توزيع الأسهم المجانية/.test(h),
  capital_increase: (h) => /زيادة رأس المال|زيادة رأس مال|رأس المال المستمد|اكتتاب/.test(h),
  share_listing: (h) => /قيد أسهم|قيد زيادة|إدراج|ادراج/.test(h),
  ma_deal: (h) => /استحواذ|اندماج|بيع حصة|شراء حصة/.test(h),
  contract_win: (h) => /تعاقد|تتعاقد|توقيع عقد|اتفاقية|بعقد|فوز بعقد|عقد بقيمة/.test(h),
  stake_change: (h) => /حصته في|حصتها في|يخفض حصته|يرفع حصته|تخفض حصتها|ترفع حصتها|مساهم يخفض|مساهم يرفع/.test(h),
  treasury_shares: (h) => /أسهم خزينة|اسهم خزينة|خزينة/.test(h),
  ipo: (h) => /طرح/.test(h),
};
const rows = fs.readFileSync('_mb_archive_cache.jsonl', 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
const tagMap = {}; const tagCount = {}; const taggedSym = {}; const ex = {};
for (const r of rows) {
  const tags = Object.keys(TAGS).filter((t) => TAGS[t](r.title));
  tagMap[r.id] = { tags, sym: symMap[r.id] || null };
  for (const t of tags) {
    tagCount[t] = (tagCount[t] || 0) + 1;
    if (symMap[r.id]) { taggedSym[t] = (taggedSym[t] || 0) + 1; if (!ex[t]) ex[t] = symMap[r.id] + ' | ' + esc(r.title.slice(0, 85)); }
  }
}
const untagged = rows.filter((r) => tagMap[r.id].tags.length === 0).length;
const untaggedSym = rows.filter((r) => tagMap[r.id].tags.length === 0 && symMap[r.id]).length;
const out = [
  'TAG COUNTS (of ' + rows.length + '): ' + JSON.stringify(tagCount),
  'tagged with symbol (testable): ' + JSON.stringify(taggedSym),
  'untagged: ' + untagged + ' (' + (100 * untagged / rows.length).toFixed(1) + '%) | untagged-but-matched-to-symbol: ' + untaggedSym,
  '--- examples (first symbol-matched per tag) ---',
  ...Object.keys(TAGS).map((t) => t + ': ' + (ex[t] ? ex[t] : '(none with symbol)')),
];
fs.writeFileSync('_mb_tags.json', JSON.stringify({ tagMap, tagCount }), 'utf8');
fs.writeFileSync('_mb_stage3b.out', out.join('\n') + '\n', 'utf8');
console.log('STAGE3b: ' + JSON.stringify(tagCount) + ' | untagged=' + untagged);