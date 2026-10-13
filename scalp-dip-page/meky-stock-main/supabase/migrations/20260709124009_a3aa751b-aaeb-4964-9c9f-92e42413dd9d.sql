-- Session log tables for auto-tracking chat, edits, and reads

CREATE TABLE public.session_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  turn_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.session_messages TO anon, authenticated;
GRANT ALL ON public.session_messages TO service_role;
ALTER TABLE public.session_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read messages" ON public.session_messages FOR SELECT USING (true);
CREATE POLICY "public insert messages" ON public.session_messages FOR INSERT WITH CHECK (true);
CREATE INDEX idx_session_messages_created ON public.session_messages (created_at DESC);

CREATE TABLE public.session_edits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  turn_id TEXT,
  summary TEXT NOT NULL,
  files_changed TEXT[] NOT NULL DEFAULT '{}',
  migrations TEXT[] NOT NULL DEFAULT '{}',
  version TEXT,
  extra JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.session_edits TO anon, authenticated;
GRANT ALL ON public.session_edits TO service_role;
ALTER TABLE public.session_edits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read edits" ON public.session_edits FOR SELECT USING (true);
CREATE POLICY "public insert edits" ON public.session_edits FOR INSERT WITH CHECK (true);
CREATE INDEX idx_session_edits_created ON public.session_edits (created_at DESC);

CREATE TABLE public.session_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  turn_id TEXT,
  file_path TEXT NOT NULL,
  purpose TEXT,
  key_findings TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.session_reads TO anon, authenticated;
GRANT ALL ON public.session_reads TO service_role;
ALTER TABLE public.session_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read reads" ON public.session_reads FOR SELECT USING (true);
CREATE POLICY "public insert reads" ON public.session_reads FOR INSERT WITH CHECK (true);
CREATE INDEX idx_session_reads_path ON public.session_reads (file_path);
CREATE INDEX idx_session_reads_created ON public.session_reads (created_at DESC);