-- Migration: Add project_id to suppliers table
-- This makes suppliers project-specific instead of global

-- Add project_id column to suppliers table
ALTER TABLE public.suppliers 
ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;

-- Remove the unique constraint on email since suppliers can now be duplicated across projects
ALTER TABLE public.suppliers 
DROP CONSTRAINT IF EXISTS suppliers_email_key;

-- Update the table comment
COMMENT ON TABLE public.suppliers IS 'Project-specific suppliers for construction projects';
COMMENT ON COLUMN public.suppliers.project_id IS 'Reference to the project this supplier belongs to';

-- Create index for better performance when querying suppliers by project
CREATE INDEX IF NOT EXISTS idx_suppliers_project_id ON public.suppliers(project_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_project_active ON public.suppliers(project_id, is_active);