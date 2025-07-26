import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Upload, 
  Search, 
  Filter,
  Download,
  Eye,
  Share2,
  Trash2,
  FolderPlus,
  File,
  Folder,
  Calendar,
  User,
  Paperclip,
  MoreHorizontal,
  Grid,
  List,
  Star,
  Clock
} from 'lucide-react';
import { useAppStore } from '../../store';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  category: 'drawings' | 'contracts' | 'reports' | 'photos' | 'certificates' | 'other';
  uploadedBy: string;
  uploadedAt: Date;
  lastModified: Date;
  tags: string[];
  isStarred: boolean;
  isShared: boolean;
  permissions: {
    canView: string[];
    canEdit: string[];
    canDelete: string[];
  };
  url?: string;
  thumbnail?: string;
}

interface Folder {
  id: string;
  name: string;
  parentId?: string;
  createdBy: string;
  createdAt: Date;
  documentCount: number;
  color: string;
}

export default function DocumentsPage() {
  const { currentUser, isProjectManager } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Mock data - in real app, this would come from the store/database
  const [folders] = useState<Folder[]>([
    {
      id: '1',
      name: 'Project Drawings',
      createdBy: 'Mike Thompson',
      createdAt: new Date('2024-01-15'),
      documentCount: 12,
      color: 'blue'
    },
    {
      id: '2',
      name: 'Contracts & Legal',
      createdBy: 'Sarah Wilson',
      createdAt: new Date('2024-01-20'),
      documentCount: 8,
      color: 'green'
    },
    {
      id: '3',
      name: 'Quality Reports',
      createdBy: 'Lisa Chen',
      createdAt: new Date('2024-02-01'),
      documentCount: 15,
      color: 'purple'
    },
    {
      id: '4',
      name: 'Site Photos',
      createdBy: 'Jake Rodriguez',
      createdAt: new Date('2024-02-10'),
      documentCount: 45,
      color: 'orange'
    }
  ]);

  const [documents] = useState<Document[]>([
    {
      id: '1',
      name: 'Architectural Plans - Level 1.pdf',
      type: 'pdf',
      size: 2400000,
      category: 'drawings',
      uploadedBy: 'Mike Thompson',
      uploadedAt: new Date('2024-01-15'),
      lastModified: new Date('2024-01-20'),
      tags: ['architectural', 'level-1', 'foundation'],
      isStarred: true,
      isShared: true,
      permissions: {
        canView: ['all'],
        canEdit: ['project_manager', 'project_coordinator'],
        canDelete: ['project_manager']
      }
    },
    {
      id: '2',
      name: 'Construction Contract.docx',
      type: 'docx',
      size: 850000,
      category: 'contracts',
      uploadedBy: 'Sarah Wilson',
      uploadedAt: new Date('2024-01-18'),
      lastModified: new Date('2024-01-25'),
      tags: ['contract', 'legal', 'main-contractor'],
      isStarred: false,
      isShared: false,
      permissions: {
        canView: ['project_manager', 'project_coordinator'],
        canEdit: ['project_manager'],
        canDelete: ['project_manager']
      }
    },
    {
      id: '3',
      name: 'Weekly Progress Report - Week 3.pdf',
      type: 'pdf',
      size: 1200000,
      category: 'reports',
      uploadedBy: 'Lisa Chen',
      uploadedAt: new Date('2024-02-01'),
      lastModified: new Date('2024-02-01'),
      tags: ['progress', 'weekly', 'week-3'],
      isStarred: false,
      isShared: true,
      permissions: {
        canView: ['all'],
        canEdit: ['project_manager', 'project_coordinator'],
        canDelete: ['project_manager']
      }
    },
    {
      id: '4',
      name: 'Foundation Pour - Site Photo.jpg',
      type: 'jpg',
      size: 3200000,
      category: 'photos',
      uploadedBy: 'Jake Rodriguez',
      uploadedAt: new Date('2024-02-05'),
      lastModified: new Date('2024-02-05'),
      tags: ['foundation', 'concrete', 'site-photo'],
      isStarred: true,
      isShared: true,
      permissions: {
        canView: ['all'],
        canEdit: ['project_manager', 'project_coordinator', 'subcontractor'],
        canDelete: ['project_manager', 'subcontractor']
      }
    },
    {
      id: '5',
      name: 'Material Safety Certificate.pdf',
      type: 'pdf',
      size: 650000,
      category: 'certificates',
      uploadedBy: 'Lisa Chen',
      uploadedAt: new Date('2024-02-10'),
      lastModified: new Date('2024-02-10'),
      tags: ['safety', 'certificate', 'materials'],
      isStarred: false,
      isShared: false,
      permissions: {
        canView: ['project_manager', 'project_coordinator', 'supplier'],
        canEdit: ['project_manager'],
        canDelete: ['project_manager']
      }
    }
  ]);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'drawings': return 'bg-blue-100 text-blue-800';
      case 'contracts': return 'bg-green-100 text-green-800';
      case 'reports': return 'bg-purple-100 text-purple-800';
      case 'photos': return 'bg-orange-100 text-orange-800';
      case 'certificates': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFolderColor = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-100 text-blue-600';
      case 'green': return 'bg-green-100 text-green-600';
      case 'purple': return 'bg-purple-100 text-purple-600';
      case 'orange': return 'bg-orange-100 text-orange-600';
      case 'red': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const handleUpload = () => {
    // Mock file upload
    toast.success('File upload functionality would be implemented here with real file handling');
    setShowUploadModal(false);
  };

  const handleDownload = (doc: Document) => {
    toast.success(`Downloading ${doc.name}...`);
  };

  const handleShare = (doc: Document) => {
    navigator.clipboard.writeText(`${window.location.origin}/documents/${doc.id}`);
    toast.success('Share link copied to clipboard!');
  };

  const handleDelete = (docId: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      toast.success('Document deleted successfully');
    }
  };

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
          <p className="text-gray-600 mt-1">Organize, share, and manage project documents</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Files</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Folder className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Folders</p>
              <p className="text-2xl font-bold text-gray-900">{folders.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Share2 className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Shared</p>
              <p className="text-2xl font-bold text-gray-900">
                {documents.filter(d => d.isShared).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Recent Uploads</p>
              <p className="text-2xl font-bold text-gray-900">
                {documents.filter(d => {
                  const daysSinceUpload = (new Date().getTime() - d.uploadedAt.getTime()) / (1000 * 60 * 60 * 24);
                  return daysSinceUpload <= 7;
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search documents..."
              className="input pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              className="input w-auto"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="drawings">Drawings</option>
              <option value="contracts">Contracts</option>
              <option value="reports">Reports</option>
              <option value="photos">Photos</option>
              <option value="certificates">Certificates</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Folders Section */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Folders</h3>
          {isProjectManager && (
            <button className="btn btn-outline btn-sm flex items-center space-x-2">
              <FolderPlus className="w-4 h-4" />
              <span>New Folder</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {folders.map((folder) => (
            <motion.div
              key={folder.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer"
              onClick={() => setSelectedFolder(folder.id)}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${getFolderColor(folder.color)}`}>
                  <Folder className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{folder.name}</p>
                  <p className="text-sm text-gray-500">{folder.documentCount} files</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Documents Section */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Documents ({filteredDocuments.length})
          </h3>
        </div>

        {viewMode === 'grid' ? (
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDocuments.map((doc) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-2xl">{getFileIcon(doc.type)}</div>
                    <div className="flex items-center space-x-1">
                      {doc.isStarred && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                      {doc.isShared && <Share2 className="w-4 h-4 text-blue-500" />}
                    </div>
                  </div>

                  <h4 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">{doc.name}</h4>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>{formatFileSize(doc.size)}</span>
                    <span className={`px-2 py-1 rounded-full ${getCategoryColor(doc.category)}`}>
                      {doc.category}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 mb-3">
                    <p>By {doc.uploadedBy}</p>
                    <p>{format(doc.uploadedAt, 'MMM dd, yyyy')}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDownload(doc)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleShare(doc)}
                        className="p-1 text-gray-400 hover:text-green-600"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                    {isProjectManager && (
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocuments.map((doc) => (
                  <motion.tr
                    key={doc.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-xl mr-3">{getFileIcon(doc.type)}</div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                            <span>{doc.name}</span>
                            {doc.isStarred && <Star className="w-3 h-3 text-yellow-500 fill-current" />}
                            {doc.isShared && <Share2 className="w-3 h-3 text-blue-500" />}
                          </div>
                          <div className="text-sm text-gray-500">By {doc.uploadedBy}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(doc.category)}`}>
                        {doc.category}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatFileSize(doc.size)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(doc.uploadedAt, 'MMM dd, yyyy')}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDownload(doc)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleShare(doc)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        {isProjectManager && (
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredDocuments.length === 0 && (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No documents found matching your search criteria.</p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
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
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Upload Documents</h3>
            </div>

            <div className="p-6">
              <div className="border-dashed border-2 border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Drag and drop files here, or click to browse</p>
                <p className="text-sm text-gray-400">Supports PDF, DOC, XLS, images, and CAD files</p>
                <button className="btn btn-outline mt-4">Choose Files</button>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  className="btn btn-primary"
                >
                  Upload
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
} 