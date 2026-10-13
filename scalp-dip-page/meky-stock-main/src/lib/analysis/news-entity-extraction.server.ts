// NER-lite for Arabic financial news
export type Entity = { text: string; type: 'org' | 'gov' | 'event' | 'amount' | 'date'; weight: number };

const GOV_KEYWORDS = ['وزارة المالية', 'البنك المركزي', 'الحكومة', 'مجلس الوزراء', 'البورصة', 'هيئة الرقابة'];
const EVENT_KEYWORDS = [
  { kw: 'استحواذ', weight: 8, bullish: true },
  { kw: 'اندماج', weight: 7, bullish: true },
  { kw: 'أرباح قياسية', weight: 9, bullish: true },
  { kw: 'توزيعات', weight: 6, bullish: true },
  { kw: 'خسائر', weight: -7, bullish: false },
  { kw: 'تراجع الأرباح', weight: -6, bullish: false },
  { kw: 'إفلاس', weight: -10, bullish: false },
  { kw: 'تحقيق', weight: -5, bullish: false },
  { kw: 'صفقة', weight: 5, bullish: true },
  { kw: 'تخفيض', weight: -4, bullish: false },
  { kw: 'رفع الفائدة', weight: -3, bullish: false },
  { kw: 'خفض الفائدة', weight: 4, bullish: true }
];

export type NewsAnalysis = {
  entities: Entity[];
  hasGovImpact: boolean;
  eventSignal: number; // -1..1
  confidenceDelta: number;
};

export function analyzeNewsText(text: string): NewsAnalysis {
  const entities: Entity[] = [];
  let eventSignal = 0;
  let signals = 0;
  let hasGovImpact = false;
  for (const gov of GOV_KEYWORDS) {
    if (text.includes(gov)) {
      entities.push({ text: gov, type: 'gov', weight: 1 });
      hasGovImpact = true;
    }
  }
  for (const ev of EVENT_KEYWORDS) {
    if (text.includes(ev.kw)) {
      entities.push({ text: ev.kw, type: 'event', weight: Math.abs(ev.weight) });
      eventSignal += ev.bullish ? 1 : -1;
      signals++;
    }
  }
  const normalizedSignal = signals > 0 ? eventSignal / signals : 0;
  const confidenceDelta = normalizedSignal * 6 + (hasGovImpact ? 2 : 0);
  return { entities, hasGovImpact, eventSignal: normalizedSignal, confidenceDelta };
}

export function aggregateNewsAnalyses(analyses: NewsAnalysis[]): { totalDelta: number; bullishCount: number; bearishCount: number } {
  let totalDelta = 0, bullish = 0, bearish = 0;
  for (const a of analyses) {
    totalDelta += a.confidenceDelta;
    if (a.confidenceDelta > 0) bullish++;
    else if (a.confidenceDelta < 0) bearish++;
  }
  return { totalDelta: Math.max(-15, Math.min(15, totalDelta)), bullishCount: bullish, bearishCount: bearish };
}
