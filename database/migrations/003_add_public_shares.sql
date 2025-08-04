-- Migration: Add public_shares table for project sharing functionality
-- This allows projects to be shared publicly with configurable permissions

-- Create public_shares table
CREATE TABLE IF NOT EXISTS public.public_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    share_token VARCHAR(255) NOT NULL UNIQUE,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Share settings as JSONB for flexibility
    settings JSONB NOT NULL DEFAULT '{
        "showTaskDetails": true,
        "showTeamMembers": false,
        "showProgress": true,
        "showMilestones": true,
        "showDelays": false,
        "hideProcurement": true,
        "hideFinancials": true,
        "hideInternalNotes": true,
        "allowedSections": ["overview", "schedule", "progress", "milestones"]
    }'::jsonb,
    
    -- Access tracking
    access_count INTEGER NOT NULL DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,
    access_log JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_public_shares_project_id ON public.public_shares(project_id);
CREATE INDEX IF NOT EXISTS idx_public_shares_share_token ON public.public_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_public_shares_created_by ON public.public_shares(created_by);
CREATE INDEX IF NOT EXISTS idx_public_shares_active ON public.public_shares(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_public_shares_expires_at ON public.public_shares(expires_at) WHERE expires_at IS NOT NULL;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_public_shares_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_public_shares_updated_at
    BEFORE UPDATE ON public.public_shares
    FOR EACH ROW
    EXECUTE FUNCTION update_public_shares_updated_at();

-- Row Level Security (RLS) Policies
ALTER TABLE public.public_shares ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view public shares for projects they have access to
CREATE POLICY "Users can view public shares for their projects" ON public.public_shares
    FOR SELECT
    USING (
        project_id IN (
            SELECT pm.project_id 
            FROM public.project_members pm 
            WHERE pm.user_id = auth.uid()
        )
    );

-- Policy: Only project managers can create public shares
CREATE POLICY "Project managers can create public shares" ON public.public_shares
    FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT pm.project_id 
            FROM public.project_members pm 
            WHERE pm.user_id = auth.uid() 
            AND pm.role = 'project_manager'
        )
    );

-- Policy: Only project managers can update public shares
CREATE POLICY "Project managers can update public shares" ON public.public_shares
    FOR UPDATE
    USING (
        project_id IN (
            SELECT pm.project_id 
            FROM public.project_members pm 
            WHERE pm.user_id = auth.uid() 
            AND pm.role = 'project_manager'
        )
    );

-- Policy: Only project managers can delete public shares
CREATE POLICY "Project managers can delete public shares" ON public.public_shares
    FOR DELETE
    USING (
        project_id IN (
            SELECT pm.project_id 
            FROM public.project_members pm 
            WHERE pm.user_id = auth.uid() 
            AND pm.role = 'project_manager'
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.public_shares TO authenticated;
GRANT SELECT ON public.public_shares TO anon; -- Allow anonymous access for public viewing

-- Add comment
COMMENT ON TABLE public.public_shares IS 'Public project sharing links with configurable permissions and access tracking';