import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { openPosition } from "@/lib/positions/positions.functions";

type Props = {
  symbol: string;
  name?: string | null;
  entry: number;
  target?: number | null;
  stop?: number | null;
  maxHoldDays?: number | null;
  recommendationId?: string | null;
  defaultShares?: number;
  disabled?: boolean;
  disabledReason?: string;
};

export function BuyNowButton({
  symbol,
  name,
  entry,
  target,
  stop,
  maxHoldDays,
  recommendationId,
  defaultShares = 0,
  disabled = false,
  disabledReason = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [shares, setShares] = useState(defaultShares > 0 ? defaultShares : 100);
  const [price, setPrice] = useState(entry);
  const open_ = useServerFn(openPosition);
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: () =>
      open_({
        data: {
          symbol,
          entry_price: price,
          quantity: shares,
          stop_loss: stop ?? null,
          target_price: target ?? null,
          max_hold_days: maxHoldDays ?? 30,
          recommendation_id: recommendationId ?? null,
          notes: null,
        },
      }),
    onSuccess: () => {
      toast.success(`✅ تم تسجيل صفقة ${name ?? symbol}`, {
        description: `الكميه ${shares.toLocaleString("en-EG")} سهم · بسعر ${price.toFixed(2)} ج.م — هنبعتلك إشعار لما يحين البيع`,
      });
      qc.invalidateQueries({ queryKey: ["positions"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(`فشل: ${e.message}`),
  });

  return (
    <>
      <button
        onClick={() => {
          if (!disabled) setOpen(true);
        }}
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
        className="rounded-lg bg-bull px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {disabled ? "⏰ التنفيذ مغلق" : "✋ اشتريت ده — تابعه ليّا"}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <h3 className="text-lg font-extrabold">سجّل صفقتك في {name ?? symbol}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              هنتابع السعر اللحظي ونبعتلك إشعار في الصفحة وعلى التليجرام لما يحين البيع (هدف / ستوب / تريلينج).
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">سعر الدخول الفعلي</span>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(Math.max(0, Number(e.target.value) || 0))}
                  className="rounded-lg border border-border bg-background px-3 py-2 font-bold tabular-nums"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">عدد الأسهم</span>
                <input
                  type="number"
                  step="1"
                  value={shares}
                  onChange={(e) => setShares(Math.max(1, Math.floor(Number(e.target.value) || 0)))}
                  className="rounded-lg border border-border bg-background px-3 py-2 font-bold tabular-nums"
                />
              </label>
            </div>

            <div className="mt-3 rounded-lg bg-muted/40 p-3 text-xs">
              <div className="flex justify-between"><span>إجمالي التكلفة</span><b className="tabular-nums">{(price * shares).toLocaleString("en-EG", { maximumFractionDigits: 0 })} ج.م</b></div>
              {target != null && <div className="flex justify-between mt-1"><span>الهدف</span><b className="tabular-nums text-bull">{target.toFixed(2)}</b></div>}
              {stop != null && <div className="flex justify-between mt-1"><span>وقف الخسارة</span><b className="tabular-nums text-bear">{stop.toFixed(2)}</b></div>}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
              >
                إلغاء
              </button>
              <button
                onClick={() => mut.mutate()}
                disabled={mut.isPending || price <= 0 || shares <= 0}
                className="flex-1 rounded-lg bg-bull px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {mut.isPending ? "جاري الحفظ…" : "✅ احفظ وتابع"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}