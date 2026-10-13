-- 1) CREATE TABLE
CREATE TABLE public.extension_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by text
);

-- 2) GRANTS
-- anon: قراءة فقط (الإضافة بتشتغل بدون تسجيل دخول)
GRANT SELECT ON public.extension_config TO anon;
GRANT SELECT ON public.extension_config TO authenticated;
-- service_role فقط له صلاحية الكتابة (أنا من خلال المشروع)
GRANT ALL ON public.extension_config TO service_role;

-- 3) ENABLE RLS
ALTER TABLE public.extension_config ENABLE ROW LEVEL SECURITY;

-- 4) POLICIES
-- قراءة مفتوحة للجميع
CREATE POLICY "Anyone can read extension config"
  ON public.extension_config
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- الكتابة لـ service_role فقط — مفيش policy لـ anon/authenticated يعني ممنوع تماماً

-- 5) Trigger لتحديث updated_at
CREATE TRIGGER update_extension_config_updated_at
  BEFORE UPDATE ON public.extension_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6) تفعيل Realtime
ALTER TABLE public.extension_config REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.extension_config;

-- 7) Seed بالقيم الافتراضية الحالية المطابقة لـ v2.1.7 (سلوك مطابق تماماً)
INSERT INTO public.extension_config (key, value, description) VALUES
  ('kill_switch', 'false'::jsonb,
   'لو true: الإضافة توقف Semi-Auto فوراً لكل المستخدمين'),
  ('semi_auto_enabled', 'true'::jsonb,
   'تفعيل ميزة Semi-Auto عامة (المستخدم لازم برضو يفعّلها من popup)'),
  ('poll_interval_ms', '3000'::jsonb,
   'كل قد إيه الإضافة تسأل السيرفر عن أوامر pending'),
  ('tick_interval_ms', '2000'::jsonb,
   'كل قد إيه ترسل ticks الأسعار للسيرفر'),
  ('order_expire_seconds', '60'::jsonb,
   'بعد قد إيه الأمر يعتبر منتهي لو محدش نفّذه'),
  ('human_delay_min_ms', '800'::jsonb,
   'أقل تأخير عشوائي بين الـ actions (محاكاة سلوك بشري)'),
  ('human_delay_max_ms', '2500'::jsonb,
   'أكبر تأخير عشوائي بين الـ actions'),
  ('thunder_selectors', '{
    "buy_button": "[data-testid=\"buy-button\"], button[aria-label*=\"شراء\"]",
    "market_price_option": "[data-testid=\"market-price\"], label[for=\"market\"]",
    "quantity_input": "input[name=\"quantity\"], input[aria-label*=\"كمية\"]",
    "review_button": "[data-testid=\"review-order\"], button[aria-label*=\"مراجعة\"]"
  }'::jsonb,
   'CSS selectors لعناصر صفحة ثاندر — لو ثاندر غيّر الـ UI نعدّل هنا فوراً'),
  ('config_version', '1'::jsonb,
   'رقم نسخة الإعدادات — يزيد مع كل تحديث');