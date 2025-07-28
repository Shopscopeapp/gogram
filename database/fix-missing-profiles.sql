-- FIX MISSING USER PROFILES - CORRECTED VERSION
-- This creates profiles for users who signed up but don't have profiles
-- Run this in your Supabase SQL Editor

-- First, let's see the current state
SELECT 
    'Auth users total' as description,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
    'Users with profiles' as description,
    COUNT(*) as count
FROM public.users
UNION ALL
SELECT 
    'Users missing profiles' as description,
    COUNT(*) as count
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.auth_user_id
WHERE u.id IS NULL;

-- Check if auth_user_id has a unique constraint
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'users' 
    AND tc.table_schema = 'public'
    AND kcu.column_name = 'auth_user_id';

-- If no unique constraint exists, let's add one first
ALTER TABLE public.users 
ADD CONSTRAINT users_auth_user_id_unique 
UNIQUE (auth_user_id);

-- Now create profiles for users who don't have them (safe version)
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
WHERE NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.auth_user_id = au.id
);

-- Final verification
SELECT 
    'FINAL: Auth users total' as description,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
    'FINAL: Users with profiles' as description,
    COUNT(*) as count
FROM public.users
UNION ALL
SELECT 
    'FINAL: Users missing profiles' as description,
    COUNT(*) as count
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.auth_user_id
WHERE u.id IS NULL; 