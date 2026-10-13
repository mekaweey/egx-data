/**
 * EGX market hours helpers — pure client/server safe utility (no I/O).
 * EGX: Sunday–Thursday, 10:00–14:30 Cairo time (UTC+2, no DST).
 */

export type MarketStatus = {
  isOpen: boolean;
  cairoTime: Date; // a Date whose UTC components equal Cairo wall-clock
  label: string; // e.g. "السوق مفتوح" / "مغلق — يفتح بعد ٣٢ دقيقة"
  hhmmss: string; // "HH:MM:SS" Cairo time
  dateLabel: string; // "الأحد ٤ يونيو"
};

const AR_DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const AR_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export function getCairoNow(now: Date = new Date()): Date {
  // Use Intl to get the correct Cairo wall-clock time, including DST.
  // Egypt observes summer time (UTC+3) from late April to late October.
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  // Build a Date whose UTC components equal Cairo wall-clock components,
  // so the rest of the helpers can read them via getUTC*.
  return new Date(Date.UTC(
    get("year"), get("month") - 1, get("day"),
    get("hour") % 24, get("minute"), get("second"),
  ));
}

export function getMarketStatus(now: Date = new Date()): MarketStatus {
  const c = getCairoNow(now);
  const day = c.getUTCDay(); // 0=Sun ... 6=Sat
  const h = c.getUTCHours();
  const m = c.getUTCMinutes();
  const s = c.getUTCSeconds();
  const minutes = h * 60 + m;

  const isWeekday = day >= 0 && day <= 4; // Sun..Thu
  const OPEN = 10 * 60; // 10:00 — EGX official open
  const CLOSE = 14 * 60 + 30; // 14:30 — EGX official close

  let isOpen = false;
  let label = "";
  if (isWeekday && minutes >= OPEN && minutes < CLOSE) {
    isOpen = true;
    const left = CLOSE - minutes;
    label = left > 60
      ? `السوق مفتوح · باقي ${Math.floor(left / 60)}س ${left % 60}د`
      : `السوق مفتوح · باقي ${left} دقيقة`;
  } else if (isWeekday && minutes < OPEN) {
    const left = OPEN - minutes;
    label = `مغلق · يفتح بعد ${Math.floor(left / 60)}س ${left % 60}د`;
  } else {
    label = "السوق مغلق";
  }

  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    isOpen,
    cairoTime: c,
    label,
    hhmmss: `${pad(h)}:${pad(m)}:${pad(s)}`,
    dateLabel: `${AR_DAYS[day]} ${c.getUTCDate()} ${AR_MONTHS[c.getUTCMonth()]}`,
  };
}