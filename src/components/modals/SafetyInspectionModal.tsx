import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, MapPin, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import type { SafetyInspection } from '../../types';
import safetyService from '../../services/safetyService';
import toast from 'react-hot-toast';

interface SafetyInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (inspection: SafetyInspection) => void;
  projectId: string;
  inspection?: SafetyInspection | null;
}

export default function SafetyInspectionModal({ 
  isOpen, 
  onClose, 
  onSave, 
  projectId, 
  inspection 
}: SafetyInspectionModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    inspection_type: 'routine' as SafetyInspection['inspection_type'],
    inspection_date: '',
    location: '',
    status: 'scheduled' as SafetyInspection['status'],
    severity: 'medium' as SafetyInspection['severity'],
    findings: [] as string[],
    corrective_actions: [] as string[],
    next_inspection_date: '',
    notes: ''
  });

  const [newFinding, setNewFinding] = useState('');
  const [newAction, setNewAction] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (inspection) {
      setFormData({
        title: inspection.title,
        description: inspection.description || '',
        inspection_type: inspection.inspection_type,
        inspection_date: inspection.inspection_date.toISOString().split('T')[0],
        location: inspection.location || '',
        status: inspection.status,
        severity: inspection.severity,
        findings: inspection.findings || [],
        corrective_actions: inspection.corrective_actions || [],
        next_inspection_date: inspection.next_inspection_date ? inspection.next_inspection_date.toISOString().split('T')[0] : '',
        notes: inspection.notes || ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        inspection_type: 'routine',
        inspection_date: '',
        location: '',
        status: 'scheduled',
        severity: 'medium',
        findings: [],
        corrective_actions: [],
        next_inspection_date: '',
        notes: ''
      });
    }
  }, [inspection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const inspectionData = {
        project_id: projectId,
        ...formData,
        inspection_date: new Date(formData.inspection_date),
        next_inspection_date: formData.next_inspection_date ? new Date(formData.next_inspection_date) : undefined
      };

      if (inspection) {
        // Update existing inspection
        const updated = await safetyService.updateInspectionStatus(inspection.id, inspectionData.status);
        if (updated) {
          toast.success('Inspection updated successfully!');
          onSave({ ...inspection, ...inspectionData });
        } else {
          toast.error('Failed to update inspection');
        }
      } else {
        // Create new inspection
        const newInspection = await safetyService.createSafetyInspection(inspectionData);
        if (newInspection) {
          toast.success('Inspection created successfully!');
          onSave(newInspection);
        } else {
          toast.error('Failed to create inspection');
        }
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving inspection:', error);
      toast.error('An error occurred while saving the inspection');
    } finally {
      setLoading(false);
    }
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
            {inspection ? 'Edit Inspection' : 'Add Inspection'}
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
                Inspection Title *
              </label>
              <input
                type="text"
                required
                className="input w-full"
                placeholder="Enter inspection title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inspection Type *
              </label>
              <select
                required
                className="input w-full"
                value={formData.inspection_type}
                onChange={(e) => setFormData({ ...formData, inspection_type: e.target.value as SafetyInspection['inspection_type'] })}
              >
                <option value="routine">Routine</option>
                <option value="scheduled">Scheduled</option>
                <option value="incident_followup">Incident Follow-up</option>
                <option value="compliance">Compliance</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inspection Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  required
                  className="input pl-10 w-full"
                  value={formData.inspection_date}
                  onChange={(e) => setFormData({ ...formData, inspection_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  className="input pl-10 w-full"
                  placeholder="Enter location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                required
                className="input w-full"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as SafetyInspection['status'] })}
              >
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity *
              </label>
              <select
                required
                className="input w-full"
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as SafetyInspection['severity'] })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              rows={3}
              className="input w-full"
              placeholder="Enter inspection description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Findings
            </label>
            <div className="space-y-2">
              {formData.findings.map((finding, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
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
              Next Inspection Date
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="date"
                className="input pl-10 w-full"
                value={formData.next_inspection_date}
                onChange={(e) => setFormData({ ...formData, next_inspection_date: e.target.value })}
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
              {loading ? 'Saving...' : (inspection ? 'Update Inspection' : 'Create Inspection')}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
} 