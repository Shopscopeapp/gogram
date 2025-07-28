-- FIX PROJECT DATABASE SCHEMA
-- This ensures the database schema matches the Project interface in types/index.ts
-- Run this in your Supabase SQL Editor

-- First, check current schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'projects'
ORDER BY ordinal_position;

-- Drop existing triggers that might conflict
DROP TRIGGER IF EXISTS on_project_created ON public.projects;
DROP FUNCTION IF EXISTS public.add_project_creator_as_member();

-- Make sure projects table has the correct structure
-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'projects' 
                   AND column_name = 'status') THEN
        ALTER TABLE public.projects 
        ADD COLUMN status VARCHAR(20) DEFAULT 'planning' 
        CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled'));
    END IF;

    -- Ensure project_manager_id exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'projects' 
                   AND column_name = 'project_manager_id') THEN
        ALTER TABLE public.projects 
        ADD COLUMN project_manager_id UUID REFERENCES public.users(id);
    END IF;

    -- Update existing projects to have default status if null
    UPDATE public.projects SET status = 'planning' WHERE status IS NULL;
END $$;

-- Recreate the project creator membership trigger with better error handling
CREATE OR REPLACE FUNCTION public.add_project_creator_as_member()
RETURNS trigger AS $$
BEGIN
    -- Add the project manager as a project member with role 'project_manager'
    INSERT INTO public.project_members (project_id, user_id, role)
    VALUES (NEW.id, NEW.project_manager_id, 'project_manager')
    ON CONFLICT (project_id, user_id) DO NOTHING; -- Prevent duplicate entries
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the project creation
        RAISE WARNING 'Failed to add project creator as member: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_project_created
    AFTER INSERT ON public.projects
    FOR EACH ROW 
    WHEN (NEW.project_manager_id IS NOT NULL)
    EXECUTE FUNCTION public.add_project_creator_as_member();

-- Verify the current structure
SELECT 
    'SCHEMA CHECK' as status,
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'projects'
ORDER BY ordinal_position; 