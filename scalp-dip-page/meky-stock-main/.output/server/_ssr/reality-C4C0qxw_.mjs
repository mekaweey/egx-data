import { j as jsxRuntimeExports } from "../_libs/react.mjs";
const SplitErrorComponent = ({
  error
}) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-8 text-bear", children: [
  "خطأ في تحميل التقرير: ",
  error.message
] });
export {
  SplitErrorComponent as errorComponent
};
