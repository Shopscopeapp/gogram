-- CHECK ACTUAL ENUM VALUES IN DATABASE
-- Run this first to see what's actually available

-- Method 1: Check the user_role enum type
SELECT enumlabel as available_roles 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role');

-- Method 2: Check what's actually being used in the table
SELECT DISTINCT role FROM project_members WHERE role IS NOT NULL;

-- Method 3: Check the column definition
SELECT column_name, data_type, udt_name
FROM information_schema.columns 
WHERE table_name = 'project_members' AND column_name = 'role'; 