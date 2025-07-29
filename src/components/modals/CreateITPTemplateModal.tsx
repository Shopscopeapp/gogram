import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Trash2, Save, FileText, AlertTriangle } from 'lucide-react';
import { itpService, CreateITPTemplateData } from '../../services/itpService';
import { useAppStore } from '../../store';
import toast from 'react-hot-toast';
import type { ITPRequirement, ITPTemplate } from '../../types';

interface CreateITPTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateCreated: () => void;
  template?: ITPTemplate | null; // For editing existing template
}

export default function CreateITPTemplateModal({ 
  isOpen, 
  onClose, 
  onTemplateCreated,
  template 
}: CreateITPTemplateModalProps) {
  const { currentUser } = useAppStore();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    type: 'general' as ITPTemplate['type'],
    priority: 'medium' as ITPTemplate['priority'],
  });
  const [requirements, setRequirements] = useState<Omit<ITPRequirement, 'id'>[]>([
    {
      text: '',
      required: true,
      category: 'safety',
      order: 1,
      notes: '',
    }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when template is provided (edit mode)
  React.useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        category: template.category,
        type: template.type,
        priority: template.priority,
      });
      setRequirements(template.requirements.map(req => ({
        text: req.text,
        required: req.required,
        category: req.category,
        order: req.order,
        notes: req.notes || '',
      })));
    } else {
      // Reset form for create mode
      setFormData({
        name: '',
        description: '',
        category: '',
        type: 'general' as const,
        priority: 'medium' as const,
      });
      setRequirements([{
        text: '',
        required: true,
        category: 'safety',
        order: 1,
        notes: '',
      }]);
    }
  }, [template]);

  const typeOptions = [
    { value: 'structural', label: 'Structural' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'plumbing', label: 'Plumbing' },
    { value: 'hvac', label: 'HVAC' },
    { value: 'fire_safety', label: 'Fire Safety' },
    { value: 'accessibility', label: 'Accessibility' },
    { value: 'environmental', label: 'Environmental' },
    { value: 'general', label: 'General' },
  ];

  const categoryOptions = [
    { value: 'safety', label: 'Safety' },
    { value: 'quality', label: 'Quality' },
    { value: 'compliance', label: 'Compliance' },
    { value: 'documentation', label: 'Documentation' },
    { value: 'testing', label: 'Testing' },
    { value: 'inspection', label: 'Inspection' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.error('User not found');
      return;
    }

    // Validate form
    if (!formData.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    if (requirements.length === 0) {
      toast.error('At least one requirement is needed');
      return;
    }

    const validRequirements = requirements.filter(req => req.text.trim());
    if (validRequirements.length === 0) {
      toast.error('At least one valid requirement is needed');
      return;
    }

    setIsSubmitting(true);

    try {
      const templateData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category.trim() || 'General',
        type: formData.type,
        priority: formData.priority,
        requirements: validRequirements.map((req, index) => ({
          ...req,
          text: req.text.trim(),
          order: index + 1,
        })),
      };

      let result;
      if (template) {
        // Update existing template
        result = await itpService.updateITPTemplate({
          ...templateData,
          id: template.id,
        });
      } else {
        // Create new template
        result = await itpService.createITPTemplate(templateData);
      }

      if (result.success) {
        toast.success(template ? 'ITP template updated successfully!' : 'ITP template created successfully!');
        onTemplateCreated();
        onClose();
        resetForm();
      } else {
        toast.error(result.error || (template ? 'Failed to update ITP template' : 'Failed to create ITP template'));
      }
    } catch (error) {
      console.error('Error saving ITP template:', error);
      toast.error(template ? 'Failed to update ITP template' : 'Failed to create ITP template');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      type: 'general',
      priority: 'medium',
    });
    setRequirements([
      {
        text: '',
        required: true,
        category: 'safety',
        order: 1,
        notes: '',
      }
    ]);
  };

  const addRequirement = () => {
    setRequirements(prev => [
      ...prev,
      {
        text: '',
        required: true,
        category: 'safety',
        order: prev.length + 1,
        notes: '',
      }
    ]);
  };

  const removeRequirement = (index: number) => {
    if (requirements.length > 1) {
      setRequirements(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateRequirement = (index: number, field: keyof ITPRequirement, value: any) => {
    setRequirements(prev => prev.map((req, i) => 
      i === index ? { ...req, [field]: value } : req
    ));
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {template ? 'Edit ITP Template' : 'Create ITP Template'}
                </h2>
                <p className="text-sm text-gray-600">
                  {template ? 'Update the Inspection and Test Plan template' : 'Create a new Inspection and Test Plan template with requirements checklist'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Template Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Concrete Foundation Inspection"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Foundation, Structural, etc."
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Describe the purpose and scope of this ITP template..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                >
                  {typeOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                >
                  {priorityOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Requirements Checklist
              </h3>
              <button
                type="button"
                onClick={addRequirement}
                className="flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Requirement
              </button>
            </div>

            <div className="space-y-4">
              {requirements.map((requirement, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Requirement {index + 1}</span>
                    {requirements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRequirement(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Requirement Text *</label>
                      <textarea
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={2}
                        placeholder="Describe the requirement..."
                        value={requirement.text}
                        onChange={(e) => updateRequirement(index, 'text', e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={requirement.category}
                          onChange={(e) => updateRequirement(index, 'category', e.target.value)}
                        >
                          {categoryOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center space-x-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={requirement.required}
                            onChange={(e) => updateRequirement(index, 'required', e.target.checked)}
                          />
                          <span className="ml-2 text-sm font-medium text-gray-700">Required</span>
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Optional notes..."
                          value={requirement.notes || ''}
                          onChange={(e) => updateRequirement(index, 'notes', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {requirements.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No requirements added yet</p>
                <button
                  type="button"
                  onClick={addRequirement}
                  className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Add your first requirement
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>
                {isSubmitting 
                  ? (template ? 'Updating...' : 'Creating...') 
                  : (template ? 'Update Template' : 'Create Template')
                }
              </span>
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
} 