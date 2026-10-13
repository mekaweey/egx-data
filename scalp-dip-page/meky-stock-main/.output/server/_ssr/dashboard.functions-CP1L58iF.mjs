import { c as createSsrRpc } from "./router-BYsPPCpA.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
const getDashboard = createServerFn({
  method: "GET"
}).handler(createSsrRpc("39b0b075ab72fa74a7030092cbdda75deb8601a34a82200ba1e2e0f71556d80e"));
const getStockDetail = createServerFn({
  method: "GET"
}).inputValidator((data) => data).handler(createSsrRpc("7985742ccb6734d9e76fbb476aa655f32c1a06b7b710d0ca5d2c7e6746fc0570"));
export {
  getStockDetail as a,
  getDashboard as g
};
