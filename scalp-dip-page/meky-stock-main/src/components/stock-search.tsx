import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { getDashboard, type DashboardRow } from "@/lib/scan/dashboard.functions";

export function StockSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const fetchDashboard = useServerFn(getDashboard);
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fetchDashboard(),
    staleTime: 60_000,
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const rows: DashboardRow[] = data?.rows ?? [];
  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows.slice(0, 30);
    return rows
      .filter(
        (r) =>
          r.symbol.toLowerCase().includes(term) ||
          (r.name_ar ?? "").toLowerCase().includes(term),
      )
      .slice(0, 50);
  }, [rows, q]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="بحث عن سهم"
        aria-label="بحث عن سهم"
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:border-primary/50"
      >
        <span aria-hidden>🔍</span>
        <span className="hidden sm:inline text-muted-foreground">ابحث عن سهم…</span>
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-20"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="flex items-center gap-2 border-b border-border p-3">
              <span aria-hidden>🔍</span>
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث بالاسم أو الرمز (مثال: COMI أو البنك التجاري)…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                onClick={() => setOpen(false)}
                className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
              >
                ESC
              </button>
            </div>
            <ul className="max-h-[60vh] overflow-y-auto p-2">
              {results.length === 0 ? (
                <li className="p-4 text-center text-sm text-muted-foreground">
                  لا توجد نتائج
                </li>
              ) : (
                results.map((r) => (
                  <li key={r.symbol}>
                    <Link
                      to="/stock/$symbol"
                      params={{ symbol: r.symbol }}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between gap-3 rounded-lg p-2.5 hover:bg-muted/60"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-bold">{r.name_ar}</div>
                        <div className="text-[11px] text-muted-foreground">{r.symbol}</div>
                      </div>
                      {r.close != null && (
                        <div className="text-end tabular-nums">
                          <div className="text-sm font-semibold">
                            {Number(r.close).toLocaleString("en-EG", {
                              maximumFractionDigits: 2,
                              minimumFractionDigits: 2,
                            })}
                          </div>
                          {r.change_pct != null && (
                            <div
                              className={`text-[11px] ${
                                Number(r.change_pct) >= 0 ? "text-bull" : "text-bear"
                              }`}
                            >
                              {Number(r.change_pct) >= 0 ? "+" : ""}
                              {Number(r.change_pct).toFixed(2)}%
                            </div>
                          )}
                        </div>
                      )}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}