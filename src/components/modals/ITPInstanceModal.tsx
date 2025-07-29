import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle, Clock, AlertTriangle, FileText, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { itpService } from '../../services/itpService';
import { useAppStore } from '../../store';
import toast from 'react-hot-toast';
import type { ITPInstance, ITPRequirementInstance } from '../../types';

interface ITPInstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  instance: ITPInstance | null;
  onInstanceUpdated: () => void;
}

export default function ITPInstanceModal({ 
  isOpen, 
  onClose, 
  instance, 
  onInstanceUpdated 
}: ITPInstanceModalProps) {
  const { currentUser, users } = useAppStore();
  const [processingItems, setProcessingItems] = useState<Set<string>>(new Set());
  const [requirementNotes, setRequirementNotes] = useState<Record<string, string>>({});

  if (!isOpen || !instance) return null;

  const handleRequirementComplete = async (requirementId: string) => {
    if (!currentUser || processingItems.has(requirementId)) return;

    setProcessingItems(prev => new Set(prev).add(requirementId));
    
    try {
      const notes = requirementNotes[requirementId] || '';
      const result = await itpService.completeRequirementInstance(requirementId, currentUser.id, notes);
      
      if (result.success) {
        // Clear notes after successful completion
        setRequirementNotes(prev => {
          const updated = { ...prev };
          delete updated[requirementId];
          return updated;
        });
        onInstanceUpdated();
        toast.success('Requirement completed successfully!');
      } else {
        toast.error(result.error || 'Failed to complete requirement');
      }
    } catch (error) {
      console.error('Error completing requirement:', error);
      toast.error('Failed to complete requirement');
    } finally {
      setProcessingItems(prev => {
        const updated = new Set(prev);
        updated.delete(requirementId);
        return updated;
      });
    }
  };

  const handleStatusUpdate = async (newStatus: ITPInstance['status']) => {
    if (!currentUser) return;

    try {
      const result = await itpService.updateITPInstanceStatus(instance.id, newStatus, currentUser.id);
      
      if (result.success) {
        onInstanceUpdated();
        toast.success(`ITP status updated to ${newStatus.replace('_', ' ')}`);
      } else {
        toast.error(result.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating ITP status:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const completedRequirements = instance.requirements?.filter(req => req.completed).length || 0;
  const totalRequirements = instance.requirements?.length || 0;
  const progressPercentage = totalRequirements > 0 ? (completedRequirements / totalRequirements) * 100 : 0;

  const assignedUser = users.find(u => u.id === instance.assigned_to);

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
                <h2 className="text-xl font-semibold text-gray-900">ITP Instance</h2>
                <p className="text-sm text-gray-600">
                  Inspection and Test Plan Requirements
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

        <div className="p-6 space-y-6">
          {/* Instance Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Instance Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(instance.status)}`}>
                      {instance.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">Created:</span>
                    <span>{format(instance.created_at, 'MMM dd, yyyy')}</span>
                  </div>
                  {instance.due_date && (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">Due:</span>
                      <span>{format(instance.due_date, 'MMM dd, yyyy')}</span>
                    </div>
                  )}
                  {instance.completed_at && (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">Completed:</span>
                      <span>{format(instance.completed_at, 'MMM dd, yyyy')}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Assignment</h3>
                <div className="space-y-2 text-sm">
                  {assignedUser ? (
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{assignedUser.full_name}</span>
                    </div>
                  ) : (
                    <span className="text-gray-500">Unassigned</span>
                  )}
                  {instance.notes && (
                    <div className="text-gray-600">
                      <span className="font-medium">Notes:</span> {instance.notes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Progress</h3>
              <span className="text-sm text-gray-500">
                {completedRequirements} of {totalRequirements} requirements completed
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="text-center mt-2">
              <span className="text-lg font-semibold text-gray-900">{Math.round(progressPercentage)}%</span>
            </div>
          </div>

          {/* Requirements */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Requirements Checklist</h3>
            
            {instance.requirements && instance.requirements.length > 0 ? (
              <div className="space-y-3">
                {instance.requirements.map((requirement) => (
                  <div key={requirement.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {requirement.completed ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`text-sm ${requirement.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {requirement.text}
                          </span>
                          {requirement.required && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                              Required
                            </span>
                          )}
                          <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(requirement.category)}`}>
                            {requirement.category}
                          </span>
                        </div>

                        {/* Completion info */}
                        {requirement.completed && requirement.completed_at && (
                          <div className="text-xs text-gray-500 mb-2">
                            Completed on {format(new Date(requirement.completed_at), 'MMM dd, yyyy')}
                            {requirement.notes && ` - ${requirement.notes}`}
                          </div>
                        )}

                        {/* Notes input for incomplete items */}
                        {!requirement.completed && (
                          <textarea
                            value={requirementNotes[requirement.id] || ''}
                            onChange={(e) => setRequirementNotes(prev => ({
                              ...prev,
                              [requirement.id]: e.target.value
                            }))}
                            placeholder="Add completion notes (optional)..."
                            rows={2}
                            className="mt-2 w-full text-sm border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        )}

                        {/* Action button */}
                        {!requirement.completed && (
                          <button
                            onClick={() => handleRequirementComplete(requirement.id)}
                            disabled={processingItems.has(requirement.id)}
                            className="mt-2 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-1"
                          >
                            {processingItems.has(requirement.id) ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                <span>Processing...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                <span>Mark Complete</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No requirements found for this ITP instance</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Last updated: {format(instance.updated_at, 'MMM dd, yyyy HH:mm')}
            </div>
            
            <div className="flex items-center space-x-2">
              {instance.status === 'pending' && progressPercentage === 100 && (
                <button
                  onClick={() => handleStatusUpdate('completed')}
                  className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  Mark Complete
                </button>
              )}
              
              {instance.status === 'pending' && progressPercentage < 100 && (
                <button
                  onClick={() => handleStatusUpdate('in_progress')}
                  className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                  Start Work
                </button>
              )}

              {instance.status === 'in_progress' && progressPercentage === 100 && (
                <button
                  onClick={() => handleStatusUpdate('completed')}
                  className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
} 