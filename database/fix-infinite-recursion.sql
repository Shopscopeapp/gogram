-- FIX INFINITE RECURSION IN RLS POLICIES
-- This fixes the "infinite recursion detected in policy for relation 'projects'" error
-- Run this in your Supabase SQL Editor

-- First, check what policies currently exist
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('projects', 'project_members', 'users')
ORDER BY tablename, policyname;

-- Drop all existing problematic policies that could cause recursion
DROP POLICY IF EXISTS "authenticated_users_can_create_projects" ON public.projects;
DROP POLICY IF EXISTS "users_can_view_accessible_projects" ON public.projects; 
DROP POLICY IF EXISTS "project_managers_can_update_projects" ON public.projects;
DROP POLICY IF EXISTS "users_can_view_project_members" ON public.project_members;
DROP POLICY IF EXISTS "project_managers_can_add_members" ON public.project_members;

-- Create simple, non-recursive policies

-- 1. Allow authenticated users to create projects (simple check)
CREATE POLICY "simple_project_creation"
    ON public.projects FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Allow users to view projects (simple ownership check - no joins)
CREATE POLICY "simple_project_read"
    ON public.projects FOR SELECT
    TO authenticated
    USING (
        project_manager_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

-- 3. Allow project managers to update their projects (simple check)
CREATE POLICY "simple_project_update"
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

-- 4. Project members policies (simplified)
CREATE POLICY "simple_project_members_read"
    ON public.project_members FOR SELECT
    TO authenticated
    USING (
        user_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "simple_project_members_insert"
    ON public.project_members FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- Verify the new policies don't have recursion
SELECT 
    'POLICIES UPDATED' as status,
    tablename, 
    policyname, 
    cmd,
    CASE 
        WHEN qual LIKE '%projects%' AND tablename = 'projects' THEN 'POTENTIAL_RECURSION'
        ELSE 'OK'
    END as recursion_check
FROM pg_policies 
WHERE tablename IN ('projects', 'project_members') 
AND schemaname = 'public'
ORDER BY tablename, policyname; 