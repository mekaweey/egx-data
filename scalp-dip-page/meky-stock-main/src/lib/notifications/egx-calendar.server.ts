/**
 * EGX trading calendar helpers — البورصة المصرية تعمل من الأحد للخميس فقط.
 * الجمعة والسبت إجازة أسبوعية. (إجازات رسمية إضافية يمكن إضافتها هنا لاحقًا.)
 */

const EGX_HOLIDAYS = new Set<string>([
  // YYYY-MM-DD — أضِف هنا الإجازات الرسمية لو احتجنا دقة أكثر.
]);

function toCairoDateKey(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(d);
  return parts; // YYYY-MM-DD
}

function cairoDayOfWeek(d: Date): number {
  // 0=Sun ... 6=Sat (Cairo wall-clock)
  const wd = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo", weekday: "short",
  }).format(d);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd);
}

export function isEgxTradingDay(d: Date): boolean {
  const dow = cairoDayOfWeek(d);
  if (dow === 5 || dow === 6) return false; // Fri/Sat
  if (EGX_HOLIDAYS.has(toCairoDateKey(d))) return false;
  return true;
}

/** يرجع تاريخ أقرب يوم تداول بعد التاريخ المعطى (أو نفسه لو tradingNow=true وكان يوم تداول). */
export function nextEgxTradingDay(from: Date = new Date(), includeToday = false): Date {
  const d = new Date(from);
  if (!includeToday) d.setUTCDate(d.getUTCDate() + 1);
  for (let i = 0; i < 10; i++) {
    if (isEgxTradingDay(d)) return new Date(d);
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return d;
}

/** يضيف N يوم تداول (يتخطى الجمعة/السبت والإجازات). */
export function addEgxTradingDays(from: Date, n: number): Date {
  const d = new Date(from);
  let added = 0;
  while (added < n) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (isEgxTradingDay(d)) added++;
  }
  return d;
}

/** يحسب عدد أيام التداول بين تاريخين (inclusive للبداية، exclusive للنهاية). */
export function countEgxTradingDays(from: Date, to: Date): number {
  if (to <= from) return 0;
  let count = 0;
  const d = new Date(from);
  while (d < to) {
    if (isEgxTradingDay(d)) count++;
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return count;
}

export function toDateOnly(d: Date): string {
  return toCairoDateKey(d);
}

const AR_DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const AR_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export function formatCairoDateAr(d: Date): string {
  const dow = cairoDayOfWeek(d);
  const key = toCairoDateKey(d); // YYYY-MM-DD
  const [, mm, dd] = key.split("-").map(Number);
  return `${AR_DAYS[dow]} ${dd} ${AR_MONTHS[(mm ?? 1) - 1]}`;
}

/** وصف بشري للأفق + التأثير على أي يوم تداول. */
export function describeImpactWindowAr(publishedAt: Date, impactStart: Date, horizon: "short" | "medium" | "long"): string {
  const horizonAr = horizon === "short" ? "قصير المدى" : horizon === "medium" ? "متوسط المدى" : "طويل المدى";
  const startDow = cairoDayOfWeek(impactStart);
  const isWeekend = startDow === 5 || startDow === 6;
  const note = isWeekend ? " (البورصة مقفولة — هيتأجل لأول يوم تداول)" : "";
  return `📅 نُشر: ${formatCairoDateAr(publishedAt)} · أفق ${horizonAr} · التأثير المتوقع: ${formatCairoDateAr(impactStart)}${note}`;
}