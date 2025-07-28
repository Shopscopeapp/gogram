-- FIX PROJECT RLS POLICIES
-- This fixes 400 errors when accessing/creating projects
-- Run this in your Supabase SQL Editor

-- Check current project policies
SELECT 
    tablename, 
    policyname, 
    cmd, 
    with_check, 
    qual
FROM pg_policies 
WHERE tablename = 'projects' AND schemaname = 'public'
ORDER BY cmd, policyname;

-- Drop existing problematic project policies
DROP POLICY IF EXISTS "Project members can view projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Project managers can update projects" ON public.projects;
DROP POLICY IF EXISTS "Project managers can add project members" ON public.project_members;
DROP POLICY IF EXISTS "Project members can view project membership" ON public.project_members;

-- Create more permissive project policies for testing
-- 1. Allow authenticated users to create projects
CREATE POLICY "authenticated_users_can_create_projects"
    ON public.projects FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() IS NOT NULL
    );

-- 2. Allow users to view projects they created or are members of
CREATE POLICY "users_can_view_accessible_projects"
    ON public.projects FOR SELECT
    TO authenticated
    USING (
        -- User is the project manager
        project_manager_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
        OR 
        -- User is a project member
        id IN (
            SELECT project_id FROM public.project_members pm
            JOIN public.users u ON pm.user_id = u.id
            WHERE u.auth_user_id = auth.uid()
        )
        OR
        -- Project is public
        is_public = true
    );

-- 3. Allow project managers to update their projects
CREATE POLICY "project_managers_can_update_projects"
    ON public.projects FOR UPDATE
    TO authenticated
    USING (
        project_manager_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    )
    WITH CHECK (
        project_manager_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

-- 4. Project members policies
CREATE POLICY "users_can_view_project_members"
    ON public.project_members FOR SELECT
    TO authenticated
    USING (
        project_id IN (
            SELECT id FROM public.projects p
            WHERE p.project_manager_id IN (
                SELECT id FROM public.users WHERE auth_user_id = auth.uid()
            )
            OR p.id IN (
                SELECT pm.project_id FROM public.project_members pm
                JOIN public.users u ON pm.user_id = u.id
                WHERE u.auth_user_id = auth.uid()
            )
        )
    );

-- 5. Allow project managers to add members
CREATE POLICY "project_managers_can_add_members"
    ON public.project_members FOR INSERT
    TO authenticated
    WITH CHECK (
        project_id IN (
            SELECT id FROM public.projects p
            WHERE p.project_manager_id IN (
                SELECT id FROM public.users WHERE auth_user_id = auth.uid()
            )
        )
    );

-- 6. Add the project creator as a member automatically (function)
CREATE OR REPLACE FUNCTION public.add_project_creator_as_member()
RETURNS trigger AS $$
BEGIN
    -- Add the project manager as a project member
    INSERT INTO public.project_members (project_id, user_id, role)
    VALUES (NEW.id, NEW.project_manager_id, 'project_manager');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically add project creator as member
DROP TRIGGER IF EXISTS on_project_created ON public.projects;
CREATE TRIGGER on_project_created
    AFTER INSERT ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.add_project_creator_as_member();

-- Verify the new policies
SELECT 
    'PROJECT POLICIES UPDATED' as status,
    tablename, 
    policyname, 
    cmd
FROM pg_policies 
WHERE tablename IN ('projects', 'project_members') AND schemaname = 'public'
ORDER BY tablename, cmd, policyname; 