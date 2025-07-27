-- COMPREHENSIVE RLS POLICY FIX FOR USER SIGNUP
-- Debug and fix all authentication issues
-- Run this in your Supabase SQL Editor

-- First, let's see what policies currently exist
SELECT schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

-- Drop ALL existing policies on users table to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;  
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.users;

-- Create comprehensive policies for users table
-- 1. Allow users to insert their own profile (CRITICAL for signup)
CREATE POLICY "authenticated_users_can_insert_profile"
    ON public.users FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = auth_user_id);

-- 2. Allow users to view their own profile
CREATE POLICY "users_can_view_own_profile"
    ON public.users FOR SELECT
    TO authenticated
    USING (auth.uid() = auth_user_id);

-- 3. Allow users to update their own profile
CREATE POLICY "users_can_update_own_profile"
    ON public.users FOR UPDATE
    TO authenticated
    USING (auth.uid() = auth_user_id)
    WITH CHECK (auth.uid() = auth_user_id);

-- Verify RLS is enabled on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Test the auth context (this should show your current auth state)
SELECT 
    auth.uid() as current_auth_uid,
    auth.role() as current_auth_role,
    current_user as current_db_user;

-- Verify the new policies were created
SELECT policyname, cmd, with_check, qual
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

-- Test policy with a sample insert (this will show if the policy works)
-- NOTE: This will only work if you're authenticated in the SQL editor
-- INSERT INTO public.users (auth_user_id, email, full_name, role) 
-- VALUES (auth.uid(), 'test@example.com', 'Test User', 'viewer');
-- (Don't actually run this - it's just to show the syntax) 