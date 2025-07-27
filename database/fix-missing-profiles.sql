-- FIX MISSING USER PROFILES
-- This creates profiles for users who signed up but don't have profiles
-- Run this in your Supabase SQL Editor

-- First, let's see which auth users don't have profiles
SELECT 
    au.id as auth_user_id,
    au.email,
    au.created_at as auth_created_at,
    CASE WHEN u.id IS NULL THEN 'MISSING PROFILE' ELSE 'HAS PROFILE' END as status
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.auth_user_id
ORDER BY au.created_at DESC;

-- Create profiles for users who don't have them
INSERT INTO public.users (
    auth_user_id,
    email,
    full_name,
    role,
    company,
    phone,
    specialties
)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email, 'New User'),
    COALESCE(au.raw_user_meta_data->>'role', 'viewer')::user_role,
    COALESCE(au.raw_user_meta_data->>'company', ''),
    COALESCE(au.raw_user_meta_data->>'phone', ''),
    '{}'::text[]
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.auth_user_id
WHERE u.id IS NULL  -- Only create profiles for users who don't have them
ON CONFLICT (auth_user_id) DO NOTHING;

-- Verify all users now have profiles
SELECT 
    COUNT(*) as total_auth_users,
    COUNT(u.id) as users_with_profiles,
    COUNT(*) - COUNT(u.id) as missing_profiles
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.auth_user_id; 