globalThis.__nitro_main__ = import.meta.url;
import { N as NodeResponse, s as serve } from "./_libs/srvx.mjs";
import { d as defineHandler, H as HTTPError, t as toEventHandler, a as defineLazyEventHandler, b as H3Core } from "./_libs/h3.mjs";
import { d as decodePath, w as withLeadingSlash, a as withoutTrailingSlash, j as joinURL } from "./_libs/ufo.mjs";
import { promises } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import "node:http";
import "node:stream";
import "node:stream/promises";
import "node:https";
import "node:http2";
import "./_libs/rou3.mjs";
function lazyService(loader) {
  let promise, mod;
  return {
    fetch(req) {
      if (mod) {
        return mod.fetch(req);
      }
      if (!promise) {
        promise = loader().then((_mod) => mod = _mod.default || _mod);
      }
      return promise.then((mod2) => mod2.fetch(req));
    }
  };
}
const services = {
  ["ssr"]: lazyService(() => import("./_ssr/index.mjs"))
};
globalThis.__nitro_vite_envs__ = services;
const headers = ((m) => function headersRouteRule(event) {
  for (const [key2, value] of Object.entries(m.options || {})) {
    event.res.headers.set(key2, value);
  }
});
const assets = {
  "/market_data_2026-08-13_full.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"a89f-ILurDZAQXJAiJAbeSCP5Vs593Lw"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 43167,
    "path": "../public/market_data_2026-08-13_full.csv"
  },
  "/all_market_data.zip": {
    "type": "application/zip",
    "etag": '"386ab-Z2bR/GBnjmsnTLCBMY272QzCyXA"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 231083,
    "path": "../public/all_market_data.zip"
  },
  "/lovable-chat-logger.zip": {
    "type": "application/zip",
    "etag": '"1722-7T1E1hzk/BeQSz5VojBI4WrO2gE"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 5922,
    "path": "../public/lovable-chat-logger.zip"
  },
  "/thunder-extension-v3.zip": {
    "type": "application/zip",
    "etag": '"4b7f1-TESGALcwoI/UJc3DqLTSzF9jo/c"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 309233,
    "path": "../public/thunder-extension-v3.zip"
  },
  "/thunder-extension-v4.1.72.zip": {
    "type": "application/zip",
    "etag": '"1a3ef-m3OWUIoy38K2RwHjLEHVCP8GUyw"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 107503,
    "path": "../public/thunder-extension-v4.1.72.zip"
  },
  "/thunder-extension-v4.1.73.zip": {
    "type": "application/zip",
    "etag": '"1a3ff-Jr5HGZJNjSzcUFjLTnnmrhBTojo"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 107519,
    "path": "../public/thunder-extension-v4.1.73.zip"
  },
  "/thunder-extension-v4.2.5.zip": {
    "type": "application/zip",
    "etag": '"1fa83-fqeNvj8cdSmsgB1QsafhOfWS9rs"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 129667,
    "path": "../public/thunder-extension-v4.2.5.zip"
  },
  "/thunder-extension-v4.1.71.zip": {
    "type": "application/zip",
    "etag": '"19e73-mSQHBEHEgmJuOCFNpRbjxvDjI54"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 106099,
    "path": "../public/thunder-extension-v4.1.71.zip"
  },
  "/thunder-proactive-v3.zip": {
    "type": "application/zip",
    "etag": '"4b7ad-/pAvymqMQm7QDljd1i9dZKmQCtw"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 309165,
    "path": "../public/thunder-proactive-v3.zip"
  },
  "/mock-thunder.html": {
    "type": "text/html; charset=utf-8",
    "etag": '"43ba-5q2oVv6X9g0VcdkeWJuHzsbNI3Y"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 17338,
    "path": "../public/mock-thunder.html"
  },
  "/thunder-unified-v4.zip": {
    "type": "application/zip",
    "etag": '"4b7ad-/pAvymqMQm7QDljd1i9dZKmQCtw"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 309165,
    "path": "../public/thunder-unified-v4.zip"
  },
  "/backup-v3/background.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1370-Rx1PjzRfKT5IWin1OTHdLYYGTYE"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 4976,
    "path": "../public/backup-v3/background.js"
  },
  "/thunder-extension-v4.zip": {
    "type": "application/zip",
    "etag": '"4c1a4-GX/9t3rAZQ5o3qVvUkJmSY1tevk"',
    "mtime": "2026-09-28T16:54:06.804Z",
    "size": 311716,
    "path": "../public/thunder-extension-v4.zip"
  },
  "/backup-v3/manifest.json": {
    "type": "application/json",
    "etag": '"72c-RqO4SbYhN/aYE786qSwOp8OyUK4"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 1836,
    "path": "../public/backup-v3/manifest.json"
  },
  "/backup-v3/config.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1793-o6G65yKLdLe6OFJb8tmj5LdKPig"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 6035,
    "path": "../public/backup-v3/config.js"
  },
  "/backup-v3/content.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1780-g6MD/G59eo9dXjZDTCj6WDcFPkM"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 6016,
    "path": "../public/backup-v3/content.js"
  },
  "/backup-v3/page-script.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"94-TQakEezZEO0Be9Avgm6gOzZ10Ds"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 148,
    "path": "../public/backup-v3/page-script.js"
  },
  "/assets/activity-CEqsY9Sg.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"ab-Fq6TwJFT74Vvf+0zITzAmo71iZM"',
    "mtime": "2026-10-01T10:10:03.213Z",
    "size": 171,
    "path": "../public/assets/activity-CEqsY9Sg.js"
  },
  "/thunder-extension.zip": {
    "type": "application/zip",
    "etag": '"4b7f1-eSE5BQF9901/SVrqXOfS6eKxGp4"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 309233,
    "path": "../public/thunder-extension.zip"
  },
  "/assets/activity-BDKK28QX.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"d05-cMJ4ZeQ1X7HTGS3TDFMjNlY6rZA"',
    "mtime": "2026-10-01T10:10:03.213Z",
    "size": 3333,
    "path": "../public/assets/activity-BDKK28QX.js"
  },
  "/backup-v3/popup.html": {
    "type": "text/html; charset=utf-8",
    "etag": '"831-m0WZRF70dXZzknJ5bmyev4/Lb2U"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 2097,
    "path": "../public/backup-v3/popup.html"
  },
  "/backup-v3/popup.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"753-iTKWmaikR3AIJa/Q+zeA7roa8zw"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 1875,
    "path": "../public/backup-v3/popup.js"
  },
  "/market_data_2026-08-13.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"153398-NJrXe/JWW2PZxnvlPzztOq1RQiw"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 1389464,
    "path": "../public/market_data_2026-08-13.csv"
  },
  "/assets/activity-PjiBByxK.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"c4-s1V8Rc0bv240hLGA4eDNW2X4XA8"',
    "mtime": "2026-10-01T10:10:03.213Z",
    "size": 196,
    "path": "../public/assets/activity-PjiBByxK.js"
  },
  "/assets/ai-supervisor-By9pfLuw.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1896-BNykYtTAMyUFh4N4zt+0g7DmEo0"',
    "mtime": "2026-10-01T10:10:03.213Z",
    "size": 6294,
    "path": "../public/assets/ai-supervisor-By9pfLuw.js"
  },
  "/assets/advisory-reports.functions-DWHcKt6x.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"112-q6Y3njQzHvQ9GUdNP2qHWzeNy/A"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 274,
    "path": "../public/assets/advisory-reports.functions-DWHcKt6x.js"
  },
  "/assets/automation-BajwCQ6F.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"ab-Fq6TwJFT74Vvf+0zITzAmo71iZM"',
    "mtime": "2026-10-01T10:10:03.213Z",
    "size": 171,
    "path": "../public/assets/automation-BajwCQ6F.js"
  },
  "/assets/automation-BV4Iwwqz.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"c4-s1V8Rc0bv240hLGA4eDNW2X4XA8"',
    "mtime": "2026-10-01T10:10:03.213Z",
    "size": 196,
    "path": "../public/assets/automation-BV4Iwwqz.js"
  },
  "/assets/automation-cT0jkiW9.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1286-VB4f+pWsFpuIcM0vx/Cbx+2AcMM"',
    "mtime": "2026-10-01T10:10:03.213Z",
    "size": 4742,
    "path": "../public/assets/automation-cT0jkiW9.js"
  },
  "/assets/backtest-Dh4w2mE4.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"5238-1YT4nuGw1iBjG3bfVUQf42wmZPg"',
    "mtime": "2026-10-01T10:10:03.213Z",
    "size": 21048,
    "path": "../public/assets/backtest-Dh4w2mE4.js"
  },
  "/assets/buy-now-button-CVmE-K1f.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"eb2-j9mjZ7canhBnkkrKt/H8dCAEGt4"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 3762,
    "path": "../public/assets/buy-now-button-CVmE-K1f.js"
  },
  "/assets/dashboard-builder-CzzAQZF4.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1086-+NnNI1i+87AtJnVa0jemfbzV960"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 4230,
    "path": "../public/assets/dashboard-builder-CzzAQZF4.js"
  },
  "/assets/dashboard.functions-BEWKHT8W.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"112-lWfczkRNmpsZor1LPFbY4HPdTBs"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 274,
    "path": "../public/assets/dashboard.functions-BEWKHT8W.js"
  },
  "/assets/daily-DBFGbdmV.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"336b-3i9VyvH/nh7JJiVkuz9dkkNFcWU"',
    "mtime": "2026-10-01T10:10:03.213Z",
    "size": 13163,
    "path": "../public/assets/daily-DBFGbdmV.js"
  },
  "/assets/decision-engine-C80d1bHu.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"8e-+TjFh7eq659VUi1jP2KQaSPXwcQ"',
    "mtime": "2026-10-01T10:10:03.213Z",
    "size": 142,
    "path": "../public/assets/decision-engine-C80d1bHu.js"
  },
  "/assets/decision-engine-D95XxEr0.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1bc0-z4nwbcDlGMXubsHSESTmU2f06hU"',
    "mtime": "2026-10-01T10:10:03.213Z",
    "size": 7104,
    "path": "../public/assets/decision-engine-D95XxEr0.js"
  },
  "/assets/decision-engine-DYp77ema.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"b3-BjEO2DwqE87JCCzLTsY1hh64fe0"',
    "mtime": "2026-10-01T10:10:03.213Z",
    "size": 179,
    "path": "../public/assets/decision-engine-DYp77ema.js"
  },
  "/assets/deep-BLkIXV5A.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"8e-a1GOhaw5DIfbt2uoBFWJIbh1Ssg"',
    "mtime": "2026-10-01T10:10:03.213Z",
    "size": 142,
    "path": "../public/assets/deep-BLkIXV5A.js"
  },
  "/assets/deep-Ccf0gzYQ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"82-TjYRdZeShwPptcE7YEgAsW+t/7U"',
    "mtime": "2026-10-01T10:10:03.213Z",
    "size": 130,
    "path": "../public/assets/deep-Ccf0gzYQ.js"
  },
  "/assets/deep-D6Dm3nUk.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"ce3-CFcmQ85oMye4ZBoiJWpCimJTlLo"',
    "mtime": "2026-10-01T10:10:03.213Z",
    "size": 3299,
    "path": "../public/assets/deep-D6Dm3nUk.js"
  },
  "/assets/execution-lab-B8XXp-Fw.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"a7-HTyUDDH3rYe0qt18bixsd+IvO/w"',
    "mtime": "2026-10-01T10:10:03.213Z",
    "size": 167,
    "path": "../public/assets/execution-lab-B8XXp-Fw.js"
  },
  "/assets/execution-lab-BEGU0eqv.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"88-mJN4QWNUdNIvXd+WTvmdf7m4ats"',
    "mtime": "2026-10-01T10:10:03.213Z",
    "size": 136,
    "path": "../public/assets/execution-lab-BEGU0eqv.js"
  },
  "/assets/execution-lab-CbZQ54Ar.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1183-WGPj6F4t03kplFsQVKJ8mWeXTQo"',
    "mtime": "2026-10-01T10:10:03.213Z",
    "size": 4483,
    "path": "../public/assets/execution-lab-CbZQ54Ar.js"
  },
  "/assets/ext-diag-DFG1sNuJ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1672-K80owSfHSK1PrfmXbhv+ivJCFDI"',
    "mtime": "2026-10-01T10:10:03.213Z",
    "size": 5746,
    "path": "../public/assets/ext-diag-DFG1sNuJ.js"
  },
  "/assets/extension-telemetry-CetG1LkO.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"212c-K8i/GbdUfWQglPywvkuMUKBLaog"',
    "mtime": "2026-10-01T10:10:03.213Z",
    "size": 8492,
    "path": "../public/assets/extension-telemetry-CetG1LkO.js"
  },
  "/assets/generateCategoricalChart-DZWYZ6A1.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"5d493-RDIRX9QDoxTf+nt/oa3qSjQg1KM"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 382099,
    "path": "../public/assets/generateCategoricalChart-DZWYZ6A1.js"
  },
  "/assets/halal-daytrade-RZvc1Riy.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"6aba-sRvDfWRZZh4qVUCI8cPk1FVgZog"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 27322,
    "path": "../public/assets/halal-daytrade-RZvc1Riy.js"
  },
  "/assets/health-check-qAfikztZ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"e8f-NAT96M+frh+QOaAmRYKfgznes3U"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 3727,
    "path": "../public/assets/health-check-qAfikztZ.js"
  },
  "/assets/health-CklDybpd.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"16da-LRCnP+Z49J1o9D9FV/gtrMWCrXQ"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 5850,
    "path": "../public/assets/health-CklDybpd.js"
  },
  "/assets/index-CFM3fdZV.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"895a-VBZY5xXn5Vggaar39/z8hd8wW90"',
    "mtime": "2026-10-01T10:10:03.213Z",
    "size": 35162,
    "path": "../public/assets/index-CFM3fdZV.js"
  },
  "/assets/investment-BZzEkyyS.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"2b3e-OStHob7fNUXKLhoEqWLlNtjYwqw"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 11070,
    "path": "../public/assets/investment-BZzEkyyS.js"
  },
  "/assets/learning-D2Fx2H_F.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"26a9-1GWmcE3l7mdvBhr3kYSpjwuPVgU"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 9897,
    "path": "../public/assets/learning-D2Fx2H_F.js"
  },
  "/assets/live-price-card-BFLG2ctu.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"104d-1F8eJoqJox505odLDSAbj/7kFZ8"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 4173,
    "path": "../public/assets/live-price-card-BFLG2ctu.js"
  },
  "/assets/market-pulse-card-CfWxGuwp.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"ae2-EGlSGDB5Bml0PvwMFRpFQAzbDJE"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 2786,
    "path": "../public/assets/market-pulse-card-CfWxGuwp.js"
  },
  "/assets/marketwatch-health-DGCS2gc-.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"8170-8SHxID68VUDVqFAyFF+fzZhaqNM"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 33136,
    "path": "../public/assets/marketwatch-health-DGCS2gc-.js"
  },
  "/assets/live-quote.functions-qf5jicD8.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"10e-wPN5zSZ0tuRFp0tHDyXOQyt4xFQ"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 270,
    "path": "../public/assets/live-quote.functions-qf5jicD8.js"
  },
  "/assets/missed-signals-F1QXpqKH.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1693-a86GCCyZvg625pD5GP/XfElVxQ0"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 5779,
    "path": "../public/assets/missed-signals-F1QXpqKH.js"
  },
  "/assets/missed-signals-Dx5zhE-h.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"b3-BjEO2DwqE87JCCzLTsY1hh64fe0"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 179,
    "path": "../public/assets/missed-signals-Dx5zhE-h.js"
  },
  "/assets/missed-signals--I_SgPnm.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"8e-+TjFh7eq659VUi1jP2KQaSPXwcQ"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 142,
    "path": "../public/assets/missed-signals--I_SgPnm.js"
  },
  "/assets/morning-u8Gnz6hZ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1211-bnFfMUGebXgq6xDDv7Um1f29Ox4"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 4625,
    "path": "../public/assets/morning-u8Gnz6hZ.js"
  },
  "/assets/paper-Cet3W59o.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"90-nFN3LYsedion7yAruKPx27agayo"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 144,
    "path": "../public/assets/paper-Cet3W59o.js"
  },
  "/assets/paper-DLrL0mYl.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"209f-kITau7V4h9p8FHMqL/loWUNy65s"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 8351,
    "path": "../public/assets/paper-DLrL0mYl.js"
  },
  "/assets/paper-DN_ungw8.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"ab-uWoqxgBdM0nbU9r1GMxl5/KvzYM"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 171,
    "path": "../public/assets/paper-DN_ungw8.js"
  },
  "/assets/performance-BD_3kElx.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"ca9-/e0ebwtit8hj68kduG8XGRgGp3U"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 3241,
    "path": "../public/assets/performance-BD_3kElx.js"
  },
  "/assets/performance-CpjCTakK.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"c4-s1V8Rc0bv240hLGA4eDNW2X4XA8"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 196,
    "path": "../public/assets/performance-CpjCTakK.js"
  },
  "/assets/index-B5-eQYsV.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"9dcc6-KbDsTaK26/23Zg1KtcjRC4OogBQ"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 646342,
    "path": "../public/assets/index-B5-eQYsV.js"
  },
  "/assets/performance-CSgAAPE8.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"ab-Fq6TwJFT74Vvf+0zITzAmo71iZM"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 171,
    "path": "../public/assets/performance-CSgAAPE8.js"
  },
  "/assets/plan-DoWcIy9a.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"44c1-dR8cd8nbF+d+aqLynpolJCFt/EU"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 17601,
    "path": "../public/assets/plan-DoWcIy9a.js"
  },
  "/all_days_historical_data_full.zip": {
    "type": "application/zip",
    "etag": '"51c799-7vFiJ6sp4u6qLWvW4YbcmtSRrTQ"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 5359513,
    "path": "../public/all_days_historical_data_full.zip"
  },
  "/assets/positions-B9fXerG4.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"2911-vUitKkfUpkO+I3YHJZgtYIcWwRY"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 10513,
    "path": "../public/assets/positions-B9fXerG4.js"
  },
  "/assets/positions-CM64EA5O.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"c4-s1V8Rc0bv240hLGA4eDNW2X4XA8"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 196,
    "path": "../public/assets/positions-CM64EA5O.js"
  },
  "/assets/positions-zMYxjjY_.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"ab-Fq6TwJFT74Vvf+0zITzAmo71iZM"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 171,
    "path": "../public/assets/positions-zMYxjjY_.js"
  },
  "/assets/reality-BXjOmjBv.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"c3-+r1mwolv+CQXOpOX/aXjqLTxqcw"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 195,
    "path": "../public/assets/reality-BXjOmjBv.js"
  },
  "/assets/reality-m4ku5LMf.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1a29-+d6PolCoMTdBM8C9ir8Aha4ZhsQ"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 6697,
    "path": "../public/assets/reality-m4ku5LMf.js"
  },
  "/assets/reconciliation-B17uaOxe.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"8e-+TjFh7eq659VUi1jP2KQaSPXwcQ"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 142,
    "path": "../public/assets/reconciliation-B17uaOxe.js"
  },
  "/assets/reconciliation-CL0mw1Ml.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1395-U6+anMNUV+r2u0sbYplcfGYxVP4"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 5013,
    "path": "../public/assets/reconciliation-CL0mw1Ml.js"
  },
  "/assets/reconciliation-Dip6QZaK.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"b3-BjEO2DwqE87JCCzLTsY1hh64fe0"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 179,
    "path": "../public/assets/reconciliation-Dip6QZaK.js"
  },
  "/assets/rights-BfWHdwh3.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"d4-wnFrXmlL3YgHt/vLQTudvVu27Os"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 212,
    "path": "../public/assets/rights-BfWHdwh3.js"
  },
  "/assets/rights-C6_TkkzP.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"dbc-s3oAfS/1aee5B2Vj3hZlZ6D45JI"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 3516,
    "path": "../public/assets/rights-C6_TkkzP.js"
  },
  "/assets/rights-BE4_NfAF.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"9a-rfsagufSU8OYlup+XtMKn1ZpULo"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 154,
    "path": "../public/assets/rights-BE4_NfAF.js"
  },
  "/assets/scalp-BWfl7z3H.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"90-nFN3LYsedion7yAruKPx27agayo"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 144,
    "path": "../public/assets/scalp-BWfl7z3H.js"
  },
  "/assets/scalp-BZNgZlsw.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"ab-uWoqxgBdM0nbU9r1GMxl5/KvzYM"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 171,
    "path": "../public/assets/scalp-BZNgZlsw.js"
  },
  "/assets/scalp-D4FELtco.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"3f3f-Mv1GwbdZAF6D818BgfpW/fd2JYQ"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 16191,
    "path": "../public/assets/scalp-D4FELtco.js"
  },
  "/assets/scalp-dip-C0dXSzBx.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"ab-uWoqxgBdM0nbU9r1GMxl5/KvzYM"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 171,
    "path": "../public/assets/scalp-dip-C0dXSzBx.js"
  },
  "/assets/scalp-dip-fKEx_E0z.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"90-nFN3LYsedion7yAruKPx27agayo"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 144,
    "path": "../public/assets/scalp-dip-fKEx_E0z.js"
  },
  "/assets/scalp-dip-C9uR2BQy.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"d866-WmdgTUaPDpIsDR/wG7btje3pAbo"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 55398,
    "path": "../public/assets/scalp-dip-C9uR2BQy.js"
  },
  "/assets/scalp-feasibility-DcjyhgP0.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"20d2-9cc2edr8ai5cuQAYyxecanpF68c"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 8402,
    "path": "../public/assets/scalp-feasibility-DcjyhgP0.js"
  },
  "/assets/scalp-fresh-CouHcMZn.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"ab-uWoqxgBdM0nbU9r1GMxl5/KvzYM"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 171,
    "path": "../public/assets/scalp-fresh-CouHcMZn.js"
  },
  "/assets/scalp-fresh-Cp7Uv9sL.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"90-nFN3LYsedion7yAruKPx27agayo"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 144,
    "path": "../public/assets/scalp-fresh-Cp7Uv9sL.js"
  },
  "/assets/scalp-fresh-CrEUHT5G.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1679-6l2moiK5/7m3zprK/9AuNBz6P0c"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 5753,
    "path": "../public/assets/scalp-fresh-CrEUHT5G.js"
  },
  "/assets/session-log-DwXTBHXk.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"5796-g61pnEinrn6bpiRKfiATQ2PUrUY"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 22422,
    "path": "../public/assets/session-log-DwXTBHXk.js"
  },
  "/assets/shadow-report-DeXougOD.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1cb8-JmIyzMnuDKgZdiqcsJ0HCEOL090"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 7352,
    "path": "../public/assets/shadow-report-DeXougOD.js"
  },
  "/assets/signal-quality-BM9waiP2.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1736-6AqxL4P9D4W0A/dUvKPoDrta9JQ"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 5942,
    "path": "../public/assets/signal-quality-BM9waiP2.js"
  },
  "/all_days_rich_data.zip": {
    "type": "application/zip",
    "etag": '"758202-cO862C7bxzVSMymtRO4bLfRZPps"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 7700994,
    "path": "../public/all_days_rich_data.zip"
  },
  "/assets/signal-quality-CaHuW4FQ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"8e-+TjFh7eq659VUi1jP2KQaSPXwcQ"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 142,
    "path": "../public/assets/signal-quality-CaHuW4FQ.js"
  },
  "/assets/signal-quality-YhHMcB2M.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"b3-BjEO2DwqE87JCCzLTsY1hh64fe0"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 179,
    "path": "../public/assets/signal-quality-YhHMcB2M.js"
  },
  "/assets/slippage-report-CFVHknJR.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1807-ChmfRnCT3JnRaqDpI9GCqXsLIRE"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 6151,
    "path": "../public/assets/slippage-report-CFVHknJR.js"
  },
  "/assets/slippage-report-DW2uFlyP.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"b3-BjEO2DwqE87JCCzLTsY1hh64fe0"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 179,
    "path": "../public/assets/slippage-report-DW2uFlyP.js"
  },
  "/assets/slippage-report-SMPA9yKm.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"8e-+TjFh7eq659VUi1jP2KQaSPXwcQ"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 142,
    "path": "../public/assets/slippage-report-SMPA9yKm.js"
  },
  "/assets/sniper-DTW9br_W.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1a41-+OO+sx+RruZ5znLZexHhJJ9D5Us"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 6721,
    "path": "../public/assets/sniper-DTW9br_W.js"
  },
  "/assets/stock._symbol-DSuQxVGZ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"4a0-mHKKc6Xw7uQ+CVJE+lcyD5Dg5+k"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 1184,
    "path": "../public/assets/stock._symbol-DSuQxVGZ.js"
  },
  "/assets/stock._symbol-CiFJ7h9E.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"659a-Nw4gryVagno7KTDZ2KBjh9T25f4"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 26010,
    "path": "../public/assets/stock._symbol-CiFJ7h9E.js"
  },
  "/assets/throttle-test-jFysmzcT.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1b11-PY1wrw9qd3tTqa23cRvPO+vRXKs"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 6929,
    "path": "../public/assets/throttle-test-jFysmzcT.js"
  },
  "/assets/thunder-connection-banner-BpdrZSdy.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"8b1-YEYtnRKZhjKiVttVj84+5PuVWUg"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 2225,
    "path": "../public/assets/thunder-connection-banner-BpdrZSdy.js"
  },
  "/assets/thunder-live-B-2i3pOh.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"2875-yoUYT7Omb9IfkH5lmKrCl3YnZ0E"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 10357,
    "path": "../public/assets/thunder-live-B-2i3pOh.js"
  },
  "/assets/thunder-tabs-DyUWuUMa.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"c7c-38eFUj5rohQcFp5A0+y5xNQ+KNo"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 3196,
    "path": "../public/assets/thunder-tabs-DyUWuUMa.js"
  },
  "/assets/styles-DX9Ap4IU.css": {
    "type": "text/css; charset=utf-8",
    "etag": '"203b4-hv19KjenPFuQUXO6rbqAVVgn064"',
    "mtime": "2026-10-01T10:10:03.200Z",
    "size": 132020,
    "path": "../public/assets/styles-DX9Ap4IU.css"
  },
  "/assets/thunder-i6WMQoWl.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"21be-Sdq2wRimZ0dI7vuFXizA9l4W5Sk"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 8638,
    "path": "../public/assets/thunder-i6WMQoWl.js"
  },
  "/assets/today-CUOxRbVP.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"4386-U0mOpaRy61F1MusrlkvVWmNw2AI"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 17286,
    "path": "../public/assets/today-CUOxRbVP.js"
  },
  "/assets/tiers-CxWx6AZ8.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1efa-JhIPo/ypPTJ9wzibrYQgDQXiFMU"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 7930,
    "path": "../public/assets/tiers-CxWx6AZ8.js"
  },
  "/assets/tomorrow-E1iP36S8.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1df5-EW3E5YJC74Md+mwIFsYxTrGIlHw"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 7669,
    "path": "../public/assets/tomorrow-E1iP36S8.js"
  },
  "/assets/tomorrow.functions-07bOWWWB.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"177-3SxVnJC68ELaMm8lGZvHasd6YOc"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 375,
    "path": "../public/assets/tomorrow.functions-07bOWWWB.js"
  },
  "/assets/track-record-B2BLHz0w.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1eeb-V8isSMxxmw9QQem1LAY0IGglfng"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 7915,
    "path": "../public/assets/track-record-B2BLHz0w.js"
  },
  "/assets/track-record.functions-D19rK_hB.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"a3-9sXiozulp4vbJKEKDvbdpmwEn40"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 163,
    "path": "../public/assets/track-record.functions-D19rK_hB.js"
  },
  "/assets/trade-ledger.functions-CYHYSpDj.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"177-+trcTRBrmrdLFYbMJ8AYTb/dThM"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 375,
    "path": "../public/assets/trade-ledger.functions-CYHYSpDj.js"
  },
  "/assets/trade-lifecycle-BAEHiVVf.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"8e-+TjFh7eq659VUi1jP2KQaSPXwcQ"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 142,
    "path": "../public/assets/trade-lifecycle-BAEHiVVf.js"
  },
  "/assets/trade-lifecycle-DV70m4wJ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"b3-BjEO2DwqE87JCCzLTsY1hh64fe0"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 179,
    "path": "../public/assets/trade-lifecycle-DV70m4wJ.js"
  },
  "/assets/trade-lifecycle-RpqSHSrS.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1129-ytb48TiCaahmyv2ErAYMUPkQbxk"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 4393,
    "path": "../public/assets/trade-lifecycle-RpqSHSrS.js"
  },
  "/assets/useBaseQuery-D2P8MVf2.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"2278-cPdEDoBfSBJ33Ao8EvOw01eD/Yo"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 8824,
    "path": "../public/assets/useBaseQuery-D2P8MVf2.js"
  },
  "/assets/useMutation-Cnikz9LH.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"89b-c6doXAku0xnL0NyfuWJAWFpMhrY"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 2203,
    "path": "../public/assets/useMutation-Cnikz9LH.js"
  },
  "/assets/useQuery-R4IsrjLo.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"64-RLfPTIC+5Xu5nl+2H5M77f0u6nw"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 100,
    "path": "../public/assets/useQuery-R4IsrjLo.js"
  },
  "/assets/useSuspenseQuery-DdC17mTz.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"ad-ZJ5lGO0cxJ9FcXdaivDftJ9FAls"',
    "mtime": "2026-10-01T10:10:03.214Z",
    "size": 173,
    "path": "../public/assets/useSuspenseQuery-DdC17mTz.js"
  },
  "/thunder-extension-v4/config.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1793-o6G65yKLdLe6OFJb8tmj5LdKPig"',
    "mtime": "2026-09-28T16:53:47.620Z",
    "size": 6035,
    "path": "../public/thunder-extension-v4/config.js"
  },
  "/thunder-extension-v4/cdp-module.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"e82e-RonmwBXZwPIgY0DrEkeciRWHQRk"',
    "mtime": "2026-09-28T16:53:47.633Z",
    "size": 59438,
    "path": "../public/thunder-extension-v4/cdp-module.js"
  },
  "/thunder-extension-v4/manifest.json": {
    "type": "application/json",
    "etag": '"973-LEKx30WCzrf0UFNj1AM6FzM5IKI"',
    "mtime": "2026-09-28T16:54:06.762Z",
    "size": 2419,
    "path": "../public/thunder-extension-v4/manifest.json"
  },
  "/thunder-extension-v4/offscreen.html": {
    "type": "text/html; charset=utf-8",
    "etag": '"aa-yMpk73khHbBJkfEQfQ0Dq1Mz4CU"',
    "mtime": "2026-09-28T16:53:47.634Z",
    "size": 170,
    "path": "../public/thunder-extension-v4/offscreen.html"
  },
  "/thunder-extension-v4/offscreen.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"3be-KBPbkTJ2lvcv4OPTC3ou3Q1Qt5M"',
    "mtime": "2026-09-28T16:53:47.636Z",
    "size": 958,
    "path": "../public/thunder-extension-v4/offscreen.js"
  },
  "/thunder-extension-v4/overlay-module.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"5580-d6x6T4Qieq3tAJ4Ux3Ba0LMvBZ0"',
    "mtime": "2026-09-28T16:53:47.636Z",
    "size": 21888,
    "path": "../public/thunder-extension-v4/overlay-module.js"
  },
  "/thunder-extension-v4/popup.html": {
    "type": "text/html; charset=utf-8",
    "etag": '"534e-JsqfEjkFBMwUA0gt1ZeEbyZ6KN8"',
    "mtime": "2026-09-28T16:53:47.629Z",
    "size": 21326,
    "path": "../public/thunder-extension-v4/popup.html"
  },
  "/thunder-extension-v4/page-script.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"14f9b-39/j/2WMKsDEI9V0U/OaTEcqu6c"',
    "mtime": "2026-09-28T16:53:47.626Z",
    "size": 85915,
    "path": "../public/thunder-extension-v4/page-script.js"
  },
  "/thunder-extension-v4/content.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"311e0-61pdW0j9FzVRgD98knS7VtzhhFs"',
    "mtime": "2026-09-28T16:53:47.623Z",
    "size": 201184,
    "path": "../public/thunder-extension-v4/content.js"
  },
  "/thunder-extension-v4/background.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1f31e-UovkLjfd/qRV4roUAz1/5jvxRhM"',
    "mtime": "2026-09-28T16:53:47.619Z",
    "size": 127774,
    "path": "../public/thunder-extension-v4/background.js"
  },
  "/thunder-extension-v4/popup.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"a32c-5tcrzeUFOWf2M7Sh4CHTd3c3Pd4"',
    "mtime": "2026-09-28T16:53:47.631Z",
    "size": 41772,
    "path": "../public/thunder-extension-v4/popup.js"
  },
  "/rich_data_export/2026-06-24.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"5b473-5eIUlqFqbVREf3ExCxUmNs+zpjg"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 373875,
    "path": "../public/rich_data_export/2026-06-24.csv"
  },
  "/rich_data_export/2026-06-29.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"51b50-dvn+OBkaHUhC5qQW20DlPtA2Gy8"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 334672,
    "path": "../public/rich_data_export/2026-06-29.csv"
  },
  "/rich_data_export/2026-07-02.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"2771-fhpeleRYvNiFKrc9+HdZOI3qfcI"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 10097,
    "path": "../public/rich_data_export/2026-07-02.csv"
  },
  "/rich_data_export/2026-06-08.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"278e8a-TSAW7yUV+XAiU2OKU4qquZodbZE"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 2592394,
    "path": "../public/rich_data_export/2026-06-08.csv"
  },
  "/rich_data_export/2026-06-10.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"27a1ae-TkfoR4yJBGK9GllvuPagwFiID58"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 2597294,
    "path": "../public/rich_data_export/2026-06-10.csv"
  },
  "/rich_data_export/2026-06-14.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"272e4d-ko6CEf6LRBQjYE7eMuRml3urenc"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 2567757,
    "path": "../public/rich_data_export/2026-06-14.csv"
  },
  "/rich_data_export/2026-06-11.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"278654-XEFizjDzKAkUe7+DEVssOO8ZGUE"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 2590292,
    "path": "../public/rich_data_export/2026-06-11.csv"
  },
  "/rich_data_export/2026-06-22.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"c3aac-Pwme4T9LUWmYqDy5ePiiuvLRq/0"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 801452,
    "path": "../public/rich_data_export/2026-06-22.csv"
  },
  "/rich_data_export/2026-06-25.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"ae540-ecwtAbToucWjWDnvH8AAhQFS3zQ"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 714048,
    "path": "../public/rich_data_export/2026-06-25.csv"
  },
  "/rich_data_export/2026-06-30.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"9000b-CxgC55BskAnTl4JqOUIpz6ViwB8"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 589835,
    "path": "../public/rich_data_export/2026-06-30.csv"
  },
  "/rich_data_export/2026-06-28.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"c39b9-Z7MT4zAt96Yn6NkaY7ehQRZl+BU"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 801209,
    "path": "../public/rich_data_export/2026-06-28.csv"
  },
  "/rich_data_export/2026-06-23.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"9708d-cUINA6Dok5VtN5byVMwLYjtTyC4"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 618637,
    "path": "../public/rich_data_export/2026-06-23.csv"
  },
  "/rich_data_export/2026-07-01.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"b0e28-o5XeibEfo6k53qng/z8ngkMiLFo"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 724520,
    "path": "../public/rich_data_export/2026-07-01.csv"
  },
  "/rich_data_export/2026-07-05.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"b90d9-9ZvEMbNcJfXPH6t3PcYs29EOczc"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 757977,
    "path": "../public/rich_data_export/2026-07-05.csv"
  },
  "/rich_data_export/2026-07-07.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"92fe0-um//+DE/48vTKtVz+01UMOnSw+g"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 602080,
    "path": "../public/rich_data_export/2026-07-07.csv"
  },
  "/rich_data_export/2026-07-06.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"cdba8-yXfpWhyAUy9ATc9rYzYL75MXU6M"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 842664,
    "path": "../public/rich_data_export/2026-07-06.csv"
  },
  "/rich_data_export/2026-07-08.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"984bc-PByriWmCGaPlPI1M11El3R/b35s"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 623804,
    "path": "../public/rich_data_export/2026-07-08.csv"
  },
  "/rich_data_export/2026-06-15.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"27869f-K2ywqDDiBYlOnuIi8L6NpCbtxqo"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 2590367,
    "path": "../public/rich_data_export/2026-06-15.csv"
  },
  "/rich_data_export/2026-06-16.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"27737f-p8cOj/nkqUHZ9y9bh3N4fG44VPU"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 2585471,
    "path": "../public/rich_data_export/2026-06-16.csv"
  },
  "/rich_data_export/2026-06-09.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"278a61-Cijrcv0NCPOCr+J6PKDmhuTnrpE"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 2591329,
    "path": "../public/rich_data_export/2026-06-09.csv"
  },
  "/rich_data_export/2026-07-09.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"86b9c-uWtIakpIwRCqctqbaiJs9YQVVOE"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 551836,
    "path": "../public/rich_data_export/2026-07-09.csv"
  },
  "/rich_data_export/2026-06-17.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"274303-anAhe/1RkdKMa7ZdDPPqqqvpRWY"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 2573059,
    "path": "../public/rich_data_export/2026-06-17.csv"
  },
  "/rich_data_export/2026-07-12.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"674ca-1z63UfFKXBetgbrBj7PJp3rwaC4"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 423114,
    "path": "../public/rich_data_export/2026-07-12.csv"
  },
  "/rich_data_export/2026-07-13.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"5cca8-GoKbgPOgudBmWgbKylz/EBLqYU0"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 380072,
    "path": "../public/rich_data_export/2026-07-13.csv"
  },
  "/rich_data_export/2026-07-14.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"24ece-BZmpHACtbB++UjLHeZ8grPxgPZM"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 151246,
    "path": "../public/rich_data_export/2026-07-14.csv"
  },
  "/rich_data_export/2026-07-16.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"32a17-z3vqAjdG4hDXQIR/js4AjGho1kY"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 207383,
    "path": "../public/rich_data_export/2026-07-16.csv"
  },
  "/rich_data_export/2026-07-29.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"10e73-NvOJIsGLvFIA/n7P9znGWIRnlGU"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 69235,
    "path": "../public/rich_data_export/2026-07-29.csv"
  },
  "/rich_data_export/2026-08-04.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"53b6a-F+9M6aF7/s0sGqerrCOSCsh4tnM"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 342890,
    "path": "../public/rich_data_export/2026-08-04.csv"
  },
  "/rich_data_export/2026-07-15.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"fbc22-hJQ2GOIuGf0vsXOazUDRB6aFAyU"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 1031202,
    "path": "../public/rich_data_export/2026-07-15.csv"
  },
  "/rich_data_export/2026-08-06.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"246a-GMw5zNTWlye4QBYN+bgCEfjnaiQ"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 9322,
    "path": "../public/rich_data_export/2026-08-06.csv"
  },
  "/rich_data_export/2026-08-09.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"1dc16-9Hy+ZiM2cw4qLuBE8r4siUHiAaw"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 121878,
    "path": "../public/rich_data_export/2026-08-09.csv"
  },
  "/rich_data_export/2026-06-07.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"33c965-q98pmU00g7tKqMQJWBI9NPzH4WU"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 3393893,
    "path": "../public/rich_data_export/2026-06-07.csv"
  },
  "/rich_data_export/2026-06-18.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"2789fe-B4+feHPxGgpFOfbVz4J65aFtIXc"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 2591230,
    "path": "../public/rich_data_export/2026-06-18.csv"
  },
  "/rich_data_export/2026-07-19.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"11dae0-79MORfXJI04sX+BT/2/jXmhKS9I"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 1170144,
    "path": "../public/rich_data_export/2026-07-19.csv"
  },
  "/thunder-extension-v4/extension/background.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1f31e-UovkLjfd/qRV4roUAz1/5jvxRhM"',
    "mtime": "2026-09-28T16:53:47.640Z",
    "size": 127774,
    "path": "../public/thunder-extension-v4/extension/background.js"
  },
  "/rich_data_export/2026-06-21.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"290e83-wZqa7GqrqLvnLmhtAL2nMaDIF4o"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 2690691,
    "path": "../public/rich_data_export/2026-06-21.csv"
  },
  "/rich_data_export/2026-07-20.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"1a715f-6Sjgc+eISTUsKuma2bV0NGJjc84"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 1732959,
    "path": "../public/rich_data_export/2026-07-20.csv"
  },
  "/thunder-extension-v4/extension/cdp-module.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"e748-NhNndI3t2ANX082fiQjPTOQlF5M"',
    "mtime": "2026-09-28T16:53:47.641Z",
    "size": 59208,
    "path": "../public/thunder-extension-v4/extension/cdp-module.js"
  },
  "/rich_data_export/2026-07-22.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"1f8bf7-HDjTUU9zRge2WzEzijI79i+rNsU"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 2067447,
    "path": "../public/rich_data_export/2026-07-22.csv"
  },
  "/rich_data_export/2026-08-05.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"d98d8-RDmSNc2Cn5PZjvF0AnjKZ8CBez0"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 891096,
    "path": "../public/rich_data_export/2026-08-05.csv"
  },
  "/rich_data_export/2026-08-12.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"81878-6hfx2DcO/KFugUYyM+dv4BCfUXU"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 530552,
    "path": "../public/rich_data_export/2026-08-12.csv"
  },
  "/thunder-extension-v4/extension/manifest.json": {
    "type": "application/json",
    "etag": '"96a-3M/R6lFMPbpi3GV+KBxAa04S0LY"',
    "mtime": "2026-09-28T16:54:06.764Z",
    "size": 2410,
    "path": "../public/thunder-extension-v4/extension/manifest.json"
  },
  "/thunder-extension-v4/extension/offscreen.html": {
    "type": "text/html; charset=utf-8",
    "etag": '"aa-yMpk73khHbBJkfEQfQ0Dq1Mz4CU"',
    "mtime": "2026-09-28T16:53:47.650Z",
    "size": 170,
    "path": "../public/thunder-extension-v4/extension/offscreen.html"
  },
  "/thunder-extension-v4/extension/config.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1793-o6G65yKLdLe6OFJb8tmj5LdKPig"',
    "mtime": "2026-09-28T16:53:47.643Z",
    "size": 6035,
    "path": "../public/thunder-extension-v4/extension/config.js"
  },
  "/thunder-extension-v4/extension/page-script.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"14f85-p47Wz1XB5Q26ZHDvkIr7WJ3NLng"',
    "mtime": "2026-09-28T16:53:47.653Z",
    "size": 85893,
    "path": "../public/thunder-extension-v4/extension/page-script.js"
  },
  "/thunder-extension-v4/extension/offscreen.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"3be-KBPbkTJ2lvcv4OPTC3ou3Q1Qt5M"',
    "mtime": "2026-09-28T16:53:47.651Z",
    "size": 958,
    "path": "../public/thunder-extension-v4/extension/offscreen.js"
  },
  "/thunder-extension-v4/extension/overlay-module.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"5580-d6x6T4Qieq3tAJ4Ux3Ba0LMvBZ0"',
    "mtime": "2026-09-28T16:53:47.651Z",
    "size": 21888,
    "path": "../public/thunder-extension-v4/extension/overlay-module.js"
  },
  "/thunder-extension-v4/extension/content.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"311e0-61pdW0j9FzVRgD98knS7VtzhhFs"',
    "mtime": "2026-09-28T16:53:47.647Z",
    "size": 201184,
    "path": "../public/thunder-extension-v4/extension/content.js"
  },
  "/thunder-extension-v4/extension/popup.html": {
    "type": "text/html; charset=utf-8",
    "etag": '"534e-JsqfEjkFBMwUA0gt1ZeEbyZ6KN8"',
    "mtime": "2026-09-28T16:53:47.654Z",
    "size": 21326,
    "path": "../public/thunder-extension-v4/extension/popup.html"
  },
  "/thunder-extension-v4/extension/popup.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"a32c-5tcrzeUFOWf2M7Sh4CHTd3c3Pd4"',
    "mtime": "2026-09-28T16:53:47.656Z",
    "size": 41772,
    "path": "../public/thunder-extension-v4/extension/popup.js"
  },
  "/rich_data_export/2026-08-13.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"16baa9-TqhIFyvpc6+poBfzjGAwrJf2Yk0"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 1489577,
    "path": "../public/rich_data_export/2026-08-13.csv"
  },
  "/rich_data_export/2026-07-26.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"306bc9-qV6LyHh2H2foIdui2hoaW9aDeo0"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 3173321,
    "path": "../public/rich_data_export/2026-07-26.csv"
  },
  "/rich_data_export/2026-07-21.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"3c304b-4Z3oiPuCnWmMe4nlpjvqKagbT0A"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 3944523,
    "path": "../public/rich_data_export/2026-07-21.csv"
  },
  "/rich_data_export/2026-07-30.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"3bf907-ICI7A/bLmaIZK3Fn8P+7jL+8HTY"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 3930375,
    "path": "../public/rich_data_export/2026-07-30.csv"
  },
  "/rich_data_export/2026-08-03.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"4f6856-DhCelmaNhTIRCyOcb/T9rke/nyY"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 5204054,
    "path": "../public/rich_data_export/2026-08-03.csv"
  },
  "/rich_data_export/2026-08-02.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"68a164-StvlLofAPHMPe7gq+tJjxSJeDNs"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 6857060,
    "path": "../public/rich_data_export/2026-08-02.csv"
  },
  "/rich_data_export/2026-07-27.csv": {
    "type": "text/csv; charset=utf-8",
    "etag": '"8d8c0a-JMfAtevHqEF4T6nsaXOcgdF4rS4"',
    "mtime": "2026-08-17T20:14:11.000Z",
    "size": 9276426,
    "path": "../public/rich_data_export/2026-07-27.csv"
  }
};
function readAsset(id) {
  const serverDir = dirname(fileURLToPath(globalThis.__nitro_main__));
  return promises.readFile(resolve(serverDir, assets[id].path));
}
const publicAssetBases = {};
function isPublicAssetURL(id = "") {
  if (assets[id]) {
    return true;
  }
  for (const base in publicAssetBases) {
    if (id.startsWith(base)) {
      return true;
    }
  }
  return false;
}
function getAsset(id) {
  return assets[id];
}
const METHODS = /* @__PURE__ */ new Set(["HEAD", "GET"]);
const EncodingMap = {
  gzip: ".gz",
  br: ".br",
  zstd: ".zst"
};
const _08hJSV = defineHandler((event) => {
  if (event.req.method && !METHODS.has(event.req.method)) {
    return;
  }
  let id = decodePath(withLeadingSlash(withoutTrailingSlash(event.url.pathname)));
  let asset;
  const encodingHeader = event.req.headers.get("accept-encoding") || "";
  const encodings = [...encodingHeader.split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(), ""];
  for (const encoding of encodings) {
    for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
      const _asset = getAsset(_id);
      if (_asset) {
        asset = _asset;
        id = _id;
        break;
      }
    }
  }
  if (!asset) {
    if (isPublicAssetURL(id)) {
      event.res.headers.delete("Cache-Control");
      throw new HTTPError({ status: 404 });
    }
    return;
  }
  if (encodings.length > 1) {
    event.res.headers.append("Vary", "Accept-Encoding");
  }
  const ifNotMatch = event.req.headers.get("if-none-match") === asset.etag;
  if (ifNotMatch) {
    event.res.status = 304;
    event.res.statusText = "Not Modified";
    return "";
  }
  const ifModifiedSinceH = event.req.headers.get("if-modified-since");
  const mtimeDate = new Date(asset.mtime);
  if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
    event.res.status = 304;
    event.res.statusText = "Not Modified";
    return "";
  }
  if (asset.type) {
    event.res.headers.set("Content-Type", asset.type);
  }
  if (asset.etag && !event.res.headers.has("ETag")) {
    event.res.headers.set("ETag", asset.etag);
  }
  if (asset.mtime && !event.res.headers.has("Last-Modified")) {
    event.res.headers.set("Last-Modified", mtimeDate.toUTCString());
  }
  if (asset.encoding && !event.res.headers.has("Content-Encoding")) {
    event.res.headers.set("Content-Encoding", asset.encoding);
  }
  if (asset.size > 0 && !event.res.headers.has("Content-Length")) {
    event.res.headers.set("Content-Length", asset.size.toString());
  }
  return readAsset(id);
});
const findRouteRules = /* @__PURE__ */ (() => {
  const $0 = [{ name: "headers", route: "/assets/**", handler: headers, options: { "cache-control": "public, max-age=31536000, immutable" } }];
  return (m, p) => {
    let r = [];
    if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
    let s = p.split("/"), l = s.length;
    if (l > 1) {
      if (s[1] === "assets") {
        r.unshift({ data: $0, params: { "_": s.slice(2).join("/") } });
      }
    }
    return r;
  };
})();
const _lazy_nGmcpU = defineLazyEventHandler(() => import("./_chunks/ssr-renderer.mjs"));
const findRoute = /* @__PURE__ */ (() => {
  const data = { route: "/**", handler: _lazy_nGmcpU };
  return ((_m, p) => {
    return { data, params: { "_": p.slice(1) } };
  });
})();
const globalMiddleware = [
  toEventHandler(_08hJSV)
].filter(Boolean);
const errorHandler$1 = (error, event) => {
  const res = defaultHandler(error, event);
  return new NodeResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event) {
  const unhandled = error.unhandled ?? !HTTPError.isError(error);
  const { status = 500, statusText = "" } = unhandled ? {} : error;
  if (status === 404) {
    const url = event.url || new URL(event.req.url);
    const baseURL = "/";
    if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) {
      return {
        status: 302,
        headers: new Headers({ location: `${baseURL}${url.pathname.slice(1)}${url.search}` })
      };
    }
  }
  const headers2 = new Headers(unhandled ? {} : error.headers);
  headers2.set("content-type", "application/json; charset=utf-8");
  const jsonBody = unhandled ? {
    status,
    unhandled: true
  } : typeof error.toJSON === "function" ? error.toJSON() : {
    status,
    statusText,
    message: error.message
  };
  return {
    status,
    statusText,
    headers: headers2,
    body: {
      error: true,
      ...jsonBody
    }
  };
}
const errorHandlers = [errorHandler$1];
async function errorHandler(error, event) {
  for (const handler of errorHandlers) {
    try {
      const response = await handler(error, event, { defaultHandler });
      if (response) {
        return response;
      }
    } catch (error2) {
      console.error(error2);
    }
  }
}
function createNitroApp() {
  const captureError = (error, errorCtx) => {
    if (errorCtx?.event) {
      const errors = errorCtx.event.req.context?.nitro?.errors;
      if (errors) {
        errors.push({ error, context: errorCtx });
      }
    }
  };
  const h3App = createH3App({
    onError(error, event) {
      return errorHandler(error, event);
    }
  });
  let appHandler = (req) => {
    req.context ||= {};
    req.context.nitro = req.context.nitro || { errors: [] };
    return h3App.fetch(req);
  };
  return {
    fetch: appHandler,
    h3: h3App,
    hooks: void 0,
    captureError
  };
}
function createH3App(config) {
  const h3App = new H3Core(config);
  h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
  h3App["~middleware"].push(...globalMiddleware);
  h3App["~getMiddleware"] = (event, route) => {
    const pathname = event.url.pathname;
    const method = event.req.method;
    const middleware = [];
    const routeRules = getRouteRules(method, pathname);
    event.context.routeRules = routeRules?.routeRules;
    if (routeRules?.routeRuleMiddleware.length) {
      middleware.push(...routeRules.routeRuleMiddleware);
    }
    middleware.push(...h3App["~middleware"]);
    if (route?.data?.middleware?.length) {
      middleware.push(...route.data.middleware);
    }
    return middleware;
  };
  return h3App;
}
const APP_ID = "default";
function useNitroApp() {
  let instance = useNitroApp._instance;
  if (instance) {
    return instance;
  }
  instance = useNitroApp._instance = createNitroApp();
  globalThis.__nitro__ = globalThis.__nitro__ || {};
  globalThis.__nitro__[APP_ID] = instance;
  return instance;
}
function getRouteRules(method, pathname) {
  const m = findRouteRules(method, pathname);
  if (!m?.length) {
    return { routeRuleMiddleware: [] };
  }
  const routeRules = {};
  for (const layer of m) {
    for (const rule of layer.data) {
      const currentRule = routeRules[rule.name];
      if (currentRule) {
        if (rule.options === false) {
          delete routeRules[rule.name];
          continue;
        }
        if (typeof currentRule.options === "object" && typeof rule.options === "object") {
          currentRule.options = {
            ...currentRule.options,
            ...rule.options
          };
        } else {
          currentRule.options = rule.options;
        }
        currentRule.route = rule.route;
        currentRule.params = {
          ...currentRule.params,
          ...layer.params
        };
      } else if (rule.options !== false) {
        routeRules[rule.name] = {
          ...rule,
          params: layer.params
        };
      }
    }
  }
  const middleware = [];
  const orderedRules = Object.values(routeRules).sort((a, b) => (a.handler?.order || 0) - (b.handler?.order || 0));
  for (const rule of orderedRules) {
    if (rule.options === false || !rule.handler) {
      continue;
    }
    middleware.push(rule.handler(rule));
  }
  return {
    routeRules,
    routeRuleMiddleware: middleware
  };
}
function _captureError(error, type) {
  console.error(`[${type}]`, error);
  useNitroApp().captureError?.(error, { tags: [type] });
}
function trapUnhandledErrors() {
  process.on("unhandledRejection", (error) => _captureError(error, "unhandledRejection"));
  process.on("uncaughtException", (error) => _captureError(error, "uncaughtException"));
}
const tracingSrvxPlugins = [];
const _parsedPort = Number.parseInt(process.env.NITRO_PORT ?? process.env.PORT ?? "");
const port = Number.isNaN(_parsedPort) ? 3e3 : _parsedPort;
const host = process.env.NITRO_HOST || process.env.HOST;
const cert = process.env.NITRO_SSL_CERT;
const key = process.env.NITRO_SSL_KEY;
const nitroApp = useNitroApp();
serve({
  port,
  hostname: host,
  tls: cert && key ? {
    cert,
    key
  } : void 0,
  fetch: nitroApp.fetch,
  plugins: [...tracingSrvxPlugins]
});
trapUnhandledErrors();
const nodeServer = {};
export {
  nodeServer as default
};
