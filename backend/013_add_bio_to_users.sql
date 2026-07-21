-- Add the missing bio column to the users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Refresh the schema cache so PostgREST picks up the new column immediately
NOTIFY pgrst, 'reload schema';
