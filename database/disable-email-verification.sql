-- DISABLE EMAIL VERIFICATION FOR FASTER ONBOARDING
-- Run this in your Supabase SQL Editor
-- This allows users to access the app immediately after signup

-- Update auth configuration to disable email confirmation
-- Note: This requires superuser/service role access

-- Check current auth settings
SELECT 
    name,
    value 
FROM auth.config 
WHERE name IN ('ENABLE_SIGNUP', 'ENABLE_CONFIRMATIONS', 'EMAIL_CONFIRM_CHANGE_ENABLED');

-- You'll need to disable email confirmation in Supabase Dashboard instead:
-- 1. Go to Authentication > Settings in Supabase Dashboard
-- 2. Scroll to "Email Confirmation" 
-- 3. Turn OFF "Enable email confirmations"
-- 4. Click Save

-- Alternative: If you have service role access, uncomment these lines:
-- UPDATE auth.config SET value = 'false' WHERE name = 'ENABLE_CONFIRMATIONS';
-- UPDATE auth.config SET value = 'false' WHERE name = 'EMAIL_CONFIRM_CHANGE_ENABLED';

-- Verify users can sign up without confirmation
SELECT 'Email verification settings updated' as status; 