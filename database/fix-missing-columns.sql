-- FIX MISSING DATABASE COLUMNS

-- Add project_id column to task_change_proposals if it doesn't exist
ALTER TABLE public.task_change_proposals 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id);

-- If the table doesn't exist at all, create it
CREATE TABLE IF NOT EXISTS public.task_change_proposals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id),
    task_id UUID REFERENCES public.tasks(id),
    proposed_by UUID REFERENCES public.users(id),
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.task_change_proposals ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists, then create new one
DROP POLICY IF EXISTS "allow_all_task_change_proposals" ON public.task_change_proposals;
CREATE POLICY "allow_all_task_change_proposals" ON public.task_change_proposals 
FOR ALL TO authenticated USING (true) WITH CHECK (true); 