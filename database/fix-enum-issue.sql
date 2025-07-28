-- QUICK FIX FOR ENUM ISSUE
-- The database expects specific enum values for user_role
-- Run this in Supabase SQL Editor

-- Check what enum values exist
SELECT unnest(enum_range(NULL::user_role)) as valid_roles;

-- Add 'owner' to the enum if it doesn't exist
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'owner';

-- Alternative: Check what roles currently exist in project_members
SELECT DISTINCT role FROM project_members;

-- If owner doesn't work, we'll use 'project_manager' instead 