import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useServerFn, c as createSsrRpc } from "./router-BYsPPCpA.mjs";
import { s as supabase } from "./client-DcfJRNR2.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
import "../_libs/mendable__firecrawl-js.mjs";
import "../_libs/sonner.mjs";
import "../_libs/seroval.mjs";
import { o as object, b as string, c as array, _ as _enum } from "../_libs/zod.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "async_hooks";
import "stream";
import "crypto";
import "../_libs/isbot.mjs";
import "./market-hours-CyHCW23Z.mjs";
import "./client.server-D5ro3rAQ.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "./telegram.server-D6g8flro.mjs";
import "./chat-fallback.server-HMcdWJQs.mjs";
import "node:fs";
import "node:path";
import "node:child_process";
import "./outcome-loop.server-BOECsdkT.mjs";
import "./auto-orchestrator.server-Cobs3ZBw.mjs";
import "./tier-k-intelligence.server-IqAM99dH.mjs";
import "./run-scan.server-C7KKLuW0.mjs";
import "./tradingview.server-ASbxwkih.mjs";
import "./levels.server-DPpGzyqT.mjs";
import "../_libs/technicalindicators.mjs";
import "./yahoo.server-Coiq-pQ8.mjs";
import "../_libs/ai.mjs";
import "../_libs/ai-sdk__gateway.mjs";
import "../_libs/ai-sdk__provider-utils.mjs";
import "../_libs/ai-sdk__provider.mjs";
import "../_libs/eventsource-parser.mjs";
import "../_libs/@vercel/oidc.mjs";
import "path";
import "fs";
import "os";
import "../_libs/opentelemetry__api.mjs";
import "./news.server-DBo8FnwV.mjs";
import "../_libs/ai-sdk__openai-compatible.mjs";
import "./pattern-memory.server-BKGG6vXj.mjs";
import "./tier-i-intelligence.server-Ddugl3s6.mjs";
import "./isotonic-calibration.server-CgJbsL0r.mjs";
import "node:zlib";
import "./self-calibration.server-DafiNwz-.mjs";
import "./engine.server-K_Mwkd4b.mjs";
import "./strategy.server-BM-ZfGqV.mjs";
import "./blocklist-BkSBV-pn.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:http";
import "node:stream/promises";
import "node:https";
import "node:http2";
import "../_libs/axios.mjs";
import "../_libs/form-data.mjs";
import "../_libs/combined-stream.mjs";
import "../_libs/delayed-stream.mjs";
import "http";
import "https";
import "url";
import "../_libs/mime-types.mjs";
import "../_libs/mime-db.mjs";
import "../_libs/asynckit.mjs";
import "../_libs/es-set-tostringtag.mjs";
import "../_libs/get-intrinsic.mjs";
import "../_libs/es-object-atoms.mjs";
import "../_libs/es-errors.mjs";
import "../_libs/math-intrinsics.mjs";
import "../_libs/gopd.mjs";
import "../_libs/es-define-property.mjs";
import "../_libs/has-symbols.mjs";
import "../_libs/get-proto.mjs";
import "../_libs/dunder-proto.mjs";
import "../_libs/call-bind-apply-helpers.mjs";
import "../_libs/function-bind.mjs";
import "../_libs/hasown.mjs";
import "../_libs/has-tostringtag.mjs";
import "../_libs/proxy-from-env.mjs";
import "http2";
import "../_libs/follow-redirects.mjs";
import "assert";
import "../_libs/debug.mjs";
import "../_libs/ms.mjs";
import "tty";
import "../_libs/supports-color.mjs";
import "../_libs/has-flag.mjs";
import "zlib";
import "events";
import "../_libs/zod-to-json-schema.mjs";
const MessageInput = object({
  role: _enum(["user", "assistant"]),
  content: string().min(1).max(2e5),
  turn_id: string().max(120).nullish()
});
const InputSchema = object({
  messages: array(MessageInput).min(1).max(200),
  source: string().max(80).default("manual-refresh-button")
});
const logMessagesManual = createServerFn({
  method: "POST"
}).inputValidator((input) => InputSchema.parse(input)).handler(createSsrRpc("3bdcdc1a58dd1636ab04563a53c79057646cf1bc6d351f5c3bf5e4c3c8dc32ff"));
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
function HealthIndicator({
  messages
}) {
  const [now, setNow] = reactExports.useState(() => Date.now());
  reactExports.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 3e4);
    return () => clearInterval(t);
  }, []);
  if (messages.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xs font-medium text-red-600", children: "⚠️ مفيش أي رسايل مسجلة" });
  }
  const last = new Date(messages[0].created_at).getTime();
  const mins = Math.floor((now - last) / 6e4);
  const stale = mins >= 5;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `mt-1 text-xs font-medium ${stale ? "text-red-600" : "text-emerald-600"}`, children: [
    stale ? "⚠️" : "✅",
    " آخر تسجيل: ",
    mins <= 0 ? "دلوقتي" : `من ${mins} دقيقة`,
    stale && " — التسجيل متأخر، ذكّرني"
  ] });
}
function CoverageIndicator({
  messages
}) {
  const turns = reactExports.useMemo(() => {
    const byTurn = /* @__PURE__ */ new Map();
    for (const message of messages) {
      const key = message.turn_id || message.id;
      const item = byTurn.get(key) ?? {
        user: false,
        assistant: false,
        latest: 0
      };
      if (message.role === "user") item.user = true;
      if (message.role === "assistant") item.assistant = true;
      item.latest = Math.max(item.latest, new Date(message.created_at).getTime());
      byTurn.set(key, item);
    }
    return [...byTurn.values()].sort((a, b) => b.latest - a.latest).slice(0, 20);
  }, [messages]);
  if (!turns.length) return null;
  const missing = turns.filter((turn) => !turn.user || !turn.assistant).length;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `mt-1 text-xs font-medium ${missing ? "text-red-600" : "text-emerald-600"}`, children: [
    missing ? "⚠️" : "✅",
    " آخر 20 تبادل: ",
    missing ? `${missing} ناقص` : "كامل"
  ] });
}
const safetyLayers = ["Endpoint محمي بالتوكن، مش أي متصفح يكتب في السجل.", "الكتابة المباشرة لجداول السجل مقفولة؛ التسجيل يمر من السيرفر فقط.", "كل عنصر له content_hash يمنع تكرار نفس الرسالة/القراءة/التعديل.", "كل batch لها client_batch_id وsource عشان نعرف مصدر كل محاولة.", "جدول audit يسجل كل محاولة ingest نجحت أو فشلت.", "الإدخال مقسوم رسائل/تعديلات/قراءات؛ فشل نوع لا يخفي مكان الخطأ.", "إعادة إرسال نفس batch آمنة: القديم يتحسب duplicate مش يتكرر.", "Realtime insert events تسرّع ظهور الجديد في الصفحة.", "Polling كل 10 ثواني + focus + visibility يرجّع الصفحة لو realtime فاته حدث.", "تبويب الصحة يكشف آخر التسجيلات، الفجوات، وآخر أخطاء بدل الاعتماد على الإحساس."];
function buildTurnHealth(messages) {
  const byTurn = /* @__PURE__ */ new Map();
  for (const message of messages) {
    const turnId = message.turn_id || message.id;
    const item = byTurn.get(turnId) ?? {
      turnId,
      user: false,
      assistant: false,
      latest: 0,
      latestText: ""
    };
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
function newBlock(role) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content: ""
  };
}
function SmartRefreshDialog({
  onClose
}) {
  const [blocks, setBlocks] = reactExports.useState([newBlock("user"), newBlock("assistant")]);
  const [busy, setBusy] = reactExports.useState(false);
  const [result, setResult] = reactExports.useState(null);
  const [error, setError] = reactExports.useState(null);
  const [turnId, setTurnId] = reactExports.useState(() => (/* @__PURE__ */ new Date()).toISOString());
  const logFn = useServerFn(logMessagesManual);
  const setContent = (id, content) => setBlocks((prev) => prev.map((b) => b.id === id ? {
    ...b,
    content
  } : b));
  const setRole = (id, role) => setBlocks((prev) => prev.map((b) => b.id === id ? {
    ...b,
    role
  } : b));
  const removeBlock = (id) => setBlocks((prev) => prev.filter((b) => b.id !== id));
  const addBlock = (role) => setBlocks((prev) => [...prev, newBlock(role)]);
  const submit = async () => {
    setError(null);
    setResult(null);
    setBusy(true);
    try {
      const messages = blocks.filter((b) => b.content.trim().length > 0).map((b) => ({
        role: b.role,
        content: b.content.trim(),
        turn_id: turnId
      }));
      if (!messages.length) throw new Error("مافيش رسائل مليانة");
      const res = await logFn({
        data: {
          messages,
          source: "manual-refresh-button"
        }
      });
      setResult(`تم: ${res.inserted} جديدة، ${res.duplicates} مكررة (متسجّلة قبل كده)`);
      if (res.inserted > 0) {
        setBlocks([newBlock("user"), newBlock("assistant")]);
        setTurnId((/* @__PURE__ */ new Date()).toISOString());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto p-4", dir: "rtl", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-background rounded-lg border shadow-lg max-w-3xl w-full my-8 p-4 space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-bold", children: "✨ تحديث ذكي — سجّل الشات في DB" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, className: "text-2xl leading-none px-2", "aria-label": "إغلاق", children: "×" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground space-y-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "• الصق كل رسالة في كتلة منفصلة، واختار الدور (انت / المساعد)." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "• لو رسالة موجودة قبل كده في DB، هتتحسب مكررة تلقائي (مافيش تكرار)." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "• كل الكتل بتتسجل بنفس الـ turn_id عشان الصفحة تعتبرها تبادل واحد." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-muted-foreground", children: "turn_id: " }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: turnId, onChange: (e) => setTurnId(e.target.value), className: "ml-1 px-2 py-1 border rounded bg-card text-xs w-96 font-mono" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 max-h-[55vh] overflow-y-auto pr-1", children: blocks.map((b, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded border p-2 ${b.role === "user" ? "bg-primary/5 border-primary/30" : "bg-card"}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-1 gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
            "#",
            idx + 1
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: b.role, onChange: (e) => setRole(b.id, e.target.value), className: "px-2 py-1 border rounded bg-background text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "user", children: "👤 انت (user)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "assistant", children: "🤖 المساعد (assistant)" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
            b.content.length,
            " حرف"
          ] })
        ] }),
        blocks.length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => removeBlock(b.id), className: "text-xs text-red-600 hover:underline", children: "حذف" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { value: b.content, onChange: (e) => setContent(b.id, e.target.value), placeholder: b.role === "user" ? "الصق رسالتك هنا..." : "الصق رد المساعد هنا...", className: "w-full min-h-[100px] px-2 py-2 border rounded bg-background text-sm font-mono leading-relaxed", dir: "auto" })
    ] }, b.id)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => addBlock("user"), className: "px-3 py-1.5 rounded border text-xs", children: "+ كتلة انت" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => addBlock("assistant"), className: "px-3 py-1.5 rounded border text-xs", children: "+ كتلة المساعد" })
    ] }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-red-600 border border-red-600/40 rounded p-2", children: [
      "⚠️ ",
      error
    ] }),
    result && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-emerald-600 border border-emerald-600/40 rounded p-2", children: [
      "✅ ",
      result
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2 pt-2 border-t", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, className: "px-4 py-2 rounded border text-sm", disabled: busy, children: "إلغاء" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => void submit(), disabled: busy, className: "px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50", children: busy ? "جاري التسجيل..." : "سجّل الآن" })
    ] })
  ] }) });
}
function SessionLogPage() {
  const [tab, setTab] = reactExports.useState("mission");
  const [q, setQ] = reactExports.useState("");
  const [visible, setVisible] = reactExports.useState(PAGE_SIZE);
  const [messages, setMessages] = reactExports.useState([]);
  const [pinnedMission, setPinnedMission] = reactExports.useState(null);
  const [edits, setEdits] = reactExports.useState([]);
  const [reads, setReads] = reactExports.useState([]);
  const [audits, setAudits] = reactExports.useState([]);
  const [counts, setCounts] = reactExports.useState({
    messages: 0,
    edits: 0,
    reads: 0,
    audits: 0
  });
  const [loading, setLoading] = reactExports.useState(false);
  const [lastLoadedAt, setLastLoadedAt] = reactExports.useState(null);
  const [loadError, setLoadError] = reactExports.useState(null);
  const debounceRef = reactExports.useRef(null);
  const [smartOpen, setSmartOpen] = reactExports.useState(false);
  const load = reactExports.useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      if (tab === "messages" || tab === "mission") {
        const [{
          data,
          error
        }, {
          data: missionData,
          error: missionError
        }] = await Promise.all([supabase.from("session_messages").select("id,role,content,turn_id,created_at").order("created_at", {
          ascending: false
        }).limit(300), supabase.from("session_messages").select("id,role,content,turn_id,created_at").eq("turn_id", PINNED_MISSION_TURN_ID).eq("role", "user").order("created_at", {
          ascending: true
        }).limit(1)]);
        if (error) throw error;
        if (missionError) throw missionError;
        if (data) setMessages(data);
        setPinnedMission(missionData?.[0] ?? null);
      } else if (tab === "health") {
        const [{
          data: latestMessages,
          error: latestMessagesError
        }, {
          data: auditData,
          error: auditError
        }] = await Promise.all([supabase.from("session_messages").select("id,role,content,turn_id,created_at").order("created_at", {
          ascending: false
        }).limit(500), supabase.from("session_ingest_audit").select("id,turn_id,client_batch_id,source,items_total,messages_count,edits_count,reads_count,duplicate_count,ok,error_stage,error_message,created_at").order("created_at", {
          ascending: false
        }).limit(200)]);
        if (latestMessagesError) throw latestMessagesError;
        if (auditError) throw auditError;
        if (latestMessages) setMessages(latestMessages);
        if (auditData) setAudits(auditData);
      } else if (tab === "edits") {
        const [{
          data: latestMessages,
          error: latestMessagesError
        }, {
          data,
          error
        }] = await Promise.all([supabase.from("session_messages").select("id,role,content,turn_id,created_at").order("created_at", {
          ascending: false
        }).limit(80), supabase.from("session_edits").select("id,turn_id,summary,files_changed,migrations,version,extra,created_at").order("created_at", {
          ascending: false
        }).limit(300)]);
        if (latestMessagesError) throw latestMessagesError;
        if (error) throw error;
        if (latestMessages) setMessages(latestMessages);
        if (data) setEdits(data);
      } else {
        const [{
          data: latestMessages,
          error: latestMessagesError
        }, {
          data,
          error
        }] = await Promise.all([supabase.from("session_messages").select("id,role,content,turn_id,created_at").order("created_at", {
          ascending: false
        }).limit(80), supabase.from("session_reads").select("id,turn_id,file_path,purpose,key_findings,created_at").order("created_at", {
          ascending: false
        }).limit(300)]);
        if (latestMessagesError) throw latestMessagesError;
        if (error) throw error;
        if (latestMessages) setMessages(latestMessages);
        if (data) setReads(data);
      }
      const [cm, ce, cr, ca] = await Promise.all([supabase.from("session_messages").select("*", {
        count: "exact",
        head: true
      }), supabase.from("session_edits").select("*", {
        count: "exact",
        head: true
      }), supabase.from("session_reads").select("*", {
        count: "exact",
        head: true
      }), supabase.from("session_ingest_audit").select("*", {
        count: "exact",
        head: true
      })]);
      if (cm.error) throw cm.error;
      if (ce.error) throw ce.error;
      if (cr.error) throw cr.error;
      if (ca.error) throw ca.error;
      setCounts({
        messages: cm.count ?? 0,
        edits: ce.count ?? 0,
        reads: cr.count ?? 0,
        audits: ca.count ?? 0
      });
      setLastLoadedAt(Date.now());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "فشل تحميل السجل");
    } finally {
      setLoading(false);
    }
  }, [tab]);
  const scheduleReload = reactExports.useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void load();
    }, 1500);
  }, [load]);
  reactExports.useEffect(() => {
    void load();
    const ch = supabase.channel("session-log").on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "session_messages"
    }, scheduleReload).on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "session_edits"
    }, scheduleReload).on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "session_reads"
    }, scheduleReload).subscribe();
    return () => {
      supabase.removeChannel(ch);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [load, scheduleReload]);
  reactExports.useEffect(() => {
    const interval = setInterval(() => {
      void load();
    }, 1e4);
    const reloadOnFocus = () => {
      void load();
    };
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
  reactExports.useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [tab, q]);
  const filtered = reactExports.useMemo(() => {
    const ql = q.trim().toLowerCase();
    if (tab === "messages") {
      const src2 = ql ? messages.filter((x) => x.content.toLowerCase().includes(ql) || (x.turn_id ?? "").toLowerCase().includes(ql)) : messages;
      return {
        list: src2,
        total: src2.length
      };
    }
    if (tab === "edits") {
      const src2 = ql ? edits.filter((x) => x.summary.toLowerCase().includes(ql) || x.files_changed.some((f) => f.toLowerCase().includes(ql))) : edits;
      return {
        list: src2,
        total: src2.length
      };
    }
    if (tab === "health") {
      const src2 = ql ? audits.filter((x) => (x.turn_id ?? "").toLowerCase().includes(ql) || (x.client_batch_id ?? "").toLowerCase().includes(ql) || (x.error_message ?? "").toLowerCase().includes(ql)) : audits;
      return {
        list: src2,
        total: src2.length
      };
    }
    const src = ql ? reads.filter((x) => x.file_path.toLowerCase().includes(ql) || (x.key_findings ?? "").toLowerCase().includes(ql)) : reads;
    return {
      list: src,
      total: src.length
    };
  }, [tab, q, messages, edits, reads, audits]);
  const turnHealth = reactExports.useMemo(() => buildTurnHealth(messages), [messages]);
  const missingTurns = turnHealth.filter((turn) => !turn.user || !turn.assistant).slice(0, 20);
  const failedAudits = audits.filter((audit) => !audit.ok).slice(0, 20);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-background text-foreground p-6", dir: "rtl", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-6xl mx-auto space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between flex-wrap gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "📜 Session Log — سجل الجلسة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "تسجيل تلقائي لكل الرسائل والتعديلات والملفات المقروءة." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(HealthIndicator, { messages }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CoverageIndicator, { messages }),
        lastLoadedAt && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-xs text-muted-foreground", children: [
          "آخر فحص للصفحة: ",
          new Date(lastLoadedAt).toLocaleTimeString("ar-EG")
        ] }),
        loadError && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-xs font-medium text-red-600", children: [
          "⚠️ فشل تحديث الصفحة: ",
          loadError
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: q, onChange: (e) => setQ(e.target.value), placeholder: "بحث...", className: "px-3 py-2 rounded border bg-card text-sm w-64" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => void load(), className: "px-3 py-2 rounded bg-primary text-primary-foreground text-sm", children: loading ? "..." : "تحديث" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setSmartOpen(true), className: "px-3 py-2 rounded border-2 border-primary text-primary text-sm font-bold", children: "✨ تحديث ذكي" })
      ] })
    ] }),
    smartOpen && /* @__PURE__ */ jsxRuntimeExports.jsx(SmartRefreshDialog, { onClose: () => {
      setSmartOpen(false);
      void load();
    } }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 border-b", children: ["mission", "health", "messages", "edits", "reads"].map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setTab(t), className: `px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`, children: t === "mission" ? "🎯 المهمة" : t === "health" ? `🛡️ صحة التسجيل (${counts.audits})` : t === "messages" ? `💬 رسايل (${counts.messages})` : t === "edits" ? `🔧 تعديلات (${counts.edits})` : `📚 ملفات مقروءة (${counts.reads})` }, t)) }),
    tab === "mission" && (() => {
      const mission = pinnedMission ?? {
        content: PINNED_MISSION_FALLBACK,
        turn_id: PINNED_MISSION_TURN_ID,
        created_at: "2026-07-09T14:09:43.236Z"
      };
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg p-4 border-2 border-primary bg-primary/5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs text-muted-foreground mb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-primary", children: "🎯 المهمة القصوى — مثبتة ولا تتغير بآخر رسالة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: new Date(mission.created_at).toLocaleString("ar-EG") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "whitespace-pre-wrap text-base leading-relaxed font-medium", children: mission.content }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 text-xs text-muted-foreground", children: [
          "turn: ",
          mission.turn_id
        ] })
      ] });
    })(),
    tab === "health" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 md:grid-cols-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border bg-card p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "آخر batches" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold", children: audits.length })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border bg-card p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "فشل ingest" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-2xl font-bold ${failedAudits.length ? "text-red-600" : "text-emerald-600"}`, children: failedAudits.length })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border bg-card p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Turns ناقصة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-2xl font-bold ${missingTurns.length ? "text-red-600" : "text-emerald-600"}`, children: missingTurns.length })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border bg-card p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "آخر 20 تبادل" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-2xl font-bold ${missingTurns.length ? "text-red-600" : "text-emerald-600"}`, children: missingTurns.length ? "ناقص" : "كامل" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border bg-card p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold mb-3", children: "🛡️ 10 طبقات حماية شغالة مع بعض" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-2 md:grid-cols-2", children: safetyLayers.map((layer, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 text-sm text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-primary", children: [
            index + 1,
            "."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: layer })
        ] }, layer)) })
      ] }),
      missingTurns.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-red-600/40 bg-card p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-red-600 mb-2", children: "⚠️ Turns محتاجة catch-up" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: missingTurns.map((turn) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded border p-2 text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between gap-2 text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("code", { children: turn.turnId }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: new Date(turn.latest).toLocaleString("ar-EG") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1", children: [
            "user: ",
            turn.user ? "✅" : "❌",
            " assistant: ",
            turn.assistant ? "✅" : "❌"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-muted-foreground whitespace-pre-wrap", children: turn.latestText })
        ] }, turn.turnId)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        filtered.list.slice(0, visible).map((audit) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded-lg p-3 border ${audit.ok ? "bg-card" : "border-red-600/40 bg-card"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs text-muted-foreground mb-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: audit.ok ? "text-emerald-600 font-bold" : "text-red-600 font-bold", children: audit.ok ? "✅ نجح" : "⚠️ فشل" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: new Date(audit.created_at).toLocaleString("ar-EG") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
            "items: ",
            audit.items_total,
            " — رسايل: ",
            audit.messages_count,
            " — تعديلات: ",
            audit.edits_count,
            " — قراءات: ",
            audit.reads_count,
            " — مكرر: ",
            audit.duplicate_count
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-xs text-muted-foreground", children: [
            "source: ",
            audit.source,
            audit.client_batch_id ? ` — batch: ${audit.client_batch_id}` : "",
            audit.turn_id ? ` — turn: ${audit.turn_id}` : ""
          ] }),
          audit.error_message && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-xs text-red-600", children: [
            audit.error_stage,
            ": ",
            audit.error_message
          ] })
        ] }, audit.id)),
        filtered.total === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center text-muted-foreground py-8", children: "لسه مفيش audit batches." })
      ] })
    ] }),
    tab === "messages" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      filtered.list.slice(0, visible).map((m) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded-lg p-3 border ${m.role === "user" ? "bg-primary/5 border-primary/20" : "bg-card"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs text-muted-foreground mb-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: m.role === "user" ? "👤 المستخدم" : "🤖 المساعد" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: new Date(m.created_at).toLocaleString("ar-EG") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "whitespace-pre-wrap text-sm leading-relaxed", children: m.content })
      ] }, m.id)),
      filtered.total === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center text-muted-foreground py-8", children: "مفيش رسايل مسجلة." })
    ] }),
    tab === "edits" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      filtered.list.slice(0, visible).map((e) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg p-3 border bg-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs text-muted-foreground mb-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: e.version ? `v${e.version}` : "" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: new Date(e.created_at).toLocaleString("ar-EG") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium mb-2", children: e.summary }),
        e.files_changed.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground mb-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "ملفات:" }),
          " ",
          e.files_changed.join(", ")
        ] }),
        e.migrations.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "مايجريشن:" }),
          " ",
          e.migrations.map((s) => s.slice(0, 80)).join(" | ")
        ] })
      ] }, e.id)),
      filtered.total === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center text-muted-foreground py-8", children: "مفيش تعديلات مسجلة." })
    ] }),
    tab === "reads" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      filtered.list.slice(0, visible).map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg p-3 border bg-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs text-muted-foreground mb-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "font-mono", children: r.file_path }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: new Date(r.created_at).toLocaleString("ar-EG") })
        ] }),
        r.purpose && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs mb-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "الغرض:" }),
          " ",
          r.purpose
        ] }),
        r.key_findings && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground whitespace-pre-wrap", children: r.key_findings })
      ] }, r.id)),
      filtered.total === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center text-muted-foreground py-8", children: "مفيش ملفات مقروءة مسجلة." })
    ] }),
    filtered.total > visible && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setVisible((v) => v + PAGE_SIZE), className: "px-4 py-2 rounded border bg-card text-sm hover:bg-accent", children: [
      "عرض المزيد (",
      filtered.total - visible,
      " متبقي)"
    ] }) })
  ] }) });
}
export {
  SessionLogPage as component
};
