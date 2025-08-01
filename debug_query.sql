-- Check the tasks table schema to see if requires_materials column exists
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND column_name IN ('requires_materials', 'primary_supplier_id', 'material_delivery_date')
ORDER BY column_name;

-- Check recent tasks to see what's being stored
SELECT id, title, requires_materials, primary_supplier_id, material_delivery_date, created_at
FROM tasks 
ORDER BY created_at DESC 
LIMIT 5;