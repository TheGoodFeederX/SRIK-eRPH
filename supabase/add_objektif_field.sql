-- Add 'objektif' column to rph_records table
-- Run this in your Supabase SQL Editor

ALTER TABLE public.rph_records 
ADD COLUMN IF NOT EXISTS objektif TEXT;

-- Update existing records to have an empty string if necessary (though TEXT is nullable)
-- UPDATE public.rph_records SET objektif = '' WHERE objektif IS NULL;
