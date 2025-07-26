-- =====================================================
-- Gogram Sample Data
-- Run this after the main schema is created
-- =====================================================

-- Sample Users (these would normally be created via Supabase Auth)
INSERT INTO public.users (id, email, full_name, role, company, specialties, phone) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'sarah.johnson@buildtech.com', 'Sarah Johnson', 'project_manager', 'BuildTech Construction', '{"Commercial Construction", "Project Management"}', '+1-555-0101'),
('550e8400-e29b-41d4-a716-446655440002', 'mike.rodriguez@buildtech.com', 'Mike Rodriguez', 'project_coordinator', 'BuildTech Construction', '{"Site Coordination", "Quality Control"}', '+1-555-0102'),
('550e8400-e29b-41d4-a716-446655440003', 'alex.chen@metro-contractors.com', 'Alex Chen', 'subcontractor', 'Metro Contractors', '{"Concrete Work", "Structural"}', '+1-555-0103'),
('550e8400-e29b-41d4-a716-446655440004', 'jennifer.davis@city-supplies.com', 'Jennifer Davis', 'supplier', 'City Building Supplies', '{"Materials Supply", "Logistics"}', '+1-555-0104'),
('550e8400-e29b-41d4-a716-446655440005', 'robert.wilson@client-corp.com', 'Robert Wilson', 'viewer', 'Client Corporation', '{"Project Oversight"}', '+1-555-0105');

-- Sample Projects
INSERT INTO public.projects (id, name, description, location, client, project_manager_id, status, start_date, end_date, budget, progress_percentage) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Metro Tower Construction', 'A 25-story commercial office building in downtown metro area', '123 Main Street, Metro City', 'Metro Development Corp', '550e8400-e29b-41d4-a716-446655440001', 'active', '2024-01-15', '2024-12-15', 15000000.00, 35),
('660e8400-e29b-41d4-a716-446655440002', 'Residential Complex Phase 1', 'First phase of a 200-unit residential complex', '456 Oak Avenue, Suburb City', 'Residential Builders LLC', '550e8400-e29b-41d4-a716-446655440001', 'planning', '2024-03-01', '2025-02-28', 8500000.00, 15);

-- Project Members
INSERT INTO public.project_members (project_id, user_id, role) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'project_manager'),
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'project_coordinator'),
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'subcontractor'),
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 'supplier'),
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', 'viewer'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'project_manager'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'project_coordinator');

-- Sample Tasks
INSERT INTO public.tasks (id, project_id, title, description, category, status, priority, assigned_to, start_date, end_date, planned_duration, color, created_by) VALUES
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'Site Preparation', 'Clear and level the construction site', 'Site Work', 'completed', 'high', '550e8400-e29b-41d4-a716-446655440003', '2024-01-15', '2024-01-25', 10, '#22c55e', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'Foundation Excavation', 'Excavate foundation area to required depth', 'Foundation', 'completed', 'critical', '550e8400-e29b-41d4-a716-446655440003', '2024-01-26', '2024-02-05', 10, '#22c55e', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', 'Foundation Pour', 'Pour concrete foundation including reinforcement', 'Foundation', 'in_progress', 'critical', '550e8400-e29b-41d4-a716-446655440003', '2024-02-06', '2024-02-20', 14, '#3b82f6', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440001', 'Ground Floor Framing', 'Steel frame construction for ground floor', 'Structural', 'pending', 'high', '550e8400-e29b-41d4-a716-446655440003', '2024-02-21', '2024-03-15', 23, '#6b7280', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440001', 'Plumbing Rough-in', 'Install rough plumbing for ground floor', 'MEP', 'pending', 'medium', '550e8400-e29b-41d4-a716-446655440003', '2024-03-16', '2024-03-30', 14, '#6b7280', '550e8400-e29b-41d4-a716-446655440001'),
('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440001', 'Electrical Rough-in', 'Install electrical conduits and boxes', 'MEP', 'pending', 'medium', '550e8400-e29b-41d4-a716-446655440003', '2024-03-16', '2024-04-05', 20, '#6b7280', '550e8400-e29b-41d4-a716-446655440001');

-- Task Dependencies
INSERT INTO public.task_dependencies (task_id, depends_on_task_id) VALUES
('770e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001'), -- Foundation depends on site prep
('770e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440002'), -- Foundation pour depends on excavation
('770e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440003'), -- Framing depends on foundation
('770e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440004'), -- Plumbing depends on framing
('770e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440004'); -- Electrical depends on framing

-- Sample Suppliers
INSERT INTO public.suppliers (id, name, company, email, phone, specialties, rating) VALUES
('880e8400-e29b-41d4-a716-446655440001', 'Jennifer Davis', 'City Building Supplies', 'jennifer@citysupplies.com', '+1-555-0201', '{"Concrete", "Rebar", "Aggregates"}', 4.5),
('880e8400-e29b-41d4-a716-446655440002', 'David Kim', 'Metro Steel Works', 'david@metrosteel.com', '+1-555-0202', '{"Structural Steel", "Rebar", "Metal Fabrication"}', 4.8),
('880e8400-e29b-41d4-a716-446655440003', 'Lisa Anderson', 'Electrical Distributors Inc', 'lisa@elecdist.com', '+1-555-0203', '{"Electrical Components", "Conduits", "Wiring"}', 4.3),
('880e8400-e29b-41d4-a716-446655440004', 'Mark Thompson', 'Plumbing & HVAC Supply', 'mark@plumbingsupply.com', '+1-555-0204', '{"Plumbing Fixtures", "Pipes", "HVAC Equipment"}', 4.6);

-- Sample Deliveries
INSERT INTO public.deliveries (id, project_id, task_id, supplier_id, item, quantity, unit, planned_date, confirmation_status, notes) VALUES
('990e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440001', 'Ready-Mix Concrete C30', 120.00, 'cubic meters', '2024-02-06', 'confirmed', 'Foundation pour - early morning delivery required'),
('990e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440002', 'Reinforcement Steel #5', 2500.00, 'kg', '2024-02-04', 'confirmed', 'Cut and bent as per drawings'),
('990e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440002', 'Structural Steel Beams', 15.00, 'tons', '2024-02-18', 'pending', 'Ground floor framing package'),
('990e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440005', '880e8400-e29b-41d4-a716-446655440004', 'PVC Pipe 4 inch', 150.00, 'meters', '2024-03-14', 'pending', 'Main drainage system');

-- Sample Task Delays
INSERT INTO public.task_delays (task_id, original_end_date, new_end_date, delay_days, reason, reported_by) VALUES
('770e8400-e29b-41d4-a716-446655440003', '2024-02-15', '2024-02-20', 5, 'Weather delays due to heavy rain', '550e8400-e29b-41d4-a716-446655440002');

-- Sample Change Proposals
INSERT INTO public.task_change_proposals (id, task_id, proposed_by, status, proposed_start_date, proposed_end_date, reason) VALUES
('aa0e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'pending', '2024-02-25', '2024-03-20', 'Steel delivery delayed by 4 days due to fabrication issues'),
('aa0e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', 'approved', '2024-03-20', '2024-04-03', 'Adjust plumbing schedule to align with delayed framing');

-- Sample QA Alerts
INSERT INTO public.qa_alerts (id, project_id, task_id, type, status, title, description, due_date, assigned_to, priority, checklist) VALUES
('bb0e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440003', 'pre_pour_checklist', 'pending', 'Foundation Pour Pre-Inspection', 'Complete pre-pour checklist before concrete delivery', '2024-02-05', '550e8400-e29b-41d4-a716-446655440002', 'critical', '[
    {"id": "formwork_inspected", "text": "Formwork inspected and approved", "required": true, "completed": false},
    {"id": "reinforcement_checked", "text": "Reinforcement placement verified", "required": true, "completed": true},
    {"id": "concrete_ordered", "text": "Concrete delivery scheduled", "required": true, "completed": true},
    {"id": "weather_suitable", "text": "Weather conditions suitable for pour", "required": true, "completed": false}
]'),
('bb0e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440004', 'itp_required', 'pending', 'Structural Steel ITP', 'Inspection and Test Plan required for structural steel installation', '2024-02-18', '550e8400-e29b-41d4-a716-446655440002', 'high', '[
    {"id": "materials_certified", "text": "Steel materials mill certificates reviewed", "required": true, "completed": false},
    {"id": "drawings_approved", "text": "Shop drawings approved by engineer", "required": true, "completed": false},
    {"id": "welding_procedures", "text": "Welding procedures qualified", "required": true, "completed": false}
]');

-- Sample Notifications
INSERT INTO public.notifications (user_id, type, title, message, data) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'approval_request', 'Schedule Change Approval Required', 'Steel framing schedule change request from Alex Chen requires your approval', '{"proposalId": "aa0e8400-e29b-41d4-a716-446655440001", "taskId": "770e8400-e29b-41d4-a716-446655440004"}'),
('550e8400-e29b-41d4-a716-446655440002', 'qa_alert', 'QA Inspection Due', 'Foundation pour pre-inspection checklist is due tomorrow', '{"qaAlertId": "bb0e8400-e29b-41d4-a716-446655440001", "dueDate": "2024-02-05"}'),
('550e8400-e29b-41d4-a716-446655440003', 'delivery_update', 'Delivery Confirmed', 'Steel beam delivery has been confirmed for February 18th', '{"deliveryId": "990e8400-e29b-41d4-a716-446655440003"}');

-- Sample Project Snapshot
INSERT INTO public.project_snapshots (project_id, snapshot_date, total_tasks, completed_tasks, delayed_tasks, progress_percentage, data) VALUES
('660e8400-e29b-41d4-a716-446655440001', '2024-02-01', 6, 2, 1, 33, '{"totalBudget": 15000000, "spentBudget": 2500000, "activeTasks": 1, "criticalPath": ["770e8400-e29b-41d4-a716-446655440003", "770e8400-e29b-41d4-a716-446655440004"]}');

-- Sample Activity Logs (these would normally be created by triggers)
INSERT INTO public.activity_logs (project_id, user_id, entity_type, entity_id, action, new_values) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'tasks', '770e8400-e29b-41d4-a716-446655440003', 'updated', '{"status": "in_progress", "updated_at": "2024-02-06T08:00:00Z"}'),
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'qa_alerts', 'bb0e8400-e29b-41d4-a716-446655440001', 'created', '{"type": "pre_pour_checklist", "title": "Foundation Pour Pre-Inspection", "status": "pending"}'),
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 'deliveries', '990e8400-e29b-41d4-a716-446655440001', 'updated', '{"confirmation_status": "confirmed", "confirmed_at": "2024-02-04T14:30:00Z"}');

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify the data was inserted correctly
DO $$
DECLARE
    user_count INTEGER;
    project_count INTEGER;
    task_count INTEGER;
    delivery_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM public.users;
    SELECT COUNT(*) INTO project_count FROM public.projects;
    SELECT COUNT(*) INTO task_count FROM public.tasks;
    SELECT COUNT(*) INTO delivery_count FROM public.deliveries;
    
    RAISE NOTICE 'Sample data inserted successfully:';
    RAISE NOTICE '- Users: %', user_count;
    RAISE NOTICE '- Projects: %', project_count;
    RAISE NOTICE '- Tasks: %', task_count;
    RAISE NOTICE '- Deliveries: %', delivery_count;
    RAISE NOTICE '- All UUIDs generated automatically';
END $$; 