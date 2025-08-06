-- Add RLS policies for task_dependencies table
-- This migration adds the missing RLS policies that are causing the 403 Forbidden error

-- Enable RLS on task_dependencies table
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;

-- Policy for users to view task dependencies for projects they have access to
CREATE POLICY "Users can view task dependencies for their projects" ON public.task_dependencies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            JOIN public.project_members pm ON p.id = pm.project_id
            WHERE (t.id = task_dependencies.task_id OR t.id = task_dependencies.depends_on_task_id)
            AND pm.user_id = auth.uid()
        )
    );

-- Policy for users to insert task dependencies for projects they have access to
CREATE POLICY "Users can insert task dependencies for their projects" ON public.task_dependencies
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            JOIN public.project_members pm ON p.id = pm.project_id
            WHERE t.id = task_dependencies.task_id
            AND pm.user_id = auth.uid()
        )
    );

-- Policy for users to update task dependencies for projects they have access to
CREATE POLICY "Users can update task dependencies for their projects" ON public.task_dependencies
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            JOIN public.project_members pm ON p.id = pm.project_id
            WHERE t.id = task_dependencies.task_id
            AND pm.user_id = auth.uid()
        )
    );

-- Policy for users to delete task dependencies for projects they have access to
CREATE POLICY "Users can delete task dependencies for their projects" ON public.task_dependencies
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.tasks t
            JOIN public.projects p ON t.project_id = p.id
            JOIN public.project_members pm ON p.id = pm.project_id
            WHERE t.id = task_dependencies.task_id
            AND pm.user_id = auth.uid()
        )
    ); 