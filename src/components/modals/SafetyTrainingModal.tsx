import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Clock, MapPin, Users, FileText } from 'lucide-react';
import type { SafetyTraining } from '../../types';
import safetyService from '../../services/safetyService';
import toast from 'react-hot-toast';

interface SafetyTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (training: SafetyTraining) => void;
  projectId: string;
  training?: SafetyTraining | null;
}

export default function SafetyTrainingModal({ 
  isOpen, 
  onClose, 
  onSave, 
  projectId, 
  training 
}: SafetyTrainingModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    training_type: 'safety_orientation' as SafetyTraining['training_type'],
    training_date: '',
    duration_hours: 1,
    instructor: '',
    location: '',
    attendees: [] as string[],
    status: 'scheduled' as SafetyTraining['status'],
    notes: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (training) {
      setFormData({
        title: training.title,
        description: training.description || '',
        training_type: training.training_type,
        training_date: training.training_date.toISOString().split('T')[0],
        duration_hours: training.duration_hours,
        instructor: training.instructor || '',
        location: training.location || '',
        attendees: training.attendees || [],
        status: training.status,
        notes: training.notes || ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        training_type: 'safety_orientation',
        training_date: '',
        duration_hours: 1,
        instructor: '',
        location: '',
        attendees: [],
        status: 'scheduled',
        notes: ''
      });
    }
  }, [training]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const trainingData = {
        project_id: projectId,
        ...formData,
        training_date: new Date(formData.training_date),
        duration_hours: Number(formData.duration_hours)
      };

      if (training) {
        // Update existing training
        const updated = await safetyService.updateTrainingStatus(training.id, trainingData.status);
        if (updated) {
          toast.success('Training record updated successfully!');
          onSave({ ...training, ...trainingData });
        } else {
          toast.error('Failed to update training record');
        }
      } else {
        // Create new training
        const newTraining = await safetyService.createSafetyTraining(trainingData);
        if (newTraining) {
          toast.success('Training record created successfully!');
          onSave(newTraining);
        } else {
          toast.error('Failed to create training record');
        }
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving training:', error);
      toast.error('An error occurred while saving the training record');
    } finally {
      setLoading(false);
    }
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
            {training ? 'Edit Training Record' : 'Add Training Record'}
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
                Training Title *
              </label>
              <input
                type="text"
                required
                className="input w-full"
                placeholder="Enter training title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Training Type *
              </label>
              <select
                required
                className="input w-full"
                value={formData.training_type}
                onChange={(e) => setFormData({ ...formData, training_type: e.target.value as SafetyTraining['training_type'] })}
              >
                <option value="safety_orientation">Safety Orientation</option>
                <option value="equipment_operation">Equipment Operation</option>
                <option value="hazard_awareness">Hazard Awareness</option>
                <option value="emergency_procedures">Emergency Procedures</option>
                <option value="compliance_training">Compliance Training</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Training Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  required
                  className="input pl-10 w-full"
                  value={formData.training_date}
                  onChange={(e) => setFormData({ ...formData, training_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (Hours) *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="number"
                  required
                  min="0.5"
                  step="0.5"
                  className="input pl-10 w-full"
                  placeholder="2.0"
                  value={formData.duration_hours}
                  onChange={(e) => setFormData({ ...formData, duration_hours: Number(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructor
              </label>
              <input
                type="text"
                className="input w-full"
                placeholder="Enter instructor name"
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
              />
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              rows={3}
              className="input w-full"
              placeholder="Enter training description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status *
            </label>
            <select
              required
              className="input w-full"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as SafetyTraining['status'] })}
            >
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
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
              {loading ? 'Saving...' : (training ? 'Update Training' : 'Create Training')}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
} 