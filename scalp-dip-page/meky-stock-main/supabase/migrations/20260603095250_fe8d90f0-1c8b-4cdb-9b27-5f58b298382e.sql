
-- Add additional Sharia-compliant EGX stocks to expand the trading universe
INSERT INTO public.stocks (symbol, yahoo_symbol, name_ar, name_en, sector_ar, is_sharia, is_active) VALUES
  ('OLFI', 'OLFI.CA', 'عبور لاند للصناعات الغذائية', 'Obour Land for Food Industries', 'الأغذية والمشروبات', true, true),
  ('RMDA', 'RMDA.CA', 'راميدا للصناعات الدوائية', 'Rameda Pharmaceuticals', 'الرعاية الصحية والأدوية', true, true),
  ('ORHD', 'ORHD.CA', 'أوراسكوم للتنمية مصر', 'Orascom Development Egypt', 'العقارات والسياحة', true, true),
  ('MCQE', 'MCQE.CA', 'مصر لإسمنت قنا', 'Misr Cement Qena', 'مواد البناء', true, true),
  ('ATQA', 'ACGC.CA', 'العربية لحليج الأقطان', 'Arab Cotton Ginning', 'الصناعات النسيجية', true, true),
  ('SVCE', 'SVCE.CA', 'قناة السويس لتوطين التكنولوجيا', 'Suez Canal Co for Tech Settlements', 'التكنولوجيا', true, true),
  ('IRAX', 'IRAX.CA', 'الإسكندرية للحديد والصلب الخاصة', 'Alex Iron and Steel', 'الحديد والصلب', true, true),
  ('MTIE', 'MTIE.CA', 'مصر الحديثة للتعليم', 'Egyptian Modern Education', 'التعليم', true, true),
  ('KZPC', 'KZPC.CA', 'كفر الزيات للمبيدات', 'Kafr El Zayat Pesticides', 'الكيماويات', true, true),
  ('ELEC', 'ELEC.CA', 'المصرية للكابلات الكهربائية', 'Egyptian Electrical Cables', 'الصناعات الكهربائية', true, true),
  ('NCCW', 'NCCW.CA', 'النصر لتصنيع المحولات', 'National Co for Transformers', 'الصناعات الكهربائية', true, true),
  ('DSCW', 'DSCW.CA', 'دايس للملابس الجاهزة', 'Dice Sport & Casual Wear', 'الصناعات النسيجية', true, true)
ON CONFLICT (symbol) DO UPDATE SET is_sharia = true, is_active = true;

-- Also flip these to sharia=true if appropriate (CCAP Qalaa Holdings is widely considered Sharia by some funds; leave others as-is)
UPDATE public.stocks SET is_sharia = true WHERE symbol = 'CCAP';
