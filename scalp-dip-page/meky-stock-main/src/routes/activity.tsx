import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  listActivity,
  deletePosition,
  type ActivityItem,
} from "@/lib/positions/positions.functions";

const activityQO = queryOptions({
  queryKey: ["activity"],
  queryFn: () => listActivity(),
});

export const Route = createFileRoute("/activity")({
  loader: ({ context }) => context.queryClient.ensureQueryData(activityQO),
  component: ActivityPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-bear" role="alert">
      حدث خطأ: {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-8 text-center">الصفحة غير موجودة</div>,
});

function fmtDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("ar-EG", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function ActivityPage() {
  const { data } = useSuspenseQuery(activityQO);
  const qc = useQueryClient();
  const del = useServerFn(deletePosition);

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { position_id: id } }),
    onSuccess: () => {
      toast.success("تم الحذف — اعتبرنا الصفقة دي ما حصلتش");
      qc.invalidateQueries({ queryKey: ["activity"] });
      qc.invalidateQueries({ queryKey: ["positions"] });
    },
    onError: (e: Error) => toast.error(`فشل الحذف: ${e.message}`),
  });

  const items = data.items;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6" dir="rtl">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">📜 سجل النشاط والإشعارات</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              كل اللي قلتلي عليه + كل الإشعارات اللي وصلتك. تقدر تلغي أي صفقة دخلتها بالغلط.
            </p>
          </div>
          <Link
            to="/"
            className="rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-muted"
          >
            ← الرئيسية
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            مفيش أي نشاط لحد دلوقتي.
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((it: ActivityItem) => {
              const positionId =
                it.kind === "position_open" ? it.id.replace(/^pos-open-/, "") : null;
              const hasSymbol = !!it.symbol && it.symbol !== "—";
              const color =
                it.kind === "position_open"
                  ? "border-bull/40 bg-bull/5"
                  : it.kind === "position_close"
                    ? "border-border bg-muted/30"
                    : it.kind === "sell_alert"
                      ? "border-amber-500/40 bg-amber-500/5"
                      : "border-primary/30 bg-primary/5";
              return (
                <li
                  key={it.id}
                  className={`rounded-xl border ${color} p-4 shadow-sm`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {hasSymbol ? (
                      <Link
                        to="/stock/$symbol"
                        params={{ symbol: it.symbol }}
                        className="min-w-0 flex-1 -m-1 rounded-lg p-1 hover:bg-muted/40 transition"
                      >
                        <div className="text-sm font-bold">{it.title}</div>
                        {it.detail && (
                          <div className="mt-1 text-xs text-muted-foreground break-words">
                            {it.detail}
                          </div>
                        )}
                        <div className="mt-2 text-[11px] text-muted-foreground tabular-nums">
                          {fmtDate(it.ts)} · {it.symbol} · اضغط للفتح ←
                        </div>
                      </Link>
                    ) : (
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold">{it.title}</div>
                        {it.detail && (
                          <div className="mt-1 text-xs text-muted-foreground break-words">
                            {it.detail}
                          </div>
                        )}
                        <div className="mt-2 text-[11px] text-muted-foreground tabular-nums">
                          {fmtDate(it.ts)} · {it.symbol}
                        </div>
                      </div>
                    )}
                    {positionId && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (
                            confirm(
                              "متأكد إنك عايز تلغي تسجيل الصفقة دي؟ (هنحذفها خالص من السجل وكأنها ما حصلتش)",
                            )
                          ) {
                            delMut.mutate(positionId);
                          }
                        }}
                        disabled={delMut.isPending}
                        className="shrink-0 rounded-lg border border-bear/40 px-3 py-1.5 text-xs font-bold text-bear hover:bg-bear/10 disabled:opacity-50"
                      >
                        🗑️ إلغاء
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}