-- Run Safety Schema Script
-- This script will create all safety-related tables and data

DO $$
BEGIN
    -- Create safety_reports table
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
    
    RAISE NOTICE 'Created safety_reports table';

    -- Create safety_training table
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
    
    RAISE NOTICE 'Created safety_training table';

    -- Create safety_inspections table
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
    
    RAISE NOTICE 'Created safety_inspections table';

    -- Create safety_compliance table
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
    
    RAISE NOTICE 'Created safety_compliance table';

    -- Create indexes
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
    
    RAISE NOTICE 'Created all safety indexes';

    -- Enable RLS
    ALTER TABLE safety_reports ENABLE ROW LEVEL SECURITY;
    ALTER TABLE safety_training ENABLE ROW LEVEL SECURITY;
    ALTER TABLE safety_inspections ENABLE ROW LEVEL SECURITY;
    ALTER TABLE safety_compliance ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'Enabled RLS on all safety tables';

    -- Create RLS policies
    -- Safety Reports Policies
    DROP POLICY IF EXISTS "Users can view safety reports for projects they are members of" ON safety_reports;
    CREATE POLICY "Users can view safety reports for projects they are members of" ON safety_reports
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM project_members pm
                WHERE pm.project_id = safety_reports.project_id
                AND pm.user_id = auth.uid()
            )
        );

    DROP POLICY IF EXISTS "Project managers can create safety reports" ON safety_reports;
    CREATE POLICY "Project managers can create safety reports" ON safety_reports
        FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM project_members pm
                WHERE pm.project_id = safety_reports.project_id
                AND pm.user_id = auth.uid()
                AND pm.role = 'project_manager'
            )
        );

    DROP POLICY IF EXISTS "Project managers can update safety reports" ON safety_reports;
    CREATE POLICY "Project managers can update safety reports" ON safety_reports
        FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM project_members pm
                WHERE pm.project_id = safety_reports.project_id
                AND pm.user_id = auth.uid()
                AND pm.role = 'project_manager'
            )
        );

    DROP POLICY IF EXISTS "Project managers can delete safety reports" ON safety_reports;
    CREATE POLICY "Project managers can delete safety reports" ON safety_reports
        FOR DELETE USING (
            EXISTS (
                SELECT 1 FROM project_members pm
                WHERE pm.project_id = safety_reports.project_id
                AND pm.user_id = auth.uid()
                AND pm.role = 'project_manager'
            )
        );

    -- Safety Training Policies
    DROP POLICY IF EXISTS "Users can view safety training for projects they are members of" ON safety_training;
    CREATE POLICY "Users can view safety training for projects they are members of" ON safety_training
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM project_members pm
                WHERE pm.project_id = safety_training.project_id
                AND pm.user_id = auth.uid()
            )
        );

    DROP POLICY IF EXISTS "Project managers can create safety training" ON safety_training;
    CREATE POLICY "Project managers can create safety training" ON safety_training
        FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM project_members pm
                WHERE pm.project_id = safety_training.project_id
                AND pm.user_id = auth.uid()
                AND pm.role = 'project_manager'
            )
        );

    DROP POLICY IF EXISTS "Project managers can update safety training" ON safety_training;
    CREATE POLICY "Project managers can update safety training" ON safety_training
        FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM project_members pm
                WHERE pm.project_id = safety_training.project_id
                AND pm.user_id = auth.uid()
                AND pm.role = 'project_manager'
            )
        );

    DROP POLICY IF EXISTS "Project managers can delete safety training" ON safety_training;
    CREATE POLICY "Project managers can delete safety training" ON safety_training
        FOR DELETE USING (
            EXISTS (
                SELECT 1 FROM project_members pm
                WHERE pm.project_id = safety_training.project_id
                AND pm.user_id = auth.uid()
                AND pm.role = 'project_manager'
            )
        );

    -- Safety Inspections Policies
    DROP POLICY IF EXISTS "Users can view safety inspections for projects they are members of" ON safety_inspections;
    CREATE POLICY "Users can view safety inspections for projects they are members of" ON safety_inspections
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM project_members pm
                WHERE pm.project_id = safety_inspections.project_id
                AND pm.user_id = auth.uid()
            )
        );

    DROP POLICY IF EXISTS "Project managers can create safety inspections" ON safety_inspections;
    CREATE POLICY "Project managers can create safety inspections" ON safety_inspections
        FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM project_members pm
                WHERE pm.project_id = safety_inspections.project_id
                AND pm.user_id = auth.uid()
                AND pm.role = 'project_manager'
            )
        );

    DROP POLICY IF EXISTS "Project managers can update safety inspections" ON safety_inspections;
    CREATE POLICY "Project managers can update safety inspections" ON safety_inspections
        FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM project_members pm
                WHERE pm.project_id = safety_inspections.project_id
                AND pm.user_id = auth.uid()
                AND pm.role = 'project_manager'
            )
        );

    DROP POLICY IF EXISTS "Project managers can delete safety inspections" ON safety_inspections;
    CREATE POLICY "Project managers can delete safety inspections" ON safety_inspections
        FOR DELETE USING (
            EXISTS (
                SELECT 1 FROM project_members pm
                WHERE pm.project_id = safety_inspections.project_id
                AND pm.user_id = auth.uid()
                AND pm.role = 'project_manager'
            )
        );

    -- Safety Compliance Policies
    DROP POLICY IF EXISTS "Users can view safety compliance for projects they are members of" ON safety_compliance;
    CREATE POLICY "Users can view safety compliance for projects they are members of" ON safety_compliance
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM project_members pm
                WHERE pm.project_id = safety_compliance.project_id
                AND pm.user_id = auth.uid()
            )
        );

    DROP POLICY IF EXISTS "Project managers can create safety compliance" ON safety_compliance;
    CREATE POLICY "Project managers can create safety compliance" ON safety_compliance
        FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM project_members pm
                WHERE pm.project_id = safety_compliance.project_id
                AND pm.user_id = auth.uid()
                AND pm.role = 'project_manager'
            )
        );

    DROP POLICY IF EXISTS "Project managers can update safety compliance" ON safety_compliance;
    CREATE POLICY "Project managers can update safety compliance" ON safety_compliance
        FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM project_members pm
                WHERE pm.project_id = safety_compliance.project_id
                AND pm.user_id = auth.uid()
                AND pm.role = 'project_manager'
            )
        );

    DROP POLICY IF EXISTS "Project managers can delete safety compliance" ON safety_compliance;
    CREATE POLICY "Project managers can delete safety compliance" ON safety_compliance
        FOR DELETE USING (
            EXISTS (
                SELECT 1 FROM project_members pm
                WHERE pm.project_id = safety_compliance.project_id
                AND pm.user_id = auth.uid()
                AND pm.role = 'project_manager'
            )
        );
    
    RAISE NOTICE 'Created all RLS policies';

    RAISE NOTICE 'Safety schema setup completed successfully!';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error setting up safety schema: %', SQLERRM;
        RAISE;
END $$; 