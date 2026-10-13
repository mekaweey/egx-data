import { j as jsxRuntimeExports } from "../_libs/react.mjs";
const SplitErrorComponent = ({
  error
}) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-8 text-center text-bear", role: "alert", children: [
  "حدث خطأ: ",
  error.message
] });
export {
  SplitErrorComponent as errorComponent
};
