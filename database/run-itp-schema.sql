-- Run ITP Schema with Error Handling
-- This script creates the ITP tables and sample data

-- First, let's check if the tables exist and drop them if they do
DROP TABLE IF EXISTS itp_requirement_instances CASCADE;
DROP TABLE IF EXISTS itp_instances CASCADE;
DROP TABLE IF EXISTS itp_requirements CASCADE;
DROP TABLE IF EXISTS itp_templates CASCADE;

-- Now create the tables
\i database/itp-schema.sql

-- Verify the tables were created
SELECT 'ITP Tables created successfully' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'itp_%'; 