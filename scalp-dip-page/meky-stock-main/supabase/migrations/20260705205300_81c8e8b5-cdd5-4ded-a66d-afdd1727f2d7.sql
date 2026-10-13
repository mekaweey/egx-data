-- Step 1/3: Add pre-buy sellability proof columns to scalp_feasibility_report
-- All columns are NULLABLE — existing rows and existing code are unaffected.
-- Purpose: measure (after the fact) whether L2 at target-touch time actually
-- had a sufficient bid at the target price. This gives us statistical proof
-- that the pre-buy filter (evaluateL2ForBuy in the extension) is predicting
-- sellability correctly.

ALTER TABLE public.scalp_feasibility_report
  ADD COLUMN IF NOT EXISTS l2_at_target_ts        timestamp with time zone,
  ADD COLUMN IF NOT EXISTS l2_bid_at_target       numeric,
  ADD COLUMN IF NOT EXISTS l2_bid_depth_at_target numeric,
  ADD COLUMN IF NOT EXISTS sellable_at_target     boolean;

COMMENT ON COLUMN public.scalp_feasibility_report.l2_at_target_ts        IS 'Timestamp of the L2 snapshot closest to time_to_target_sec (±10s window).';
COMMENT ON COLUMN public.scalp_feasibility_report.l2_bid_at_target       IS 'best_bid from that L2 snapshot.';
COMMENT ON COLUMN public.scalp_feasibility_report.l2_bid_depth_at_target IS 'Sum of bid depth in top 5 levels at or above target_price at that snapshot.';
COMMENT ON COLUMN public.scalp_feasibility_report.sellable_at_target     IS 'TRUE iff best_bid >= target_price AND depth >= required qty at target time. NULL when no L2 snapshot exists in the window (unknown, not false).';