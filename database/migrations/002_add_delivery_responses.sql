-- Migration: Add delivery responses table for interactive supplier email system
-- This enables suppliers to confirm/deny delivery date changes via email links

-- Add delivery responses table (for interactive email responses)
CREATE TABLE IF NOT EXISTS public.delivery_responses (
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