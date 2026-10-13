const BLOCKED_SYMBOLS = /* @__PURE__ */ new Set([]);
function isBlocked(symbol) {
  return !!symbol && BLOCKED_SYMBOLS.has(symbol.toUpperCase());
}
export {
  BLOCKED_SYMBOLS,
  isBlocked
};
