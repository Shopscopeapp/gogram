-- Add missing requires_materials column to tasks table
-- This fixes the PGRST204 error when creating tasks

-- Add the requires_materials column if it doesn't exist
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS requires_materials BOOLEAN DEFAULT false;

-- Update existing tasks to have a default value
UPDATE public.tasks 
SET requires_materials = false 
WHERE requires_materials IS NULL; 