import { supabase } from '../lib/supabase';
import type { User } from '../types';

export interface Document {
  id: string;
  name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  category: string;
  tags: string[];
  uploaded_by: string;
  uploaded_at: string;
  project_id: string;
  folder_id?: string;
  description?: string;
  version: number;
  is_public: boolean;
}

export interface Folder {
  id: string;
  name: string;
  description?: string;
  parent_folder_id?: string;
  project_id: string;
  created_by: string;
  created_at: string;
  color: string;
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  document?: Document;
}

class DocumentService {
  private readonly STORAGE_BUCKET = 'project-documents';

  /**
   * Upload a file to Supabase Storage and create document record
   */
  async uploadDocument(
    file: File,
    projectId: string,
    userId: string,
    options: {
      category?: string;
      folderId?: string;
      tags?: string[];
      description?: string;
      isPublic?: boolean;
    } = {},
    onProgress?: (progress: number) => void
  ): Promise<{ success: boolean; document?: Document; error?: string }> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${projectId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('File upload error:', uploadError);
        return { success: false, error: 'Failed to upload file' };
      }

      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from(this.STORAGE_BUCKET)
        .getPublicUrl(fileName);

      // Create document record in database
      const { data: document, error: dbError } = await supabase
        .from('documents')
        .insert({
          name: file.name,
          file_path: fileName,
          file_size: file.size,
          file_type: file.type,
          category: options.category || 'General',
          tags: options.tags || [],
          uploaded_by: userId,
          project_id: projectId,
          folder_id: options.folderId,
          description: options.description,
          version: 1,
          is_public: options.isPublic || false
        })
        .select()
        .single();

      if (dbError) {
        console.error('Document record creation error:', dbError);
        // Clean up uploaded file if database insert fails
        await supabase.storage.from(this.STORAGE_BUCKET).remove([fileName]);
        return { success: false, error: 'Failed to create document record' };
      }

      onProgress?.(100);
      return { success: true, document };
    } catch (error) {
      console.error('Upload document error:', error);
      return { success: false, error: 'An unexpected error occurred during upload' };
    }
  }

  /**
   * Upload multiple files with progress tracking
   */
  async uploadMultipleDocuments(
    files: File[],
    projectId: string,
    userId: string,
    options: {
      category?: string;
      folderId?: string;
      tags?: string[];
      isPublic?: boolean;
    } = {},
    onProgress?: (fileProgress: UploadProgress[]) => void
  ): Promise<{ success: boolean; documents: Document[]; errors: string[] }> {
    const results: Document[] = [];
    const errors: string[] = [];
    const progress: UploadProgress[] = files.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }));

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        const result = await this.uploadDocument(
          file,
          projectId,
          userId,
          options,
          (fileProgress) => {
            progress[i].progress = fileProgress;
            onProgress?.(progress);
          }
        );

        if (result.success && result.document) {
          results.push(result.document);
          progress[i].status = 'completed';
          progress[i].document = result.document;
        } else {
          errors.push(`${file.name}: ${result.error}`);
          progress[i].status = 'error';
          progress[i].error = result.error;
        }
      } catch (error) {
        errors.push(`${file.name}: Upload failed`);
        progress[i].status = 'error';
        progress[i].error = 'Upload failed';
      }
      
      onProgress?.(progress);
    }

    return {
      success: results.length > 0,
      documents: results,
      errors
    };
  }

  /**
   * Get all documents for a project
   */
  async getProjectDocuments(projectId: string): Promise<{ success: boolean; documents?: Document[]; error?: string }> {
    try {
      const { data: documents, error } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Get project documents error:', error);
        return { success: false, error: 'Failed to fetch documents' };
      }

      return { success: true, documents: documents || [] };
    } catch (error) {
      console.error('Get project documents error:', error);
      return { success: false, error: 'Failed to fetch documents' };
    }
  }

  /**
   * Get documents in a specific folder
   */
  async getFolderDocuments(folderId: string): Promise<{ success: boolean; documents?: Document[]; error?: string }> {
    try {
      const { data: documents, error } = await supabase
        .from('documents')
        .select('*')
        .eq('folder_id', folderId)
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Get folder documents error:', error);
        return { success: false, error: 'Failed to fetch folder documents' };
      }

      return { success: true, documents: documents || [] };
    } catch (error) {
      console.error('Get folder documents error:', error);
      return { success: false, error: 'Failed to fetch folder documents' };
    }
  }

  /**
   * Create a new folder
   */
  async createFolder(
    name: string,
    projectId: string,
    userId: string,
    options: {
      description?: string;
      parentFolderId?: string;
      color?: string;
    } = {}
  ): Promise<{ success: boolean; folder?: Folder; error?: string }> {
    try {
      const { data: folder, error } = await supabase
        .from('document_folders')
        .insert({
          name,
          description: options.description,
          parent_folder_id: options.parentFolderId,
          project_id: projectId,
          created_by: userId,
          color: options.color || '#3b82f6'
        })
        .select()
        .single();

      if (error) {
        console.error('Create folder error:', error);
        return { success: false, error: 'Failed to create folder' };
      }

      return { success: true, folder };
    } catch (error) {
      console.error('Create folder error:', error);
      return { success: false, error: 'Failed to create folder' };
    }
  }

  /**
   * Get all folders for a project
   */
  async getProjectFolders(projectId: string): Promise<{ success: boolean; folders?: Folder[]; error?: string }> {
    try {
      const { data: folders, error } = await supabase
        .from('document_folders')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get project folders error:', error);
        return { success: false, error: 'Failed to fetch folders' };
      }

      return { success: true, folders: folders || [] };
    } catch (error) {
      console.error('Get project folders error:', error);
      return { success: false, error: 'Failed to fetch folders' };
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // First get the document to get file path
      const { data: document, error: getError } = await supabase
        .from('documents')
        .select('file_path, uploaded_by')
        .eq('id', documentId)
        .single();

      if (getError || !document) {
        return { success: false, error: 'Document not found' };
      }

      // Check if user has permission to delete (uploaded by user or is project manager)
      // For now, allow the uploader to delete
      if (document.uploaded_by !== userId) {
        return { success: false, error: 'Permission denied' };
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(this.STORAGE_BUCKET)
        .remove([document.file_path]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (dbError) {
        console.error('Database delete error:', dbError);
        return { success: false, error: 'Failed to delete document record' };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete document error:', error);
      return { success: false, error: 'Failed to delete document' };
    }
  }

  /**
   * Get download URL for a document
   */
  async getDownloadUrl(filePath: string): Promise<string> {
    const { data } = supabase.storage
      .from(this.STORAGE_BUCKET)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  }

  /**
   * Search documents by name, tags, or content
   */
  async searchDocuments(
    projectId: string,
    query: string,
    filters: {
      category?: string;
      folderId?: string;
      fileType?: string;
      uploadedBy?: string;
    } = {}
  ): Promise<{ success: boolean; documents?: Document[]; error?: string }> {
    try {
      let queryBuilder = supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId);

      // Add text search
      if (query) {
        queryBuilder = queryBuilder.or(`name.ilike.%${query}%, description.ilike.%${query}%`);
      }

      // Add filters
      if (filters.category) {
        queryBuilder = queryBuilder.eq('category', filters.category);
      }
      if (filters.folderId) {
        queryBuilder = queryBuilder.eq('folder_id', filters.folderId);
      }
      if (filters.fileType) {
        queryBuilder = queryBuilder.ilike('file_type', `%${filters.fileType}%`);
      }
      if (filters.uploadedBy) {
        queryBuilder = queryBuilder.eq('uploaded_by', filters.uploadedBy);
      }

      const { data: documents, error } = await queryBuilder
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Search documents error:', error);
        return { success: false, error: 'Failed to search documents' };
      }

      return { success: true, documents: documents || [] };
    } catch (error) {
      console.error('Search documents error:', error);
      return { success: false, error: 'Failed to search documents' };
    }
  }

  /**
   * Update document metadata
   */
  async updateDocument(
    documentId: string,
    updates: {
      name?: string;
      category?: string;
      tags?: string[];
      description?: string;
      folder_id?: string;
    },
    userId: string
  ): Promise<{ success: boolean; document?: Document; error?: string }> {
    try {
      const { data: document, error } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', documentId)
        .select()
        .single();

      if (error) {
        console.error('Update document error:', error);
        return { success: false, error: 'Failed to update document' };
      }

      return { success: true, document };
    } catch (error) {
      console.error('Update document error:', error);
      return { success: false, error: 'Failed to update document' };
    }
  }
}

const documentService = new DocumentService();
export default documentService; 