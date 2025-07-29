-- Clean ITP Setup Script
-- This script drops existing ITP tables and recreates them with the corrected schema

-- Drop existing ITP tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS itp_requirement_instances CASCADE;
DROP TABLE IF EXISTS itp_instances CASCADE;
DROP TABLE IF EXISTS itp_requirements CASCADE;
DROP TABLE IF EXISTS itp_templates CASCADE;

-- Remove the itp_requirements column from tasks table if it exists
ALTER TABLE tasks DROP COLUMN IF EXISTS itp_requirements;

-- Now create the tables with the corrected schema
-- ITP Templates table
CREATE TABLE IF NOT EXISTS itp_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('structural', 'electrical', 'plumbing', 'hvac', 'fire_safety', 'accessibility', 'environmental', 'general')),
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ITP Requirements table
CREATE TABLE IF NOT EXISTS itp_requirements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID NOT NULL REFERENCES itp_templates(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    required BOOLEAN DEFAULT true,
    category VARCHAR(50) NOT NULL CHECK (category IN ('safety', 'quality', 'compliance', 'documentation', 'testing', 'inspection')),
    order_index INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ITP Instances table
CREATE TABLE IF NOT EXISTS itp_instances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID NOT NULL REFERENCES itp_templates(id),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
    assigned_to UUID REFERENCES auth.users(id),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES auth.users(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ITP Requirement Instances table
CREATE TABLE IF NOT EXISTS itp_requirement_instances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    instance_id UUID NOT NULL REFERENCES itp_instances(id) ON DELETE CASCADE,
    requirement_id UUID NOT NULL REFERENCES itp_requirements(id),
    text TEXT NOT NULL,
    required BOOLEAN DEFAULT true,
    category VARCHAR(50) NOT NULL,
    order_index INTEGER NOT NULL,
    completed BOOLEAN DEFAULT false,
    completed_by UUID REFERENCES auth.users(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    evidence TEXT, -- URL to uploaded evidence
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add ITP requirements column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS itp_requirements TEXT[] DEFAULT '{}';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_itp_templates_type ON itp_templates(type);
CREATE INDEX IF NOT EXISTS idx_itp_templates_category ON itp_templates(category);
CREATE INDEX IF NOT EXISTS idx_itp_templates_priority ON itp_templates(priority);
CREATE INDEX IF NOT EXISTS idx_itp_templates_active ON itp_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_itp_requirements_template_id ON itp_requirements(template_id);
CREATE INDEX IF NOT EXISTS idx_itp_requirements_category ON itp_requirements(category);

CREATE INDEX IF NOT EXISTS idx_itp_instances_task_id ON itp_instances(task_id);
CREATE INDEX IF NOT EXISTS idx_itp_instances_project_id ON itp_instances(project_id);
CREATE INDEX IF NOT EXISTS idx_itp_instances_status ON itp_instances(status);
CREATE INDEX IF NOT EXISTS idx_itp_instances_assigned_to ON itp_instances(assigned_to);

CREATE INDEX IF NOT EXISTS idx_itp_requirement_instances_instance_id ON itp_requirement_instances(instance_id);
CREATE INDEX IF NOT EXISTS idx_itp_requirement_instances_completed ON itp_requirement_instances(completed);

-- Row Level Security (RLS) policies
ALTER TABLE itp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE itp_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE itp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE itp_requirement_instances ENABLE ROW LEVEL SECURITY;

-- ITP Templates policies
CREATE POLICY "Users can view active ITP templates" ON itp_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Project managers can create ITP templates" ON itp_templates
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.auth_user_id = auth.uid() 
            AND public.users.role IN ('project_manager', 'project_coordinator')
        )
    );

CREATE POLICY "Project managers can update ITP templates" ON itp_templates
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.auth_user_id = auth.uid() 
            AND public.users.role IN ('project_manager', 'project_coordinator')
        )
    );

-- ITP Requirements policies
CREATE POLICY "Users can view requirements for active templates" ON itp_requirements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM itp_templates 
            WHERE itp_templates.id = itp_requirements.template_id 
            AND itp_templates.is_active = true
        )
    );

CREATE POLICY "Project managers can manage requirements" ON itp_requirements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.auth_user_id = auth.uid() 
            AND public.users.role IN ('project_manager', 'project_coordinator')
        )
    );

-- ITP Instances policies
CREATE POLICY "Users can view ITP instances for their projects" ON itp_instances
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members 
            WHERE public.project_members.project_id = itp_instances.project_id 
            AND public.project_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Project managers can create ITP instances" ON itp_instances
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.auth_user_id = auth.uid() 
            AND public.users.role IN ('project_manager', 'project_coordinator')
        )
    );

CREATE POLICY "Assigned users can update ITP instances" ON itp_instances
    FOR UPDATE USING (
        assigned_to = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.auth_user_id = auth.uid() 
            AND public.users.role IN ('project_manager', 'project_coordinator')
        )
    );

-- ITP Requirement Instances policies
CREATE POLICY "Users can view requirement instances for their projects" ON itp_requirement_instances
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM itp_instances 
            JOIN public.project_members ON public.project_members.project_id = itp_instances.project_id
            WHERE itp_instances.id = itp_requirement_instances.instance_id 
            AND public.project_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Assigned users can update requirement instances" ON itp_requirement_instances
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM itp_instances 
            WHERE itp_instances.id = itp_requirement_instances.instance_id 
            AND itp_instances.assigned_to = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE public.users.auth_user_id = auth.uid() 
            AND public.users.role IN ('project_manager', 'project_coordinator')
        )
    );

-- Insert some sample ITP templates
INSERT INTO itp_templates (name, description, category, type, priority) VALUES
('Concrete Foundation Inspection', 'Comprehensive inspection checklist for concrete foundation work', 'Foundation', 'structural', 'critical'),
('Electrical System Inspection', 'Quality control checklist for electrical installations', 'Electrical', 'electrical', 'high'),
('Plumbing System Inspection', 'Inspection requirements for plumbing installations', 'Plumbing', 'plumbing', 'high'),
('HVAC System Inspection', 'Quality assurance checklist for HVAC installations', 'HVAC', 'hvac', 'medium'),
('Fire Safety Inspection', 'Fire safety compliance checklist', 'Safety', 'fire_safety', 'critical'),
('Accessibility Compliance', 'ADA and accessibility compliance checklist', 'Compliance', 'accessibility', 'high'),
('Environmental Impact Assessment', 'Environmental compliance and impact assessment', 'Environmental', 'environmental', 'medium');

-- Insert sample requirements for Concrete Foundation Inspection
INSERT INTO itp_requirements (template_id, text, required, category, order_index) 
SELECT 
    t.id,
    req.text,
    req.required,
    req.category,
    req.order_index
FROM itp_templates t
CROSS JOIN (VALUES
    ('Verify concrete mix design meets specifications', true, 'quality', 1),
    ('Check formwork is properly secured and aligned', true, 'safety', 2),
    ('Confirm reinforcement placement and spacing', true, 'quality', 3),
    ('Verify concrete temperature and curing conditions', true, 'quality', 4),
    ('Check for proper concrete consolidation', true, 'quality', 5),
    ('Document concrete placement and finishing', true, 'documentation', 6),
    ('Verify concrete strength testing schedule', false, 'testing', 7),
    ('Check for surface defects and repairs', true, 'quality', 8)
) AS req(text, required, category, order_index)
WHERE t.name = 'Concrete Foundation Inspection';

-- Insert sample requirements for Electrical System Inspection
INSERT INTO itp_requirements (template_id, text, required, category, order_index) 
SELECT 
    t.id,
    req.text,
    req.required,
    req.category,
    req.order_index
FROM itp_templates t
CROSS JOIN (VALUES
    ('Verify electrical panel installation and labeling', true, 'safety', 1),
    ('Check wire sizing and circuit protection', true, 'quality', 2),
    ('Confirm grounding system installation', true, 'safety', 3),
    ('Verify outlet and switch placement', true, 'quality', 4),
    ('Check electrical load calculations', true, 'quality', 5),
    ('Document electrical permit and inspections', true, 'compliance', 6),
    ('Verify emergency lighting installation', false, 'safety', 7),
    ('Check electrical system testing results', true, 'testing', 8)
) AS req(text, required, category, order_index)
WHERE t.name = 'Electrical System Inspection';

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_itp_templates_updated_at BEFORE UPDATE ON itp_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_itp_requirements_updated_at BEFORE UPDATE ON itp_requirements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_itp_instances_updated_at BEFORE UPDATE ON itp_instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_itp_requirement_instances_updated_at BEFORE UPDATE ON itp_requirement_instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify the tables were created successfully
SELECT 'ITP Tables created successfully' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'itp_%' ORDER BY table_name; 