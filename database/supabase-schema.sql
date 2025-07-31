-- =====================================================
-- Gogram Construction Management Platform
-- Supabase Database Schema
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUMS
-- =====================================================

-- User roles
CREATE TYPE user_role AS ENUM (
    'project_manager',
    'project_coordinator', 
    'subcontractor',
    'supplier',
    'viewer'
);

-- Project status
CREATE TYPE project_status AS ENUM (
    'planning',
    'active',
    'on_hold',
    'completed',
    'cancelled'
);

-- Task status
CREATE TYPE task_status AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'delayed',
    'cancelled'
);

-- Task priority
CREATE TYPE task_priority AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);

-- Change proposal status
CREATE TYPE proposal_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);

-- Delivery confirmation status
CREATE TYPE delivery_status AS ENUM (
    'pending',
    'confirmed',
    'rejected'
);

-- QA alert status
CREATE TYPE qa_alert_status AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'overdue'
);

-- QA alert type
CREATE TYPE qa_alert_type AS ENUM (
    'itp_required',
    'pre_pour_checklist',
    'engineer_inspection',
    'quality_checkpoint',
    'compliance_check'
);

-- Notification type
CREATE TYPE notification_type AS ENUM (
    'task_update',
    'task_assignment',
    'delivery_update',
    'qa_alert',
    'approval_request',
    'system_message'
);

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'viewer',
    avatar_url TEXT,
    phone VARCHAR(50),
    company VARCHAR(255),
    specialties TEXT[],
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    client VARCHAR(255),
    project_manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status project_status DEFAULT 'planning',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    budget DECIMAL(15,2),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    is_public BOOLEAN DEFAULT false,
    public_share_token VARCHAR(255) UNIQUE,
    public_settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project members (many-to-many relationship)
CREATE TABLE public.project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    permissions JSONB DEFAULT '{}',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Tasks table
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    location VARCHAR(255),
    status task_status DEFAULT 'pending',
    priority task_priority DEFAULT 'medium',
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    planned_duration INTEGER, -- in days
    actual_duration INTEGER, -- in days
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    color VARCHAR(7) DEFAULT '#3b82f6', -- hex color
    notes TEXT,
    attachments JSONB DEFAULT '[]',
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task dependencies (many-to-many self-referencing)
CREATE TABLE public.task_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(task_id, depends_on_task_id),
    CHECK(task_id != depends_on_task_id)
);

-- Task delays tracking
CREATE TABLE public.task_delays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    original_end_date DATE NOT NULL,
    new_end_date DATE NOT NULL,
    delay_days INTEGER NOT NULL,
    reason TEXT,
    impact_assessment TEXT,
    reported_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task change proposals
CREATE TABLE public.task_change_proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    proposed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status proposal_status DEFAULT 'pending',
    proposed_start_date DATE,
    proposed_end_date DATE,
    reason TEXT NOT NULL,
    impact_description TEXT,
    reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SUPPLIER & PROCUREMENT TABLES
-- =====================================================

-- Suppliers table
CREATE TABLE public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    specialties TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deliveries table
CREATE TABLE public.deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
    item VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    planned_date DATE NOT NULL,
    actual_date DATE,
    confirmation_status delivery_status DEFAULT 'pending',
    delivery_address TEXT,
    notes TEXT,
    confirmation_token VARCHAR(255) UNIQUE,
    confirmed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery confirmations (audit trail)
CREATE TABLE public.delivery_confirmations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id UUID REFERENCES public.deliveries(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
    status delivery_status NOT NULL,
    proposed_date DATE,
    comments TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery responses (for interactive email responses)
CREATE TABLE public.delivery_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id UUID REFERENCES public.deliveries(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
    response VARCHAR(20) NOT NULL CHECK (response IN ('confirm', 'deny')),
    comments TEXT,
    alternative_date TIMESTAMPTZ,
    responded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- QUALITY ASSURANCE TABLES
-- =====================================================

-- QA alerts table
CREATE TABLE public.qa_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    type qa_alert_type NOT NULL,
    status qa_alert_status DEFAULT 'pending',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    checklist JSONB DEFAULT '[]', -- Array of checklist items
    priority task_priority DEFAULT 'medium',
    completed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- QA checklist items completion tracking
CREATE TABLE public.qa_checklist_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    qa_alert_id UUID REFERENCES public.qa_alerts(id) ON DELETE CASCADE,
    checklist_item_id VARCHAR(255) NOT NULL, -- ID from the JSONB checklist
    completed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    notes TEXT,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(qa_alert_id, checklist_item_id)
);

-- =====================================================
-- NOTIFICATION SYSTEM
-- =====================================================

-- Notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}', -- Additional contextual data
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- REPORTING & ANALYTICS TABLES
-- =====================================================

-- Project snapshots for historical reporting
CREATE TABLE public.project_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    total_tasks INTEGER,
    completed_tasks INTEGER,
    delayed_tasks INTEGER,
    progress_percentage INTEGER,
    budget_spent DECIMAL(15,2),
    data JSONB, -- Full project state snapshot
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, snapshot_date)
);

-- Activity logs for audit trail
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'task', 'project', 'delivery', etc.
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'moved', etc.
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);

-- Projects indexes
CREATE INDEX idx_projects_manager ON public.projects(project_manager_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_dates ON public.projects(start_date, end_date);

-- Project members indexes
CREATE INDEX idx_project_members_project ON public.project_members(project_id);
CREATE INDEX idx_project_members_user ON public.project_members(user_id);

-- Tasks indexes
CREATE INDEX idx_tasks_project ON public.tasks(project_id);
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_dates ON public.tasks(start_date, end_date);
CREATE INDEX idx_tasks_priority ON public.tasks(priority);

-- Task dependencies indexes
CREATE INDEX idx_task_deps_task ON public.task_dependencies(task_id);
CREATE INDEX idx_task_deps_depends ON public.task_dependencies(depends_on_task_id);

-- Deliveries indexes
CREATE INDEX idx_deliveries_project ON public.deliveries(project_id);
CREATE INDEX idx_deliveries_task ON public.deliveries(task_id);
CREATE INDEX idx_deliveries_supplier ON public.deliveries(supplier_id);
CREATE INDEX idx_deliveries_status ON public.deliveries(confirmation_status);
CREATE INDEX idx_deliveries_dates ON public.deliveries(planned_date, actual_date);

-- QA alerts indexes
CREATE INDEX idx_qa_alerts_project ON public.qa_alerts(project_id);
CREATE INDEX idx_qa_alerts_task ON public.qa_alerts(task_id);
CREATE INDEX idx_qa_alerts_status ON public.qa_alerts(status);
CREATE INDEX idx_qa_alerts_assigned ON public.qa_alerts(assigned_to);
CREATE INDEX idx_qa_alerts_due_date ON public.qa_alerts(due_date);

-- Notifications indexes
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created ON public.notifications(created_at);

-- Activity logs indexes
CREATE INDEX idx_activity_logs_project ON public.activity_logs(project_id);
CREATE INDEX idx_activity_logs_user ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created ON public.activity_logs(created_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_delays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_change_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_checklist_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert their own profile"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = auth_user_id);

-- Projects policies
CREATE POLICY "Project members can view projects"
    ON public.projects FOR SELECT
    USING (
        id IN (
            SELECT project_id FROM public.project_members 
            WHERE user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
        )
        OR is_public = true
    );

CREATE POLICY "Authenticated users can create projects"
    ON public.projects FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        project_manager_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    );

CREATE POLICY "Project managers can update projects"
    ON public.projects FOR UPDATE
    USING (
        project_manager_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    );

-- Project members policies
CREATE POLICY "Project members can view project membership"
    ON public.project_members FOR SELECT
    USING (
        project_id IN (
            SELECT project_id FROM public.project_members 
            WHERE user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
        )
    );

CREATE POLICY "Project managers can add project members"
    ON public.project_members FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM public.projects 
            WHERE project_manager_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
        )
    );

-- Tasks policies
CREATE POLICY "Project members can view tasks"
    ON public.tasks FOR SELECT
    USING (
        project_id IN (
            SELECT project_id FROM public.project_members 
            WHERE user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
        )
    );

CREATE POLICY "Project managers and coordinators can modify tasks"
    ON public.tasks FOR ALL
    USING (
        project_id IN (
            SELECT pm.project_id FROM public.project_members pm
            JOIN public.users u ON pm.user_id = u.id
            WHERE u.auth_user_id = auth.uid()
            AND pm.role IN ('project_manager', 'project_coordinator')
        )
    );

-- Deliveries policies
CREATE POLICY "Project members can view deliveries"
    ON public.deliveries FOR SELECT
    USING (
        project_id IN (
            SELECT project_id FROM public.project_members 
            WHERE user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
        )
    );

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_change_proposals_updated_at BEFORE UPDATE ON public.task_change_proposals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON public.deliveries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_qa_alerts_updated_at BEFORE UPDATE ON public.qa_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get current user ID
    SELECT id INTO current_user_id FROM public.users WHERE auth_user_id = auth.uid();
    
    -- Log the activity
    INSERT INTO public.activity_logs (
        project_id,
        user_id,
        entity_type,
        entity_id,
        action,
        old_values,
        new_values,
        created_at
    ) VALUES (
        COALESCE(NEW.project_id, OLD.project_id),
        current_user_id,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW) 
             WHEN TG_OP = 'UPDATE' THEN to_jsonb(NEW) 
             ELSE NULL END,
        NOW()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply activity logging to key tables
CREATE TRIGGER log_tasks_activity AFTER INSERT OR UPDATE OR DELETE ON public.tasks FOR EACH ROW EXECUTE FUNCTION log_activity();
CREATE TRIGGER log_deliveries_activity AFTER INSERT OR UPDATE OR DELETE ON public.deliveries FOR EACH ROW EXECUTE FUNCTION log_activity();
CREATE TRIGGER log_qa_alerts_activity AFTER INSERT OR UPDATE OR DELETE ON public.qa_alerts FOR EACH ROW EXECUTE FUNCTION log_activity();

-- Function to auto-update project progress
CREATE OR REPLACE FUNCTION update_project_progress()
RETURNS TRIGGER AS $$
DECLARE
    project_id_to_update UUID;
    total_tasks INTEGER;
    completed_tasks INTEGER;
    new_progress INTEGER;
BEGIN
    -- Get project ID from the task
    project_id_to_update := COALESCE(NEW.project_id, OLD.project_id);
    
    -- Calculate new progress
    SELECT COUNT(*) INTO total_tasks FROM public.tasks WHERE project_id = project_id_to_update;
    SELECT COUNT(*) INTO completed_tasks FROM public.tasks WHERE project_id = project_id_to_update AND status = 'completed';
    
    new_progress := CASE WHEN total_tasks > 0 THEN ROUND((completed_tasks::DECIMAL / total_tasks) * 100) ELSE 0 END;
    
    -- Update project progress
    UPDATE public.projects 
    SET progress_percentage = new_progress, updated_at = NOW()
    WHERE id = project_id_to_update;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply project progress trigger
CREATE TRIGGER update_project_progress_trigger 
    AFTER INSERT OR UPDATE OR DELETE ON public.tasks 
    FOR EACH ROW EXECUTE FUNCTION update_project_progress();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get user's role in a project
CREATE OR REPLACE FUNCTION get_user_project_role(user_uuid UUID, project_uuid UUID)
RETURNS user_role AS $$
DECLARE
    user_role_result user_role;
BEGIN
    SELECT pm.role INTO user_role_result
    FROM public.project_members pm
    WHERE pm.user_id = user_uuid AND pm.project_id = project_uuid;
    
    RETURN user_role_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can perform action on project
CREATE OR REPLACE FUNCTION can_user_perform_action(user_uuid UUID, project_uuid UUID, required_roles user_role[])
RETURNS BOOLEAN AS $$
DECLARE
    user_role_in_project user_role;
BEGIN
    SELECT get_user_project_role(user_uuid, project_uuid) INTO user_role_in_project;
    
    RETURN user_role_in_project = ANY(required_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate public share token
CREATE OR REPLACE FUNCTION generate_public_share_token()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INITIAL DATA SETUP
-- =====================================================

-- Insert default notification types configuration
CREATE TABLE IF NOT EXISTS public.system_config (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.system_config (key, value, description) VALUES
('notification_settings', '{
    "email_enabled": true,
    "push_enabled": true,
    "task_updates": true,
    "delivery_updates": true,
    "qa_alerts": true,
    "approval_requests": true
}', 'Default notification settings'),
('qa_checklist_templates', '{
    "itp_required": [
        {"id": "materials_ready", "text": "All materials delivered and inspected", "required": true},
        {"id": "drawings_approved", "text": "Construction drawings approved", "required": true},
        {"id": "permits_obtained", "text": "All necessary permits obtained", "required": true}
    ],
    "pre_pour_checklist": [
        {"id": "formwork_inspected", "text": "Formwork inspected and approved", "required": true},
        {"id": "reinforcement_checked", "text": "Reinforcement placement verified", "required": true},
        {"id": "concrete_ordered", "text": "Concrete delivery scheduled", "required": true},
        {"id": "weather_suitable", "text": "Weather conditions suitable for pour", "required": true}
    ]
}', 'QA checklist templates');

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for project dashboard statistics
CREATE VIEW project_dashboard_stats AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    p.progress_percentage,
    COUNT(t.id) as total_tasks,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as active_tasks,
    COUNT(CASE WHEN t.status = 'delayed' THEN 1 END) as delayed_tasks,
    COUNT(CASE WHEN t.end_date < CURRENT_DATE AND t.status != 'completed' THEN 1 END) as overdue_tasks,
    COUNT(CASE WHEN d.confirmation_status = 'pending' THEN 1 END) as pending_deliveries,
    COUNT(CASE WHEN qa.status IN ('pending', 'overdue') THEN 1 END) as pending_qa_alerts
FROM public.projects p
LEFT JOIN public.tasks t ON p.id = t.project_id
LEFT JOIN public.deliveries d ON p.id = d.project_id
LEFT JOIN public.qa_alerts qa ON p.id = qa.project_id
GROUP BY p.id, p.name, p.progress_percentage;

-- View for task details with dependencies
CREATE VIEW task_details AS
SELECT 
    t.*,
    u.full_name as assigned_to_name,
    creator.full_name as created_by_name,
    array_agg(DISTINCT dep_tasks.title) FILTER (WHERE dep_tasks.title IS NOT NULL) as dependency_titles,
    COUNT(qa.id) as qa_alerts_count
FROM public.tasks t
LEFT JOIN public.users u ON t.assigned_to = u.id
LEFT JOIN public.users creator ON t.created_by = creator.id
LEFT JOIN public.task_dependencies td ON t.id = td.task_id
LEFT JOIN public.tasks dep_tasks ON td.depends_on_task_id = dep_tasks.id
LEFT JOIN public.qa_alerts qa ON t.id = qa.task_id AND qa.status IN ('pending', 'overdue')
GROUP BY t.id, u.full_name, creator.full_name;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.users IS 'Extended user profiles for Gogram platform users';
COMMENT ON TABLE public.projects IS 'Construction projects managed in the platform';
COMMENT ON TABLE public.tasks IS 'Individual tasks within construction projects';
COMMENT ON TABLE public.deliveries IS 'Material and equipment deliveries linked to tasks';
COMMENT ON TABLE public.qa_alerts IS 'Quality assurance alerts and checklists';
COMMENT ON TABLE public.notifications IS 'System notifications for users';
COMMENT ON TABLE public.activity_logs IS 'Audit trail for all significant actions';

-- =====================================================
-- END OF SCHEMA
-- ===================================================== 