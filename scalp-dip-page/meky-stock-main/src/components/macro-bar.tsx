import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMacroSnapshot } from "@/lib/macro/macro.functions";

function fmt(n: number | null | undefined, d = 2) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-EG", { maximumFractionDigits: d, minimumFractionDigits: d });
}

export function MacroBar() {
  const fetchMacro = useServerFn(getMacroSnapshot);
  const { data } = useQuery({
    queryKey: ["macro-snapshot"],
    queryFn: () => fetchMacro(),
    refetchInterval: 30 * 60 * 1000,
    staleTime: 10 * 60 * 1000,
  });

  if (!data) return null;

  const sp = data.sp500_change_pct;
  const spCls = sp == null ? "text-muted-foreground" : sp >= 0 ? "text-bull" : "text-bear";

  return (
    <div className="mb-4 rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-bold text-muted-foreground">🌍 المؤشرات الكلية ({data.as_of})</div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4 lg:grid-cols-7">
        <div>
          <div className="text-muted-foreground">USD/EGP</div>
          <div className="font-bold tabular-nums">{fmt(data.usd_egp)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">الذهب $</div>
          <div className="font-bold tabular-nums">{fmt(data.gold_usd, 0)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">برنت $</div>
          <div className="font-bold tabular-nums">{fmt(data.brent_oil_usd)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">فائدة CBE</div>
          <div className="font-bold tabular-nums">{fmt(data.cbe_interest_rate, 2)}%</div>
        </div>
        <div>
          <div className="text-muted-foreground">تضخم</div>
          <div className="font-bold tabular-nums">{fmt(data.inflation_yoy, 1)}%</div>
        </div>
        <div>
          <div className="text-muted-foreground">S&P 500</div>
          <div className={`font-bold tabular-nums ${spCls}`}>
            {fmt(data.sp500_close, 0)} {sp != null && <span>({sp >= 0 ? "+" : ""}{fmt(sp, 2)}%)</span>}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground">MSCI EM</div>
          <div className="font-bold tabular-nums">{fmt(data.msci_em_close, 0)}</div>
        </div>
      </div>
    </div>
  );
}