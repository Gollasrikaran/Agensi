-- Add downvotes column to skills table
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS downvotes INTEGER DEFAULT 0;

-- Refresh the schema cache so PostgREST picks up the new column immediately
NOTIFY pgrst, 'reload schema';
