-- Add construction-specific fields to tasks table
-- This migration adds the missing fields that are defined in the Task interface

-- Add supplier/procurement fields
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS primary_supplier_id UUID REFERENCES suppliers(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS requires_materials BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS material_delivery_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS procurement_notes TEXT;

-- Add ITP fields
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS itp_requirements TEXT[] DEFAULT '{}';

-- Add construction-specific fields
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS phase TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sub_phase TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS predecessors TEXT[] DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS successors TEXT[] DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS lag_days INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS lead_days INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS float_days INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS free_float_days INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_critical BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS resource_names TEXT[] DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS crew_size INTEGER DEFAULT 1;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS equipment_needed TEXT[] DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS weather_dependent BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS work_hours_per_day INTEGER DEFAULT 8;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS work_days_per_week INTEGER DEFAULT 5;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS cost_per_day DECIMAL(10,2) DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) DEFAULT 0;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_phase ON tasks(phase);
CREATE INDEX IF NOT EXISTS idx_tasks_sub_phase ON tasks(sub_phase);
CREATE INDEX IF NOT EXISTS idx_tasks_is_critical ON tasks(is_critical);
CREATE INDEX IF NOT EXISTS idx_tasks_requires_materials ON tasks(requires_materials);

-- Update RLS policies to include new fields
DROP POLICY IF EXISTS "Users can view tasks in their projects" ON tasks;
CREATE POLICY "Users can view tasks in their projects" ON tasks
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE id IN (
        SELECT project_id FROM project_members 
        WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert tasks in their projects" ON tasks;
CREATE POLICY "Users can insert tasks in their projects" ON tasks
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects 
      WHERE id IN (
        SELECT project_id FROM project_members 
        WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can update tasks in their projects" ON tasks;
CREATE POLICY "Users can update tasks in their projects" ON tasks
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE id IN (
        SELECT project_id FROM project_members 
        WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can delete tasks in their projects" ON tasks;
CREATE POLICY "Users can delete tasks in their projects" ON tasks
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE id IN (
        SELECT project_id FROM project_members 
        WHERE user_id = auth.uid()
      )
    )
  ); 