import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckSquare, 
  Clock, 
  AlertTriangle, 
  FileText, 
  User, 
  Calendar,
  Filter,
  Search,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAppStore } from '../../store';
import { format, differenceInDays } from 'date-fns';
import qaService, { type QAAlert, type QAChecklistItem } from '../../services/qaService';

interface QAAlertCardProps {
  alert: QAAlert;
  task?: any;
  onStatusUpdate: (alertId: string, status: QAAlert['status']) => void;
  onChecklistComplete: (alertId: string, itemId: string, notes?: string) => void;
}

function QAAlertCard({ alert, task, onStatusUpdate, onChecklistComplete }: QAAlertCardProps) {
  const [expandedChecklist, setExpandedChecklist] = useState(false);
  const [checklistNotes, setChecklistNotes] = useState<Record<string, string>>({});

  // Format alert for display directly
  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'itp_required': return '📋';
      case 'pre_pour_checklist': return '✅';
      case 'engineer_inspection': return '👷';
      case 'quality_checkpoint': return '⚠️';
      case 'compliance_check': return '🔍';
      default: return '🔍';
    }
  };

  const displayInfo = {
    icon: getAlertTypeIcon(alert.type),
    title: alert.title,
    subtitle: task ? `${task.title} • ${alert.due_date ? format(alert.due_date, 'MMM dd') : 'No due date'}` : (alert.due_date ? format(alert.due_date, 'MMM dd') : 'No due date'),
    priority: alert.priority.toUpperCase(),
    colorClass: `text-${alert.priority === 'critical' ? 'danger' : alert.priority === 'high' ? 'warning' : alert.priority === 'medium' ? 'primary' : 'gray'}-600 bg-${alert.priority === 'critical' ? 'danger' : alert.priority === 'high' ? 'warning' : alert.priority === 'medium' ? 'primary' : 'gray'}-100`,
    daysUntilDue: alert.due_date ? differenceInDays(alert.due_date, new Date()) : 0
  };
  const priorityColors = {
    critical: 'bg-danger-50 border-danger-200',
    high: 'bg-warning-50 border-warning-200',
    medium: 'bg-primary-50 border-primary-200',
    low: 'bg-gray-50 border-gray-200'
  };

  const statusColors = {
    pending: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-primary-100 text-primary-700',
    completed: 'bg-success-100 text-success-700',
    overdue: 'bg-danger-100 text-danger-700'
  };

  const handleChecklistItemComplete = (itemId: string) => {
    const notes = checklistNotes[itemId];
    onChecklistComplete(alert.id, itemId, notes);
    setChecklistNotes(prev => ({ ...prev, [itemId]: '' }));
  };

  const getCompletionPercentage = () => {
    if (!alert.checklist) return 100;
    const completedItems = alert.checklist.filter(item => item.completed).length;
    return Math.round((completedItems / alert.checklist.length) * 100);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card border-l-4 ${priorityColors[alert.priority]}`}
    >
      <div className="p-6">
        {/* Alert Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 text-2xl">
              {displayInfo.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{alert.title}</h3>
              <p className="text-gray-600 mt-1">{alert.description}</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {alert.due_date ? `Due ${format(alert.due_date, 'MMM dd')}` : 'No due date'}
                </span>
                {task && (
                  <span className="flex items-center">
                    <FileText className="w-4 h-4 mr-1" />
                    {task.title}
                  </span>
                )}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[alert.status]}`}>
                  {alert.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${displayInfo.colorClass}`}>
              {displayInfo.priority}
            </span>
            {alert.status !== 'completed' && (
              <button
                onClick={() => onStatusUpdate(alert.id, 'completed')}
                className="btn btn-success btn-sm"
                disabled={alert.checklist && getCompletionPercentage() < 100}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Complete
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        {alert.description && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">{alert.description}</p>
          </div>
        )}

        {/* Checklist */}
        {alert.checklist && alert.checklist.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Checklist</h4>
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-600">
                  {getCompletionPercentage()}% Complete
                </div>
                <button
                  onClick={() => setExpandedChecklist(!expandedChecklist)}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  {expandedChecklist ? 'Collapse' : 'Expand'}
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getCompletionPercentage()}%` }}
              />
            </div>

            {expandedChecklist && (
              <div className="space-y-3">
                {alert.checklist.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border ${
                      item.completed 
                        ? 'bg-success-50 border-success-200' 
                        : item.required 
                          ? 'bg-white border-gray-200' 
                          : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {item.completed ? (
                          <CheckCircle className="w-5 h-5 text-success-600" />
                        ) : (
                          <div className={`w-5 h-5 rounded border-2 ${
                            item.required ? 'border-primary-400' : 'border-gray-300'
                          }`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className={`font-medium ${
                            item.completed ? 'text-success-700' : 'text-gray-900'
                          }`}>
                            {item.text}
                          </p>
                          {item.required && !item.completed && (
                            <span className="text-xs px-2 py-1 bg-danger-100 text-danger-700 rounded-full">
                              Required
                            </span>
                          )}
                        </div>
                        
                        {item.completed ? (
                          <div className="mt-1 text-sm text-success-600">
                            ✓ Completed {item.completed_at && format(item.completed_at, 'MMM dd, HH:mm')}
                            {item.completed_by && ` by ${item.completed_by}`}
                            {item.notes && (
                              <div className="mt-1 text-success-700 italic">
                                "{item.notes}"
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="mt-2 space-y-2">
                            <textarea
                              value={checklistNotes[item.id] || ''}
                              onChange={(e) => setChecklistNotes(prev => ({
                                ...prev,
                                [item.id]: e.target.value
                              }))}
                              placeholder="Add completion notes (optional)..."
                              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              rows={2}
                            />
                            <button
                              onClick={() => handleChecklistItemComplete(item.id)}
                              className="btn btn-success btn-sm"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Mark Complete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function QAPage() {
  const { 
    qaAlerts, 
    tasks, 
    currentUser, 
    updateQAAlertStatus, 
    completeQAChecklistItem,
    generateQAAlerts,
    canUserPerformAction
  } = useAppStore();

  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'critical'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Generate QA alerts on page load
  useEffect(() => {
    generateQAAlerts();
  }, [generateQAAlerts]);

  // Check if user can manage QA
  const canManageQA = canUserPerformAction('manage_qa', 'qa_alerts');

  if (!canManageQA) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">
            You don't have permission to access QA management. This feature is available to Project Coordinators and Project Managers.
          </p>
        </div>
      </div>
    );
  }

  // Filter alerts
  const filteredAlerts = qaAlerts.filter(alert => {
    // Search filter
    if (searchQuery) {
      const task = tasks.find(t => t.id === alert.task_id);
      const searchText = `${alert.title} ${alert.description} ${task?.title || ''}`.toLowerCase();
      if (!searchText.includes(searchQuery.toLowerCase())) {
        return false;
      }
    }

    // Status filter
    switch (filter) {
      case 'pending':
        return alert.status === 'pending';
      case 'overdue':
        return alert.status !== 'completed' && alert.due_date && alert.due_date < new Date();
      case 'critical':
        return (alert.priority === 'high' || alert.priority === 'critical') && alert.status !== 'completed';
      default:
        return true;
    }
  });

  // Calculate alert summary directly
  const now = new Date();
  const alertSummary = {
    total: qaAlerts.length,
    pending: qaAlerts.filter(alert => alert.status === 'pending').length,
    overdue: qaAlerts.filter(alert => {
      if (alert.status === 'completed' || !alert.due_date) return false;
      return alert.due_date < now;
    }).length,
    critical: qaAlerts.filter(alert => 
      (alert.priority === 'high' || alert.priority === 'critical') && 
      alert.status !== 'completed'
    ).length,
    completed: qaAlerts.filter(alert => alert.status === 'completed').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quality Assurance</h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage construction quality alerts and inspections
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={generateQAAlerts}
            className="btn btn-secondary btn-md"
          >
            <CheckSquare className="w-4 h-4 mr-2" />
            Refresh Alerts
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{alertSummary.total}</div>
          <div className="text-sm text-gray-600">Total Alerts</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-warning-600">{alertSummary.pending}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-danger-600">{alertSummary.overdue}</div>
          <div className="text-sm text-gray-600">Overdue</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-primary-600">{alertSummary.critical}</div>
          <div className="text-sm text-gray-600">Critical</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-success-600">{alertSummary.completed}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alerts and tasks..."
            className="input pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          {(['all', 'pending', 'overdue', 'critical'] as const).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === filterType
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* QA Alerts */}
      <div className="space-y-4">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => {
            const task = tasks.find(t => t.id === alert.task_id);
            return (
              <QAAlertCard
                key={alert.id}
                alert={alert}
                task={task}
                onStatusUpdate={updateQAAlertStatus}
                onChecklistComplete={completeQAChecklistItem}
              />
            );
          })
        ) : (
          <div className="card p-8 text-center">
            <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No QA Alerts Found</h3>
            <p className="text-gray-600">
              {searchQuery || filter !== 'all'
                ? 'No alerts match your current filters.'
                : 'No quality assurance alerts have been generated yet.'
              }
            </p>
          </div>
        )}
      </div>

      {/* QA Information */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
        <h3 className="font-medium text-primary-900 mb-2">🔍 Construction QA Information</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-primary-800">
          <div>
            <strong>ITP (Inspection & Test Plans):</strong> Required for concrete pours and critical structural work.
          </div>
          <div>
            <strong>Pre-Pour Checklists:</strong> Final verification before concrete delivery arrives on site.
          </div>
          <div>
            <strong>Engineer Inspections:</strong> Structural engineer reviews for steel and major construction phases.
          </div>
          <div>
            <strong>Quality Hold Points:</strong> Mandatory quality checks before work can proceed.
          </div>
        </div>
      </div>
    </div>
  );
} 