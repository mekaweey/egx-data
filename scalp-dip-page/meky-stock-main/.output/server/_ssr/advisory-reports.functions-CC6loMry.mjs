import { c as createSsrRpc } from "./router-BYsPPCpA.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
const getReconciliationReport = createServerFn({
  method: "GET"
}).inputValidator((data) => ({
  date: data?.date
})).handler(createSsrRpc("205090ed19875e9dcb8a2cecd4574c3deb6ff9343552f2758493cf786b706261"));
const getSignalQualityReport = createServerFn({
  method: "GET"
}).inputValidator((data) => ({
  days: data?.days
})).handler(createSsrRpc("0ceabd38ac9fe036bbd1d6cc462f61ddeaf35632cc74c9788a890949e6f2e43c"));
export {
  getSignalQualityReport as a,
  getReconciliationReport as g
};
