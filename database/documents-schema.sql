-- =====================================================
-- Document Management System Schema
-- Add to your main Supabase schema
-- =====================================================

-- Document folders table
CREATE TABLE document_folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_folder_id UUID REFERENCES document_folders(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    color VARCHAR(7) DEFAULT '#3b82f6'
);

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    tags TEXT[] DEFAULT '{}',
    description TEXT,
    version INTEGER DEFAULT 1,
    is_public BOOLEAN DEFAULT FALSE,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES document_folders(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX idx_documents_project_id ON documents(project_id);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_folder_id ON documents(folder_id);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_uploaded_at ON documents(uploaded_at DESC);
CREATE INDEX idx_documents_name_search ON documents USING gin(to_tsvector('english', name));
CREATE INDEX idx_documents_tags ON documents USING gin(tags);

CREATE INDEX idx_document_folders_project_id ON document_folders(project_id);
CREATE INDEX idx_document_folders_parent_id ON document_folders(parent_folder_id);
CREATE INDEX idx_document_folders_created_by ON document_folders(created_by);

-- Enable Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_folders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documents
CREATE POLICY "Users can view documents in their projects" ON documents
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert documents in their projects" ON documents
    FOR INSERT WITH CHECK (
        uploaded_by = auth.uid() AND
        project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own documents" ON documents
    FOR UPDATE USING (uploaded_by = auth.uid());

CREATE POLICY "Project managers can delete documents" ON documents
    FOR DELETE USING (
        uploaded_by = auth.uid() OR
        project_id IN (
            SELECT pm.project_id FROM project_members pm
            WHERE pm.user_id = auth.uid() AND pm.role = 'project_manager'
        )
    );

-- RLS Policies for document folders
CREATE POLICY "Users can view folders in their projects" ON document_folders
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create folders in their projects" ON document_folders
    FOR INSERT WITH CHECK (
        created_by = auth.uid() AND
        project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Folder creators and project managers can update folders" ON document_folders
    FOR UPDATE USING (
        created_by = auth.uid() OR
        project_id IN (
            SELECT pm.project_id FROM project_members pm
            WHERE pm.user_id = auth.uid() AND pm.role = 'project_manager'
        )
    );

CREATE POLICY "Folder creators and project managers can delete folders" ON document_folders
    FOR DELETE USING (
        created_by = auth.uid() OR
        project_id IN (
            SELECT pm.project_id FROM project_members pm
            WHERE pm.user_id = auth.uid() AND pm.role = 'project_manager'
        )
    );

-- Update trigger for documents
CREATE OR REPLACE FUNCTION update_document_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_document_updated_at();

CREATE TRIGGER update_document_folders_updated_at
    BEFORE UPDATE ON document_folders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create Storage Bucket (run this in Supabase SQL Editor)
INSERT INTO storage.buckets (id, name, public) VALUES ('project-documents', 'project-documents', true);

-- Storage RLS Policies
CREATE POLICY "Users can upload documents to their projects" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'project-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view documents in their projects" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'project-documents' AND
        EXISTS (
            SELECT 1 FROM documents d
            JOIN project_members pm ON d.project_id = pm.project_id
            WHERE d.file_path = name AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own documents" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'project-documents' AND
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.file_path = name AND d.uploaded_by = auth.uid()
        )
    ); 