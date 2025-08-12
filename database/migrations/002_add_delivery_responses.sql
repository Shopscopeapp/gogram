-- Migration: Add delivery responses table for interactive supplier email system
-- This enables suppliers to confirm/deny delivery date changes via email links

-- Add delivery responses table (for interactive email responses)
CREATE TABLE IF NOT EXISTS public.Final data for Gantt: (23) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
FrappeGantt.tsx:292 Frappe Gantt initialized successfully!
FrappeGantt.tsx:80 Frappe Gantt module: Module {Symbol(Symbol.toStringTag): 'Module'}
FrappeGantt.tsx:83 Skipping CSS import - Frappe Gantt has built-in styles
FrappeGantt.tsx:88 Gantt constructor found: class {
  constructor(t, e, i) {
    this.setup_wrapper(t), this.setup_options(i), this.setup_tasks(e), this.change_view_mode(), this.bind_events();
  }
  setup_wrapper(t) {
    let e, i;
    if (typeof t …
FrappeGantt.tsx:89 Gantt type: function
FrappeGantt.tsx:90 Gantt prototype: {setup_wrapper: ƒ, setup_options: ƒ, update_options: ƒ, setup_tasks: ƒ, setup_dependencies: ƒ, …}
FrappeGantt.tsx:94 Frappe data transformed: (23) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
FrappeGantt.tsx:95 Original tasks count: 23
FrappeGantt.tsx:96 Transformed tasks count: 23
FrappeGantt.tsx:114 Validated data: (23) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
FrappeGantt.tsx:115 Validated tasks count: 23
FrappeGantt.tsx:116 Sample task structure: {
  "id": "6e4e7566-ee18-474f-9046-669364818689",
  "name": "234234",
  "start": "2025-07-10",
  "end": "2025-07-25",
  "progress": 0,
  "dependencies": "",
  "custom_class": "task-completed-medium",
  "_originalTask": {
    "id": "6e4e7566-ee18-474f-9046-669364818689",
    "project_id": "4448399b-dd73-43f2-aed3-48fdb00a4923",
    "title": "234234",
    "description": "234234",
    "category": "General",
    "location": "",
    "status": "completed",
    "priority": "medium",
    "assigned_to": "5fa12bf7-e990-4718-bcac-e103d24404f9",
    "start_date": "2025-07-10T00:00:00.000Z",
    "end_date": "2025-07-25T00:00:00.000Z",
    "planned_duration": 16,
    "actual_duration": null,
    "progress_percentage": 0,
    "color": "#3b82f6",
    "dependencies": [],
    "notes": null,
    "attachments": [],
    "primary_supplier_id": "f701cf72-11d4-4fbc-91b4-7172287772b5",
    "requires_materials": false,
    "material_delivery_date": "2025-07-31T00:00:00.000Z",
    "procurement_notes": null,
    "created_by": "5fa12bf7-e990-4718-bcac-e103d24404f9",
    "created_at": "2025-07-28T04:55:14.037Z",
    "updated_at": "2025-08-04T07:40:48.333Z"
  }
}
FrappeGantt.tsx:136 Will try with test data if real data fails: (2) [{…}, {…}]
FrappeGantt.tsx:138 Gantt constructor: class {
  constructor(t, e, i) {
    this.setup_wrapper(t), this.setup_options(i), this.setup_tasks(e), this.change_view_mode(), this.bind_events();
  }
  setup_wrapper(t) {
    let e, i;
    if (typeof t …
FrappeGantt.tsx:139 ganttRef.current: <div class=​"frappe-gantt-container">​…​</div>​
FrappeGantt.tsx:148 Final data for Gantt: (23) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
FrappeGantt.tsx:292 Frappe Gantt initialized successfully!
FrappeGantt.tsx:298 Task bars found: 24
FrappeGantt.tsx:299 Bar wrappers found: 23
FrappeGantt.tsx:300 Gantt container HTML: <div class="gantt-container" style="--gv-bar-height: 20px; --gv-lower-header-height: 30px; --gv-upper-header-height: 45px; --gv-column-width: 30px; height: 967px;"><div class="popup-wrapper"></div><div class="extras"><button class="adjust hide">←</button></div><div class="grid-header" style="width: 4290px;"><div class="upper-header"><div class="side-header"><button class="today-button">Today</button></div><div class="upper-text" style="top: 17px; left: 0px;">June</div><div class="upper-text" sty
FrappeGantt.tsx:298 Task bars found: 24
FrappeGantt.tsx:299 Bar wrappers found: 23
FrappeGantt.tsx:300 Gantt container HTML: <div class="gantt-container" style="--gv-bar-height: 20px; --gv-lower-header-height: 30px; --gv-upper-header-height: 45px; --gv-column-width: 30px; height: 967px;"><div class="popup-wrapper"></div><div class="extras"><button class="adjust hide">←</button></div><div class="grid-header" style="width: 4290px;"><div class="upper-header"><div class="side-header"><button class="today-button">Today</button></div><div class="upper-text" style="top: 17px; left: 0px;">June</div><div class="upper-text" stydelivery_responses (
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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_delivery_responses_delivery_id ON public.delivery_responses(delivery_id);
CREATE INDEX IF NOT EXISTS idx_delivery_responses_supplier_id ON public.delivery_responses(supplier_id);
CREATE INDEX IF NOT EXISTS idx_delivery_responses_responded_at ON public.delivery_responses(responded_at);

-- Add columns to deliveries table for tracking confirmations
ALTER TABLE public.deliveries 
ADD COLUMN IF NOT EXISTS confirmed_by VARCHAR(255),
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

-- Create index for confirmed deliveries
CREATE INDEX IF NOT EXISTS idx_deliveries_confirmed_at ON public.deliveries(confirmed_at);

-- Add Row Level Security policies for delivery_responses
ALTER TABLE public.delivery_responses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view delivery responses for their projects
CREATE POLICY "Users can view delivery responses for their projects" ON public.delivery_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.deliveries d
            JOIN public.projects p ON d.project_id = p.id
            JOIN public.project_members pm ON p.id = pm.project_id
            JOIN public.users u ON pm.user_id = u.id
            WHERE d.id = delivery_responses.delivery_id
            AND u.auth_user_id = auth.uid()
        )
    );

-- Policy: Project managers can view all delivery responses for their projects
CREATE POLICY "Project managers can view all delivery responses" ON public.delivery_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.deliveries d
            JOIN public.projects p ON d.project_id = p.id
            WHERE d.id = delivery_responses.delivery_id
            AND p.project_manager_id = auth.uid()
        )
    );

-- Policy: Allow public insert for supplier responses (they don't have auth accounts)
CREATE POLICY "Allow public insert for supplier responses" ON public.delivery_responses
    FOR INSERT WITH CHECK (true);

-- Add comments to new table and columns
COMMENT ON TABLE public.delivery_responses IS 'Stores supplier responses to delivery date change requests sent via email';
COMMENT ON COLUMN public.delivery_responses.response IS 'Supplier response: confirm or deny';
COMMENT ON COLUMN public.delivery_responses.comments IS 'Supplier comments explaining their response';
COMMENT ON COLUMN public.delivery_responses.alternative_date IS 'Alternative delivery date proposed by supplier (if denying)';
COMMENT ON COLUMN public.delivery_responses.responded_at IS 'When the supplier responded';

COMMENT ON COLUMN public.deliveries.confirmed_by IS 'Name of person who confirmed the delivery';
COMMENT ON COLUMN public.deliveries.confirmed_at IS 'When the delivery was confirmed';

-- Grant necessary permissions
GRANT SELECT, INSERT ON public.delivery_responses TO anon;
GRANT SELECT, INSERT ON public.delivery_responses TO authenticated;

-- Update triggers for updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_delivery_responses_updated_at 
    BEFORE UPDATE ON public.delivery_responses 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Migration completed successfully
-- Run this migration with: psql -d your_database -f 002_add_delivery_responses.sql