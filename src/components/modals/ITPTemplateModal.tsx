import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import type { ITPTemplate } from '../../types';

interface ITPTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: ITPTemplate | null;
  onEdit?: (template: ITPTemplate) => void;
}

export default function ITPTemplateModal({ isOpen, onClose, template, onEdit }: ITPTemplateModalProps) {
  if (!template) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{template.name}</h2>
                    <p className="text-sm text-gray-500">ITP Template Details</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Template Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                    <p className="text-gray-900">{template.description || 'No description provided'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Type</h3>
                    <p className="text-gray-900 capitalize">{template.type}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Priority</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(template.priority)}`}>
                        {getPriorityIcon(template.priority)}
                        <span className="ml-1 capitalize">{template.priority}</span>
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Requirements</h3>
                    <p className="text-gray-900">{template.requirements.length} items</p>
                  </div>
                </div>

                {/* Requirements List */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Requirements Checklist</h3>
                  {template.requirements.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No requirements defined for this template</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {template.requirements.map((requirement, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                          </div>
                                                     <div className="flex-1">
                             <p className="text-sm font-medium text-gray-900">{requirement.text}</p>
                             <div className="flex items-center space-x-4 mt-1">
                               <span className={`text-xs px-2 py-1 rounded-full ${
                                 requirement.category === 'safety' ? 'bg-red-100 text-red-800' :
                                 requirement.category === 'quality' ? 'bg-orange-100 text-orange-800' :
                                 requirement.category === 'compliance' ? 'bg-blue-100 text-blue-800' :
                                 requirement.category === 'documentation' ? 'bg-purple-100 text-purple-800' :
                                 requirement.category === 'testing' ? 'bg-green-100 text-green-800' :
                                 'bg-gray-100 text-gray-800'
                               }`}>
                                 {requirement.category}
                               </span>
                               <span className="text-xs text-gray-500">
                                 Order: {requirement.order}
                               </span>
                             </div>
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Template Metadata */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <span className="ml-2 text-gray-900">
                        {format(new Date(template.created_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Last Updated:</span>
                      <span className="ml-2 text-gray-900">
                        {format(new Date(template.updated_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Template ID: {template.id}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      if (onEdit) {
                        onEdit(template);
                      }
                    }}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Edit Template
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
} 