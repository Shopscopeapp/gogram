-- Add missing requires_materials column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS requires_materials BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS material_delivery_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS primary_supplier_id UUID REFERENCES suppliers(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS procurement_notes TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_tasks_requires_materials ON tasks(requires_materials);