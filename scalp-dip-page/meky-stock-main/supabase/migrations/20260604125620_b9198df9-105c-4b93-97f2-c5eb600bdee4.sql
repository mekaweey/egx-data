
DROP POLICY IF EXISTS counterfactual_insights_public_read ON public.counterfactual_insights;
DROP POLICY IF EXISTS news_embeddings_public_read ON public.news_embeddings;
DROP POLICY IF EXISTS online_learning_state_public_read ON public.online_learning_state;

REVOKE SELECT ON public.counterfactual_insights FROM anon, authenticated;
REVOKE SELECT ON public.news_embeddings FROM anon, authenticated;
REVOKE SELECT ON public.online_learning_state FROM anon, authenticated;
REVOKE SELECT ON public.data_source_logs FROM anon, authenticated;

GRANT ALL ON public.counterfactual_insights TO service_role;
GRANT ALL ON public.news_embeddings TO service_role;
GRANT ALL ON public.online_learning_state TO service_role;
GRANT ALL ON public.data_source_logs TO service_role;
