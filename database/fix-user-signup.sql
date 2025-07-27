-- Fix User Signup and Project Creation RLS Policies
-- This drops existing policies and recreates them to avoid conflicts
-- Run this in your Supabase SQL Editor

-- Drop existing policies if they exist (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Project managers can add project members" ON public.project_members;
DROP POLICY IF EXISTS "Project members can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Project members can create suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Project members can create deliveries" ON public.deliveries;

-- 1. Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = auth_user_id);

-- 2. Users can create projects (they become project manager)
CREATE POLICY "Authenticated users can create projects"
    ON public.projects FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        project_manager_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    );

-- 3. Project managers can add project members
CREATE POLICY "Project managers can add project members"
    ON public.project_members FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE project_manager_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
        )
    );

-- 4. Project members can create tasks
CREATE POLICY "Project members can create tasks"
    ON public.tasks FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT project_id FROM public.project_members 
            WHERE user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
        )
    );

-- 5. Project members can create suppliers
CREATE POLICY "Project members can create suppliers"
    ON public.suppliers FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- 6. Project members can create deliveries
CREATE POLICY "Project members can create deliveries"
    ON public.deliveries FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT project_id FROM public.project_members 
            WHERE user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
        )
    );

-- Verify all policies were created
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE cmd = 'INSERT' AND schemaname = 'public'
ORDER BY tablename, policyname; 