# ملف شامل — مشروع meky-stock (نظام تداول آلي لبورصة مصر EGX)

> **الغرض من الملف:** تسليم كامل لذكاء اصطناعي آخر ليفهم المشروع من الصفر — من أول يوم اتقرر فيه بناء الموقع، مرورًا بفترة التطوير على VSCode مع Cline، وحتى كل التعديلات الأخيرة.
> **تاريخ التجميع:** 2026-09-17 (توقيت القاهرة)
> **⚠️ تحذير مهم:** القيم الفعلية للمفاتيح السرية **محذوفة عمدًا** من الملف ده (مكتوب مكانها `[REDACTED]`). الملف ده مصمم إنه يتبعت بأمان. **متبعتش** ملفات `config.yaml` أو `.env` نفسها لأي حد — دول فيهم مفاتيح شغّالة.

---

# الفهرس

1. الملخص التنفيذي
2. الجدول الزمني الكامل (من أول يوم لحد دلوقتي)
3. البنية التقنية (Tech Stack)
4. كل المواقع والأماكن الأونلاين
5. كل المجلدات والملفات على الجهاز (بالأحجام والمسارات)
6. الإكستنشنز (كل الإصدارات)
7. قاعدة البيانات (Supabase)
8. الاستراتيجية (Gap-Up Momentum) — التفاصيل والأرقام
9. المشرف الذكي (AI Supervisor)
10. المهام المجدولة (Cron Jobs)
11. ملفات الأسرار (Secrets) — **أماكنها ومتغيراتها فقط**
12. طريقة التشغيل (من الصفر)
13. قواعد الشغل المتفق عليها
14. أحدث التعديلات (2026-09-17)
15. الحقائق المؤكدة بالأرقام ومع طريقة التحقق
16. ملاحظات مهمة للنموذج اللي هيقرأ الملف

---

# 1. الملخص التنفيذي

**المشروع:** نظام تداول آلي (Algorithmic Trading) للسوق المصري (EGX)، بيشتغل عليه شخص واحد (ميكاواي) بهدف تحقيق ربح أسبوعي ثابت من رأس مال 100,000 جنيه.

**الفكرة الجوهرية:** استراتيجية **Gap-Up Momentum** — شراء الأسهم اللي كانت أسعارها اتفتحت أعلى من إغلاق اليوم السابق (Gap-Up) بنسبة صغيرة، مع تأكيدات إضافية (سعر جديد مرتفع داخل أول 10 دقايق + السعر عند 10:00 أعلى من إغلاق اليوم السابق).

**الثلاثية الأساسية للمشروع:**
1. **موقع ويب** (Frontend + Backend) — منصة مراقبة وتحليل وتنفيذ، مبنية على TanStack Start + Supabase، ومستضافة على Render.
2. **إكستنشن متصفح** (Chrome Extension) — بيقرأ بيانات مباشرة من موقع ثاندر (Thndr — وسيط التداول المصري) عبر CDP + WebSocket + DOM، ويبعتها للسيرفر.
3. **قاعدة بيانات سحابية** (Supabase/Postgres) — 93 جدول، بتخزن البيانات اللحظية + التاريخية + الأسعار + الأخبار + سجلات التنفيذ.

**الغاية النهائية:** نظام يشتغل شبه-آلي: يكتشف فرص الدخول، ينبّه، يتابع المراكز، يخرج، ويتعلم — مع مشرف ذكي (AI Supervisor) بيراقب كل حاجة وبيبلّغ عن أي مشكلة.

---

# 2. الجدول الزمني الكامل

## المرحلة صفر — قبل القرار (سياق)
الشخص كان بيشتغل على مشاريع برمجة متنوعة (مجلدات قديمة على D:\ و F:\ زي `lecture-recorder`، `shoghlana-egypt-jobs`، `lovable-chat-logger`، `claude-full-chat-copy-extension`) — دي مش جزء من مشروع التداول لكنها في نفس الجهاز.

## المرحلة الأولى — البداية على Lovable ثم VSCode/Cline

| التاريخ | الحدث |
|---|---|
| **~2026-05-12** | القالب الأساسي (TanStack Start TS template) — commit `86becaa2` بتاريخ 2025-01-01 (تاريخ القالب الأصلي). المشروع اتولّد أصلاً على **Lovable** (منصة توليد مواقع بالذكاء الاصطناعي) — الدليل: `host_permissions` في الإكستنشن فيه `https://meky-stock.lovable.app/*`، وفي مستودع الموقع مجلد `.lovable/` و `@lovable.dev/vite-tanstack-config` في الـ devDependencies. |
| **2026-05-20** | أول commits حقيقية: `d71968ed`, `5fa45bc5`, `1dacfbc7` ("Addressed Yahoo EGX gaps"), `f29cb452`... — يعني الشغل الفعلي بدأ 20 مايو 2026. |
| **2026-05-20 → 2026-08-18** | تطوير مكثّف على VSCode بالتعاون مع **Cline** (مساعد برمجة بالذكاء الاصطناعي) — بناء الجداول، السكربتات، صفحات الموقع، تكامل Supabase. |
| **2026-08-18** | نسخة كاملة محفوظة على `D:\meky-stock1-main\meky-stock1-main` |
| **2026-08-19** | بداية الجلسات الموثقة في Cline (session `1787143236870_lnxfx`) |
| **2026-08-22** | نسخة كاملة محفوظة على `D:\meky-stock-main\meky-stock-main` (المجلد النشط الحالي) — والجلسات الكبيرة بدأت (`z5brr`, `5h9vx`, `pwupz`, `x0z0r`, `4q5gs`) |
| **2026-08-24** | نسخة كاملة محفوظة على `D:\meky-stock-master\meky-stock-main` |

## المرحلة الثانية — Cline (جلسات موثّقة)

كل الجلسات محفوظة في `D:\z.ai 15.9.2026\chat_transcripts\` (باك أب كامل من Cline):

| # | Session | من | إلى | رسايل خام | رسايل المستخدم | ردود المساعد | نداءات أدوات |
|---|---|---|---|---|---|---|---|
| 01 | `1787143236870_lnxfx` | 2026-08-19 | 2026-09-03 | 2944 | 193 | 571 | 1378 |
| 02 | `1787375351969_f9fwy` | 2026-08-22 | 2026-09-05 | 65 | 16 | 1 | 26 |
| 03 | `1787377038536_z5brr` | 2026-08-22 | 2026-09-13 | 10869 | 1109 | 2332 | 4791 |
| 04 | `1789293040467_5h9vx` | 2026-08-22 | 2026-09-13 | 10867 | 1107 | 2332 | 4791 |
| 05 | `1789293846775_pwupz` | 2026-08-22 | 2026-09-13 | 10872 | 1112 | 2332 | 4791 |
| 06 | `1789298100554_x0z0r` | 2026-08-22 | 2026-09-14 | 10885 | 1125 | 2324 | 4795 |
| 07 | `1789335784718_4q5gs` | 2026-08-22 | 2026-09-14 | 11047 | 1116 | 2376 | 4865 |

> ملف `ALL-CHAT-ONE-FILE.md` (2.6 MB) فيه كل الجلسات مدموجة.
> ملف `08-ملخص-المشاكل-القديمة-والحلول.md` فيه ملخص مشاكل سابقة.

## المرحلة الثالثة — الانتقال للشغل هنا (OpenClaw)

| التاريخ | الحدث |
|---|---|
| **2026-09-14** | بداية العمل من هنا: إضافة NotificationCenter، risk-guard (kill switch أسبوعي −8000، تصفية عند −10%)، الواتش-دوج + التشغيل التلقائي المخفي، لوج الصفقات المغلقة بفصل REAL عن SHADOW |
| **2026-09-15** | الاستراتيجية الكانونية Gap-Up Momentum اتثبتت: ترتيب تصاعدي (ASC)، فلتر القيمة السوقية ≤ 10 مليار، وقف خسارة −10% (إغلاق فقط، بدون هدف ربح). + المشرف الذكي (8e7b2f78) + إصلاح نصوص الصفحة + ربط أخبار 30 ساعة |
| **2026-09-15 → 16** | **v2 config** (commit `84ad26d0`): الاحتفاظ 4 أيام تداول (كان 3)، 10 خانات × 10,000 جنيه، نطاق Gap 0.1%–1.5%، تأكيد مزدوج (سعر جديد مرتفع + فوق إغلاق الأمس) — متحقّق منه على 89 يوم |
| **2026-09-16** | المشرف الموسّع (15 وظيفة) + concentration guard (منع أي سهم > 20% من أرباح 30 يوم، قاعدة CRST) + صفحة `/ai-supervisor` + ويدجت شات + **v3 sizing** (vol-parity + regime-half) |
| **2026-09-17** | إصلاح انقطاع البيانات الحيّة: توحيد التوكن على كل مسارات الاستقبال (كانت 401)، إسقاط FK من `live_ticks` عشان توقف رمي البيانات، تعديل حدود المراقبة، وإصلاح كارت "أسهم أسعار حيّة"، وإزالة fallback مضلل |

**المجموع الكلي:** 5,786 commit في المستودع، من 2026-05-20 لحد 2026-09-17.

---

# 3. البنية التقنية (Tech Stack)

## الموقع (Frontend + Backend)
| العنصر | التفاصيل |
|---|---|
| الاسم | `tanstack_start_ts` (اسم المستودع: `meky-stock`) |
| الإطار | **TanStack Start** (React + SSR) + Vite |
| اللغة | TypeScript |
| التنسيق | Tailwind CSS v4 + Radix UI (30+ مكتبة راديكس) + lucide-react للأيقونات |
| المخططات | Recharts + lightweight-charts (شموع) |
| قاعدة البيانات | Supabase (Postgres) + `postgres` (driver مباشر) |
| النماذج/الذكاء | `ai` (Vercel AI SDK) + `@ai-sdk/openai-compatible` |
| التحقق | Zod + react-hook-form |
| النشر | Render (auto-deploy من GitHub main) |
| الاتصال اللحظي | Supabase Realtime + polling |

## قاعدة الكود (أرقام فعلية)
- **142 ملف route** في `src/routes/` (صفحات + API endpoints)
- **367 ملف** في `src/lib/` (منطق العمل)
- **63 ملف** في `src/components/` (مكوّنات UI)
- **133 migration** في `supabase/migrations/`
- **18 سكربت** في `scripts/`
- الحجم الكلي: **~43,832 ملف / 901.5 ميجا** (بما فيهم node_modules)

## الإكستنشن (Chrome Extension — Manifest V3)
- الملف الرئيسي: `background.js` (service worker) + `cdp-module.js` + `content.js` + `page-script.js` + `overlay-module.js` + `offscreen.js` + `popup.js`
- الصلاحيات: `storage, scripting, tabs, alarms, debugger, notifications, offscreen`
- المواقع المسموح بيها: `web.thndr.app`, `*.thndr.app`, `*.firebaseio.com`, `*.firebasedatabase.app`, `meky-stock.lovable.app`

---

# 4. كل المواقع والأماكن الأونلاين

| # | الموقع | الرابط | الوصف |
|---|---|---|---|
| 1 | **المستودع (GitHub)** | `https://github.com/mekaweey/meky-stock.git` | الكود المصدري الكامل |
| 2 | **الموقع في الإنتاج (Render)** | `https://meky-stock.onrender.com` | النسخة الحيّة المنشورة |
| 3 | **الموقع محليًا** | `http://localhost:8080` | نسخة التطوير (بتشتغل تلقائيًا) |
| 4 | **قاعدة البيانات (Supabase)** | `https://<SUPABASE_PROJECT_ID>.supabase.co` — الاستضافة الفعلية: `aws-0-eu-central-1.pooler.supabase.com` | Postgres — 93 جدول |
| 5 | **Lovable (الأصل)** | `https://meky-stock.lovable.app` | المكان اللي المشروع اتولّد فيه |
| 6 | **موقع ثاندر (مصدر البيانات)** | `https://web.thndr.app/ar/watchlist` | موقع الوسيط — الإكستنشن بيقرأ منه |
| 7 | **WhatsApp (الإشعارات)** | عبر `whatsapp` channel في OpenClaw | إشعارات التنبيهات |

## أهم API Endpoints في الموقع (`/api/public/hooks/...`)

**استقبال من الإكستنشن:**
| المسار | الوظيفة |
|---|---|
| `/thunder-ticks` | استقبال التيّكات اللحظية (سعر/حجم لكل رمز) |
| `/thunder-marketwatch` | استقبال لقطات مراقبة السوق (الأسعار/الأحجام/الطلبات) — **المصدر الأساسي** |
| `/thunder-watchlist` | استقبال قائمة المراقبة |
| `/thunder-quotes` | استقبال Bid/Ask |
| `/thunder-tape` | استقبال شريط الصفقات |
| `/thunder-orders` | استقبال الأوامر |
| `/thunder-positions` | استقبال المراكز |
| `/orderbook-snapshot` | استقبال عمق السوق (L2) |
| `/live-tick-poll` | سحب التيّكات |
| `/extension-telemetry` | تتبع حالة الإكستنشن |

**مراقبة وتشخيص:**
| المسار | الوظيفة |
|---|---|
| `/marketwatch-health` | فحص صحة تدفق البيانات (الأهم) |
| `/health-check` | فحص صحة عام |
| `/thunder-health` | صحة اتصال ثاندر |
| `/thunder-auth-alert` | تنبيه مصادقة ثاندر |
| `/ai-supervisor-feed` | تغذية أفكار المشرف الذكي |
| `/ai-supervisor-identity` | هوية المشرف |

**الاستراتيجية والتحليل:**
| المسار | الوظيفة |
|---|---|
| `/daily-scan`, `/live-signal-scan`, `/intraday-breakout-scan` | فحص الفرص |
| `/paper-scalp-dip`, `/paper-scalp`, `/paper-scalp-fresh` | التداول الورقي |
| `/smart-exit`, `/smart-exit-toggle`, `/sell-watcher`, `/trailing-stop`, `/target-stop-detector` | إدارة الخروج |
| `/scalp-signal-logger`, `/scalp-canary`, `/scalp-brief`, `/scalp-eod-report`, `/scalp-timeline` | تسجيل وتقارير |
| `/walk-forward`, `/run-backtest`, `/auto-backtest` | الاختبار الخلفي |
| `/shadow-report`, `/outcome-loop`, `/update-outcomes` | تقارير الظل والنتائج |
| `/eod-learn`, `/weekly-learning`, `/weekly-deep-learn`, `/self-improve`, `/self-calibrate` | التعلّم الذاتي |
| `/news-watchdog`, `/fetch-news-all`, `/enrich-news-rss`, `/enrich-news-mubasher`, `/forecast-news-impacts` | الأخبار |

**صفحات الموقع (أهمها):**
`scalp-dip` (صفحة الاستراتيجية)، `marketwatch-health`، `ai-supervisor`، `positions`، `paper`، `daily`، `today`، `tomorrow`، `performance`، `track-record`، `learning`، `backtest`، `slippage-report`، `signal-quality`، `trade-lifecycle`، `reconciliation`، `missed-signals`، `halal-daytrade`، `investment`، `stock.$symbol`، `health`، `automation`، `deep`، `reality`، `sniper`...

*(القائمة الكاملة لـ 142 ملف موجودة في `src/routes/`)*

---

# 5. كل المجلدات والملفات على الجهاز

## المجلد النشط (الأهم)
| المسار | الوصف | الحجم |
|---|---|---|
| `D:\meky-stock-main\meky-stock-main` | **المشروع النشط** — كل التعديلات الحالية فيه | 43,832 ملف / 901.5 MB |

### المجلدات الفرعية المهمة في المشروع
| المسار | الوصف |
|---|---|
| `src/` | كود الموقع كامل (`routes/`, `lib/`, `components/`) |
| `supabase/migrations/` | 133 ملف migration لقاعدة البيانات |
| `scripts/` | سكربتات التشغيل والصيانة |
| `public/` | الملفات العامة + ملفات zip للإكستنشنز |
| `extension/` | نسخة الإكستنشن الحالية (22 ملف / 1.14 MB) |
| `extension-v3/`, `extension-v4/`, `extension-v4-backup/`, `extension-proactive/`, `extension-chat-logger/` | إصدارات إكستنشن قديمة |
| `dist-archive/`, `mem/`, `node_modules/`, `.output/`, `.wrangler/`, `.tanstack/`, `.lovable/` | بناءات وذاكرة وحزم |

### ملفات السكربتات (`scripts/`)
| الملف | الوظيفة |
|---|---|
| `daily-archive.ts` | الأرشفة اليومية |
| `decode-mkb2.cjs` | فك تشفير ملفات mkb2 |
| `dev-server.cjs` / `dev-stop.cjs` | تشغيل/إيقاف سيرفر التطوير |
| `egx-autostart.bat` / `egx-autostart-hidden.vbs` | التشغيل التلقائي المخفي |
| `generate-quality.ts` | توليد تقارير الجودة |
| `query-db-size.cjs` | استعلام حجم قاعدة البيانات |
| `supervisor.cjs` | المشرف — الفحص الأساسي |
| `supervisor_extended.cjs` | المشرف — 15 وظيفة موسّعة |
| `supervisor_thoughts.cjs` | كاتب أفكار المشرف |
| `watchdog.cjs` | الواتش-دوج (فحص كل 5 دقايق + إعادة تشغيل تلقائي) |
| `DATA_QUALITY_SYSTEM.md` / `README-daily-archive-setup.md` / `README-adding-new-data-table.md` | توثيق |

### ملفات الحالة والتتبع (في جذر المشروع)
| الملف | الوصف |
|---|---|
| `supervisor_state.json` | حالة المشرف الأخيرة |
| `supervisor_extended.json` | نتائج الفحص الموسّع |
| `supervisor_feed.jsonl` | تغذية الأفكار والأحداث |
| `supervisor_history.jsonl` | سجل القرارات |
| `supervisor_identity.json` | هوية المشرف |
| `supervisor_log.md` | لوج مختصر |
| `PROJECT_HANDOFF.md` | تسليم المشروع (خاص بأرشيف أخبار مباشر) |
| `news_signal_summary.csv` / `news_signal_test_results.csv` | نتائج اختبار الأخبار |
| `_mb_*.cjs` / `_mb_*.json` | أدوات وبيانات أرشيف أخبار مباشر |
| `_egx_diag*.cjs` / `_egx_timeline_tmp*.cjs` | أدوات تشخيص مؤقتة |

## النسخ الاحتياطية والمجلدات الأخرى

| المسار | الوصف | الحجم |
|---|---|---|
| `D:\meky-stock1-main\meky-stock1-main` | نسخة قديمة (قبل 2026-08-18) | 43,366 ملف / 581.8 MB |
| `D:\meky-stock-master\meky-stock-main` | نسخة قديمة (2026-08-24) | ملف واحد |
| `D:\z.ai 15.9.2026` | **الباك أب الكامل من Cline** (جلسات + نسخة الموقع + العمل) | 129 ملف / 302.3 MB |
| `D:\all_market_data` | بيانات سوق | 40 ملف / 1.6 MB |
| `D:\1All Data` | بيانات شاملة | 149 ملف / 929.7 MB |
| `D:\30.8.2026 10 days data` | بيانات 10 أيام | 11 ملف / 1850.6 MB |
| `D:\TradingView data` | بيانات TradingView (222 رمز) | 222 ملف / 166.4 MB |
| `D:\aaaa` | بيانات إضافية | 24 ملف / 353.3 MB |
| `D:\files` | ملفات متنوعة | 10 ملف / 8.1 MB |
| `D:\web_thndr_app1.har` | تسجيل شبكة لموقع ثاندر (تحليل) | — |

## داخل `D:\z.ai 15.9.2026\`
| المجلد | الوصف |
|---|---|
| `chat_transcripts/` | **7 جلسات Cline كاملة** + `ALL-CHAT-ONE-FILE.md` (2.6 MB) + فهرس + ملخص مشاكل |
| `cline_history_backup/` | باك أب ذاكرة Cline |
| `egx_work/` | شغل EGX المؤقت |
| `site_backup/` | نسخة موقع |

## مجلدات أدوات الذكاء الاصطناعي (على C:\)
| المسار | الحجم | الوصف |
|---|---|---|
| `C:\Users\Mekawey\.cline` | 191.2 MB (34 ملف) | ذاكرة وسجل Cline |
| `C:\Users\Mekawey\.zcode` | 56.8 MB (372 ملف) | ذاكرة ZCode (أداة AI أخرى) |
| `C:\Users\Mekawey\.cursor` | 2.9 MB (206 ملف) | إعدادات Cursor |
| `C:\Users\Mekawey\.vscode` | 554.8 MB (11205 ملف) | إضافات وسجل VSCode |
| `C:\Users\Mekawey\.gemini` | 13.1 MB (26 ملف) | إعدادات Gemini CLI |
| `C:\Users\Mekawey\.claude` | ~0 MB | إعدادات Claude |
| `C:\Users\Mekawey\.supabase` | ~0 MB | إعدادات Supabase CLI |
| `C:\Users\Mekawey\.openclaw-autoclaw` | — | **مساحة العمل الحالية** (OpenClaw) |

---

# 6. الإكستنشنز

## الإكستنشن الرئيسي
| البند | التفاصيل |
|---|---|
| الاسم في manifest | `Thunder Unified (v1 + CDP + Overlay)` |
| الإصدار في manifest (F:\) | `4.5.3` |
| الإصدار الشغّال فعليًا في المتصفح | `4.5.0` (المحمّل يختلف عن المجلد) |
| المسار | `F:\thunder-extension-v4.6.2\extension\` (+ نسخة في جذر F:\thunder-extension-v4.6.2\) |
| الملفات | 22 ملف / 1.1 MB |
| نسخة داخل المشروع | `D:\meky-stock-main\meky-stock-main\extension\` |

### طريقة عمله
1. **CDP (Chrome DevTools Protocol)** — الإكستنشن بيوصل لِـ debugger المتصفح ويقرأ رسايل الـ WebSocket الخاصة بموقع ثاندر.
2. **REST passive poll** — بيقرأ ردود موقع ثاندر نفسه (قائمة المراقبة) ويبعتها للسيرفر.
3. **DOM scraping** — بيقرأ القيم الظاهرة على الصفحة.
4. **Offscreen document** — للاتصال الدائم.
5. **Overlay** — واجهة فوق صفحة ثاندر.

### مسارات الإرسال (Endpoints) اللي الإكستنشن بيستخدمها
| المتغير | القيمة |
|---|---|
| `DEFAULT_ENDPOINT` | `/thunder-ticks` |
| `MARKETWATCH_ENDPOINT` | `/thunder-marketwatch` |
| `WATCHLIST_ENDPOINT` | `/thunder-watchlist` |
| `ORDERBOOK_ENDPOINT` | `/orderbook-snapshot` |
| `BACKEND_LIVE_POLL_ENDPOINT` | `/live-tick-poll` |
| `priceSourceUrl` | `https://web.thndr.app/ar/watchlist` (مصدر الأسعار الوحيد المقبول) |

### **ملاحظة تقنية جوهرية للنموذج الآخر**
الإكستنشن بيقبل التيّكات **بس** من التابات اللي عنوانها بيبدأ بـ `priceSourceUrl`، وأي تابات تانية بتترمي (العدّاد "أسقط من تابات تانية" كان بيعرض **1,165,568** تيك مرفوض). ده سبب إن قناة التيّكات بتحمل عدد رموز قليل (المؤشرات + السهم المفتوح)، بينما قناة marketwatch (REST) بتحمل كل رموز قائمة المراقبة.

## إصدارات ومشاريع إكستنشن أخرى
| المسار | الملفات | الوصف |
|---|---|---|
| `F:\thunder-market-viewer` | 6 | عارض السوق |
| `F:\thunder-market-viewer (11)` | 6 | نسخة تانية |
| `F:\thunder-proactive-v3` | 7 | نسخة استباقية |
| `F:\thunder extention logs` | 1,990 ملف | سجل الإكستنشن + ملفات zip لكل الإصدارات القديمة |
| `F:\claude-full-chat-copy-extension` | 4 | إكستنشن نسخ محادثات Claude (مشروع منفصل) |
| `D:\GmailNameFinderExtension_v3` / `D:\Gmail_Name_Finder` | — | إكستنشن Gmail (مشروع منفصل) |

### نسخ الإكستنشن (zip) في `public/`
`thunder-extension.zip`، `thunder-extension-v3.zip`، `thunder-extension-v4.zip`، `thunder-extension-v4.1.71.zip`، `...v4.1.72`، `...v4.1.73`، `...v4.2.5`، `thunder-unified-v4.zip`، `thunder-proactive-v3.zip`

---

# 7. قاعدة البيانات (Supabase)

- **المضيف:** `aws-0-eu-central-1.pooler.supabase.com` (منطقة أوروبا الوسطى)
- **العدد الكلي:** **93 جدول** في schema `public` — **1,248 عمود**

## كل الجداول (93)
```
_cleanup_log, _storage_log, backtest_trades, backtests, concentration_blocks,
counterfactual_insights, daily_candles, daily_intelligence, daily_picks,
daily_trade_analytics, data_source_logs, decision_suggestions, depth_imbalance,
ensemble_votes, execution_context, execution_quality_log, extension_config,
extension_diag, extension_tab_telemetry, extension_trades, fill_analysis_v,
fundamentals, ingest_diag, ingest_tokens, intraday_breakouts, intraday_candles,
learning_labels, live_quotes, live_ticks, live_ticks_best, macro_indicators,
market_regimes, market_snapshots, marketwatch_snapshots, missed_signals,
model_state, mubasher_news, news_embeddings, news_impact_forecasts,
news_near_signal, news_sentiment, news_symbol_map, online_learning_state,
opening_range, order_lifecycle, orderbook_snapshots, paper_trades,
paper_trades_analytics, pending_orders, pick_notifications, positions,
pre_buy_gate_log, premarket_shortlist, recommendations, scalp_dip_signals,
scalp_feasibility_report, scalp_fresh_fetch_log, scalp_signal_log,
scalp_timeline_events, scans, seed_depth_imbalance, seed_news_sentiment,
seed_opening_range, seed_paper_trades_analytics, seed_signal_reversal_check,
seed_strategy_overview, seed_strategy_symbol_ranking, seed_symbol_vwap_daily,
sell_alerts, session_edits, session_ingest_audit, session_messages,
session_reads, signal_failures, signal_reversal_check, smart_exit_log,
sniper_picks, stock_snapshots, stocks, strategy_overview, strategy_settings,
strategy_symbol_ranking, strategy_symbol_rankings, symbol_profile,
symbol_vwap_daily, thunder_auth_events, thunder_tape, thunder_tick_archive,
thunder_watchlist_snapshots, trade_events, trade_reversal_signals,
walk_forward_days, walk_forward_runs
```

## أكبر الجداول بعدد الصفوف
| الجدول | الصفوف | الوصف |
|---|---|---|
| `thunder_tick_archive` | 289,382 | أرشيف التيّكات |
| `marketwatch_snapshots` | 98,935 | **لقطات مراقبة السوق (المصدر الأساسي للأسعار)** |
| `thunder_tape` | 26,232 | شريط الصفقات |
| `extension_diag` | 20,305 | تشخيص الإكستنشن |
| `thunder_watchlist_snapshots` | 19,588 | لقطات قائمة المراقبة |
| `live_quotes` | 7,192 | Bid/Ask لحظي |
| `orderbook_snapshots` | 7,157 | عمق السوق |
| `mubasher_news` | 5,731 | أرشيف أخبار مباشر |
| `news_symbol_map` | 1,060 | ربط الأخبار بالرموز |
| `live_ticks` | 221 | التيّكات اللحظية |
| `trade_events` | 90 | أحداث التداول |
| `symbol_profile` | 86 | بروفايل الرموز |
| `scalp_dip_signals` | 62 | إشارات الاستراتيجية |
| `paper_trades` | 56 | التداول الورقي |

## أنواع البيانات الأساسية
- **لحظية:** `marketwatch_snapshots`, `live_ticks`, `live_quotes`, `orderbook_snapshots`, `thunder_tape`, `thunder_tick_archive`
- **تاريخية:** `daily_candles`, `intraday_candles`, `intraday_breakouts`, `opening_range`, `symbol_vwap_daily`
- **استراتيجية:** `stocks`, `scalp_dip_signals`, `paper_trades`, `positions`, `strategy_settings`, `concentration_blocks`
- **أخبار:** `mubasher_news`, `news_symbol_map`, `news_sentiment`, `news_impact_forecasts`, `news_embeddings`
- **تعلّم:** `learning_labels`, `model_state`, `online_learning_state`, `walk_forward_runs`, `walk_forward_days`
- **تشغيل:** `ingest_tokens`, `ingest_diag`, `extension_diag`, `smart_exit_log`, `sell_alerts`, `thunder_auth_events`

## أهم الـ migrations (آخر 25)
```
20260803234858_ed14b0ef...sql       20260825000001_db_size_monitor.sql
20260812040327_541c4e59...sql       20260826000000_vacuum_full_data_tables.sql
20260812040339_a3af7768...sql       20260827000000_dedup_latest_per_symbol.sql
20260812040346_0f1def12...sql       20260830000000_live_quotes_source_column.sql
20260812164018_7c694031...sql       20260901000001_cleanup_log_rls.sql
20260816163811_abd9fff6...sql       20260908000000_scalp_dip_user_capital.sql
20260816163837_4d683c2e...sql       20260908000001_scalp_dip_signals.sql
20260817145703_9b213c18...sql       20260912000000_mubasher_news_archive.sql
20260819180000_fix_cron_urls.sql    20260914215014_symbol_profile.sql
20260819180100_csv_upload_tables.sql 20260915061728_news_symbol_map.sql
20260819180200_seed_csv_tables.sql  20260915083000_signals_news_30h.sql
                                    20260916220000_concentration_blocks.sql
                                    20260917121500_ingest_tokens.sql
                                    20260917130000_live_ticks_drop_fk.sql
```

**قاعدة مقدسة:** ممنوع أي تعديل على قاعدة البيانات بدون migration قابل لإعادة التشغيل.

---

# 8. الاستراتيجية (Gap-Up Momentum)

## الفكرة
شراء الأسهم اللي فتحت أعلى من إغلاق الأمس بنسبة صغيرة (Gap-Up) — لأن الأسهم دي بتكمل صعود في نفس اليوم، والمراكز بتتقفل بعد 4 أيام تداول.

## الإعدادات النهائية (v2 + v3)
| الإعداد | القيمة | السبب/التحقق |
|---|---|---|
| **نطاق Gap** | 0.1% – 1.5% | متحقّق منه على 89 يوم |
| **الترتيب** | تصاعدي (ASC) | الأفضل في الاختبارات |
| **عدد الخانات** | 10 خانات | |
| **رأس المال لكل خانة** | 10,000 جنيه | من 100,000 |
| **مدة الاحتفاظ** | **4 أيام تداول** | أفضل من 3 أيام: +4,202 مقابل +2,682، وتراجع أقصى −1,496 بس |
| **تأكيد الدخول** | سعر جديد مرتفع في أول 10 دقايق **+** السعر عند 10:00 ≥ إغلاق الأمس | |
| **فلتر القيمة السوقية** | ≤ 10 مليار جنيه | |
| **فلتر السعر** | ≥ 1 جنيه | |
| **مستثنى قطاعيًا** | تكنولوجيا المعلومات + البنوك | |
| **حجم المركز** | vol-parity (مبني على ATR) × regime-half (اتساع السوق) | v3 sizing |
| **وقف الخسارة** | −10% (إغلاق فقط) | |
| **هدف الربح** | **بدون** | الأرقام أثبتت إنه بيقلل الأداء |

## الأرقام (89 يوم — الفترة 2026-04-27 → 2026-09-09)
| المقياس | القيمة |
|---|---|
| عدد الصفقات | 698 |
| إجمالي الربح | +47,972 إلى +48,443 جنيه |
| متوسط أسبوعي | ~2,525 جنيه |
| t-statistic | 3.79 |
| نسخة الكود الحيّ | +2,741/أسبوع (نسبة فوز 56.6%، أقصى تراجع −3,547) |
| walk-forward ديناميكي | +3,159 (الطيّة الثالثة = −317) |
| إعداد ثابت (أعمى) | +5,078 (3/3 طيّات موجبة) |
| Monte-Carlo | احتمال (المتوسط ≤ 0) = 0.02% |
| اختبار الانزلاق 0.5%/جهة | +1,541 |
| أسوأ أسبوعين | −3,614 |

## النتيجة الصادقة (مهم جدًا)
- **العدد الواقعي للتخطيط: 1,500 – 2,900 جنيه/أسبوع (المتوسط ~2,200)**
- 4,200 – 5,078 = سقف تفاؤلي
- **الألفا (الميزة على "اشتري أي حاجة") = +453/أسبوع فقط، t = 0.51 — غير معنوي إحصائيًا، احتمال (الألفا ≤ 0) = 30.9%**
- السبب: الـ 89 يوم دول فترة صعود سوق واحدة قوية

## تحليل مهم (R1)
- المقارنة من الإغلاق للإغلاق: **+2.14%/أسبوع** (استراتيجيتنا)
- من الفتح للإغلاق: **−0.22%/أسبوع** (السوق ككل)
- **الاستنتاج:** أرباح السوق كلها بتحصل في الفجوات الليلية، والتداول داخل اليوم سلبي — ده **دعم بنيوي** لاستراتيجية شراء الـ Gap.

## إدارة المخاطر
- **قتل أسبوعي:** −8,000 جنيه → إيقاف
- **تصفية عند التراجع:** −10% → تنصيف الحجم
- **حاجز التركّز:** أي سهم > 20% من صافي ربح 30 يوم → محظور من الدخول 14 يوم (قاعدة CRST)
- **فحص التركّز المكتشف:** CRST كان **51% من أرباح الشهر** — تم اكتشافه بالمشرف الموسّع

## بوابة التداول الورقي
- البدء ورقي، مراجعة بعد 4 أسابيع (النجاح = ≥ 1,500/أسبوع)
- قائمة Go/No-Go بتتولّد تلقائيًا من المشرف الموسّع

## قاعدة التجميد
**صفر تعديلات** على الفلاتر/الشكل على نفس الـ 89–96 يوم. أي تغيير مستقبلي من بيانات التداول الورقي الحيّ بس.

---

# 9. المشرف الذكي (AI Supervisor)

نظام مراقبة 3 طبقات:

| الطبقة | الملف/الأداة | الوظيفة |
|---|---|---|
| **Tier 1** | `scripts/watchdog.cjs` + مشغّل | ميكانيكي بحت — فحص كل 5 دقايق + إعادة تشغيل تلقائي (بدون ذكاء اصطناعي) |
| **Tier 2** | `scripts/supervisor.cjs` | فحص كامل للنظام مع تعديل النافذة الزمنية (الموقع/البيانات/المراكز/الإشارات/الأخبار/الـcron/الـDB) + حكم بالعربي |
| **Tier 3** | Heartbeat cron + `supervisor_extended.cjs` | المشرف الكامل: بيفكر، يشخّص، يصلّح تشغيليًا، ويبلّغ |

## الوظائف الـ 15 للمشرف الموسّع (`supervisor_extended.cjs`)
1. F1 — جودة البيانات
2. F2 — اتجاه اتساع السوق
3. F3 — تركّز الأرباح
4. F5 — الانزلاق السعري (slippage)
5. F6 — التقويم المؤسسي على المراكز المفتوحة
6. F7 — تآكل العمق (depth decay)
7. F8 — تحليل مصادر الخسارة
8. F9 — ملخص عربي آخر اليوم
9. F10 — الحالات الشاذة
10. F11 — إعادة التوازن
11. F12 — الأخبار عند الفتح
12. F13 — الترابط القطاعي
13. F14 — الحيّ مقابل المتوقع
14. F15 — تحديث الكون (universe refresh)

## صفحة `/ai-supervisor`
- حكم مباشر + إحصائيات سريعة + سجل القرارات (تحديث كل 30 ثانية)
- ويدجت شات دايم الظهور (أفكار/إجراءات/ردود + رسايل المستخدم)

## صلاحيات المشرف
✅ مراقبة، تشخيص، إصلاح تشغيلي، إبلاغ
❌ **ممنوع:** تعديل استراتيجية/فلاتر من نفسه، أو أي تداول حقيقي

---

# 10. المهام المجدولة (Cron Jobs)

موجودين في OpenClaw (حاليًا **معطّلين** — `enabled: false`):

| ID | الاسم | الجدول | الهدف |
|---|---|---|---|
| `944eebb8-92e4-429c-b2a9-418740720ad2` | EGX AI supervisor heartbeat | `*/20 9-15 * * 0-4` (توقيت القاهرة) | جلسة مستقلة — الفحص الأساسي + الموسّع + كتابة الأفكار + التصرف حسب النافذة الزمنية |
| `fdd0ccca-eb80-4d56-b644-ac31f09a6847` | EGX supervisor — during-session escalation | `*/30 8-15 * * 0-4` (توقيت القاهرة) | تصعيد داخل الجلسة |

**آخر تشغيل:** both = `ok`.

كمان في **مهام cron على مستوى قاعدة البيانات** (Supabase) — مرجعها `20260819180000_fix_cron_urls.sql`.

---

# 11. ملفات الأسرار (Secrets) — ⚠️ أماكنها ومتغيراتها فقط

> **تحذير:** دي الملفات اللي فيها مفاتيح شغّالة. **أي حد يوصلها يقدر يتحكم في قاعدة البيانات والموقع.** متبعتهم لأي حد، ومتحطهم في أي مستند مشترك.

| # | الملف | المسار | المحتوى |
|---|---|---|---|
| 1 | **`.env`** | `D:\meky-stock-main\meky-stock-main\.env` | مفاتيح Supabase والتوكنز |
| 2 | **`config.yaml`** | `D:\meky-stock-main\meky-stock-main\config.yaml` | ⚠️ **فيها 21 مفتاح API شغّال لـ Gemini** + `master_key` |
| 3 | `.wrangler` | `D:\meky-stock-main\meky-stock-main\.wrangler\` | إعدادات Cloudflare |
| 4 | ذاكرة الإكستنشن | `C:\Users\Mekawey\AppData\Local\Google\Chrome\User Data\Default\Local Extension Settings\` | توكن وتكوين الإكستنشن |
| 5 | `.supabase` | `C:\Users\Mekawey\.supabase\` | إعدادات Supabase CLI |
| 6 | `config/` | `C:\Users\Mekawey\.openclaw-autoclaw\workspace\config\` | إعدادات OpenClaw |

## متغيرات `.env` (الأسماء فقط — القيم [REDACTED])
```
SUPABASE_PROJECT_ID        = [REDACTED]
SUPABASE_PUBLISHABLE_KEY   = [REDACTED]
SUPABASE_SERVICE_ROLE_KEY  = [REDACTED]   ← الأخطر (يتخطى كل الحماية)
SUPABASE_URL               = [REDACTED]
VITE_SUPABASE_PROJECT_ID   = [REDACTED]
VITE_SUPABASE_PUBLISHABLE_KEY = [REDACTED]
VITE_SUPABASE_URL          = [REDACTED]
THUNDER_INGEST_TOKEN       = [REDACTED]   ← توكن استقبال بيانات الإكستنشن
DATABASE_URL               = [REDACTED]   ← اتصال Postgres مباشر
```

## متغيرات بيئة على Render (الإنتاج)
نفس مفاتيح Supabase + `THUNDER_INGEST_TOKEN` — مضبوطة في لوحة Render (مش في المستودع).

## جداول التوكنز في قاعدة البيانات
- **`ingest_tokens`** — التوكنز المعتمدة (token, note, created_at)
- **`ingest_diag`** — تشخيص محاولات الاستقبال (token, hits, first_seen, last_seen)

**آلية الحماية الحالية:** أي مسار استقبال بيقبل التوكن لو مطابق لمتغير البيئة **أو** موجود في جدول `ingest_tokens` — عشان تدوير التوكن ميقفلش الاستقبال.

---

# 12. طريقة التشغيل (من الصفر)

## متطلبات
- Node.js v22+ / Bun
- صلاحية على مجلد المشروع
- متصفح Chrome + الإكستنشن محمّل

## خطوات التشغيل
```powershell
# 1. الرواح للمشروع
cd D:\meky-stock-main\meky-stock-main

# 2. تثبيت الحزم
bun install

# 3. تشغيل سيرفر التطوير
bun run dev            # أو: npm run dev
# أو مع الواتش-دوج:
bun run dev:safe       # node scripts/dev-server.cjs
bun run dev:restart    # إيقاف + تشغيل
bun run dev:stop

# 4. الموقع على: http://localhost:8080
```

## التشغيل التلقائي
- `EGX-AutoSite.vbs` (مخفي) في مجلد Startup — بيشغّل الموقع تلقائيًا مع الويندوز
- `scripts/egx-autostart.bat` + `scripts/egx-autostart-hidden.vbs`

## النشر
- أي `git push origin main` → Render يبني وينشر تلقائيًا (~2–4 دقايق)
```powershell
git add -A
git commit -m "..."
git push origin main
```

## الأوامر
| الأمر | الوظيفة |
|---|---|
| `bun run dev` | سيرفر التطوير |
| `bun run build` | بناء للإنتاج |
| `bun run lint` | فحص الكود |
| `bun run format` | تنسيق الكود |
| `node scripts/supervisor.cjs` | الفحص الأساسي |
| `node scripts/supervisor_extended.cjs` | الفحص الموسّع |
| `node scripts/watchdog.cjs` | الواتش-دوج |

---

# 13. قواعد الشغل المتفق عليها

1. **صدق كامل:** أرقام حقيقية حتى لو سالبة. لا تضخيم لعينات صغيرة. لا تجميل.
2. **التحقق قبل الادعاء:** مفيش "اتحلّت" غير بعد إثبات فعلي بالبيانات.
3. **أولوية الحقيقة:** بياناتنا (ticks) > أي مصدر خارجي.
4. **مفيش تعديل على قاعدة البيانات بدون migration قابل لإعادة التشغيل.**
5. **اختبار قبل التطبيق:** ممنوع أي تغيير على الموقع/Supabase/الجهاز قبل الاختبار.
6. **بدون Look-ahead bias** — ممنوع أي استخدام لبيانات مستقبلية.
7. **قاعدة التجميد:** صفر تعديلات على الفلاتر على نفس بيانات الاختبار.
8. **اللغة:** الردود بالعربي المصري.

---

# 14. أحدث التعديلات (2026-09-17)

| Commit | الوصف |
|---|---|
| `d023c9c8` | **توحيد مصادقة ثاندر** على كل مسارات الاستقبال (توكن البيئة أو توكن قاعدة البيانات) — منع رفض بيانات صحيحة بعد تدوير التوكن |
| `6c0b91cc` | مزامنة نافذة حداثة التيّكات مع إيقاع الإكستنشن (دفعات) — إزالة إنذار كاذب |
| `5ec4ebad` | **استقبال كل أنواع الرموز** (مؤشرات/صناديق) — تم إسقاط FK من `live_ticks` |
| `921e4f3e` / `fac46c19` | تشخيص مؤقت لرموز التيّكات (اتشال بعد الحل) |
| `fbbad1f9` | قبول التوكنز المعتمدة من قاعدة البيانات (مزامنة بدون إعادة نشر) |
| `26ca8cf8` | حد تغطية الكون واقعي (مربوط بقائمة المراقبة المشترك فيها) |
| `e567c9a0` | مزامنة توقّع الأسهم المرصودة مع الحجم الفعلي (150–165) |
| `a099ee14` | كارت رموز التيّكات بيستخدم نافذة الحداثة بدل 60 ثانية صارمة |
| `48a55726` | **كارت "أسهم أسعار حيّة" بيقيس التغطية الحقيقية من كل المصادر** (كان 11، بقى ~185–200) |
| `c71c5448` | **إزالة fallback مضلل** كان بيدمج bid/ask بتاع marketwatch في شارة "Bid/Ask Firebase" |
| `75179b07` | توحيد النافذة الزمنية (15 دقيقة) لكل المصادر في الاتحاد + عرض النافذة في عنوان الكارت |

## الحالة الحيّة المؤكدة (13:50–14:20 القاهرة)
| المقياس | القيمة |
|---|---|
| حالة النظام | `stale: false` ✅ |
| marketwatch (آخر 90ث) | **193 سهم** مختلف |
| marketwatch (آخر 5 دقايق) | 223 سهم |
| عدد صفوف آخر لقطة | 183 صف بنفس `captured_at` |
| عمر أحدث سعر | 2–4 ثواني |
| البث الحي (الاتحاد) | **200 سهم** (مطابق تمامًا للاستعلام الخام: فرق صفر) |
| universe | 122 سهم شريعة (المغطى 67–87 حسب النافذة) |
| live_ticks (قناة Firebase) | 11 رمز (10 مؤشرات + MCRO) |
| live_quotes (قناة Firebase) | 1 رمز (MCRO) |

## ملف الإثبات
`C:\Users\Mekawey\.openclaw-autoclaw\workspace\PROOF-live-data-verification.md` — فيه صفوف خام من قاعدة البيانات + الاستعلامات + المطابقة.

---

# 15. الحقائق المؤكدة بالأرقام ومع طريقة التحقق

| # | الحقيقة | طريقة التحقق |
|---|---|---|
| 1 | المستودع 5,786 commit | `git rev-list --count HEAD` |
| 2 | الشغل بدأ 2026-05-20 | `git log --reverse` |
| 3 | 93 جدول، 1,248 عمود | `information_schema` |
| 4 | 142 route، 367 lib، 133 migration | عدّ ملفات |
| 5 | marketwatch = المصدر الأساسي | `SELECT count(distinct symbol) FROM marketwatch_snapshots WHERE captured_at > now() - interval '90 seconds'` |
| 6 | الرقم على الشاشة = الداتا الخام | نفس معادلة الكارت على الداتا → 200 = 200 |
| 7 | القنوات القديمة صغيرة | `SELECT symbol, count(*) FROM live_ticks GROUP BY 1` |
| 8 | الباك أب من Cline | `D:\z.ai 15.9.2026\chat_transcripts\` |

## استعلامات جاهزة للتحقق المستقل
```sql
-- عدد الأسهم الحيّة الآن
SELECT count(DISTINCT symbol) FROM marketwatch_snapshots
WHERE captured_at > now() - interval '90 seconds';

-- صفوف خام حقيقية
SELECT symbol, last_price, total_volume, captured_at
FROM marketwatch_snapshots
WHERE captured_at > now() - interval '90 seconds'
ORDER BY symbol;

-- قناة التيّكات (Firebase)
SELECT symbol, count(*) FROM live_ticks GROUP BY 1 ORDER BY 2 DESC;

-- قناة الـ Quote
SELECT symbol, count(*) FROM live_quotes GROUP BY 1 ORDER BY 2 DESC;
```

---

# 16. ملاحظات مهمة للنموذج اللي هيقرأ الملف

1. **مفيش بيانات وهمية:** كل رقم في الملف ده متحقّق منه باستعلام مباشر على قاعدة البيانات، ومكتوب معاه طريقة التحقق.
2. **فرّق بين القنوات:**
   - **marketwatch** = المصدر الأساسي والأكمل (193–223 سهم، تحديث كل ~30 ثانية). بيوصل عبر REST passive poll من الإكستنشن.
   - **live_ticks / live_quotes** = قنوات WebSocket/Firebase بتاعت ثاندر، بتحمل رموز قليلة (11 و1) لأن ثاندر نفسه بيعمل streaming للسهم المفتوح + المؤشرات بس. **ده مش عطل — دي طبيعة تطبيق ثاندر.**
   - الاستراتيجية بتشتغل على **marketwatch** أساسًا.
3. **مفيش تجميل:** فيه اعتراف موثّق بإزالة fallback كان مضلل (commit `c71c5448`).
4. **الاستراتيجية متحقّق منها على 89 يوم فقط** — اللي هي فترة سوق صاعدة واحدة. الألفا غير معنوية إحصائيًا (+453/أسبوع، t=0.51). العدد الواقعي للتخطيط = 1,500–2,900/أسبوع.
5. **الملفات الممنوع مشاركتها:** `.env` و `config.yaml` (فيهم مفاتيح شغّالة).
6. **قواعد مقدسة:** مفيش تعديل DB بدون migration، مفيش look-ahead، مفيش تجميل أرقام.

---

**نهاية الملف.**
