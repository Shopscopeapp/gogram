-- ROBUST USER PROFILE CREATION FIX
-- Uses Supabase's recommended automatic profile creation pattern
-- Run this in your Supabase SQL Editor

-- First, let's create a more permissive policy for user creation
-- This allows users to create profiles immediately after signup
DROP POLICY IF EXISTS "authenticated_users_can_insert_profile" ON public.users;

-- Create a more robust INSERT policy that works during signup
CREATE POLICY "allow_user_profile_creation"
    ON public.users FOR INSERT
    WITH CHECK (
        -- Allow if the auth_user_id matches the current auth.uid()
        -- OR if this is being called from a trigger/function (auth.uid() might be null)
        auth_user_id = auth.uid() OR auth.uid() IS NULL
    );

-- Alternative: Create an automatic profile creation trigger (RECOMMENDED)
-- This creates the profile automatically when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (
        auth_user_id,
        email,
        full_name,
        role
    )
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
        COALESCE(new.raw_user_meta_data->>'role', 'viewer')
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Update the SELECT policy to work with the new structure
DROP POLICY IF EXISTS "users_can_view_own_profile" ON public.users;
CREATE POLICY "users_can_view_own_profile"
    ON public.users FOR SELECT
    USING (auth.uid() = auth_user_id OR auth.uid() IS NULL);

-- Test the policies
SELECT 
    tablename, 
    policyname, 
    cmd, 
    with_check, 
    qual
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY cmd, policyname; 