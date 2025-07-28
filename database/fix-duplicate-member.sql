-- FIX DUPLICATE PROJECT MEMBER ISSUE
-- The error suggests there's already a trigger adding project members automatically

-- Check if there's a trigger on projects table
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'projects';

-- Option 1: Drop the trigger if it exists (let code handle member creation)
DROP TRIGGER IF EXISTS on_project_created ON public.projects;
DROP FUNCTION IF EXISTS public.add_project_creator_as_member();

-- Option 2: Alternative - just ignore the member creation in code since trigger handles it 