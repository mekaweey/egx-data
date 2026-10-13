import { c as createSsrRpc } from "./router-BYsPPCpA.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
const getTradeLifecycleToday = createServerFn({
  method: "GET"
}).handler(createSsrRpc("b4dca6a6a1d0ee9c7018236f4645f542f3b3c7d729d4110b3dc29858fdfd1cae"));
const getSlippageReport = createServerFn({
  method: "GET"
}).inputValidator((data) => ({
  date: data?.date
})).handler(createSsrRpc("f5774357a183095d0c25a597179b3b01e927ba34f04d6404c18aec78a044e125"));
const getMissedSignalsReport = createServerFn({
  method: "GET"
}).inputValidator((data) => ({
  date: data?.date
})).handler(createSsrRpc("a523502bb449d6ec95657c1fc07896b231563af0b4226492dc2d4724e0fb5c5e"));
export {
  getSlippageReport as a,
  getTradeLifecycleToday as b,
  getMissedSignalsReport as g
};
