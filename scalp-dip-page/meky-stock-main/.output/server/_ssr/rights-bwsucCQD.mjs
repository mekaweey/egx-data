import { j as jsxRuntimeExports } from "../_libs/react.mjs";
const SplitErrorComponent = ({
  error
}) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 text-destructive", children: [
  "تعذّر تحميل حقوق الاكتتاب: ",
  error.message
] });
export {
  SplitErrorComponent as errorComponent
};
