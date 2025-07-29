import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, CheckCircle, AlertCircle, FileText, Clock } from 'lucide-react';
import type { SafetyCompliance } from '../../types';
import safetyService from '../../services/safetyService';
import toast from 'react-hot-toast';

interface SafetyComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (compliance: SafetyCompliance) => void;
  projectId: string;
  compliance?: SafetyCompliance | null;
}

export default function SafetyComplianceModal({ 
  isOpen, 
  onClose, 
  onSave, 
  projectId, 
  compliance 
}: SafetyComplianceModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    compliance_type: 'regulatory' as SafetyCompliance['compliance_type'],
    regulation_code: '',
    check_date: '',
    compliant: false,
    requirements: [] as string[],
    findings: [] as string[],
    corrective_actions: [] as string[],
    next_review_date: '',
    notes: ''
  });

  const [newRequirement, setNewRequirement] = useState('');
  const [newFinding, setNewFinding] = useState('');
  const [newAction, setNewAction] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (compliance) {
      setFormData({
        title: compliance.title,
        description: compliance.description || '',
        compliance_type: compliance.compliance_type,
        regulation_code: compliance.regulation_code || '',
        check_date: compliance.check_date.toISOString().split('T')[0],
        compliant: compliance.compliant,
        requirements: compliance.requirements || [],
        findings: compliance.findings || [],
        corrective_actions: compliance.corrective_actions || [],
        next_review_date: compliance.next_review_date ? compliance.next_review_date.toISOString().split('T')[0] : '',
        notes: compliance.notes || ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        compliance_type: 'regulatory',
        regulation_code: '',
        check_date: '',
        compliant: false,
        requirements: [],
        findings: [],
        corrective_actions: [],
        next_review_date: '',
        notes: ''
      });
    }
  }, [compliance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const complianceData = {
        project_id: projectId,
        ...formData,
        check_date: new Date(formData.check_date),
        next_review_date: formData.next_review_date ? new Date(formData.next_review_date) : undefined
      };

      if (compliance) {
        // Update existing compliance
        const updated = await safetyService.updateComplianceStatus(compliance.id, complianceData.compliant, complianceData.notes);
        if (updated) {
          toast.success('Compliance record updated successfully!');
          onSave({ ...compliance, ...complianceData });
        } else {
          toast.error('Failed to update compliance record');
        }
      } else {
        // Create new compliance
        const newCompliance = await safetyService.createSafetyCompliance(complianceData);
        if (newCompliance) {
          toast.success('Compliance record created successfully!');
          onSave(newCompliance);
        } else {
          toast.error('Failed to create compliance record');
        }
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving compliance:', error);
      toast.error('An error occurred while saving the compliance record');
    } finally {
      setLoading(false);
    }
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData({
        ...formData,
        requirements: [...formData.requirements, newRequirement.trim()]
      });
      setNewRequirement('');
    }
  };

  const removeRequirement = (index: number) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter((_, i) => i !== index)
    });
  };

  const addFinding = () => {
    if (newFinding.trim()) {
      setFormData({
        ...formData,
        findings: [...formData.findings, newFinding.trim()]
      });
      setNewFinding('');
    }
  };

  const removeFinding = (index: number) => {
    setFormData({
      ...formData,
      findings: formData.findings.filter((_, i) => i !== index)
    });
  };

  const addAction = () => {
    if (newAction.trim()) {
      setFormData({
        ...formData,
        corrective_actions: [...formData.corrective_actions, newAction.trim()]
      });
      setNewAction('');
    }
  };

  const removeAction = (index: number) => {
    setFormData({
      ...formData,
      corrective_actions: formData.corrective_actions.filter((_, i) => i !== index)
    });
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
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {compliance ? 'Edit Compliance Record' : 'Add Compliance Record'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compliance Title *
              </label>
              <input
                type="text"
                required
                className="input w-full"
                placeholder="Enter compliance title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compliance Type *
              </label>
              <select
                required
                className="input w-full"
                value={formData.compliance_type}
                onChange={(e) => setFormData({ ...formData, compliance_type: e.target.value as SafetyCompliance['compliance_type'] })}
              >
                <option value="regulatory">Regulatory</option>
                <option value="company_policy">Company Policy</option>
                <option value="industry_standard">Industry Standard</option>
                <option value="contractual">Contractual</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Regulation Code
              </label>
              <input
                type="text"
                className="input w-full"
                placeholder="e.g., OSHA-2024-001"
                value={formData.regulation_code}
                onChange={(e) => setFormData({ ...formData, regulation_code: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Check Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  required
                  className="input pl-10 w-full"
                  value={formData.check_date}
                  onChange={(e) => setFormData({ ...formData, check_date: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              rows={3}
              className="input w-full"
              placeholder="Enter compliance description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={formData.compliant}
                onChange={(e) => setFormData({ ...formData, compliant: e.target.checked })}
              />
              <span className="text-sm font-medium text-gray-700">Compliant</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requirements
            </label>
            <div className="space-y-2">
              {formData.requirements.map((requirement, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span className="flex-1 text-sm">{requirement}</span>
                  <button
                    type="button"
                    onClick={() => removeRequirement(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex space-x-2">
                <input
                  type="text"
                  className="input flex-1"
                  placeholder="Add a requirement"
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                />
                <button
                  type="button"
                  onClick={addRequirement}
                  className="btn btn-outline btn-sm"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Findings
            </label>
            <div className="space-y-2">
              {formData.findings.map((finding, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <span className="flex-1 text-sm">{finding}</span>
                  <button
                    type="button"
                    onClick={() => removeFinding(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex space-x-2">
                <input
                  type="text"
                  className="input flex-1"
                  placeholder="Add a finding"
                  value={newFinding}
                  onChange={(e) => setNewFinding(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFinding())}
                />
                <button
                  type="button"
                  onClick={addFinding}
                  className="btn btn-outline btn-sm"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Corrective Actions
            </label>
            <div className="space-y-2">
              {formData.corrective_actions.map((action, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="flex-1 text-sm">{action}</span>
                  <button
                    type="button"
                    onClick={() => removeAction(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex space-x-2">
                <input
                  type="text"
                  className="input flex-1"
                  placeholder="Add a corrective action"
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAction())}
                />
                <button
                  type="button"
                  onClick={addAction}
                  className="btn btn-outline btn-sm"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Next Review Date
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                className="input pl-10 w-full"
                value={formData.next_review_date}
                onChange={(e) => setFormData({ ...formData, next_review_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              rows={3}
              className="input w-full"
              placeholder="Enter additional notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : (compliance ? 'Update Compliance' : 'Create Compliance')}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
} 