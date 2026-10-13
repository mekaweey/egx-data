import { c as createSsrRpc } from "./router-BYsPPCpA.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
import { o as object, c as array, b as string } from "../_libs/zod.mjs";
const getLiveQuote = createServerFn({
  method: "GET"
}).inputValidator((d) => object({
  symbol: string().min(1).max(20).regex(/^[A-Z0-9.]+$/i)
}).parse(d)).handler(createSsrRpc("a0f88cdb691910792e5ff92c10d3682aabad833482cc13bf7dad52d831f06357"));
const getLiveQuotes = createServerFn({
  method: "POST"
}).inputValidator((d) => object({
  symbols: array(string().min(1).max(20).regex(/^[A-Z0-9.]+$/i)).min(1).max(150)
}).parse(d)).handler(createSsrRpc("7edf0edde40b0f1612d8ec3843c45c71b3276755691ee91223ab77f16f68441b"));
export {
  getLiveQuote as a,
  getLiveQuotes as g
};
