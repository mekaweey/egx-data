
CREATE POLICY model_state_service_all
  ON public.model_state
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
