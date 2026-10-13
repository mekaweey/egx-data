/**
 * SUPERVISOR THOUGHT WRITER — called by the heartbeat (or manually) to write
 * the supervisor's "thoughts" into supervisor_feed.jsonl in Arabic.
 * v1: deterministic structured thoughts from the supervisor state.
 * (The AI heartbeat session enriches these with its own analysis.)
 */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const statePath = path.join(ROOT, "supervisor_state.json");

const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
const now = new Date().toISOString();

function entry(kind, text) {
  return JSON.stringify({ time: now, kind, text });
}
const lines = [];

// 1. thought: what I'm seeing right now
const winAr = {
  "pre-open": "مرحلة ما قبل الافتتاح — بجهز تقييم جاهزية كل الأنظمة قبل فتح السوق",
  "entry": "نافذة الدخول — براقب ظهور الترشيحات وتأكيد الفلاتر الستة على كل مرشح",
  "session": "الجلسة جارية — براقب تدفق البيانات اللحظية وسلامة المراكز المفتوحة",
  "eod": "نافذة الخروج — بتابع تنفيذ الخروج للصفقات اللي كملت 4 أيام",
  "off": "خارج جلسة التداول — بعمل فحص دوري للنظام",
};
lines.push(entry("thought", winAr[state.window] || winAr["off"]));

// 2. what I see (from checks)
for (const c of state.critical || []) {
  lines.push(entry("alert", c));
}
for (const w of state.warns || []) {
  lines.push(entry("alert", "تنبيه: " + w));
}

// 3. action/plan based on window + state
if (state.level === "CRITICAL") {
  lines.push(entry("action", "في مشكلة حرجة — هستمر في المتابعة المكثفة كل دورة وأبلغ المستخدم فورًا حتى تتحل."));
  lines.push(entry("plan", "الخطة: تشخيص السبب الجذري في الدورة الجاية، محاولة إصلاح تشغيلي آمن، وإبلاغ المستخدم لو محتاج تدخل يدوي."));
} else if (state.level === "WARN") {
  lines.push(entry("plan", "الخطة: مراقبة التحذيرات ده في الدورات الجاية — لو تطورت لمشكلة حرجة هيتعامل معاها فورًا."));
} else {
  lines.push(entry("plan", "الخطة: كل حاجة سليمة — استمرار المراقبة المنتظمة حتى نهاية الجلسة."));
}

const feedPath = path.join(ROOT, "supervisor_feed.jsonl");
fs.appendFileSync(feedPath, lines.join("\n") + "\n");
console.log(`wrote ${lines.length} thought entries`);
