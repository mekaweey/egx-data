import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { logMessagesManual } from "@/lib/session-log/log-manual.functions";

export const Route = createFileRoute("/session-log")({
  ssr: false,
  head: () => ({ meta: [{ title: "Session Log — سجل الجلسة" }] }),
  component: SessionLogPage,
});

type Tab = "mission" | "health" | "messages" | "edits" | "reads";

type MsgRow = { id: string; role: string; content: string; turn_id: string | null; created_at: string };
type EditRow = { id: string; turn_id: string | null; summary: string; files_changed: string[]; migrations: string[]; version: string | null; extra: unknown; created_at: string };
type ReadRow = { id: string; turn_id: string | null; file_path: string; purpose: string | null; key_findings: string | null; created_at: string };
type AuditRow = { id: string; turn_id: string | null; client_batch_id: string | null; source: string; items_total: number; messages_count: number; edits_count: number; reads_count: number; duplicate_count: number; ok: boolean; error_stage: string | null; error_message: string | null; created_at: string };

const PAGE_SIZE = 80;
const PINNED_MISSION_TURN_ID = "2026-07-09-pre-buy-l2-gate-locked";
const PINNED_MISSION_FALLBACK = `🎯 المهمة الوحيدة (محفوظة حفظ دائم — ممنوع تغييرها أو استبدالها)

نص المستخدم الحرفي:
عايز حل يخلينا نبيع السهم فعلاً في كل المرات أو على الأقل معظم المرات.
لازم نبيع الصفقة لحظياً بعد العمولة وتحقيق الهدف، ولازم يكون في طلب كافي من ناس تانية على السهم عند سعر البيع المطلوب.
رأس المال المحدد: 20,000 جنيه.
ممنوع طلب أو انتظار أي تجميع بيانات جديد.

القاعدة الثابتة:
- ممنوع أي مهمة تانية تدخل هنا.
- ممنوع اقتراح أي حل مبني على "نجمع بيانات زيادة".
- ممنوع الشراء الأعمى: لازم فلتر سيولة قبل الشراء.
- كل رد لازم يكون عن هذه المهمة فقط.
- الهدف العملي المقبول: البيع في كل المرات أو معظمها، حتى لو عدد الصفقات قل جداً.

الحل النهائي الآن:
- رأس المال لكل صفقة = 20,000 جنيه.
- سعر البيع = السعر الآمن الذي يغطي عمولة الشراء + عمولة البيع + 0.5% صافي ربح.
- لا شراء إلا لو فلتر L2 قبل الشراء وافق.
- الفلتر يعتمد على البيانات الموجودة فقط: تاريخ سيولة السهم عند سعر البيع الآمن + عمق دفتر أوامر حالي + spread مقبول.
- بعد تأكيد الشراء، يتم تجهيز أمر بيع limit فوراً عند سعر الهدف الآمن بدل انتظار لمس الهدف لاحقاً.

نتيجة الاختبارات الموجودة:
- عدد الصفقات هيقل جداً.
- الصفقات المرفوضة أفضل نسيبها؛ لأنها غير مثبتة السيولة.
- أقرب سهم مثبت بقوة في البيانات: GIHD، ومعاه حالات أقل قوة زي AMES/IEEC/EDFM حسب السيولة الفعلية وقت الإشارة.`;

function HealthIndicator({ messages }: { messages: { created_at: string }[] }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  if (messages.length === 0) {
    return <div className="mt-1 text-xs font-medium text-red-600">⚠️ مفيش أي رسايل مسجلة</div>;
  }
  const last = new Date(messages[0].created_at).getTime();
  const mins = Math.floor((now - last) / 60_000);
  const stale = mins >= 5;
  return (
    <div className={`mt-1 text-xs font-medium ${stale ? "text-red-600" : "text-emerald-600"}`}>
      {stale ? "⚠️" : "✅"} آخر تسجيل: {mins <= 0 ? "دلوقتي" : `من ${mins} دقيقة`}
      {stale && " — التسجيل متأخر، ذكّرني"}
    </div>
  );
}

function CoverageIndicator({ messages }: { messages: MsgRow[] }) {
  const turns = useMemo(() => {
    const byTurn = new Map<string, { user: boolean; assistant: boolean; latest: number }>();
    for (const message of messages) {
      const key = message.turn_id || message.id;
      const item = byTurn.get(key) ?? { user: false, assistant: false, latest: 0 };
      if (message.role === "user") item.user = true;
      if (message.role === "assistant") item.assistant = true;
      item.latest = Math.max(item.latest, new Date(message.created_at).getTime());
      byTurn.set(key, item);
    }
    return [...byTurn.values()].sort((a, b) => b.latest - a.latest).slice(0, 20);
  }, [messages]);

  if (!turns.length) return null;
  const missing = turns.filter((turn) => !turn.user || !turn.assistant).length;
  return (
    <div className={`mt-1 text-xs font-medium ${missing ? "text-red-600" : "text-emerald-600"}`}>
      {missing ? "⚠️" : "✅"} آخر 20 تبادل: {missing ? `${missing} ناقص` : "كامل"}
    </div>
  );
}

const safetyLayers = [
  "Endpoint محمي بالتوكن، مش أي متصفح يكتب في السجل.",
  "الكتابة المباشرة لجداول السجل مقفولة؛ التسجيل يمر من السيرفر فقط.",
  "كل عنصر له content_hash يمنع تكرار نفس الرسالة/القراءة/التعديل.",
  "كل batch لها client_batch_id وsource عشان نعرف مصدر كل محاولة.",
  "جدول audit يسجل كل محاولة ingest نجحت أو فشلت.",
  "الإدخال مقسوم رسائل/تعديلات/قراءات؛ فشل نوع لا يخفي مكان الخطأ.",
  "إعادة إرسال نفس batch آمنة: القديم يتحسب duplicate مش يتكرر.",
  "Realtime insert events تسرّع ظهور الجديد في الصفحة.",
  "Polling كل 10 ثواني + focus + visibility يرجّع الصفحة لو realtime فاته حدث.",
  "تبويب الصحة يكشف آخر التسجيلات، الفجوات، وآخر أخطاء بدل الاعتماد على الإحساس.",
];

function buildTurnHealth(messages: MsgRow[]) {
  const byTurn = new Map<string, { turnId: string; user: boolean; assistant: boolean; latest: number; latestText: string }>();
  for (const message of messages) {
    const turnId = message.turn_id || message.id;
    const item = byTurn.get(turnId) ?? { turnId, user: false, assistant: false, latest: 0, latestText: "" };
    if (message.role === "user") item.user = true;
    if (message.role === "assistant") item.assistant = true;
    const ts = new Date(message.created_at).getTime();
    if (ts >= item.latest) {
      item.latest = ts;
      item.latestText = message.content.slice(0, 180);
    }
    byTurn.set(turnId, item);
  }
  return [...byTurn.values()].sort((a, b) => b.latest - a.latest);
}

type Block = { id: string; role: "user" | "assistant"; content: string };

function newBlock(role: "user" | "assistant"): Block {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, role, content: "" };
}

function SmartRefreshDialog({ onClose }: { onClose: () => void }) {
  const [blocks, setBlocks] = useState<Block[]>([newBlock("user"), newBlock("assistant")]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [turnId, setTurnId] = useState<string>(() => new Date().toISOString());
  const logFn = useServerFn(logMessagesManual);

  const setContent = (id: string, content: string) =>
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, content } : b)));
  const setRole = (id: string, role: "user" | "assistant") =>
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, role } : b)));
  const removeBlock = (id: string) => setBlocks((prev) => prev.filter((b) => b.id !== id));
  const addBlock = (role: "user" | "assistant") => setBlocks((prev) => [...prev, newBlock(role)]);

  const submit = async () => {
    setError(null); setResult(null); setBusy(true);
    try {
      const messages = blocks
        .filter((b) => b.content.trim().length > 0)
        .map((b) => ({ role: b.role, content: b.content.trim(), turn_id: turnId }));
      if (!messages.length) throw new Error("مافيش رسائل مليانة");
      const res = await logFn({ data: { messages, source: "manual-refresh-button" } });
      setResult(`تم: ${res.inserted} جديدة، ${res.duplicates} مكررة (متسجّلة قبل كده)`);
      if (res.inserted > 0) {
        setBlocks([newBlock("user"), newBlock("assistant")]);
        setTurnId(new Date().toISOString());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto p-4" dir="rtl">
      <div className="bg-background rounded-lg border shadow-lg max-w-3xl w-full my-8 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">✨ تحديث ذكي — سجّل الشات في DB</h2>
          <button onClick={onClose} className="text-2xl leading-none px-2" aria-label="إغلاق">×</button>
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <div>• الصق كل رسالة في كتلة منفصلة، واختار الدور (انت / المساعد).</div>
          <div>• لو رسالة موجودة قبل كده في DB، هتتحسب مكررة تلقائي (مافيش تكرار).</div>
          <div>• كل الكتل بتتسجل بنفس الـ turn_id عشان الصفحة تعتبرها تبادل واحد.</div>
        </div>
        <div className="text-xs">
          <label className="text-muted-foreground">turn_id: </label>
          <input value={turnId} onChange={(e) => setTurnId(e.target.value)}
            className="ml-1 px-2 py-1 border rounded bg-card text-xs w-96 font-mono" />
        </div>

        <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
          {blocks.map((b, idx) => (
            <div key={b.id} className={`rounded border p-2 ${b.role === "user" ? "bg-primary/5 border-primary/30" : "bg-card"}`}>
              <div className="flex items-center justify-between mb-1 gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">#{idx + 1}</span>
                  <select value={b.role} onChange={(e) => setRole(b.id, e.target.value as "user" | "assistant")}
                    className="px-2 py-1 border rounded bg-background text-xs">
                    <option value="user">👤 انت (user)</option>
                    <option value="assistant">🤖 المساعد (assistant)</option>
                  </select>
                  <span className="text-muted-foreground">{b.content.length} حرف</span>
                </div>
                {blocks.length > 1 && (
                  <button onClick={() => removeBlock(b.id)} className="text-xs text-red-600 hover:underline">حذف</button>
                )}
              </div>
              <textarea value={b.content} onChange={(e) => setContent(b.id, e.target.value)}
                placeholder={b.role === "user" ? "الصق رسالتك هنا..." : "الصق رد المساعد هنا..."}
                className="w-full min-h-[100px] px-2 py-2 border rounded bg-background text-sm font-mono leading-relaxed"
                dir="auto" />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => addBlock("user")} className="px-3 py-1.5 rounded border text-xs">+ كتلة انت</button>
          <button onClick={() => addBlock("assistant")} className="px-3 py-1.5 rounded border text-xs">+ كتلة المساعد</button>
        </div>

        {error && <div className="text-sm text-red-600 border border-red-600/40 rounded p-2">⚠️ {error}</div>}
        {result && <div className="text-sm text-emerald-600 border border-emerald-600/40 rounded p-2">✅ {result}</div>}

        <div className="flex justify-end gap-2 pt-2 border-t">
          <button onClick={onClose} className="px-4 py-2 rounded border text-sm" disabled={busy}>إلغاء</button>
          <button onClick={() => void submit()} disabled={busy}
            className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50">
            {busy ? "جاري التسجيل..." : "سجّل الآن"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SessionLogPage() {
  const [tab, setTab] = useState<Tab>("mission");
  const [q, setQ] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [messages, setMessages] = useState<MsgRow[]>([]);
  const [pinnedMission, setPinnedMission] = useState<MsgRow | null>(null);
  const [edits, setEdits] = useState<EditRow[]>([]);
  const [reads, setReads] = useState<ReadRow[]>([]);
  const [audits, setAudits] = useState<AuditRow[]>([]);
  const [counts, setCounts] = useState({ messages: 0, edits: 0, reads: 0, audits: 0 });
  const [loading, setLoading] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [smartOpen, setSmartOpen] = useState(false);

  // Load only the active tab's rows (capped) + cheap counts for the tab labels.
  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      if (tab === "messages" || tab === "mission") {
        const [{ data, error }, { data: missionData, error: missionError }] = await Promise.all([
          supabase.from("session_messages")
            .select("id,role,content,turn_id,created_at")
            .order("created_at", { ascending: false }).limit(300),
          supabase.from("session_messages")
            .select("id,role,content,turn_id,created_at")
            .eq("turn_id", PINNED_MISSION_TURN_ID)
            .eq("role", "user")
            .order("created_at", { ascending: true }).limit(1),
        ]);
        if (error) throw error;
        if (missionError) throw missionError;
        if (data) setMessages(data as MsgRow[]);
        setPinnedMission((missionData?.[0] as MsgRow | undefined) ?? null);
      } else if (tab === "health") {
        const [{ data: latestMessages, error: latestMessagesError }, { data: auditData, error: auditError }] = await Promise.all([
          supabase.from("session_messages").select("id,role,content,turn_id,created_at").order("created_at", { ascending: false }).limit(500),
          supabase.from("session_ingest_audit")
            .select("id,turn_id,client_batch_id,source,items_total,messages_count,edits_count,reads_count,duplicate_count,ok,error_stage,error_message,created_at")
            .order("created_at", { ascending: false }).limit(200),
        ]);
        if (latestMessagesError) throw latestMessagesError;
        if (auditError) throw auditError;
        if (latestMessages) setMessages(latestMessages as MsgRow[]);
        if (auditData) setAudits(auditData as AuditRow[]);
      } else if (tab === "edits") {
        const [{ data: latestMessages, error: latestMessagesError }, { data, error }] = await Promise.all([
          supabase.from("session_messages").select("id,role,content,turn_id,created_at").order("created_at", { ascending: false }).limit(80),
          supabase.from("session_edits")
          .select("id,turn_id,summary,files_changed,migrations,version,extra,created_at")
            .order("created_at", { ascending: false }).limit(300),
        ]);
        if (latestMessagesError) throw latestMessagesError;
        if (error) throw error;
        if (latestMessages) setMessages(latestMessages as MsgRow[]);
        if (data) setEdits(data as EditRow[]);
      } else {
        const [{ data: latestMessages, error: latestMessagesError }, { data, error }] = await Promise.all([
          supabase.from("session_messages").select("id,role,content,turn_id,created_at").order("created_at", { ascending: false }).limit(80),
          supabase.from("session_reads")
          .select("id,turn_id,file_path,purpose,key_findings,created_at")
            .order("created_at", { ascending: false }).limit(300),
        ]);
        if (latestMessagesError) throw latestMessagesError;
        if (error) throw error;
        if (latestMessages) setMessages(latestMessages as MsgRow[]);
        if (data) setReads(data as ReadRow[]);
      }
      const [cm, ce, cr, ca] = await Promise.all([
        supabase.from("session_messages").select("*", { count: "exact", head: true }),
        supabase.from("session_edits").select("*", { count: "exact", head: true }),
        supabase.from("session_reads").select("*", { count: "exact", head: true }),
        supabase.from("session_ingest_audit").select("*", { count: "exact", head: true }),
      ]);
      if (cm.error) throw cm.error;
      if (ce.error) throw ce.error;
      if (cr.error) throw cr.error;
      if (ca.error) throw ca.error;
      setCounts({ messages: cm.count ?? 0, edits: ce.count ?? 0, reads: cr.count ?? 0, audits: ca.count ?? 0 });
      setLastLoadedAt(Date.now());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "فشل تحميل السجل");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  const scheduleReload = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { void load(); }, 1500);
  }, [load]);

  useEffect(() => {
    void load();
    const ch = supabase
      .channel("session-log")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "session_messages" }, scheduleReload)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "session_edits" }, scheduleReload)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "session_reads" }, scheduleReload)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [load, scheduleReload]);

  useEffect(() => {
    const interval = setInterval(() => { void load(); }, 10_000);
    const reloadOnFocus = () => { void load(); };
    const reloadOnVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    window.addEventListener("focus", reloadOnFocus);
    document.addEventListener("visibilitychange", reloadOnVisible);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", reloadOnFocus);
      document.removeEventListener("visibilitychange", reloadOnVisible);
    };
  }, [load]);

  useEffect(() => { setVisible(PAGE_SIZE); }, [tab, q]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (tab === "messages") {
      const src = ql ? messages.filter((x) => x.content.toLowerCase().includes(ql) || (x.turn_id ?? "").toLowerCase().includes(ql)) : messages;
      return { list: src as unknown as MsgRow[], total: src.length };
    }
    if (tab === "edits") {
      const src = ql ? edits.filter((x) => x.summary.toLowerCase().includes(ql) || x.files_changed.some((f) => f.toLowerCase().includes(ql))) : edits;
      return { list: src as unknown as EditRow[], total: src.length };
    }
    if (tab === "health") {
      const src = ql ? audits.filter((x) => (x.turn_id ?? "").toLowerCase().includes(ql) || (x.client_batch_id ?? "").toLowerCase().includes(ql) || (x.error_message ?? "").toLowerCase().includes(ql)) : audits;
      return { list: src as unknown as AuditRow[], total: src.length };
    }
    const src = ql ? reads.filter((x) => x.file_path.toLowerCase().includes(ql) || (x.key_findings ?? "").toLowerCase().includes(ql)) : reads;
    return { list: src as unknown as ReadRow[], total: src.length };
  }, [tab, q, messages, edits, reads, audits]);

  const turnHealth = useMemo(() => buildTurnHealth(messages), [messages]);
  const missingTurns = turnHealth.filter((turn) => !turn.user || !turn.assistant).slice(0, 20);
  const failedAudits = audits.filter((audit) => !audit.ok).slice(0, 20);

  return (
    <div className="min-h-screen bg-background text-foreground p-6" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">📜 Session Log — سجل الجلسة</h1>
            <p className="text-sm text-muted-foreground">تسجيل تلقائي لكل الرسائل والتعديلات والملفات المقروءة.</p>
            <HealthIndicator messages={messages} />
            <CoverageIndicator messages={messages} />
            {lastLoadedAt && <div className="mt-1 text-xs text-muted-foreground">آخر فحص للصفحة: {new Date(lastLoadedAt).toLocaleTimeString("ar-EG")}</div>}
            {loadError && <div className="mt-1 text-xs font-medium text-red-600">⚠️ فشل تحديث الصفحة: {loadError}</div>}
          </div>
          <div className="flex items-center gap-2">
            <input
              value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث..."
              className="px-3 py-2 rounded border bg-card text-sm w-64"
            />
            <button onClick={() => void load()} className="px-3 py-2 rounded bg-primary text-primary-foreground text-sm">
              {loading ? "..." : "تحديث"}
            </button>
            <button onClick={() => setSmartOpen(true)} className="px-3 py-2 rounded border-2 border-primary text-primary text-sm font-bold">
              ✨ تحديث ذكي
            </button>
          </div>
        </div>

        {smartOpen && <SmartRefreshDialog onClose={() => { setSmartOpen(false); void load(); }} />}

        <div className="flex gap-2 border-b">
          {(["mission","health","messages","edits","reads"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab===t?"border-primary text-primary":"border-transparent text-muted-foreground"}`}>
              {t === "mission" ? "🎯 المهمة" : t === "health" ? `🛡️ صحة التسجيل (${counts.audits})` : t === "messages" ? `💬 رسايل (${counts.messages})` : t === "edits" ? `🔧 تعديلات (${counts.edits})` : `📚 ملفات مقروءة (${counts.reads})`}
            </button>
          ))}
        </div>

        {tab === "mission" && (() => {
          const mission = pinnedMission ?? {
            id: "pinned-mission-fallback",
            role: "user",
            content: PINNED_MISSION_FALLBACK,
            turn_id: PINNED_MISSION_TURN_ID,
            created_at: "2026-07-09T14:09:43.236Z",
          };
          return (
            <div className="rounded-lg p-4 border-2 border-primary bg-primary/5">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span className="font-bold text-primary">🎯 المهمة القصوى — مثبتة ولا تتغير بآخر رسالة</span>
                <span>{new Date(mission.created_at).toLocaleString("ar-EG")}</span>
              </div>
              <div className="whitespace-pre-wrap text-base leading-relaxed font-medium">{mission.content}</div>
              <div className="mt-2 text-xs text-muted-foreground">turn: {mission.turn_id}</div>
            </div>
          );
        })()}

        {tab === "health" && (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-lg border bg-card p-3">
                <div className="text-xs text-muted-foreground">آخر batches</div>
                <div className="text-2xl font-bold">{audits.length}</div>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <div className="text-xs text-muted-foreground">فشل ingest</div>
                <div className={`text-2xl font-bold ${failedAudits.length ? "text-red-600" : "text-emerald-600"}`}>{failedAudits.length}</div>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <div className="text-xs text-muted-foreground">Turns ناقصة</div>
                <div className={`text-2xl font-bold ${missingTurns.length ? "text-red-600" : "text-emerald-600"}`}>{missingTurns.length}</div>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <div className="text-xs text-muted-foreground">آخر 20 تبادل</div>
                <div className={`text-2xl font-bold ${missingTurns.length ? "text-red-600" : "text-emerald-600"}`}>{missingTurns.length ? "ناقص" : "كامل"}</div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="font-bold mb-3">🛡️ 10 طبقات حماية شغالة مع بعض</div>
              <div className="grid gap-2 md:grid-cols-2">
                {safetyLayers.map((layer, index) => (
                  <div key={layer} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="font-bold text-primary">{index + 1}.</span>
                    <span>{layer}</span>
                  </div>
                ))}
              </div>
            </div>

            {missingTurns.length > 0 && (
              <div className="rounded-lg border border-red-600/40 bg-card p-4">
                <div className="font-bold text-red-600 mb-2">⚠️ Turns محتاجة catch-up</div>
                <div className="space-y-2">
                  {missingTurns.map((turn) => (
                    <div key={turn.turnId} className="rounded border p-2 text-xs">
                      <div className="flex justify-between gap-2 text-muted-foreground">
                        <code>{turn.turnId}</code>
                        <span>{new Date(turn.latest).toLocaleString("ar-EG")}</span>
                      </div>
                      <div className="mt-1">user: {turn.user ? "✅" : "❌"} assistant: {turn.assistant ? "✅" : "❌"}</div>
                      <div className="mt-1 text-muted-foreground whitespace-pre-wrap">{turn.latestText}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              {(filtered.list as AuditRow[]).slice(0, visible).map((audit) => (
                <div key={audit.id} className={`rounded-lg p-3 border ${audit.ok ? "bg-card" : "border-red-600/40 bg-card"}`}>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span className={audit.ok ? "text-emerald-600 font-bold" : "text-red-600 font-bold"}>{audit.ok ? "✅ نجح" : "⚠️ فشل"}</span>
                    <span>{new Date(audit.created_at).toLocaleString("ar-EG")}</span>
                  </div>
                  <div className="text-sm">items: {audit.items_total} — رسايل: {audit.messages_count} — تعديلات: {audit.edits_count} — قراءات: {audit.reads_count} — مكرر: {audit.duplicate_count}</div>
                  <div className="mt-1 text-xs text-muted-foreground">source: {audit.source}{audit.client_batch_id ? ` — batch: ${audit.client_batch_id}` : ""}{audit.turn_id ? ` — turn: ${audit.turn_id}` : ""}</div>
                  {audit.error_message && <div className="mt-1 text-xs text-red-600">{audit.error_stage}: {audit.error_message}</div>}
                </div>
              ))}
              {filtered.total === 0 && <div className="text-center text-muted-foreground py-8">لسه مفيش audit batches.</div>}
            </div>
          </div>
        )}

        {tab === "messages" && (
          <div className="space-y-2">
            {(filtered.list as MsgRow[]).slice(0, visible).map((m) => (
              <div key={m.id} className={`rounded-lg p-3 border ${m.role === "user" ? "bg-primary/5 border-primary/20" : "bg-card"}`}>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span className="font-bold">{m.role === "user" ? "👤 المستخدم" : "🤖 المساعد"}</span>
                  <span>{new Date(m.created_at).toLocaleString("ar-EG")}</span>
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</div>
              </div>
            ))}
            {filtered.total === 0 && <div className="text-center text-muted-foreground py-8">مفيش رسايل مسجلة.</div>}
          </div>
        )}

        {tab === "edits" && (
          <div className="space-y-2">
            {(filtered.list as EditRow[]).slice(0, visible).map((e) => (
              <div key={e.id} className="rounded-lg p-3 border bg-card">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{e.version ? `v${e.version}` : ""}</span>
                  <span>{new Date(e.created_at).toLocaleString("ar-EG")}</span>
                </div>
                <div className="font-medium mb-2">{e.summary}</div>
                {e.files_changed.length > 0 && (
                  <div className="text-xs text-muted-foreground mb-1">
                    <b>ملفات:</b> {e.files_changed.join(", ")}
                  </div>
                )}
                {e.migrations.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <b>مايجريشن:</b> {e.migrations.map((s) => s.slice(0, 80)).join(" | ")}
                  </div>
                )}
              </div>
            ))}
            {filtered.total === 0 && <div className="text-center text-muted-foreground py-8">مفيش تعديلات مسجلة.</div>}
          </div>
        )}

        {tab === "reads" && (
          <div className="space-y-2">
            {(filtered.list as ReadRow[]).slice(0, visible).map((r) => (
              <div key={r.id} className="rounded-lg p-3 border bg-card">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <code className="font-mono">{r.file_path}</code>
                  <span>{new Date(r.created_at).toLocaleString("ar-EG")}</span>
                </div>
                {r.purpose && <div className="text-xs mb-1"><b>الغرض:</b> {r.purpose}</div>}
                {r.key_findings && <div className="text-xs text-muted-foreground whitespace-pre-wrap">{r.key_findings}</div>}
              </div>
            ))}
            {filtered.total === 0 && <div className="text-center text-muted-foreground py-8">مفيش ملفات مقروءة مسجلة.</div>}
          </div>
        )}

        {filtered.total > visible && (
          <div className="flex justify-center py-4">
            <button onClick={() => setVisible((v) => v + PAGE_SIZE)}
              className="px-4 py-2 rounded border bg-card text-sm hover:bg-accent">
              عرض المزيد ({filtered.total - visible} متبقي)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}