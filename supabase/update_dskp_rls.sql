-- Allow authenticated users to add new reference data (subjects/years)
-- Run this in your Supabase SQL Editor

DROP POLICY IF EXISTS "Anyone can read reference data" ON public.referensi_rph;

CREATE POLICY "Anyone can read reference data"
ON public.referensi_rph
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can add reference data"
ON public.referensi_rph
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update reference data"
ON public.referensi_rph
FOR UPDATE
USING (auth.role() = 'authenticated');
