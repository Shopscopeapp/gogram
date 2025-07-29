-- Safety Requirements Database Schema
-- This script creates all necessary tables for the safety requirements system

-- Safety Reports Table
CREATE TABLE IF NOT EXISTS safety_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('monthly', 'quarterly', 'annual', 'incident', 'custom')),
  title TEXT NOT NULL,
  summary TEXT,
  details JSONB,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'archived')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safety Training Table
CREATE TABLE IF NOT EXISTS safety_training (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  training_type TEXT NOT NULL CHECK (training_type IN ('safety_orientation', 'equipment_operation', 'hazard_awareness', 'emergency_procedures', 'compliance_training', 'custom')),
  training_date DATE NOT NULL,
  duration_hours DECIMAL(4,2) NOT NULL,
  instructor TEXT,
  location TEXT,
  attendees TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  completion_rate DECIMAL(5,2),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safety Inspections Table
CREATE TABLE IF NOT EXISTS safety_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  inspection_type TEXT NOT NULL CHECK (inspection_type IN ('routine', 'scheduled', 'incident_followup', 'compliance', 'custom')),
  title TEXT NOT NULL,
  description TEXT,
  inspection_date DATE NOT NULL,
  inspector_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'passed', 'failed')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  findings TEXT[] DEFAULT '{}',
  corrective_actions TEXT[] DEFAULT '{}',
  next_inspection_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safety Compliance Table
CREATE TABLE IF NOT EXISTS safety_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  compliance_type TEXT NOT NULL CHECK (compliance_type IN ('regulatory', 'company_policy', 'industry_standard', 'contractual', 'custom')),
  title TEXT NOT NULL,
  description TEXT,
  regulation_code TEXT,
  check_date DATE NOT NULL,
  checked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  compliant BOOLEAN NOT NULL DEFAULT false,
  requirements TEXT[] DEFAULT '{}',
  findings TEXT[] DEFAULT '{}',
  corrective_actions TEXT[] DEFAULT '{}',
  next_review_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_safety_reports_project_id ON safety_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_safety_reports_created_by ON safety_reports(created_by);
CREATE INDEX IF NOT EXISTS idx_safety_reports_status ON safety_reports(status);

CREATE INDEX IF NOT EXISTS idx_safety_training_project_id ON safety_training(project_id);
CREATE INDEX IF NOT EXISTS idx_safety_training_created_by ON safety_training(created_by);
CREATE INDEX IF NOT EXISTS idx_safety_training_status ON safety_training(status);
CREATE INDEX IF NOT EXISTS idx_safety_training_date ON safety_training(training_date);

CREATE INDEX IF NOT EXISTS idx_safety_inspections_project_id ON safety_inspections(project_id);
CREATE INDEX IF NOT EXISTS idx_safety_inspections_inspector_id ON safety_inspections(inspector_id);
CREATE INDEX IF NOT EXISTS idx_safety_inspections_status ON safety_inspections(status);
CREATE INDEX IF NOT EXISTS idx_safety_inspections_date ON safety_inspections(inspection_date);

CREATE INDEX IF NOT EXISTS idx_safety_compliance_project_id ON safety_compliance(project_id);
CREATE INDEX IF NOT EXISTS idx_safety_compliance_checked_by ON safety_compliance(checked_by);
CREATE INDEX IF NOT EXISTS idx_safety_compliance_compliant ON safety_compliance(compliant);
CREATE INDEX IF NOT EXISTS idx_safety_compliance_date ON safety_compliance(check_date);

-- Enable Row Level Security (RLS)
ALTER TABLE safety_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_compliance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for safety_reports
CREATE POLICY "Users can view safety reports for projects they are members of" ON safety_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = safety_reports.project_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project managers can create safety reports" ON safety_reports
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = safety_reports.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'project_manager'
    )
  );

CREATE POLICY "Project managers can update safety reports" ON safety_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = safety_reports.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'project_manager'
    )
  );

CREATE POLICY "Project managers can delete safety reports" ON safety_reports
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = safety_reports.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'project_manager'
    )
  );

-- RLS Policies for safety_training
CREATE POLICY "Users can view safety training for projects they are members of" ON safety_training
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = safety_training.project_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project managers can create safety training" ON safety_training
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = safety_training.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'project_manager'
    )
  );

CREATE POLICY "Project managers can update safety training" ON safety_training
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = safety_training.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'project_manager'
    )
  );

CREATE POLICY "Project managers can delete safety training" ON safety_training
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = safety_training.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'project_manager'
    )
  );

-- RLS Policies for safety_inspections
CREATE POLICY "Users can view safety inspections for projects they are members of" ON safety_inspections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = safety_inspections.project_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project managers can create safety inspections" ON safety_inspections
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = safety_inspections.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'project_manager'
    )
  );

CREATE POLICY "Project managers can update safety inspections" ON safety_inspections
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = safety_inspections.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'project_manager'
    )
  );

CREATE POLICY "Project managers can delete safety inspections" ON safety_inspections
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = safety_inspections.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'project_manager'
    )
  );

-- RLS Policies for safety_compliance
CREATE POLICY "Users can view safety compliance for projects they are members of" ON safety_compliance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = safety_compliance.project_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project managers can create safety compliance" ON safety_compliance
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = safety_compliance.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'project_manager'
    )
  );

CREATE POLICY "Project managers can update safety compliance" ON safety_compliance
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = safety_compliance.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'project_manager'
    )
  );

CREATE POLICY "Project managers can delete safety compliance" ON safety_compliance
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = safety_compliance.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'project_manager'
    )
  );

-- Insert sample data
INSERT INTO safety_reports (project_id, report_type, title, summary, details, status) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'monthly', 'Safety Report - January 2024', 'Monthly safety report covering 12 inspections, 8 training sessions, and 95.2% compliance rate.', '{"inspections": {"total": 12, "passed": 11, "failed": 1}, "training": {"total": 8, "completed": 7}, "compliance": {"score": 95.2, "total_checks": 25}}', 'completed'),
('550e8400-e29b-41d4-a716-446655440000', 'monthly', 'Safety Report - February 2024', 'Monthly safety report covering 15 inspections, 6 training sessions, and 98.1% compliance rate.', '{"inspections": {"total": 15, "passed": 15, "failed": 0}, "training": {"total": 6, "completed": 6}, "compliance": {"score": 98.1, "total_checks": 30}}', 'completed');

INSERT INTO safety_training (project_id, title, description, training_type, training_date, duration_hours, instructor, location, attendees, status, completion_rate) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Safety Orientation', 'Basic safety orientation for new workers', 'safety_orientation', '2024-01-15', 2.0, 'John Smith', 'Site Office', ARRAY['user1', 'user2', 'user3'], 'completed', 100.0),
('550e8400-e29b-41d4-a716-446655440000', 'Equipment Operation Training', 'Training on proper equipment operation', 'equipment_operation', '2024-01-20', 4.0, 'Mike Johnson', 'Training Center', ARRAY['user4', 'user5'], 'completed', 100.0),
('550e8400-e29b-41d4-a716-446655440000', 'Hazard Awareness', 'Identifying and avoiding workplace hazards', 'hazard_awareness', '2024-02-10', 3.0, 'Sarah Wilson', 'Site Office', ARRAY['user1', 'user6', 'user7'], 'scheduled', NULL);

INSERT INTO safety_inspections (project_id, inspection_type, title, description, inspection_date, location, status, severity, findings, corrective_actions) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'routine', 'Weekly Site Inspection', 'Regular weekly safety inspection', '2024-01-15', 'Main Site', 'passed', 'low', ARRAY['All safety protocols followed'], ARRAY['Continue current practices']),
('550e8400-e29b-41d4-a716-446655440000', 'scheduled', 'Monthly Equipment Inspection', 'Monthly inspection of all equipment', '2024-01-20', 'Equipment Yard', 'passed', 'medium', ARRAY['Equipment in good condition', 'Safety guards properly installed'], ARRAY['Schedule next inspection for February']),
('550e8400-e29b-41d4-a716-446655440000', 'compliance', 'Regulatory Compliance Check', 'Check for regulatory compliance', '2024-02-01', 'Entire Site', 'in_progress', 'high', ARRAY['Review in progress'], ARRAY['Awaiting completion']);

INSERT INTO safety_compliance (project_id, compliance_type, title, description, regulation_code, check_date, compliant, requirements, findings, notes) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'regulatory', 'OSHA Compliance Check', 'Check for OSHA compliance standards', 'OSHA-2024-001', '2024-01-15', true, ARRAY['Proper PPE usage', 'Safety signage', 'Emergency exits clear'], ARRAY['All requirements met'], 'Compliance check completed successfully'),
('550e8400-e29b-41d4-a716-446655440000', 'company_policy', 'Company Safety Policy Review', 'Review of company safety policies', 'COMP-2024-001', '2024-01-20', true, ARRAY['Safety training completed', 'Incident reporting procedures', 'Emergency response plan'], ARRAY['All policies being followed'], 'Policy review completed'),
('550e8400-e29b-41d4-a716-446655440000', 'industry_standard', 'Industry Standard Compliance', 'Check against industry standards', 'IND-2024-001', '2024-02-01', false, ARRAY['Quality standards', 'Performance metrics', 'Documentation requirements'], ARRAY['Some documentation needs updating'], 'Follow up required for documentation updates'); 