import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  File,
  Folder,
  Search,
  Grid,
  List,
  Filter,
  Download,
  Trash2,
  Eye,
  FolderPlus,
  X,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAppStore } from '../../store';
import { format } from 'date-fns';
import documentService, { Document, Folder as DocumentFolder, UploadProgress } from '../../services/documentService';
import toast from 'react-hot-toast';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[], options: any) => void;
  folders: DocumentFolder[];
}

function UploadModal({ isOpen, onClose, onUpload, folders }: UploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [category, setCategory] = useState('General');
  const [folderId, setFolderId] = useState('');
  const [tags, setTags] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const categories = [
    'General', 'Plans', 'Specifications', 'Photos', 'Reports',
    'Contracts', 'Permits', 'Safety', 'Quality', 'Progress'
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const files = Array.from(event.dataTransfer.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    const options = {
      category,
      folderId: folderId || undefined,
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      description: description || undefined,
      isPublic
    };

    onUpload(selectedFiles, options);

    // Reset form
    setSelectedFiles([]);
    setCategory('General');
    setFolderId('');
    setTags('');
    setDescription('');
    setIsPublic(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Upload Documents
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* File Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Support for PDF, DOC, XLS, images, and CAD files
            </p>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.dwg,.dxf"
            />
            <label
              htmlFor="file-upload"
              className="btn btn-outline cursor-pointer"
            >
              Browse Files
            </label>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">Selected Files ({selectedFiles.length})</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center flex-1">
                      <File className="w-4 h-4 text-gray-500 mr-2" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Options */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input w-full"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Folder
              </label>
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="input w-full"
              >
                <option value="">Root Folder</option>
                {folders.map(folder => (
                  <option key={folder.id} value={folder.id}>{folder.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="important, review, final"
              className="input w-full"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description for the documents"
              rows={3}
              className="input w-full"
            />
          </div>

          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Make documents publicly accessible</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedFiles.length === 0}
              className="btn btn-primary"
            >
              Upload {selectedFiles.length > 0 && `(${selectedFiles.length})`}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function DocumentsPage() {
  const { currentProject, currentUser } = useAppStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Load documents and folders on component mount
  useEffect(() => {
    if (currentProject) {
      loadProjectData();
    }
  }, [currentProject]);

  const loadProjectData = async () => {
    if (!currentProject) return;

    setLoading(true);
    try {
      const [docsResult, foldersResult] = await Promise.all([
        documentService.getProjectDocuments(currentProject.id),
        documentService.getProjectFolders(currentProject.id)
      ]);

      if (docsResult.success) {
        setDocuments(docsResult.documents || []);
      } else {
        toast.error(docsResult.error || 'Failed to load documents');
      }

      if (foldersResult.success) {
        setFolders(foldersResult.folders || []);
      } else {
        toast.error(foldersResult.error || 'Failed to load folders');
      }
    } catch (error) {
      console.error('Error loading project data:', error);
      toast.error('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (files: File[], options: any) => {
    if (!currentProject || !currentUser) {
      toast.error('Project or user not found');
      return;
    }

    setIsUploading(true);
    toast.success(`Starting upload of ${files.length} file${files.length > 1 ? 's' : ''}...`);

    try {
      const result = await documentService.uploadMultipleDocuments(
        files,
        currentProject.id,
        currentUser.id,
        options,
        setUploadProgress
      );

      if (result.success) {
        toast.success(`Successfully uploaded ${result.documents.length} document${result.documents.length > 1 ? 's' : ''}!`);

        // Show errors if any
        if (result.errors.length > 0) {
          result.errors.forEach(error => toast.error(error));
        }

        // Refresh document list
        await loadProjectData();
      } else {
        toast.error('Upload failed');
        result.errors.forEach(error => toast.error(error));
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress([]);
    }
  };

  const handleDeleteDocument = async (document: Document) => {
    if (!currentUser) return;

    if (!confirm(`Are you sure you want to delete "${document.name}"?`)) {
      return;
    }

    try {
      const result = await documentService.deleteDocument(document.id, currentUser.id);

      if (result.success) {
        toast.success('Document deleted successfully');
        setDocuments(prev => prev.filter(doc => doc.id !== document.id));
      } else {
        toast.error(result.error || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      const url = await documentService.getDownloadUrl(document.file_path);
      window.open(url, '_blank');
      toast.success('Opening document...');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to open document');
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf': return '📄';
      case 'docx':
      case 'doc': return '📝';
      case 'xlsx':
      case 'xls': return '📊';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return '🖼️';
      case 'dwg':
      case 'dxf': return '📐';
      default: return '📄';
    }
  };

  const categories = ['all', 'General', 'Plans', 'Specifications', 'Photos', 'Reports', 'Contracts', 'Permits', 'Safety', 'Quality', 'Progress'];

  if (!currentProject) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Documents</h1>
          <p className="text-gray-600">
            Manage project files, drawings, and documentation
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-primary"
            disabled={isUploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Upload Files'}
          </button>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-3">Upload Progress</h3>
          <div className="space-y-2">
            {uploadProgress.map((progress, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate">{progress.file.name}</span>
                    <div className="flex items-center space-x-2">
                      {progress.status === 'uploading' && (
                        <>
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span>{progress.progress}%</span>
                        </>
                      )}
                      {progress.status === 'completed' && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      {progress.status === 'error' && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  {progress.status === 'uploading' && (
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-200"
                        style={{ width: `${progress.progress}%` }}
                      />
                    </div>
                  )}
                  {progress.status === 'error' && progress.error && (
                    <p className="text-xs text-red-600 mt-1">{progress.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Documents Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600">Loading documents...</span>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || categoryFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Upload your first document to get started'
            }
          </p>
          {!searchQuery && categoryFilter === 'all' && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn btn-primary"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Documents
            </button>
          )}
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'space-y-2'
        }>
          {filteredDocuments.map((document) => (
            <motion.div
              key={document.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={
                viewMode === 'grid'
                  ? 'bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow'
                  : 'bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between hover:bg-gray-50'
              }
            >
              {viewMode === 'grid' ? (
                <>
                  <div className="text-center mb-3">
                    <div className="text-3xl mb-2">{getFileIcon(document.file_type)}</div>
                    <h4 className="font-medium text-gray-900 text-sm truncate" title={document.name}>
                      {document.name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatFileSize(document.file_size)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs px-2 py-1 bg-primary-100 text-primary-800 rounded-full">
                      {document.category}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleDownload(document)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(document)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="text-2xl mr-3">{getFileIcon(document.file_type)}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{document.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{document.category}</span>
                        <span>{formatFileSize(document.file_size)}</span>
                        <span>{format(new Date(document.uploaded_at), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDownload(document)}
                      className="p-2 text-gray-400 hover:text-blue-600"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDocument(document)}
                      className="p-2 text-gray-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUpload}
        folders={folders}
      />
    </div>
  );
} 